FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema: psycopg2 + pycairo (requerido por xhtml2pdf -> svglib)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    pkg-config \
    libcairo2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Crear carpetas necesarias
RUN mkdir -p /app/encuestas /app/data

CMD ["/bin/sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
