#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Actualizar app desde GitHub (usa esto cada vez que haya cambios)
# Ejecutar en el servidor: bash /opt/evaluacion-docente/scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

APP_DIR="/opt/evaluacion-docente"
cd "$APP_DIR"

echo ""
echo "▸ Descargando cambios desde GitHub…"
git pull --ff-only

echo "▸ Reconstruyendo contenedor backend…"
docker compose -f docker-compose.prod.yml up -d --build backend

echo ""
echo "▸ Esperando que la API responda…"
sleep 8

if curl -sf http://localhost:8001/ > /dev/null; then
  echo "✅ Actualización completada — API OK en http://localhost:8001"
else
  echo "⚠️  La API aún está iniciando, revisa: docker logs eval_docente_api -f"
fi
echo ""
