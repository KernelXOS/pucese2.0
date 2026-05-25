from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db, SessionLocal
from app.services.kpi_service import kpi_service
from app.services.gemini_service import gemini_service
from app.services.etl_service import etl_service
import io, threading

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
            print(f"[ETL/bg] ✅ {count} registros cargados.")
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


@router.get("/competencias-preguntas")
def get_competencias_preguntas():
    """Ranking de competencias y preguntas (mejor/peor) por periodo, leído de eval_detalladas."""
    data = kpi_service.get_competencias_preguntas()
    if not data:
        raise HTTPException(status_code=404, detail="No hay datos de preguntas disponibles")
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
    try:
        pdf_bytes = generar_pdf_reporte_general(db, sistema=sistema, modelo=modelo, periodo=periodo)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo generar el reporte: {e}")

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
    """Answer a free-form question about teacher evaluation using real data + Gemini."""
    comparativo = kpi_service.get_comparativo(db, anio=body.anio)
    ranking_top = kpi_service.get_ranking_docentes(db, limit=50)
    criticos    = kpi_service.get_docentes_criticos(db, threshold=3.5)  # <70/100

    context = {
        'comparativo': comparativo,
        'ranking_top': ranking_top,
        'criticos':    criticos,
    }

    answer = gemini_service.answer_question(body.pregunta, context)
    return {'respuesta': answer, 'pregunta': body.pregunta}
