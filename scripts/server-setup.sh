#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# server-setup.sh — Instalación INICIAL en VPS Contabo
# Ejecutar UNA sola vez como root
# ─────────────────────────────────────────────────────────────────────────────
set -e

REPO="https://github.com/KernelXOS/pucese2.0.git"
APP_DIR="/opt/evaluacion-docente"
NGINX_CONF="/etc/nginx/sites-available/evaluacion-docente"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Evaluación Docente IA — Setup inicial VPS   ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Clonar / actualizar repo ───────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "▸ Repositorio ya existe, actualizando…"
  git -C "$APP_DIR" pull --ff-only
else
  echo "▸ Clonando repositorio en $APP_DIR …"
  git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

# ── 2. Crear .env.prod si no existe ──────────────────────────────────────────
if [ ! -f "backend/.env.prod" ]; then
  cp backend/.env.prod.example backend/.env.prod
  echo ""
  echo "⚠️  IMPORTANTE: Edita backend/.env.prod con tu GEMINI_API_KEY:"
  echo "       nano $APP_DIR/backend/.env.prod"
  echo ""
  echo "   Luego vuelve a ejecutar: bash $APP_DIR/scripts/server-setup.sh"
  echo ""
  exit 1
fi

# ── 3. Verificar que GEMINI_API_KEY fue configurada ───────────────────────────
if grep -q "PON_TU_GEMINI_KEY_AQUI" backend/.env.prod; then
  echo ""
  echo "⚠️  Falta configurar GEMINI_API_KEY en backend/.env.prod"
  echo "       nano $APP_DIR/backend/.env.prod"
  echo ""
  exit 1
fi

# ── 4. Levantar contenedores ──────────────────────────────────────────────────
echo "▸ Construyendo e iniciando contenedores (puede tardar 3-5 min la primera vez)…"
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "▸ Esperando que la API arranque (ETL carga los datos automáticamente)…"
sleep 15

# ── 5. Verificar que responde ─────────────────────────────────────────────────
if curl -sf http://localhost:8001/ > /dev/null; then
  echo "✅ API respondiendo en http://localhost:8001"
else
  echo "⚠️  Aún iniciando… revisa los logs: docker logs eval_docente_api -f"
fi

# ── 6. Configurar nginx (si está instalado) ───────────────────────────────────
if command -v nginx &> /dev/null; then
  SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

  cat > "$NGINX_CONF" <<NGINXEOF
# Evaluación Docente — proxy al contenedor Docker en 8001
server {
    listen 80;
    server_name $SERVER_IP;   # Reemplaza por tu dominio si tienes uno

    # Aumentar timeout para el ETL en el primer arranque
    proxy_read_timeout 300s;
    proxy_connect_timeout 10s;

    location /api-eval/ {
        rewrite ^/api-eval/(.*)$ /\$1 break;
        proxy_pass         http://localhost:8001;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
NGINXEOF

  # Activar solo si no existe ya el enlace
  if [ ! -L /etc/nginx/sites-enabled/evaluacion-docente ]; then
    ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/evaluacion-docente
  fi

  nginx -t && nginx -s reload
  echo "✅ nginx configurado — /api-eval/ → localhost:8001"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅  Instalación completa                                    ║"
echo "║                                                              ║"
echo "║  API directa:  http://$(curl -s ifconfig.me 2>/dev/null):8001/api/v1      ║"
echo "║  Ver logs:     docker logs eval_docente_api -f              ║"
echo "║  Actualizar:   bash $APP_DIR/scripts/deploy.sh     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
