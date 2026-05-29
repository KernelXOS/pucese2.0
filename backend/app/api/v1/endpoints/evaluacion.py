from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import distinct
from app.db.session import get_db, SessionLocal
from app.models.evaluacion import Evaluacion
from app.services.kpi_service import kpi_service
from app.services.gemini_service import gemini_service
from app.services.etl_service import etl_service
import io, threading


def _periodo_to_codigo(p: str) -> str:
    """'2024-II' → '202402',  '2025-I' → '202501'"""
    if not p or '-' not in p:
        return p
    parts = p.split('-')
    if len(parts) == 2:
        year_p = parts[0] if parts[0].isdigit() else parts[1]
        sem_p  = parts[1] if parts[0].isdigit() else parts[0]
        if year_p.isdigit() and sem_p in ('I', 'II'):
            suf = '02' if sem_p == 'II' else '01'
            return f'{year_p}{suf}'
    return p


def _codigo_to_periodo(c: str) -> str:
    """'202402' → '2024-II',  '202501' → '2025-I'"""
    if len(c) == 6 and c.isdigit():
        year = c[:4]
        sem  = 'II' if int(c[4:]) >= 2 else 'I'
        return f'{year}-{sem}'
    return c


def _periodo_sem_key(code: str):
    """
    Returns ('YYYY', 'I') or ('YYYY', 'II') for any raw period code.
    Handles standard codes (202301, 202302), tec codes (202311-202330),
    and posgrado codes (202371-202379) by suffix range.
    """
    if not code or len(code) < 4:
        return (code, '')
    # Handle YYYY-I / YYYY-II format
    if '-' in code:
        parts = code.split('-')
        year = parts[0] if parts[0].isdigit() else parts[1]
        sem  = next((p for p in parts if p in ('I', 'II')), '')
        return (year, sem)
    if len(code) == 6 and code.isdigit():
        year = code[:4]
        suf  = int(code[4:])
        # Semester I: 0, 1, TEC-I (10-20), Posg-I (70-73)
        if suf == 0 or suf == 1 or (10 <= suf <= 20) or (70 <= suf <= 73):
            return (year, 'I')
        # Semester II: 2, TEC-II (21-30), MECDI G·II (56,66), Posg-II (74-79), others
        return (year, 'II')
    return (code, '')

_etl_status: dict = {"running": False, "last_count": None, "last_error": None}


class ConsultaRequest(BaseModel):
    pregunta: str
    anio: Optional[int] = None

router = APIRouter()


@router.post("/etl/process")
def process_evaluaciones():
    """Trigger ETL in a background thread (returns immediately — poll /etl/status)."""
    global _etl_status
    if _etl_status["running"]:
        return {"message": "ETL ya está en progreso. Espera unos segundos.", "running": True}

    def _run():
        global _etl_status
        _etl_status["running"] = True
        _etl_status["last_error"] = None
        db = SessionLocal()
        try:
            count = etl_service.process_all_files(db)
            _etl_status["last_count"] = count
            kpi_service.clear_cache()
            print(f"[ETL/bg] ✅ {count} registros cargados. Caché limpiado.")
        except Exception as e:
            _etl_status["last_error"] = str(e)
            print(f"[ETL/bg] ❌ Error: {e}")
        finally:
            db.close()
            _etl_status["running"] = False

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    return {"message": "ETL iniciado en segundo plano. Los datos estarán listos en ~30-60s.", "running": True}


@router.get("/etl/status")
def etl_status():
    """Check if background ETL is still running."""
    return _etl_status


@router.get("/etl/periodos")
def get_periodos_disponibles(db: Session = Depends(get_db)):
    """
    Devuelve los períodos disponibles en la BD, convertidos al formato
    codigo='202402' (lo que espera el sidebar del frontend).
    """
    LABEL_MAP = {
        '2023-I': 'I Período 2023',  '2023-II': 'II Período 2023',
        '2024-I': 'I Período 2024',  '2024-II': 'II Período 2024',
        '2025-I': 'I Período 2025',  '2025-II': 'II Período 2025',
    }
    rows = db.query(distinct(Evaluacion.periodo)).all()
    result = []
    seen: set = set()
    for (p,) in rows:
        if not p:
            continue
        year, sem = _periodo_sem_key(p)
        sem_key = (year, sem)
        if not sem or sem_key in seen:
            continue
        seen.add(sem_key)
        # Canonical codigo: YYYY01 (I) or YYYY02 (II)
        canonical = f'{year}01' if sem == 'I' else f'{year}02'
        label = LABEL_MAP.get(f'{year}-{sem}') or p
        result.append({'codigo': canonical, 'label': label, 'cargado': True})
    result.sort(key=lambda x: x['codigo'])
    return result


