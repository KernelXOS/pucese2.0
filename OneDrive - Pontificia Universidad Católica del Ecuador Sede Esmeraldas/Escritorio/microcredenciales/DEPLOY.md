# Despliegue en el VPS (Apache + Docker aislado)

> Subdominio de ejemplo: **`credenciales.pucese.kernelxos.com`** — cámbialo por el que
> uses en TODOS los pasos. Lo único que va al VPS es el **verificador estático**;
> la emisión y la **clave privada se quedan en tu máquina**.

## 0) DNS
Crea un registro **A**: `credenciales.pucese.kernelxos.com` → IP pública del VPS.
Espera a que resuelva (`ping credenciales.pucese.kernelxos.com`).

## 1) Re-emitir las credenciales con el dominio real  (en tu PC, NO en el VPS)
Las credenciales tienen `localhost:8443` incrustado; hay que rehacerlas apuntando
al dominio. Edita y reemplaza `https://localhost:8443` por `https://credenciales.pucese.kernelxos.com`:

- `data/cert-tools/conf.ini`  → `issuer_id` y `revocation_list`
- `verifier/issuer.json`      → `id` y `revocationList`
- `verifier/revocation.json`  → `id` y `issuer`

Luego regenera, re-firma y actualiza el listado:
```powershell
docker compose run --rm cert-tools create-certificate-template   -c /data/cert-tools/conf.ini
docker compose run --rm cert-tools instantiate-certificate-batch -c /data/cert-tools/conf.ini
docker compose run --rm cert-tools python /data/cert-tools/inject_names.py
docker compose run --rm cert-issuer cert-issuer -c /data/cert-issuer/conf.ini
powershell -ExecutionPolicy Bypass -File .\gen-students.ps1

# Copia los certificados firmados a la carpeta que se sube:
Copy-Item data\cert-issuer\blockchain_certificates\*.json verifier\certs\ -Force
```

## 2) Subir SOLO el verificador al VPS
Excluye lo local (clave, TLS autofirmado, config local). Con rsync (git-bash/WSL):
```bash
rsync -avz --delete \
  --exclude 'tls/' --exclude 'nginx.conf' \
  verifier/  usuario@VPS:/opt/microcredenciales/verifier/

scp docker-compose.prod.yml  usuario@VPS:/opt/microcredenciales/
```
(o usa WinSCP arrastrando `verifier/` —sin `tls/` ni `nginx.conf`— y `docker-compose.prod.yml`.)

> ❌ NUNCA subas `data/`, `pk_issuer.txt`, `cert-tools/`, `cert-issuer/`.

## 3) Levantar el contenedor (en el VPS)
```bash
cd /opt/microcredenciales
docker compose -f docker-compose.prod.yml up -d
curl -I http://127.0.0.1:8089        # debe responder 200, solo en local
```
No abre puertos públicos ni toca tus otras webs (red propia + 127.0.0.1).

## 4) Publicar con Apache + HTTPS real (en el VPS)
```bash
sudo a2enmod proxy proxy_http headers
sudo cp /opt/microcredenciales/deploy/credenciales.pucese.kernelxos.com.conf /etc/apache2/sites-available/
sudo a2ensite credenciales.pucese.kernelxos.com
sudo systemctl reload apache2

# Certificado Let's Encrypt (añade el vhost :443 y la redirección):
sudo certbot --apache -d credenciales.pucese.kernelxos.com
```

## 5) Probar
Abre **https://credenciales.pucese.kernelxos.com** → debe verificar en verde,
con candado válido (sin advertencias). El `issuer.json` y los `certs/` ahora
se sirven por HTTPS real, así que el verificador valida sin problema.

## Emitir nuevos lotes después
1. En tu PC: editas curso/roster → regeneras + re-firmas + `gen-students.ps1`.
2. Copias los nuevos `.json` a `verifier/certs/`.
3. Repites el `rsync` del paso 2. (El contenedor del VPS no se reinicia: nginx
   sirve los archivos nuevos al instante.)

## Notas
- El verificador usa `location.origin`, así que se adapta solo al dominio (no hay
  URLs fijas en el HTML).
- Si el puerto 8089 está ocupado en el VPS, define otro en un `.env` junto al
  compose: `VERIFIER_PORT=8470` (y ajusta el `ProxyPass` del vhost).
- Para 100% offline puedes alojar las fuentes (IBM Plex/Source Serif) localmente
  en vez de Google Fonts.
