# cert-issuer: firma el lote y ancla el Merkle root en Ethereum Sepolia.
# Base limpia + dependencias de compilación para las libs cripto (coincurve, etc.)
FROM python:3.10-slim

ARG CERT_ISSUER_REF=v3.13.1
ENV DEBIAN_FRONTEND=noninteractive PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        git build-essential automake pkg-config libtool \
        libffi-dev libssl-dev libgmp-dev python3-dev curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip setuptools wheel Cython

RUN git clone https://github.com/blockchain-certificates/cert-issuer.git /opt/cert-issuer \
    && cd /opt/cert-issuer \
    && git checkout ${CERT_ISSUER_REF} \
    && pip install --no-cache-dir . \
    && pip install --no-cache-dir -r ethereum_requirements.txt

# --- PARCHE de compatibilidad ----------------------------------------------
# cert-issuer v3.13.1 usa SignedTransaction.raw_transaction (eth-account >=0.13),
# pero web3 6.x fija eth-account 0.11.x, donde el atributo es .rawTransaction.
# Ajustamos signer.py al nombre disponible. (NO toca send_raw_transaction de web3.)
RUN sed -i 's/\.raw_transaction/.rawTransaction/g' \
    /usr/local/lib/python3.10/site-packages/cert_issuer/blockchain_handlers/ethereum/signer.py

# Instala el entry point: cert-issuer
WORKDIR /opt/cert-issuer
CMD ["bash"]