@router.get("/kpis/institucionales")
def get_kpis(
    db: Session = Depends(get_db),
    modelo: Optional[str] = None,
    anio: Optional[int] = None,
    sistema: Optional[str] = None,
    periodo: Optional[str] = None,
):
    kpis = kpi_service.get_institutional_kpis(db, modelo=modelo, anio=anio, sistema=sistema, periodo=periodo)
    if not kpis:
        raise HTTPException(status_code=404, detail="No hay datos disponibles")
    return kpis


@router.get("/ranking")
def get_ranking(
    db: Session = Depends(get_db),
    limit: int = 1000,
    modelo: Optional[str] = None,
    anio: Optional[int] = None,
    sistema: Optional[str] = None,
    periodo: Optional[str] = None,
):
    return kpi_service.get_ranking_docentes(db, modelo=modelo, anio=anio, limit=limit, sistema=sistema, periodo=periodo)


@router.get("/criticos")
def get_criticos(
    db: Session = Depends(get_db),
    threshold: float = 3.5,
    modelo: Optional[str] = None,
    anio: Optional[int] = None,
    sistema: Optional[str] = None,
    periodo: Optional[str] = None,
):
    return kpi_service.get_docentes_criticos(db, modelo=modelo, anio=anio, threshold=threshold, sistema=sistema, periodo=periodo)


@router.get("/tendencias")
def get_tendencias(
    db: Session = Depends(get_db),
    modelo: Optional[str] = None,
    sistema: Optional[str] = None,
):
    # Las tendencias siempre muestran todos los períodos (para el gráfico de evolución)
    return kpi_service.get_tendencias(db, modelo=modelo, sistema=sistema)


@router.get("/variables")
def get_variables(
    db: Session = Depends(get_db),
    modelo: Optional[str] = None,
    anio: Optional[int] = None,
    sistema: Optional[str] = None,
    periodo: Optional[str] = None,
):
    return kpi_service.get_variables_kpis(db, modelo=modelo, anio=anio, sistema=sistema, periodo=periodo)


@router.get("/demograficos")
def get_demograficos(
    db: Session = Depends(get_db),
    modelo: Optional[str] = None,
    anio: Optional[int] = None,
    sistema: Optional[str] = None,
    periodo: Optional[str] = None,
):
    return kpi_service.get_demograficos(db, modelo=modelo, anio=anio, sistema=sistema, periodo=periodo)


@router.get("/analisis-ia")
def get_ai_analysis(
    db: Session = Depends(get_db),
    modelo: Optional[str] = None,
    anio: Optional[int] = None,
    sistema: Optional[str] = None,
    periodo: Optional[str] = None,
):
    kpis = kpi_service.get_institutional_kpis(db, modelo=modelo, anio=anio, sistema=sistema, periodo=periodo)
    if not kpis:
        raise HTTPException(status_code=404, detail="No hay datos para analizar")
    variables = kpi_service.get_variables_kpis(db, modelo=modelo, anio=anio, sistema=sistema, periodo=periodo)
    kpis['variables'] = {k: v['promedio'] for k, v in variables.get('componentes', {}).items()}
    analysis = gemini_service.generate_executive_analysis(kpis)
    return {"analysis": analysis}


@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    sistema: Optional[str] = None,
    modelo: Optional[str] = None,
    anio: Optional[int] = None,
    periodo: Optional[str] = None,
):
    """Return gender/age/seniority/function breakdown for any filter combination."""
    return kpi_service.get_analytics(db, sistema=sistema, modelo=modelo, anio=anio, periodo=periodo)


@router.get("/comparativo")
def get_comparativo(
    db: Session = Depends(get_db),
    anio: Optional[int] = None,
):
    """Side-by-side MEIPA vs 360 metrics + per-model breakdown + yearly trends."""
    return kpi_service.get_comparativo(db, anio=anio)


@router.get("/todos-docentes")
def get_todos_docentes(
    db: Session = Depends(get_db),
    anio: Optional[int] = None,
    modelo: Optional[str] = None,
    sistema: Optional[str] = None,
    periodo: Optional[str] = None,
):
    """All teachers with per-component breakdown."""
    return kpi_service.get_todos_docentes(db, anio=anio, modelo=modelo, sistema=sistema, periodo=periodo)


@router.get("/desempeno-variables")
def get_desempeno_variables(
    db: Session = Depends(get_db),
    anio: Optional[int] = None,
    sistema: Optional[str] = None,
    modelo: Optional[str] = None,
):
    """Desempeño promedio agrupado por tiempo_servicio, sexo, función y nivel_estudio."""
    return kpi_service.get_desempeno_por_variables(db, anio=anio, sistema=sistema, modelo=modelo)


