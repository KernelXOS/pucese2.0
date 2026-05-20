"""
Endpoints de docentes: listado, perfil completo histórico, descarga de PDF.
Usa directamente la tabla `evaluaciones` (modelo Evaluacion).
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io
from collections import defaultdict

from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.evaluacion import Evaluacion
from app.services.pdf_service import (
    generar_pdf_docente,
    generar_pdf_directorio,
    generar_pdf_bulk_docentes,
    MODELO_LABELS,
)

router = APIRouter()


@router.get("/")
def listar_docentes(
    periodo:  Optional[str] = Query(None, description="Código de período ej. 202502"),
    facultad: Optional[str] = Query(None),
    modelo:   Optional[str] = Query(None),
    q:        Optional[str] = Query(None, description="Búsqueda por nombre o cédula"),
    limit:    int           = Query(200, le=1000),
    db: Session = Depends(get_db),
):
    """Lista docentes con su puntaje promedio en el período indicado."""
    query = (
        db.query(
            Evaluacion.cedula,
            Evaluacion.docente_nombre,
            Evaluacion.sexo,
            Evaluacion.facultad,
            Evaluacion.funcion_docente,
            Evaluacion.modelo,
            Evaluacion.sistema,
            Evaluacion.periodo,
            Evaluacion.nivel_desempeno,
            func.avg(Evaluacion.puntaje_100).label("avg_puntaje"),
        )
        .filter(Evaluacion.puntaje_100.isnot(None))
    )

    if periodo:
        query = query.filter(Evaluacion.periodo == periodo)
    if facultad:
        query = query.filter(Evaluacion.facultad == facultad)
    if modelo:
        query = query.filter(Evaluacion.modelo == modelo)
    if q:
        query = query.filter(
            Evaluacion.docente_nombre.ilike(f"%{q}%") |
            Evaluacion.cedula.ilike(f"%{q}%")
        )

    rows = (
        query.group_by(
            Evaluacion.cedula,
            Evaluacion.docente_nombre,
            Evaluacion.sexo,
            Evaluacion.facultad,
            Evaluacion.funcion_docente,
            Evaluacion.modelo,
            Evaluacion.sistema,
            Evaluacion.periodo,
            Evaluacion.nivel_desempeno,
        )
        .order_by(func.avg(Evaluacion.puntaje_100).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "cedula":       r.cedula,
            "nombre":       r.docente_nombre,
            "genero":       r.sexo,
            "facultad":     r.facultad,
            "funcion":      r.funcion_docente,
            "dedicacion":   None,
            "puntaje_100":  round(r.avg_puntaje, 1) if r.avg_puntaje else None,
            "nivel":        r.nivel_desempeno,
            "modelo":       r.modelo,
            "modelo_label": MODELO_LABELS.get(r.modelo or "", r.modelo or ""),
            "sistema":      r.sistema,
            "periodo":      r.periodo,
        }
        for r in rows
    ]


@router.get("/{cedula}/perfil")
def perfil_docente(cedula: str, db: Session = Depends(get_db)):
    """Perfil completo del docente con historial en todos los períodos."""
    evs = (
        db.query(Evaluacion)
        .filter(Evaluacion.cedula == cedula)
        .order_by(Evaluacion.anio, Evaluacion.periodo)
        .all()
    )
    if not evs:
        raise HTTPException(404, f"Docente {cedula} no encontrado")

    first = evs[0]

    # Agrupar por período
    por_periodo: dict = defaultdict(list)
    for ev in evs:
        por_periodo[ev.periodo or ""].append(ev)

    historico = []
    for periodo, p_evs in sorted(por_periodo.items(), key=lambda x: x[0] or ""):
        puntajes = [
            {
                "modelo":      ev.modelo,
                "modelo_label": MODELO_LABELS.get(ev.modelo or "", ev.modelo or ""),
                "sistema":     ev.sistema,
                "puntaje_100": round(ev.puntaje_100, 1) if ev.puntaje_100 else None,
                "nivel":       ev.nivel_desempeno,
                "comp_het_est": round(ev.het_estudiantil or ev.comp_hetero_est or 0, 1) or None,
                "comp_auto":    round(ev.autoevaluacion or ev.comp_auto or 0, 1) or None,
                "comp_pares":   round(ev.eval_pares or ev.comp_pares or 0, 1) or None,
                "comp_het_dir": round(ev.comp_hetero_dir or 0, 1) or None,
                "comp_cev":     round(ev.aula_virtual or 0, 1) or None,
            }
            for ev in p_evs
        ]
        historico.append({
            "periodo_codigo": periodo,
            "periodo_label":  periodo,
            "sistema":        p_evs[0].sistema if p_evs else None,
            "facultad":       p_evs[0].facultad if p_evs else None,
            "funcion":        p_evs[0].funcion_docente if p_evs else None,
            "dedicacion":     None,
            "antiguedad_anos": p_evs[0].antiguedad_anos if p_evs else None,
            "puntajes":       puntajes,
        })

    return {
        "cedula":              cedula,
        "nombre_completo":     first.docente_nombre or cedula,
        "apellidos":           "",
        "nombres":             first.docente_nombre or cedula,
        "genero":              first.sexo or "—",
        "email_institucional": None,
        "historico":           historico,
    }


# ── PDF endpoints ──────────────────────────────────────────────────────────────

@router.get("/{cedula}/reporte.pdf")
def descargar_reporte_pdf(
    cedula:  str,
    periodo: Optional[str] = Query(None, description="Período específico ej. 202502"),
    db: Session = Depends(get_db),
):
    """Genera y descarga el reporte PDF individual del docente."""
    try:
        pdf_bytes = generar_pdf_docente(cedula=cedula, db=db, periodo_codigo=periodo)
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(500, f"No se pudo generar el reporte PDF: {e}")

    # Nombre de archivo legible
    ev = db.query(Evaluacion).filter(Evaluacion.cedula == cedula).first()
    nombre_safe  = (ev.docente_nombre or cedula).replace(" ", "_").upper()[:30] if ev else cedula
    periodo_safe = periodo or "ultimo"
    filename     = f"Reporte_{nombre_safe}_{periodo_safe}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


class DocenteItem(BaseModel):
    nombre:   str = ""
    cedula:   str = ""
    facultad: str = ""
    sistema:  str = ""
    modelo:   str = ""
    puntaje:  float = 0.0
    nivel:    str = ""


class DirectorioReportePayload(BaseModel):
    titulo:   str = "Todos los Docentes"
    docentes: List[DocenteItem] = []


@router.post("/reporte-directorio.pdf")
def descargar_reporte_directorio(payload: DirectorioReportePayload):
    """
    Genera un PDF de reporte del directorio de docentes.
    El frontend envía la lista de docentes ya filtrada.
    """
    try:
        docentes_raw = [d.dict() for d in payload.docentes]
        pdf_bytes    = generar_pdf_directorio(titulo=payload.titulo, docentes_data=docentes_raw)
    except Exception as e:
        raise HTTPException(500, f"No se pudo generar el PDF de directorio: {e}")

    from datetime import datetime as _dt
    filename = f"Reporte_Directorio_{_dt.now().strftime('%Y-%m-%d')}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


class BulkReportePayload(BaseModel):
    cedulas: List[str] = []


@router.post("/reporte-bulk.pdf")
def descargar_reporte_bulk(payload: BulkReportePayload, db: Session = Depends(get_db)):
    """
    Genera un PDF con una página completa por docente para todos los de la lista.
    """
    if not payload.cedulas:
        raise HTTPException(400, "Se requiere al menos una cédula")
    if len(payload.cedulas) > 500:
        raise HTTPException(400, "Máximo 500 docentes por reporte")

    try:
        pdf_bytes = generar_pdf_bulk_docentes(cedulas=payload.cedulas, db=db)
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(500, f"No se pudo generar el PDF: {e}")

    from datetime import datetime as _dt
    filename = f"Reportes_Docentes_{_dt.now().strftime('%Y-%m-%d')}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
