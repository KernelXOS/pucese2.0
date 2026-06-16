# Regenera verifier/students.json (selector del verificador) con el txid de
# anclaje (compartido por el lote) y el targetHash unico de cada credencial.
# Ejecutar despues de cert-issuer:
#   powershell -ExecutionPolicy Bypass -File .\gen-students.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dir  = Join-Path $root "data\cert-issuer\blockchain_certificates"

# 1) Decodifica txid + targetHash dentro del contenedor (base58 + cbor2 al vuelo)
docker compose run --rm cert-issuer sh -c "pip install -q base58 cbor2 && python /data/cert-tools/decode_txid.py" | Out-Null
$info = Get-Content (Join-Path $root "data\_txids.json") -Raw | ConvertFrom-Json

# 2) Construye el manifiesto leyendo cada certificado en UTF-8
$list = Get-ChildItem $dir -Filter *.json | ForEach-Object {
  $raw = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
  $c = $raw | ConvertFrom-Json
  $course = ""
  if ($c.display.content -match '<h1[^>]*>(.*?)</h1>') { $course = $matches[1].Trim() }
  $txid = ""; $target = ""
  if ($info.PSObject.Properties.Name -contains $_.Name) {
    $e = $info.($_.Name); $txid = [string]$e.txid; $target = [string]$e.targetHash
  }
  [PSCustomObject]@{
    file       = $_.Name
    uid        = ([string]$c.id) -replace "urn:uuid:", ""
    name       = [string]$c.credentialSubject.name
    course     = $course
    txid       = $txid
    targetHash = $target
    chain      = "ethereum_sepolia"
  }
}

$json = $list | ConvertTo-Json -Depth 4
if ($list.Count -le 1) { $json = "[" + $json + "]" }
$out = Join-Path $root "verifier\students.json"
[System.IO.File]::WriteAllText($out, $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Host ("students.json actualizado: " + $list.Count + " credencial(es) con txid + huella unica.")