@router.get("/competencias-por-carrera")
def get_competencias_por_carrera(
    db: Session = Depends(get_db),
    anio: Optional[int] = None,
    sistema: Optional[str] = None,
    modelo: Optional[str] = None,
    periodo: Optional[str] = None,
):
    """Best and worst component for each official carrera."""
    data = kpi_service.get_competencias_por_carrera(db, anio=anio, sistema=sistema, modelo=modelo, periodo=periodo)
    if not data:
        raise HTTPException(status_code=404, detail="No hay datos de competencias por carrera")
    return data


@router.get("/competencias-preguntas")
def get_competencias_preguntas():
    """Ranking de competencias y preguntas (mejor/peor) por periodo, leído de eval_detalladas."""
    data = kpi_service.get_competencias_preguntas()
    if not data:
        raise HTTPException(status_code=404, detail="No hay datos de preguntas disponibles")
    return data


@router.get("/prediccion-tendencias")
def get_prediccion_tendencias(
    db: Session = Depends(get_db),
    anio: Optional[int] = None,
    con_ia: bool = True,
):
    """Predicción híbrida: tendencias/proyecciones (Python) + alertas IA (Gemini)."""
    data = kpi_service.get_prediccion_tendencias(db, anio=anio)
    if not data or not data.get('predicciones'):
        raise HTTPException(status_code=404, detail="No hay suficientes datos para proyectar tendencias")
    # Capa IA (opcional): no rompe si Gemini falla
    if con_ia:
        try:
            data['alertas_ia'] = gemini_service.generate_prediccion_alertas(data)
        except Exception as e:
            data['alertas_ia'] = ''
            data['alertas_ia_error'] = str(e)
    else:
        data['alertas_ia'] = ''
    return data


@router.get("/reporte-general.pdf")
def reporte_general_pdf(
    db:      Session      = Depends(get_db),
    sistema: Optional[str] = None,
    modelo:  Optional[str] = None,
    periodo: Optional[str] = None,
):
    """
    Genera y descarga un PDF con el informe general completo.
    Filtra por sistema (meipa|360|salud), modelo y/o período.
    Sin filtros → informe institucional unificado (todos los sistemas).
    """
    from app.services.pdf_service import generar_pdf_reporte_general
    from datetime import datetime as _dt
    import traceback as _tb
    try:
        pdf_bytes = generar_pdf_reporte_general(db, sistema=sistema, modelo=modelo, periodo=periodo)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        _tb.print_exc()
        raise HTTPException(status_code=500, detail=f"No se pudo generar el reporte: {type(e).__name__}: {e}")

    parts = [p for p in [sistema, modelo, periodo] if p]
    tag   = "_".join(parts) if parts else "institucional"
    filename = f"InformeGeneral_{tag}_{_dt.now().strftime('%Y%m%d')}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/consulta-ia")
def consulta_ia(body: ConsultaRequest, db: Session = Depends(get_db)):
    """Answer a free-form question about teacher evaluation using rich real data + Gemini."""
    comparativo        = kpi_service.get_comparativo(db, anio=body.anio)
    ranking_top        = kpi_service.get_ranking_docentes(db, limit=50)
    criticos           = kpi_service.get_docentes_criticos(db, threshold=3.5)
    tendencias         = kpi_service.get_tendencias(db)
    variables          = kpi_service.get_variables_kpis(db)
    try:
        comp_por_carrera = kpi_service.get_competencias_por_carrera(db)
    except Exception:
        comp_por_carrera = []

    context = {
        'comparativo':           comparativo,
        'ranking_top':           ranking_top,
        'criticos':              criticos,
        'tendencias':            tendencias,
        'variables':             variables,
        'competencias_por_carrera': comp_por_carrera,
    }

    answer = gemini_service.answer_question(body.pregunta, context)
    return {'respuesta': answer, 'pregunta': body.pregunta}


@router.post("/informe-ia")
def generar_informe_ia(db: Session = Depends(get_db)):
    """Genera un informe ejecutivo completo con IA usando todos los datos disponibles."""
    comparativo        = kpi_service.get_comparativo(db)
    ranking_top        = kpi_service.get_ranking_docentes(db, limit=100)
    criticos           = kpi_service.get_docentes_criticos(db, threshold=3.5)
    tendencias         = kpi_service.get_tendencias(db)
    variables          = kpi_service.get_variables_kpis(db)
    try:
        comp_por_carrera = kpi_service.get_competencias_por_carrera(db)
    except Exception:
        comp_por_carrera = []

    data = {
        'comparativo':           comparativo,
        'ranking_top':           ranking_top,
        'criticos':              criticos,
        'tendencias':            tendencias,
        'variables':             variables,
        'competencias_por_carrera': comp_por_carrera,
    }

    informe = gemini_service.generate_informe_ia(data)
    return {'informe': informe}
