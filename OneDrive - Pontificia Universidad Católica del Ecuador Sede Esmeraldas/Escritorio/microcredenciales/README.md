# Microcredenciales PUCE Sede Esmeraldas
Sistema de microcredenciales digitales basado en [Blockcerts v3](https://www.blockcerts.org/) (MIT Media Lab) con verificación en blockchain Ethereum Sepolia.

**Producción:** https://credenciales.pucese.kernelxos.com

---

## Arquitectura

```
Tu PC (emisión, PRIVADA)          VPS 89.117.74.80 (público)
─────────────────────────         ──────────────────────────
cert-tools   ──┐                  Apache (HTTPS / Let's Encrypt)
cert-issuer  ──┼─► verifier/  ──► Docker nginx ► index.html
pk_issuer.txt  │   certs/*.json   issuer.json
               └── (se sube solo  students.json
                    la carpeta     revocation.json
                    verifier/)
```

- **Emisión:** solo ocurre en tu máquina. La clave privada nunca sale.
- **Verificación:** el verifier es estático (HTML + JSON). No hay base de datos.
- **Blockchain:** Ethereum Sepolia testnet (gratis). Un tx por lote, merkle tree por cert.

---

## Emitir un nuevo lote de microcredenciales

### 1. Editar el roster de estudiantes
Abre [`data/cert-tools/rosters/roster.csv`](data/cert-tools/rosters/roster.csv):

```csv
name,identity,pubkey
Nombre Completo,correo@pucese.edu.ec,did:ethr:0xDIRECCION_WALLET
```

- `name`: nombre completo del estudiante
- `identity`: correo institucional
- `pubkey`: wallet Ethereum del estudiante en formato `did:ethr:0x...`

### 2. Cambiar el curso (si es diferente)
Edita [`data/cert-tools/conf.ini`](data/cert-tools/conf.ini):

```ini
certificate_title = Nombre del Nuevo Curso
certificate_description = Descripción del curso...
criteria_narrative = Criterios de aprobación...
badge_id = <nuevo UUID>   # python -c "import uuid; print(uuid.uuid4())"
```

Y en `additional_global_fields`, actualiza el `nonce` (debe ser único por lote):
```ini
{"path": "$.nonce", "value": "puce-esm-2026-NOMBRE-CURSO-batch01"}
```

### 3. Regenerar, firmar y publicar

```powershell
# En PowerShell, desde la carpeta del proyecto:

# Generar plantilla
docker compose run --rm cert-tools create-certificate-template -c /data/cert-tools/conf.ini

# Instanciar por estudiante
docker compose run --rm cert-tools instantiate-certificate-batch -c /data/cert-tools/conf.ini

# Inyectar nombres
docker compose run --rm cert-tools python /data/cert-tools/inject_names.py

# Firmar y anclar en blockchain (necesita SepETH en la wallet emisora)
docker compose run --rm cert-issuer cert-issuer -c /data/cert-issuer/conf.ini

# Generar manifest students.json
powershell -ExecutionPolicy Bypass -File .\gen-students.ps1

# Copiar certificados firmados al verifier
Copy-Item data\cert-issuer\blockchain_certificates\*.json verifier\certs\ -Force
```

### 4. Subir al VPS

```powershell
scp -r verifier root@89.117.74.80:/opt/microcredenciales/
ssh root@89.117.74.80 "chmod -R 755 /opt/microcredenciales/verifier/"
```

El contenedor Docker NO necesita reiniciarse — nginx sirve los archivos nuevos al instante.

---

## Estructura del proyecto

```
microcredenciales/
├── docker-compose.yml          # Dev local (cert-tools + cert-issuer + verifier)
├── docker-compose.prod.yml     # VPS (solo verifier nginx)
├── gen-students.ps1            # Genera verifier/students.json desde los certs firmados
│
├── cert-tools/
│   └── Dockerfile
├── cert-issuer/
│   └── Dockerfile              # Incluye patch rawTransaction para eth-account 0.11.x
│
├── data/                       # Montado como /data en los contenedores
│   ├── cert-tools/
│   │   ├── conf.ini            # Configuración del curso e issuer
│   │   ├── rosters/roster.csv  # Lista de estudiantes
│   │   ├── inject_names.py     # Post-proceso: agrega nombres a los certs
│   │   ├── decode_txid.py      # Extrae txid y targetHash de cada cert
│   │   ├── images/             # logo.png, certificate-image.png
│   │   ├── unsigned_certificates/   # [ignorado por git]
│   │   └── certificate_templates/   # [ignorado por git]
│   └── cert-issuer/
│       ├── conf.ini            # Wallet, RPC, gas limit
│       ├── pk_issuer.txt       # *** CLAVE PRIVADA — NUNCA a git ni al VPS ***
│       └── blockchain_certificates/ # [ignorado por git]
│
├── verifier/                   # Carpeta pública — esta se sube al VPS
│   ├── index.html              # Frontend institucional con verificador Blockcerts
│   ├── diploma.html            # Generador de diplomas PDF (A4 landscape)
│   ├── issuer.json             # Perfil del emisor (Blockcerts V3)
│   ├── revocation.json         # Lista de revocación (vacía)
│   ├── students.json           # Manifest generado por gen-students.ps1
│   ├── certs/                  # Certificados firmados (.json por estudiante)
│   ├── tls/                    # [solo local] cert autofirmado para dev
│   └── nginx.conf              # [solo local] config nginx con TLS local
│
└── deploy/
    └── credenciales.pucese.kernelxos.com.conf   # VirtualHost Apache
```

---

## Wallet emisora

- **Dirección:** `0x2f7322f882c0004df7fEC72f64416e534bEAd06C`
- **Red:** Ethereum Sepolia (testnet, gratis)
- **Faucet SepETH:** https://sepolia-faucet.pk910.de (minería PoW, ~0.05 ETH/hora)
- La clave privada está en `data/cert-issuer/pk_issuer.txt` — **nunca la compartas ni la subas**

---

## Despliegue inicial en VPS

Ver [`DEPLOY.md`](DEPLOY.md) para instrucciones completas.

**Resumen:**
```bash
# En el VPS
mkdir -p /opt/microcredenciales
cd /opt/microcredenciales
docker compose -f docker-compose.prod.yml up -d
a2enmod proxy proxy_http headers
cp deploy/credenciales.pucese.kernelxos.com.conf /etc/apache2/sites-available/
a2ensite credenciales.pucese.kernelxos.com
systemctl reload apache2
certbot --apache -d credenciales.pucese.kernelxos.com
```

---

## Basado en

- [Blockcerts](https://www.blockcerts.org/) — MIT Media Lab / Learning Machine
- [cert-tools](https://github.com/blockchain-certificates/cert-tools)
- [cert-issuer](https://github.com/blockchain-certificates/cert-issuer)
- [blockcerts-verifier](https://github.com/blockchain-certificates/blockcerts-verifier)
- Ethereum Sepolia Testnet
