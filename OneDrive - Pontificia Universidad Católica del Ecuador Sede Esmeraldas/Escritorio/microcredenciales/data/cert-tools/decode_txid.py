#!/usr/bin/env python3
"""Extrae de cada certificado firmado:
  - txid       : transaccion de anclaje en Sepolia (COMPARTIDA por todo el lote)
  - targetHash : huella criptografica UNICA de esa credencial dentro del Merkle tree
Lee el MerkleProof2019 (multibase base58btc -> CBOR).
Escribe /data/_txids.json = { "<archivo>": {"txid": "...", "targetHash": "..."} }
Requiere base58 y cbor2."""
import glob, json, os, re, base58, cbor2

BASE = "/data/cert-issuer/blockchain_certificates"
rx_tx = re.compile(rb"0x[0-9a-fA-F]{64}")
rx_h = re.compile(r"[0-9a-fA-F]{64}")
out = {}
for f in sorted(glob.glob(os.path.join(BASE, "*.json"))):
    cert = json.load(open(f, encoding="utf-8"))
    pv = cert["proof"]["proofValue"]
    raw = base58.b58decode(pv[1:] if pv[0] == "z" else pv)
    obj = cbor2.loads(raw)

    txid = ""
    m = rx_tx.search(raw)
    if m:
        txid = m.group(0).decode()

    # En este CBOR: tag 0 = merkleRoot (COMPARTIDO), tag 1 = targetHash (UNICO).
    target = ""
    try:
        for item in obj:                       # estructura: [ [tag, valor], ... ]
            if isinstance(item, (list, tuple)) and len(item) >= 2 and item[0] == 1:
                v = item[1]
                if isinstance(v, (bytes, bytearray)):
                    hm = rx_h.search(v.decode("latin1"))
                    if hm:
                        target = hm.group(0)
    except Exception:
        pass

    out[os.path.basename(f)] = {"txid": txid, "targetHash": target}

open("/data/_txids.json", "w", encoding="utf-8").write(json.dumps(out, ensure_ascii=False, indent=2))
print(json.dumps(out, indent=2))
