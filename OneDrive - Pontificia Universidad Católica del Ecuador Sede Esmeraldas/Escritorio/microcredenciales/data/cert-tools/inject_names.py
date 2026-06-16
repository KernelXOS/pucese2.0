#!/usr/bin/env python3
"""
Inyecta el nombre del estudiante (credentialSubject.name) en cada certificado
SIN firmar, cruzando por credentialSubject.id == pubkey del roster.

Por que aqui y no en cert-tools: cert-tools genera V3 minimalista y pasar
additional_per_recipient_fields por CLI en Windows rompe el JSON por el
escapado de comillas. Este post-proceso es deterministico y reproducible.
cert-issuer firma el documento YA con el nombre, asi que la prueba Merkle lo cubre.
"""
import csv, json, glob, os

BASE = "/data/cert-tools"
ROSTER = os.path.join(BASE, "rosters", "roster.csv")
UNSIGNED = os.path.join(BASE, "unsigned_certificates")

name_by_pubkey = {}
with open(ROSTER, newline="", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        name_by_pubkey[row["pubkey"].strip()] = row["name"].strip()

count = 0
for path in glob.glob(os.path.join(UNSIGNED, "*.json")):
    with open(path, encoding="utf-8") as f:
        cert = json.load(f)
    cs = cert.get("credentialSubject", {})
    name = name_by_pubkey.get(cs.get("id", ""))
    if name:
        cs["name"] = name
        with open(path, "w", encoding="utf-8") as f:
            json.dump(cert, f, ensure_ascii=False)
        count += 1
        print(f"  {os.path.basename(path)} -> {name}")

print(f"Inyectados {count} nombres.")
