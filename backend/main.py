from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.db.session import engine, SessionLocal
from app.models.evaluacion import Base
from app.models.user import User          # importar ANTES de create_all
from app.core.config import settings

# Crear TODAS las tablas (evaluaciones + users)
Base.metadata.create_all(bind=engine)

# ── Migraciones ligeras: añadir columnas nuevas si no existen ─────────────
def _run_migrations():
    from sqlalchemy import text
    statements = [
        "ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS n_evaluadores INTEGER",
        "CREATE INDEX IF NOT EXISTS idx_ev_sistema ON evaluaciones(sistema)",
        "CREATE INDEX IF NOT EXISTS idx_ev_modelo ON evaluaciones(modelo)",
        "CREATE INDEX IF NOT EXISTS idx_ev_anio ON evaluaciones(anio)",
        "CREATE INDEX IF NOT EXISTS idx_ev_periodo ON evaluaciones(periodo)",
        "CREATE INDEX IF NOT EXISTS idx_ev_cedula ON evaluaciones(cedula)",
        "CREATE INDEX IF NOT EXISTS idx_ev_sis_mod ON evaluaciones(sistema, modelo)",
        "CREATE INDEX IF NOT EXISTS idx_ev_sexo ON evaluaciones(sexo)",
        "CREATE INDEX IF NOT EXISTS idx_ev_facultad ON evaluaciones(facultad)",
    ]
    try:
        with engine.connect() as conn:
            for sql in statements:
                conn.execute(text(sql))
            conn.commit()
    except Exception as e:
        print(f"[MIGRATION] Advertencia: {e}")

_run_migrations()

app = FastAPI(title=settings.PROJECT_NAME)

def _seed_admin_user(db):
    """Crea el usuario admin si no existe."""
    try:
        from app.models.user import User
        from app.core.security import get_password_hash
        existing = db.query(User).filter(User.username == 'admin@pucese.edu.ec').first()
        if not existing:
            db.add(User(username='admin@pucese.edu.ec', hashed_password=get_password_hash('Admin23@1'), role='admin', is_active=True))
            db.commit()
            print("[SEED] Admin user created: admin@pucese.edu.ec")
        else:
            print("[SEED] Admin user already exists — skipping.")
    except Exception as e:
        print(f"[SEED] Error creando admin user: {e}")

@app.on_event("startup")
async def auto_seed():
    """Corre el ETL completo si faltan datos o la BD está incompleta."""
    import traceback
    try:
        from app.services.etl_service import etl_service, BASE
        from app.models.evaluacion import Evaluacion
        import os as _os
        db = SessionLocal()
        total_count     = db.query(Evaluacion).count()
        count_meipa     = db.query(Evaluacion).filter(Evaluacion.sistema == 'meipa').count()
        count_360       = db.query(Evaluacion).filter(Evaluacion.sistema == '360').count()
        count_servicios = db.query(Evaluacion).filter(Evaluacion.sistema == '360', Evaluacion.modelo == 'servicios').count()
        data_dir_ok     = _os.path.isdir(BASE)
        print(f"[ETL] BD actual: {total_count} total | meipa={count_meipa} | 360={count_360} | servicios={count_servicios}")
        print(f"[ETL] Directorio de datos: {BASE} (existe={data_dir_ok})")

        needs_etl = (total_count == 0 or count_meipa == 0 or count_360 == 0 or count_servicios == 0)
        if needs_etl and data_dir_ok:
            print("[ETL] Datos incompletos — procesando todos los archivos de data/...")
            total = etl_service.process_all_files(db)
            print(f"[ETL] Resultado: {total} registros.")
        elif needs_etl and not data_dir_ok:
            print(f"[ETL] ⚠️  Datos incompletos PERO directorio {BASE} NO existe — omitiendo ETL para proteger la BD.")
        else:
            print(f"[ETL] BD completa — omitiendo seed (para forzar recarga usa POST /api/v1/evaluacion/etl/process).")

        _seed_admin_user(db)
        db.close()
    except Exception as e:
        print(f"[ETL] Error durante el seed automático: {e}")
        traceback.print_exc()

# Configurar CORS
import os as _os
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
