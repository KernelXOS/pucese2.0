from fastapi import APIRouter
from app.api.v1.endpoints import evaluacion, auth, docentes

api_router = APIRouter()
api_router.include_router(auth.router,      prefix="/auth",      tags=["auth"])
api_router.include_router(evaluacion.router, prefix="/evaluacion", tags=["evaluacion"])
api_router.include_router(docentes.router,  prefix="/docentes",  tags=["docentes"])
