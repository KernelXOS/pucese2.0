# cert-tools: genera plantillas y lotes de certificados SIN firmar.
# Imagen limpia (no arrastra bitcoind como el Dockerfile oficial).
FROM python:3.10-slim

ARG CERT_TOOLS_REF=master
ENV DEBIAN_FRONTEND=noninteractive PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        git build-essential libssl-dev libffi-dev python3-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

RUN git clone https://github.com/blockchain-certificates/cert-tools.git /opt/cert-tools \
    && cd /opt/cert-tools \
    && git checkout ${CERT_TOOLS_REF} \
    && pip install --no-cache-dir .

# Instala los entry points: create-certificate-template, instantiate-certificate-batch
WORKDIR /data/cert-tools
CMD ["bash"]
