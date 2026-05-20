from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.db.session import engine, SessionLocal
from app.models.evaluacion import Base
from app.core.config import settings

# Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)

# ── Migraciones ligeras: añadir columnas nuevas si no existen ─────────────
def _run_migrations():
    from sqlalchemy import text
    cols = [
        "ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS n_evaluadores INTEGER",
    ]
    try:
        with engine.connect() as conn:
            for sql in cols:
                conn.execute(text(sql))
            conn.commit()
    except Exception as e:
        print(f"[MIGRATION] Advertencia: {e}")

_run_migrations()

app = FastAPI(title=settings.PROJECT_NAME)

@app.on_event("startup")
async def auto_seed():
    """Corre el ETL completo si faltan datos 360 o la BD está vacía."""
    import traceback
    try:
        from app.services.etl_service import etl_service
        from app.models.evaluacion import Evaluacion
        db = SessionLocal()
        total_count       = db.query(Evaluacion).count()
        count_360         = db.query(Evaluacion).filter(Evaluacion.sistema == '360').count()
        count_servicios   = db.query(Evaluacion).filter(Evaluacion.sistema == '360', Evaluacion.modelo == 'servicios').count()
        print(f"[ETL] BD actual: {total_count} total, {count_360} registros 360/MECDI, {count_servicios} servicios")

        if total_count == 0 or count_360 == 0 or count_servicios == 0:
            print("[ETL] Faltan datos (o modelo 'servicios' aún no cargado) — procesando todos los archivos de data/...")
            total = etl_service.process_all_files(db)
            print(f"[ETL] ✅ {total} registros cargados.")
        else:
            print(f"[ETL] BD completa ({total_count} registros, {count_360} de tipo 360, {count_servicios} servicios) — omitiendo seed.")
        db.close()
    except Exception as e:
        print(f"[ETL] Error durante el seed automático: {e}")
        traceback.print_exc()

# Configurar CORS
# En producción detrás de Apache, CORS lo maneja Apache para evitar headers duplicados
import os as _os
if not _os.environ.get('DISABLE_CORS'):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la Plataforma de Evaluación Docente IA API v1"}

@app.get("/debug/data")
def debug_data():
    """Diagnóstico: muestra qué archivos de datos encuentra el contenedor."""
    import os
    candidates = [
        '/app/data',
        '/app/backend/data',
        '/data',
    ]
    result = {}
    for c in candidates:
        result[c] = {
            'exists': os.path.isdir(c),
            'files': os.listdir(c)[:20] if os.path.isdir(c) else [],
        }
    try:
        from app.services.etl_service import BASE, EVAL_DIR
        result['etl_BASE'] = BASE
        result['etl_BASE_exists'] = os.path.isdir(BASE)
        result['etl_EVAL_DIR'] = EVAL_DIR
        result['etl_EVAL_DIR_exists'] = os.path.isdir(EVAL_DIR)
    except Exception as e:
        result['etl_error'] = str(e)
    result['cwd'] = os.getcwd()
    result['cwd_contents'] = os.listdir(os.getcwd())
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
