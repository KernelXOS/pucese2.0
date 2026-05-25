"""
ETL service — wraps the multi-model processing logic so the /etl/process
endpoint always rebuilds the DB from the real data sources.
Mirrors construir_multi_modelo.py logic with sistema='meipa'|'360' field support.
"""
import os, re, sys, warnings
from datetime import datetime
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from app.models.evaluacion import Evaluacion

# Ruta de datos: busca en múltiples ubicaciones posibles
_HERE    = os.path.dirname(os.path.abspath(__file__))           # .../app/services
_BACKEND = os.path.dirname(os.path.dirname(_HERE))              # .../app  (2 niveles)
_BACKEND3 = os.path.dirname(_BACKEND)                           # .../ (3 niveles, por si acaso)

_DATA_CANDIDATES = [
    '/app/data',                                                 # Railway Docker (WORKDIR=/app)
    os.path.join(_BACKEND,  'data'),                            # 2 niveles desde services
    os.path.join(_BACKEND3, 'data'),                            # 3 niveles desde services
    os.path.join(os.getcwd(), 'data'),                          # Directorio de trabajo
    r'C:\Users\KernelXos\Desktop\DATOS_DOCENTE',               # Fallback Windows local
]

BASE = next((p for p in _DATA_CANDIDATES if os.path.isdir(p)), _DATA_CANDIDATES[0])
EVAL_DIR        = os.path.join(BASE, 'eval_detalladas_2025_02')
EVAL_DIR_202501 = os.path.join(BASE, 'eval_detalladas_202501')
EVAL_DIR_202402 = os.path.join(BASE, 'eval_det_202402')
POSGRADO_DIR    = os.path.join(BASE, 'posgrado')
PUCESE_DATA_DIR = os.path.join(BASE, 'pucese_data')

print(f"[ETL] BASE resuelto a: {BASE} (existe={os.path.isdir(BASE)})")
STAFF_REF_DATE = datetime(2025, 1, 1)

# ── Helpers ────────────────────────────────────────────────────────────────────

FACULTAD_MAP = {
    'CONTABILIDAD':       'Ciencias Administrativas',
    'ADMINISTRACION':     'Ciencias Administrativas',
    'ADMINISTRACI':       'Ciencias Administrativas',
    'TURISMO':            'Turismo y Hotelería',
    'HOTELERIA':          'Turismo y Hotelería',
    'MEDICINA':           'Medicina',
    'LABORATORIO CLINICO':'Medicina',
    'LABORATORIO CL':     'Medicina',
    'ENFERMERIA':         'Salud',
    'ENFERMERÍA':         'Salud',
    'NUTRICION':          'Salud',
    'NUTRICIÓN':          'Salud',
    'PSICOLOGIA':         'Psicología',
    'PSICOLOGÍA':         'Psicología',
    'DERECHO':            'Derecho',
    'INGENIERIA':         'Ingeniería',
    'INGENIERÍA':         'Ingeniería',
    'SISTEMAS':           'Ingeniería',
    'COMPUTACION':        'Ingeniería',
    'COMPUTACIÓN':        'Ingeniería',
    'EDUCACION':          'Educación',
    'EDUCACIÓN':          'Educación',
    'AGRO':               'Agroindustria',
    'PUCETEC':            'Tecnologado',
    'TECNOLOGADO':        'Tecnologado',
    'POSGRADO':           'Posgrado',
    'MAESTRIA':           'Posgrado',
    'MAESTRÍA':           'Posgrado',
    'MENTOR':             'Sin clasificar',
    'NO DEFINIDA':        'Sin clasificar',
}


def _map_facultad(text: str) -> str:
    if not text or pd.isna(text):
        return 'Otras Ciencias'
    t = str(text).upper().strip()
    for k, v in FACULTAD_MAP.items():
        if k in t:
            return v
    return 'Otras Ciencias'


def _nivel_from_puntaje(p) -> str:
    if p is None or (isinstance(p, float) and np.isnan(p)):
        return 'Sin datos'
    if p >= 90: return 'Excelente'
    if p >= 75: return 'Bueno'
    if p >= 60: return 'Regular'
    return 'Deficiente'


def _norm_str(s: str) -> str:
    import unicodedata
    return unicodedata.normalize('NFKD', str(s)).encode('ascii', 'ignore').decode().lower().strip()


def _first_mode(x):
    m = x.mode()
    return m.iloc[0] if len(m) > 0 else ''


def _find_col(df, keywords):
    for c in df.columns:
        cl = str(c).lower()
        if any(k in cl for k in keywords):
            return c
    return None


def _find_header_row(df_raw):
    for i, row in df_raw.iterrows():
        vals = [str(v).lower() for v in row.tolist()]
        if any('evaluado' in v or 'apellido' in v or 'nombre' in v for v in vals):
            return i
    return 0


def _clean_cedula(v) -> str:
    return str(v).strip().lstrip('0') if v and str(v).strip() not in ('', 'nan', 'NaN') else ''


def _clean_nombre(v) -> str:
    s = str(v).strip() if v else ''
    return '' if s.lower() in ('nan', 'none', '') else s


def _safe_float(v):
    try:
        f = float(v)
        return None if np.isnan(f) else f
    except:
        return None


def _map_tiempo_servicio(td: str) -> str:
    """Convierte código de dedicación (TC/MT/TP) a etiqueta legible."""
    if not td:
        return ''
    td = str(td).upper().strip()
    if td in ('TC',) or 'COMPLETO' in td:
        return 'Tiempo Completo'
    if td in ('TP',) or 'PARCIAL' in td:
        return 'Tiempo Parcial'
    if td in ('MT',) or 'MEDIO' in td:
        return 'Medio Tiempo'
    return ''


def _parse_antiguedad(s) -> float:
    if not s or pd.isna(s):
        return None
    s = str(s).upper()
    anios = re.search(r'(\d+)\s*A[ÑN]OS?', s)
    meses = re.search(r'(\d+)\s*MESES?', s)
    years  = int(anios.group(1)) if anios else 0
    months = int(meses.group(1)) if meses else 0
    result = years + months / 12.0
    return round(result, 2) if result > 0 else None


def _extract_period_code(s) -> str:
    m = re.search(r'(20\d{4})', str(s))
    return m.group(1) if m else '202300'


# ── Staff lookup ───────────────────────────────────────────────────────────────

def _load_staff_lookup() -> dict:
    staff = {}
    try:
        df = pd.read_excel(
            os.path.join(BASE, 'REPORTE DE PERSONAL 2025 (1).XLSX'),
            sheet_name='Sheet1', dtype=str
        )
        df.columns = [c.strip() for c in df.columns]

        def fc(keys):
            for k in keys:
                nk = _norm_str(k)
                for c in df.columns:
                    if nk in _norm_str(c):
                        return c
            return None

        col_ced = fc(['cedula', 'pasaporte'])
        col_ap1 = fc(['1° apellido', 'primer apellido'])
        col_ap2 = fc(['segundo apellido'])
        col_n1  = fc(['primer nombre'])
        col_n2  = fc(['segundo nombre'])
        col_gen = fc(['genero', 'género'])
        col_uni = fc(['unidad organizativa'])
        col_fec = fc(['fecha antig', 'primer ingreso', 'antiguedad'])
        col_fun = fc(['funcion', 'función'])
        col_ded = fc(['tiempo de dedicacion', 'dedicacion', 'dedicación'])
        col_niv = fc(['nivel de instruccion', 'instruccion', 'instrucción'])
        col_grd = fc(['grado de instruccion', 'grado de'])

        for _, row in df.iterrows():
            ced = _clean_cedula(row.get(col_ced, '')) if col_ced else ''
            if not ced:
                continue
            ap1 = _clean_nombre(row.get(col_ap1)) if col_ap1 else ''
            ap2 = _clean_nombre(row.get(col_ap2)) if col_ap2 else ''
            n1  = _clean_nombre(row.get(col_n1))  if col_n1  else ''
            n2  = _clean_nombre(row.get(col_n2))  if col_n2  else ''
            nombre = ' '.join(f"{ap1} {ap2} {n1} {n2}".split())

            antig = None
            if col_fec:
                try:
                    fec_dt = pd.to_datetime(row.get(col_fec), errors='coerce', dayfirst=True)
                    if pd.notna(fec_dt):
                        delta = STAFF_REF_DATE - fec_dt.to_pydatetime().replace(tzinfo=None)
                        antig = round(delta.days / 365.25, 2)
                except:
                    pass

            ded_raw = _clean_nombre(row.get(col_ded)) if col_ded else ''
            niv_raw = _clean_nombre(row.get(col_niv)) if col_niv else ''
            grd_raw = _clean_nombre(row.get(col_grd)) if col_grd else ''
            # Combinar nivel + grado → nivel_instruccion legible
            if grd_raw and grd_raw not in ('Grado', 'nan', ''):
                nivel_inst = grd_raw        # p.ej. 'Maestría profesional'
            elif niv_raw:
                nivel_inst = niv_raw        # p.ej. 'Tercer Nivel', 'Cuarto Nivel'
            else:
                nivel_inst = ''

            staff[ced] = {
                'nombre_completo':  nombre,
                'antiguedad_anos':  antig,
                'funcion':          (_clean_nombre(row.get(col_fun)) or '').upper() if col_fun else '',
                'unidad_org':       _clean_nombre(row.get(col_uni)) if col_uni else '',
                'genero':           _clean_nombre(row.get(col_gen)) if col_gen else '',
                'tiempo_dedicacion': ded_raw,
                'nivel_instruccion': nivel_inst,
            }
    except Exception as e:
        pass
    return staff


VALID_COLS = None  # Loaded lazily


class ETLService:

    def _valid_cols(self):
        global VALID_COLS
        if VALID_COLS is None:
            VALID_COLS = {c.name for c in Evaluacion.__table__.columns} - {'id', 'fecha_proceso'}
        return VALID_COLS

    def _clean_rec(self, rec: dict) -> dict:
        vc = self._valid_cols()
        clean = {}
        for k, v in rec.items():
            if k not in vc:
                continue
            if v is None or (isinstance(v, float) and np.isnan(v)):
                clean[k] = None
            elif hasattr(v, 'item'):
                clean[k] = v.item()
            else:
                clean[k] = v
        return clean

    def _build_nombre(self, ced: str, staff: dict, fallback: str = '') -> str:
        s = staff.get(ced)
        if s and s['nombre_completo']:
            return s['nombre_completo']
        if fallback and _clean_nombre(fallback):
            return _clean_nombre(fallback)
        return f'CED-{ced}' if ced else 'Sin nombre'

    def process_all_files(self, db: Session) -> int:
        staff = _load_staff_lookup()
        records = []

        records += self._source_meipa_consolidado(staff)
        records += self._source_meipa_resultados_generales(staff, records)
        records += self._source_hetero_xlsx(
            os.path.join(BASE, 'HETEROEVALUACION 202456.xlsx'), '202456', staff)
        records += self._source_hetero_xlsx(
            os.path.join(BASE, 'HETEROEVALUACION 202466.xlsx'), '202466', staff)
        records += self._source_360_mecdi_2024(staff)
        model_scores = self._source_eval_detalladas_2025(staff)
        self._merge_csv_hetero_2025(model_scores, staff)
        self._reclassify_by_programa(model_scores)
        records += self._build_360_records_2025(model_scores, staff)
        records += self._source_posgrado_historico(staff)
        records += self._source_eval_detalladas_periodo(staff, EVAL_DIR_202501, '202501', 2025)
        # eval_det_202402 no se procesa — ya está cubierto por _source_360_mecdi_2024
        records += self._source_pucetec_hetero(staff)
        records += self._source_meipa_pucese_data(staff)

        # ── Deduplicación: ante mismo (cedula, periodo, modelo, sistema)
        # quedarse con el registro más completo (más componentes llenos)
        _COMP_FIELDS = ['comp_auto', 'comp_pares', 'comp_hetero_dir', 'comp_hetero_est',
                        'het_estudiantil', 'eval_pares', 'aula_virtual', 'autoevaluacion']
        def _completeness(r):
            return sum(1 for f in _COMP_FIELDS if r.get(f) not in (None, 0.0, 0))

        seen_keys: dict = {}
        for rec in records:
            key = (
                str(rec.get('cedula', '')).strip(),
                str(rec.get('periodo', '')).strip(),
                str(rec.get('modelo', '')).strip(),
                str(rec.get('sistema', '')).strip(),
            )
            if key not in seen_keys or _completeness(rec) > _completeness(seen_keys[key]):
                seen_keys[key] = rec
        records = list(seen_keys.values())

        # ── Post-procesamiento demográfico ──────────────────────────────────
        # Para todos los registros: rellenar tiempo_servicio / nivel_estudio / sexo
        # desde el lookup de personal si el campo está vacío.
        for rec in records:
            ced = rec.get('cedula', '')
            s   = staff.get(ced, {})
            if not rec.get('tiempo_servicio'):
                rec['tiempo_servicio'] = _map_tiempo_servicio(s.get('tiempo_dedicacion', ''))
            if not rec.get('nivel_estudio'):
                rec['nivel_estudio'] = s.get('nivel_instruccion', '')
            if not rec.get('sexo') and s.get('genero'):
                rec['sexo'] = s.get('genero', '')

        # Safety: never wipe if no records were loaded (protects against missing data dir)
        if not records:
            print("[ETL] ⚠️  0 registros generados — BD NO se modifica (verifica que /app/data esté montada).")
            return 0

        # Wipe and reload
        print(f"[ETL] Cargando {len(records)} registros en BD...")
        db.query(Evaluacion).delete()
        db.commit()
        for rec in records:
            db.add(Evaluacion(**self._clean_rec(rec)))
        db.commit()
        print(f"[ETL] ✅ {len(records)} registros guardados.")
        return len(records)

    # ── MEIPA: CONSOLIDADO HETEROEVALUACIÓN ───────────────────────────────────

    def _source_meipa_consolidado(self, staff: dict) -> list:
        path = os.path.join(BASE, 'CONSOLIDADO HETEROEVALUACIÓN.xlsx')
        if not os.path.exists(path):
            return []
        xl = pd.ExcelFile(path, engine='openpyxl')
        df = pd.read_excel(xl, sheet_name='DATOS', dtype=str)
        df.columns = [c.strip() for c in df.columns]

        col_map = {_norm_str(c): c for c in df.columns}

        def gc(*keys):
            for k in keys:
                nk = _norm_str(k)
                if nk in col_map:
                    return col_map[nk]
                for ck in col_map:
                    if nk in ck:
                        return col_map[ck]
            return None

        col_ced  = gc('cedula') or df.columns[1]
        col_nom  = gc('apellidos y nombres', 'apellidos') or df.columns[2]
        col_per  = gc('periodo evaluado', 'periodo') or df.columns[0]
        col_pun  = gc('promedio de puntaje', 'puntaje') or df.columns[-1]
        col_gen  = gc('genero', 'género')
        col_eda  = gc('edad')
        col_tse  = gc('tiempo de servicio')
        col_niv  = gc('nivel de estudio')
        col_gra  = gc('grado')
        col_mod  = gc('modalidad de trabajo', 'modalidad')
        col_car  = gc('carrera')

        df['_ced']     = df[col_ced].apply(_clean_cedula)
        df['_nom']     = df[col_nom].apply(_clean_nombre)
        df['_periodo'] = df[col_per].apply(_extract_period_code)
        df['_anio']    = df['_periodo'].apply(lambda p: int(p[:4]) if p[:4].isdigit() else 2023)
        df['_punt']    = pd.to_numeric(df[col_pun], errors='coerce')

        demog = {}
        for _, row in df.iterrows():
            ced = row['_ced']
            if ced and ced not in demog:
                demog[ced] = {
                    'sexo':  _clean_nombre(row.get(col_gen))  if col_gen else '',
                    'carr':  _clean_nombre(row.get(col_car))  if col_car else '',
                    'tserv': _clean_nombre(row.get(col_tse))  if col_tse else '',
                    'nivel': _clean_nombre(row.get(col_niv))  if col_niv else '',
                    'grado': _clean_nombre(row.get(col_gra))  if col_gra else '',
                    'modal': _clean_nombre(row.get(col_mod))  if col_mod else '',
                    'edad':  None,
                }
                try:
                    ed = row.get(col_eda) if col_eda else None
                    demog[ced]['edad'] = int(float(ed)) if ed and str(ed) not in ('nan', '') else None
                except:
                    pass

        agg = df[df['_ced'] != ''].groupby(['_ced', '_periodo', '_anio']).agg(
            nombre=('_nom', _first_mode),
            puntaje=('_punt', 'mean'),
        ).reset_index()

        recs = []
        for _, row in agg.iterrows():
            ced     = str(row['_ced']).strip()
            puntaje = float(row['puntaje']) if not pd.isna(row['puntaje']) else 0.0
            dm      = demog.get(ced, {})
            s       = staff.get(ced, {})
            carr    = dm.get('carr', '')
            recs.append({
                'docente_nombre': self._build_nombre(ced, staff, row['nombre']),
                'facultad':       _map_facultad(carr),
                'carrera':        carr,
                'periodo':        str(row['_periodo']),
                'anio':           int(row['_anio']),
                'modelo':         'docencia',
                'sistema':        'meipa',
                'sexo':           dm.get('sexo', '') or s.get('genero', ''),
                'edad':           dm.get('edad'),
                'tiempo_servicio': dm.get('tserv', ''),
                'nivel_estudio':   dm.get('nivel', ''),
                'grado':           dm.get('grado', ''),
                'modalidad':       dm.get('modal', ''),
                'cedula':          ced,
                'het_estudiantil': round(puntaje / 100 * 50, 2),
                'puntaje_100':     round(puntaje, 2),
                'promedio':        round(puntaje / 100 * 5, 2),
                'nivel_desempeno': _nivel_from_puntaje(puntaje),
                'comp_hetero_est': round(puntaje, 2),
                'antiguedad_anos': s.get('antiguedad_anos'),
                'funcion_docente': s.get('funcion', 'DOCENCIA') or 'DOCENCIA',
                'archivo_fuente':  'CONSOLIDADO HETEROEVALUACIÓN.xlsx',
            })
        return recs

    # ── MEIPA: RESULTADOS GENERALES CONSOLIDADO ───────────────────────────────

    def _source_meipa_resultados_generales(self, staff: dict, existing: list) -> list:
        path = os.path.join(BASE, 'RESULTADOS GENERALES CONSOLIDADO 202301 al 202401 1.xlsx')
        if not os.path.exists(path):
            return []

        covered = {(r['cedula'], r['periodo']) for r in existing if r.get('sistema') == 'meipa'}

        df = pd.read_excel(path, sheet_name='REPORTE GENERAL', header=0, dtype=str)
        df.columns = [str(c).strip() for c in df.columns]

        def fc(*keys):
            for k in keys:
                nk = _norm_str(k)
                for c in df.columns:
                    if nk in _norm_str(c):
                        return c
            return None

        col_per = fc('periodo academico', 'período') or df.columns[0]
        col_nom = fc('apellidos y nombres') or df.columns[1]
        col_ced = fc('cedula') or df.columns[2]
        col_eda = fc('edad')
        col_uni = fc('unidad academica', 'unidad')
        col_ant = fc('antiguedad', 'antigüedad')
        col_gen = fc('genero', 'género')
        col_niv = fc('nivel de estudio')
        col_tse = fc('tiempo de servicio')
        col_est = fc('estud a doc')
        col_aut = fc('autoeval')
        col_coo = fc('coord a docente', 'coord')
        col_par = fc('eval pares')
        col_tot = fc('total sobre 100')

        # Drop header rows
        df = df[df[col_ced].apply(
            lambda v: str(v).strip().upper() not in ('CEDULA', 'NAN', '')
        )].copy()

        recs = []
        for _, row in df.iterrows():
            ced = _clean_cedula(row.get(col_ced, ''))
            if not ced:
                continue
            per_raw = str(row.get(col_per, '')).strip()
            periodo = _extract_period_code(per_raw) if per_raw else '202301'
            anio    = int(periodo[:4]) if periodo[:4].isdigit() else 2023

            if (ced, periodo) in covered:
                continue

            total_100 = _safe_float(row.get(col_tot))
            if total_100 is None:
                continue

            est = _safe_float(row.get(col_est)) or 0.0
            aut = _safe_float(row.get(col_aut)) or 0.0
            coo = _safe_float(row.get(col_coo)) or 0.0
            par = _safe_float(row.get(col_par)) or 0.0

            ant_str = _clean_nombre(row.get(col_ant)) if col_ant else ''
            antig   = _parse_antiguedad(ant_str) or (staff.get(ced) or {}).get('antiguedad_anos')
            s       = staff.get(ced, {})
            unidad  = _clean_nombre(row.get(col_uni)) if col_uni else ''
            nombre  = self._build_nombre(ced, staff, row.get(col_nom, ''))

            edad_v = None
            try:
                ed = row.get(col_eda) if col_eda else None
                edad_v = int(float(ed)) if ed and str(ed).strip() not in ('nan', '') else None
            except:
                pass

            recs.append({
                'docente_nombre': nombre,
                'facultad':       _map_facultad(unidad),
                'carrera':        unidad,
                'periodo':        periodo,
                'anio':           anio,
                'modelo':         'docencia',
                'sistema':        'meipa',
                'sexo':           _clean_nombre(row.get(col_gen)) if col_gen else s.get('genero', ''),
                'edad':           edad_v,
                'tiempo_servicio': _clean_nombre(row.get(col_tse)) if col_tse else '',
                'nivel_estudio':   _clean_nombre(row.get(col_niv)) if col_niv else '',
                'cedula':          ced,
                'puntaje_100':     round(total_100, 2),
                'promedio':        round(total_100 / 100 * 5, 2),
                'nivel_desempeno': _nivel_from_puntaje(total_100),
                'het_estudiantil': round(est / 2 * 50, 2),
                'autoevaluacion':  round(aut * 10, 2),
                'comp_hetero_est': round(est / 2 * 100, 2),
                'comp_auto':       round(aut * 100, 2),
                'comp_hetero_dir': round(coo * 100, 2),
                'comp_pares':      round(par * 100, 2),
                'antiguedad_anos': antig,
                'funcion_docente': s.get('funcion', 'DOCENCIA') or 'DOCENCIA',
                'archivo_fuente':  'RESULTADOS GENERALES CONSOLIDADO 202301 al 202401 1.xlsx',
            })
        return recs

    # ── HETEROEVALUACION xlsx (202456 / 202466) ───────────────────────────────

    INSTR_360_MAP = {
        _norm_str('Heteroevaluación Grado Nuevo Docencia Esmeraldas'): ('docencia',  'hetero_est'),
        _norm_str('Heteroevaluación Grado Nuevo Docencia Quito'):      ('docencia',  'hetero_est'),
        _norm_str('Heteroevaluación Grado Nuevo Docencia Ibarra'):     ('docencia',  'hetero_est'),
        _norm_str('Heteroevalauación Grado Nuevo ABP Quito'):          ('abp',       'hetero_est'),
        _norm_str('Heteroevalauación Grado Nuevo Servicios Quito'):    ('servicios', 'hetero_est'),
        _norm_str('Heteroevaluacion Grado Nuevo Docencia Esmeraldas'): ('docencia',  'hetero_est'),
        _norm_str('Heteroevaluacion Grado Nuevo Docencia Quito'):      ('docencia',  'hetero_est'),
        _norm_str('Heteroevaluacion Grado Nuevo ABP Quito'):           ('abp',       'hetero_est'),
        _norm_str('Heteroevaluacion Grado Nuevo Servicios Quito'):     ('servicios', 'hetero_est'),
    }

    MEIPA_KEYWORDS = [
        'inst. heteroevaluacion a la docencia esmeraldas',
        'inst. heteroevaluación a la docencia esmeraldas',
        'heteroevaluacion a la docencia',
        'inst heteroevaluaci',
    ]

    def _is_meipa_instr(self, name: str) -> bool:
        n = _norm_str(name)
        return any(k in n for k in self.MEIPA_KEYWORDS)

    def _source_hetero_xlsx(self, fpath: str, periodo_code: str, staff: dict) -> list:
        if not os.path.exists(fpath):
            return []
        anio = int(periodo_code[:4]) if periodo_code[:4].isdigit() else 2024
        recs = []
        try:
            xl = pd.ExcelFile(fpath, engine='openpyxl')
            sheet = next((s for s in xl.sheet_names if 'hetero' in s.lower() or 'resultado' in s.lower()),
                         xl.sheet_names[0])
            df = pd.read_excel(xl, sheet_name=sheet, dtype=str)
            df.columns = [str(c).strip() for c in df.columns]

            def fc(*keys):
                for k in keys:
                    nk = _norm_str(k)
                    for c in df.columns:
                        if nk in _norm_str(c):
                            return c
                return None

            col_doc   = fc('num_docu', 'cedula')
            col_last  = fc('spriden_last_name', 'apellido')
            col_first = fc('spriden_first_name', 'nombre')
            col_instr = fc('instrumento')
            col_punt  = fc('puntaje')
            col_dept  = fc('stvdept_desc', 'dept', 'carrera')

            if not (col_doc and col_instr and col_punt):
                return []

            df['_ced']   = df[col_doc].apply(_clean_cedula)
            df['_punt']  = pd.to_numeric(df[col_punt], errors='coerce')
            df['_instr'] = df[col_instr].apply(_norm_str)
            df['_nom']   = (df[col_last].apply(_clean_nombre) + ' ' +
                            df[col_first].apply(_clean_nombre)).str.strip() if (col_last and col_first) \
                           else df['_ced'].apply(lambda c: f'CED-{c}')
            df['_dept']  = df[col_dept].apply(_clean_nombre) if col_dept else ''

            df_meipa = df[df[col_instr].apply(self._is_meipa_instr)]
            df_360   = df[~df[col_instr].apply(self._is_meipa_instr)]

            # MEIPA rows
            if not df_meipa.empty:
                agg = df_meipa.groupby('_ced').agg(
                    nome=('_nom', _first_mode),
                    puntaje=('_punt', 'mean'),
                    dept=('_dept', _first_mode),
                ).reset_index()
                for _, row in agg.iterrows():
                    ced = str(row['_ced']).strip()
                    puntaje = float(row['puntaje']) if not pd.isna(row['puntaje']) else 0.0
                    s = staff.get(ced, {})
                    recs.append({
                        'docente_nombre': self._build_nombre(ced, staff, row['nome']),
                        'facultad':       _map_facultad(str(row.get('dept', ''))),
                        'carrera':        str(row.get('dept', '')),
                        'periodo':        periodo_code, 'anio': anio,
                        'modelo':         'docencia', 'sistema': 'meipa', 'cedula': ced,
                        'puntaje_100':    round(puntaje, 2),
                        'promedio':       round(puntaje / 100 * 5, 2),
                        'nivel_desempeno': _nivel_from_puntaje(puntaje),
                        'het_estudiantil': round(puntaje / 100 * 50, 2),
                        'comp_hetero_est': round(puntaje, 2),
                        'sexo':           s.get('genero', ''),
                        'antiguedad_anos': s.get('antiguedad_anos'),
                        'funcion_docente': s.get('funcion', 'DOCENCIA') or 'DOCENCIA',
                        'archivo_fuente':  os.path.basename(fpath),
                    })

            # 360 rows
            if not df_360.empty:
                col_nresp = fc('numero_respuestas', 'num_resp')
                df_360['_nresp'] = pd.to_numeric(df_360[col_nresp], errors='coerce') if col_nresp else np.nan

                agg360 = df_360.groupby(['_ced', '_instr']).agg(
                    nome=('_nom', _first_mode),
                    puntaje=('_punt', 'mean'),
                    dept=('_dept', _first_mode),
                    n_resp=('_nresp', 'max'),
                ).reset_index()
                scores_360: dict = {}
                nombres_360: dict = {}
                depts_360:   dict = {}
                nresp_360:   dict = {}
                for _, row in agg360.iterrows():
                    ced     = str(row['_ced']).strip()
                    instr_n = str(row['_instr']).strip()
                    puntaje = float(row['puntaje']) if not pd.isna(row['puntaje']) else 0.0
                    if instr_n not in self.INSTR_360_MAP:
                        continue
                    modelo, comp = self.INSTR_360_MAP[instr_n]
                    key = (ced, modelo)
                    if key not in scores_360:
                        scores_360[key]  = {}
                        nombres_360[key] = self._build_nombre(ced, staff, row['nome'])
                        depts_360[key]   = str(row.get('dept', '')).strip()
                        nval = row.get('n_resp')
                        nresp_360[key] = int(nval) if nval and not pd.isna(nval) else None
                    scores_360[key][comp] = puntaje

                for (ced, modelo), comps in scores_360.items():
                    puntaje = comps.get('hetero_est', 0.0)
                    s = staff.get(ced, {})
                    # Para servicios el peso es 100% → het_estudiantil = puntaje completo
                    # Para abp/docencia el peso es 50% → het_estudiantil = puntaje * 0.50
                    if modelo == 'servicios':
                        het_est = round(puntaje, 2)
                    else:
                        het_est = round(puntaje / 100 * 50, 2)
                    recs.append({
                        'docente_nombre': nombres_360[(ced, modelo)],
                        'facultad':       _map_facultad(depts_360[(ced, modelo)]),
                        'carrera':        depts_360[(ced, modelo)],
                        'periodo':        periodo_code, 'anio': anio,
                        'modelo':         modelo, 'sistema': '360', 'cedula': ced,
                        'puntaje_100':    round(puntaje, 2),
                        'promedio':       round(puntaje / 100 * 5, 2),
                        'nivel_desempeno': _nivel_from_puntaje(puntaje),
                        'het_estudiantil': het_est,
                        'comp_hetero_est': round(puntaje, 2),
                        'sexo':           s.get('genero', ''),
                        'antiguedad_anos': s.get('antiguedad_anos'),
                        'funcion_docente': s.get('funcion', 'DOCENCIA') or 'DOCENCIA',
                        'archivo_fuente':  os.path.basename(fpath),
                        'n_evaluadores':  nresp_360.get((ced, modelo)),
                    })
        except Exception as e:
            pass
        return recs

    # ── 360 MECDI 202402 ──────────────────────────────────────────────────────

    # Column mapping for all models in RESULTADO GENERAL 202402 MECDI 1.xlsx
    # Format: modelo → {key: column_name_substring}
    MECDI_2024_MODELS = {
        'docencia':      {'het':'docgrado_het_est',  'par':'docgrado_evalpar', 'aul':'docgrado_aulavir', 'aut':'docgrado_autoeval', 'tot':'total_grado'},
        'posgrado':      {'het':'posg_het_est',       'aut':'posg_autoeval',    'aul':'posg_aulavir',     'tot':'total_posg'},
        'tecnologado':   {'het':'pucetec_het_est',    'par':'pucetec_evalpar',  'aul':'pucetec_aulavir',  'aut':'pucetec_autoeval', 'tot':'total_pucetec'},
        'abp':           {'het':'abp_het_est',        'par':'abp_evalpar',      'aul':'abp_aulavir',      'aut':'abp_autoeval',     'tot':'total_abp'},
        'investigacion': {'hetero_dir':'inv_dirinv',  'par':'inv_evalpar',      'hetero_dec':'inv_deca',  'aut':'inv_autoeval',     'tot':'total_invest'},
        'gestion':       {'hetero_dir':'ges_dir_al',  'aut':'ges_autoeval',     'het':'ges_het_doc',      'tot':'total_ges'},
        'vinculacion':   {'het':'vinc_het_est',       'hetero_dir':'vinc_coor', 'aut':'vinc_autoeval',    'tot':'total_vinc'},
    }

    def _source_360_mecdi_2024(self, staff: dict) -> list:
        path = os.path.join(BASE, 'RESULTADO GENERAL 202402 MECDI 1.xlsx')
        if not os.path.exists(path):
            return []
        xl_rg = pd.ExcelFile(path, engine='openpyxl')

        # Load all sheets with de-duplicated column names
        sheets_rg = {}
        for sh in xl_rg.sheet_names:
            raw = pd.read_excel(xl_rg, sheet_name=sh, header=None, nrows=15)
            hr  = _find_header_row(raw)
            df  = pd.read_excel(xl_rg, sheet_name=sh, header=hr)
            cols, seen = [], {}
            for c in df.columns:
                cs = str(c).strip().lower()
                if cs in seen:
                    seen[cs] += 1; cols.append(f"{cs}_{seen[cs]}")
                else:
                    seen[cs] = 0; cols.append(cs)
            df.columns = cols
            sheets_rg[sh] = df

        # Sheet 1 has demographics
        df_s1   = sheets_rg.get('Sheet 1', sheets_rg[list(sheets_rg.keys())[0]])
        col_ced = _find_col(df_s1, ['evaluado', 'cedula'])
        col_ap  = _find_col(df_s1, ['apellido'])
        col_nom = _find_col(df_s1, ['nombre'])
        col_edad= _find_col(df_s1, ['edad'])
        col_gen = _find_col(df_s1, ['genero', 'género', 'sexo'])
        col_carr= _find_col(df_s1, ['carrera'])
        col_tsv = _find_col(df_s1, ['servicio'])
        col_niv = _find_col(df_s1, ['estudio'])
        col_grd = _find_col(df_s1, ['grado'])
        col_mod = _find_col(df_s1, ['modalidad'])
        col_res = _find_col(df_s1, ['resultado'])

        demog = {}
        for _, row in df_s1.iterrows():
            ced = _clean_cedula(row.get(col_ced, '')) if col_ced else ''
            if not ced:
                continue
            ed = None
            try:
                ed_v = row.get(col_edad) if col_edad else None
                ed = int(float(ed_v)) if ed_v and str(ed_v) not in ('nan', '') else None
            except:
                pass
            demog[ced] = {
                'apellidos': _clean_nombre(row.get(col_ap))  if col_ap  else '',
                'nombres':   _clean_nombre(row.get(col_nom)) if col_nom else '',
                'edad': ed,
                'sexo':      _clean_nombre(row.get(col_gen)) if col_gen else '',
                'carrera':   _clean_nombre(row.get(col_carr))if col_carr else '',
                'tserv':     _clean_nombre(row.get(col_tsv)) if col_tsv else '',
                'nivel_est': _clean_nombre(row.get(col_niv)) if col_niv else '',
                'grado':     _clean_nombre(row.get(col_grd)) if col_grd else '',
                'modal':     _clean_nombre(row.get(col_mod)) if col_mod else '',
                'resultado': _clean_nombre(row.get(col_res)) if col_res else '',
            }

        # All data sheets (Sheet 1 also has columns from row 3 onwards in the 2024 file)
        # Collect model scores from all sheets
        model_data: dict = {}  # (ced, modelo) → {comp: [values]}

        def _get_col(df, substr):
            for c in df.columns:
                if substr in c:
                    return c
            return None

        for sh, df_sh in sheets_rg.items():
            c_ced = _find_col(df_sh, ['evaluado', 'cedula'])
            if not c_ced:
                continue
            for modelo, col_map in self.MECDI_2024_MODELS.items():
                resolved = {k: _get_col(df_sh, v) for k, v in col_map.items()}
                tot_col  = resolved.get('tot')
                if not tot_col:
                    continue
                for _, row in df_sh.iterrows():
                    ced = _clean_cedula(row.get(c_ced, '')) if c_ced else ''
                    if not ced:
                        continue
                    tot_v = pd.to_numeric(row.get(tot_col), errors='coerce')
                    if pd.isna(tot_v) or tot_v == 0:
                        continue
                    key = (ced, modelo)
                    if key not in model_data:
                        model_data[key] = {k: [] for k in col_map if k != 'tot'}
                        model_data[key]['tot'] = []
                    for k, c in resolved.items():
                        if c:
                            v = pd.to_numeric(row.get(c), errors='coerce')
                            if not pd.isna(v):
                                model_data[key][k].append(float(v))

        recs = []
        _MODELO_FACULTAD = {'tecnologado': 'Tecnologado', 'posgrado': 'Posgrado'}
        for (ced, modelo), scores in model_data.items():
            dm  = demog.get(ced, {})
            s   = staff.get(ced, {})
            carr = dm.get('carrera', '')
            nombre = self._build_nombre(ced, staff, f"{dm.get('apellidos','')} {dm.get('nombres','')}".strip())

            def avg(k): return float(np.mean(scores[k])) if scores.get(k) else 0.0

            het     = avg('het')
            aut     = avg('aut')
            par     = avg('par')
            aul     = avg('aul')
            hdir    = avg('hetero_dir')
            hdec    = avg('hetero_dec')
            # Compute weighted total based on model
            if modelo in ('docencia', 'tecnologado', 'abp'):
                tot = het + par + aul + aut
            elif modelo == 'posgrado':
                tot = het + aut + aul
            elif modelo == 'investigacion':
                tot = hdir + par + hdec + aut
            elif modelo == 'gestion':
                tot = hdir + aut + het
            elif modelo == 'vinculacion':
                tot = het + hdir + aut
            else:
                tot = het + par + aul + aut
            if tot == 0:
                continue

            recs.append({
                'docente_nombre': nombre,
                'facultad':  _MODELO_FACULTAD.get(modelo) or _map_facultad(carr),
                'carrera': carr,
                'periodo': '202402', 'anio': 2024, 'modelo': modelo, 'sistema': '360',
                'sexo': dm.get('sexo','') or s.get('genero',''), 'edad': dm.get('edad'),
                'tiempo_servicio': dm.get('tserv',''), 'nivel_estudio': dm.get('nivel_est',''),
                'grado': dm.get('grado',''), 'modalidad': dm.get('modal',''), 'cedula': ced,
                'het_estudiantil': round(het, 2), 'eval_pares': round(par, 2),
                'aula_virtual': round(aul, 2),  'autoevaluacion': round(aut, 2),
                'comp_hetero_dir': round(hdir, 2), 'comp_hetero_est': round(het, 2),
                'comp_auto':       round(aut, 2),  'comp_pares':      round(par, 2),
                'puntaje_100': round(tot, 2), 'promedio': round(tot / 100 * 5, 2),
                'nivel_desempeno': _nivel_from_puntaje(tot),
                'antiguedad_anos': s.get('antiguedad_anos'),
                'funcion_docente': s.get('funcion', 'DOCENCIA') or 'DOCENCIA',
                'archivo_fuente': 'RESULTADO GENERAL 202402 MECDI 1.xlsx',
            })
        return recs

    # ── eval_detalladas_2025 ──────────────────────────────────────────────────

    def _source_eval_detalladas_2025(self, staff: dict) -> dict:
        if not os.path.exists(EVAL_DIR):
            return {}
        MAX_CAL = {3: 4, 10: 4, 11: 4, 12: 4, 13: 4}
        # Instrument codes → (modelo, componente, peso)
        # Based on MECDI evaluation framework table:
        # Docencia: #01 Auto(20) + #02 Pares(20) + #03 CEV(10) + #04 Het.Est(50)
        # ABP:      #05 Auto(20) + #02 Pares(20) + #03 CEV(10) + #06 Het.Est.Med(50)
        # Tecnologado/PUCETEC: #05 Auto(20) + #07 Het.Est(50) + #02 Pares(20) + #03 CEV(10)
        # Posgrado: #08 Auto(30) + #03 CEV(10) + #09 Het.Est(60)
        # Investigación: #10 Auto(20) + #11 Het.Dir.Inv(50) + #12 Par(15) + #13 Decano(15)
        # Vinculación: #14 Auto(20) + #15 Het.Dir.Acad(15) + #16 Het.Est(50) + #17 Het.Dir.Inv(15)
        # Gestión: #18 Auto(20) + #19 Coevalúa.Dir(50) + #20 Het.Doc(30)
        INSTR_MAP = {
            # Docencia grado
            1:  ('docencia',     'auto',       20),
            2:  ('docencia',     'pares',      20),
            3:  ('docencia',     'aula',       10),  # CEV
            4:  ('docencia',     'hetero_est', 50),  # Het.Est Docencia
            # ABP / Salud
            5:  ('abp',          'auto',       20),
            6:  ('abp',          'hetero_est', 50),  # Het.Est Medicina
            # Tecnologado / PUCETEC — instrumento #7 único a tecnologado
            7:  ('tecnologado',  'hetero_est', 50),
            # Posgrado — instrumentos únicos
            8:  ('posgrado',     'auto',       30),
            9:  ('posgrado',     'hetero_est', 60),
            # Investigación
            10: ('investigacion','auto',       20),
            11: ('investigacion','hetero_dir', 50),
            12: ('investigacion','pares',      15),
            13: ('investigacion','hetero_dec', 15),
            # Vinculación
            14: ('vinculacion',  'auto',       20),
            15: ('vinculacion',  'hetero_dir', 15),
            16: ('vinculacion',  'hetero_est', 50),  # FIXED (era gestion auto)
            17: ('vinculacion',  'hetero_inv', 15),  # FIXED (era gestion hetero_dir)
            # Gestión — instrumentos reales
            18: ('gestion',      'auto',       20),
            19: ('gestion',      'hetero_dir', 50),  # Coevalúa.Dir
            20: ('gestion',      'hetero_est', 30),  # Het.Docentes
            170:('vinculacion',  'hetero_inv', 15),
        }

        frames = [pd.read_excel(os.path.join(EVAL_DIR, f), engine='openpyxl')
                  for f in os.listdir(EVAL_DIR) if f.endswith('.xlsx')]
        if not frames:
            return {}
        df = pd.concat(frames, ignore_index=True)
        df['cal_norm'] = pd.to_numeric(df['calificacion'], errors='coerce').fillna(0)
        df['peso_num'] = pd.to_numeric(df['peso'], errors='coerce').fillna(0)
        df['max_cal']  = df['cod_instrumento'].apply(
            lambda c: MAX_CAL.get(int(c) if str(c).isdigit() else 0, 3))
        df['contrib']  = (df['cal_norm'] / df['max_cal'].replace(0,1)) * df['peso_num']
        df['_ced']     = df['usuario_evaluado'].astype(str).str.strip().str.lstrip('0')

        # Conteo de evaluadores únicos por (cedula, instrumento)
        n_eval_df = df.groupby(['_ced','cod_instrumento'])['evaluador'].nunique().reset_index()
        n_eval_df.columns = ['_ced', 'cod_instrumento', 'n_uniq']
        n_eval_map: dict = {}  # (ced, cod) → n_evaluadores
        for _, r in n_eval_df.iterrows():
            n_eval_map[(str(r['_ced']).strip(), str(r['cod_instrumento']).strip())] = int(r['n_uniq'])

        by_instr = df.groupby(['_ced','apellidos_evaluado','nombres_evaluado','programa','cod_instrumento'])\
                     .agg(score=('contrib','sum'), max_score=('peso_num','sum')).reset_index()
        by_instr['puntaje_100'] = (by_instr['score'] / by_instr['max_score'].replace(0,1) * 100).round(2)

        # Pre-scan all rows to find the most specific programa for each (ced, modelo) key
        _SPEC = ('TG ', 'MAESTR', 'POSGRADO', 'DOCTORADO', 'ESPECIALID', 'PUCETEC', 'TECNOLOG', 'MP_')
        best_programa: dict = {}  # (ced, modelo) → best programa seen so far
        for _, row in by_instr.iterrows():
            ced = str(row['_ced']).strip()
            try:
                cod = int(float(row['cod_instrumento']))
            except:
                continue
            if cod not in INSTR_MAP:
                continue
            modelo_pre = INSTR_MAP[cod][0]
            key_pre = (ced, modelo_pre)
            prog = _clean_nombre(row['programa'])
            if key_pre not in best_programa:
                best_programa[key_pre] = prog
            elif any(k in str(prog).upper() for k in _SPEC) and not any(k in str(best_programa[key_pre]).upper() for k in _SPEC):
                best_programa[key_pre] = prog  # upgrade to more specific

        model_scores: dict = {}
        for _, row in by_instr.iterrows():
            ced = str(row['_ced']).strip()
            try:
                cod = int(float(row['cod_instrumento']))
            except:
                continue
            if cod not in INSTR_MAP:
                continue
            modelo, comp, peso = INSTR_MAP[cod]
            key = (ced, modelo)
            if key not in model_scores:
                nom_ev = f"{_clean_nombre(row['apellidos_evaluado'])} {_clean_nombre(row['nombres_evaluado'])}".strip()
                model_scores[key] = {
                    'nombre':        self._build_nombre(ced, staff, nom_ev),
                    'programa':      best_programa.get(key, _clean_nombre(row['programa'])),
                    'scores':        {},
                    'n_evaluadores': {},
                }
            model_scores[key]['scores'][comp] = {'puntaje': float(row['puntaje_100']), 'peso': peso}
            n_u = n_eval_map.get((ced, str(row['cod_instrumento']).strip()))
            if n_u:
                model_scores[key]['n_evaluadores'][comp] = n_u

        # Propagate shared instruments to ABP, Tecnologado, Posgrado
        for _, row in by_instr.iterrows():
            ced = str(row['_ced']).strip()
            try:
                cod = int(float(row['cod_instrumento']))
            except:
                continue
            puntaje_100 = float(row['puntaje_100']) if not pd.isna(row['puntaje_100']) else 0.0
            key_abp  = (ced, 'abp')
            key_tec  = (ced, 'tecnologado')
            key_pos  = (ced, 'posgrado')

            # ABP shares instruments #02 (pares) and #03 (CEV) with docencia
            if cod == 2 and key_abp in model_scores:
                model_scores[key_abp]['scores']['pares'] = {'puntaje': puntaje_100, 'peso': 20}
            if cod == 3 and key_abp in model_scores:
                model_scores[key_abp]['scores']['aula']  = {'puntaje': puntaje_100, 'peso': 10}

            # Tecnologado shares #05 (auto), #02 (pares), #03 (CEV) with docencia/abp
            if cod == 5 and key_tec in model_scores:
                model_scores[key_tec]['scores']['auto']  = {'puntaje': puntaje_100, 'peso': 20}
            if cod == 2 and key_tec in model_scores:
                model_scores[key_tec]['scores']['pares'] = {'puntaje': puntaje_100, 'peso': 20}
            if cod == 3 and key_tec in model_scores:
                model_scores[key_tec]['scores']['aula']  = {'puntaje': puntaje_100, 'peso': 10}

            # Posgrado shares #03 (CEV, peso 10) with docencia
            if cod == 3 and key_pos in model_scores:
                model_scores[key_pos]['scores']['aula']  = {'puntaje': puntaje_100, 'peso': 10}

        return model_scores

    # ── Reclassify docencia records by programa field ─────────────────────────
    def _reclassify_by_programa(self, model_scores: dict):
        """
        Move records from 'docencia' bucket to the correct model bucket
        based on the programa field. Called AFTER CSV merge so those het.est
        values are already in the docencia keys before reclassification.
        """
        _PROG_TEC = ('PUCETEC', 'TECNOLOGADO', 'TECNO', ' TG ', 'TG_', '/TG')
        _PROG_POS = ('POSGRADO', 'MAESTRIA', 'MAESTRÍA', 'ESPECIALIDAD',
                     'DOCTORADO', 'MASTER', 'POSTGRADO', 'MP_')
        _PROG_ABP = ('MEDICINA', 'INTERNADO')  # Enfermería goes to regular docencia

        to_remove = []
        to_add: dict = {}

        for (ced, modelo), info in model_scores.items():
            if modelo != 'docencia':
                continue
            prog = str(info.get('programa', '')).upper().strip()

            new_modelo = None
            if any(k in prog for k in _PROG_POS):
                new_modelo = 'posgrado'
            elif any(k in prog for k in _PROG_TEC):
                new_modelo = 'tecnologado'
            elif prog.startswith('TG ') or ' TG ' in (' ' + prog + ' '):
                new_modelo = 'tecnologado'
            elif any(k in prog for k in _PROG_ABP):
                new_modelo = 'abp'

            if not new_modelo:
                continue

            new_key = (ced, new_modelo)
            to_remove.append((ced, modelo))

            # Merge with existing key (e.g. abp already has auto from instr #5)
            if new_key in model_scores:
                existing = model_scores[new_key]
                for comp, val in info['scores'].items():
                    if comp not in existing['scores']:
                        existing['scores'][comp] = val
            elif new_key in to_add:
                for comp, val in info['scores'].items():
                    if comp not in to_add[new_key]['scores']:
                        to_add[new_key]['scores'][comp] = val
            else:
                to_add[new_key] = {
                    'nombre':   info['nombre'],
                    'programa': info['programa'],
                    'scores':   dict(info['scores']),
                }

        for k in to_remove:
            model_scores.pop(k, None)
        model_scores.update(to_add)

    # ── CSV hetero 2025 ───────────────────────────────────────────────────────

    def _merge_csv_hetero_2025(self, model_scores: dict, staff: dict):
        INSTR_CSV = {
            _norm_str('Heteroevaluación Grado Nuevo Docencia Esmeraldas'): ('docencia','hetero_est'),
            _norm_str('Heteroevaluación Grado Nuevo Docencia Quito'):      ('docencia','hetero_est'),
            _norm_str('Heteroevalauación Grado Nuevo ABP Quito'):          ('abp','hetero_est'),
            _norm_str('Heteroevaluación Grado Nuevo Vinculación Quito'):   ('vinculacion','hetero_est'),
            _norm_str('Heteroevalauación Grado Nuevo Servicios Quito'):    ('servicios','hetero_est'),
            _norm_str('Heteroevaluacion Grado Nuevo Docencia Esmeraldas'): ('docencia','hetero_est'),
            _norm_str('Heteroevaluacion Grado Nuevo Docencia Quito'):      ('docencia','hetero_est'),
            _norm_str('Heteroevaluacion Grado Nuevo ABP Quito'):           ('abp','hetero_est'),
        }
        if not os.path.isdir(BASE):
            return
        csv_files = [f for f in os.listdir(BASE) if f.endswith('.csv') and ('202566' in f or '202556' in f)]
        frames = []
        for f in csv_files:
            try:
                df_tmp = pd.read_csv(os.path.join(BASE, f), sep=';', encoding='utf-8-sig', decimal=',', on_bad_lines='skip')
                frames.append(df_tmp)
            except:
                pass
        if not frames:
            return

        df_csv = pd.concat(frames, ignore_index=True)
        df_csv['_ced']   = df_csv['NUM_DOCU'].astype(str).str.strip().str.lstrip('0')
        df_csv['_nom']   = (df_csv['SPRIDEN_LAST_NAME'].astype(str).str.strip() + ' ' +
                            df_csv['SPRIDEN_FIRST_NAME'].astype(str).str.strip())
        df_csv['_punt']  = pd.to_numeric(df_csv['PUNTAJE'], errors='coerce')
        df_csv['_dept']  = df_csv.get('STVDEPT_DESC', pd.Series([''] * len(df_csv))).astype(str)
        df_csv['_instr'] = df_csv['INSTRUMENTO'].apply(_norm_str)

        agg = df_csv.groupby(['_ced','_instr']).agg(
            nombre=('_nom', _first_mode),
            puntaje=('_punt', 'mean'),
            dept=('_dept', _first_mode),
        ).reset_index()

        for _, row in agg.iterrows():
            instr_n = str(row['_instr']).strip()
            if instr_n not in INSTR_CSV:
                continue
            modelo, comp = INSTR_CSV[instr_n]
            ced = str(row['_ced']).strip()
            key = (ced, modelo)
            nombre_ev = self._build_nombre(ced, staff, row['nombre'])
            if key not in model_scores:
                model_scores[key] = {
                    'nombre':   nombre_ev,
                    'programa': str(row.get('dept', '')).strip(),
                    'scores':   {},
                }
            model_scores[key]['scores']['hetero_est'] = {
                'puntaje': float(row['puntaje']) if not pd.isna(row['puntaje']) else 0.0,
                'peso':    50,
            }

    # ── Build 360 records 2025 ────────────────────────────────────────────────

    def _build_360_records_2025(self, model_scores: dict, staff: dict) -> list:
        MODEL_WEIGHTS = {
            # Het.Est(50) + Pares(20) + CEV(10) + Auto(20) = 100
            'docencia':      {'hetero_est':50,'pares':20,'aula':10,'auto':20},
            'abp':           {'hetero_est':50,'pares':20,'aula':10,'auto':20},
            'tecnologado':   {'hetero_est':50,'pares':20,'aula':10,'auto':20},
            # Salud — Servicios Hospitalarios: sólo Het.Est.(100%)
            'servicios':     {'hetero_est':100},
            # Het.Est(60) + Auto(30) + CEV(10) = 100
            'posgrado':      {'hetero_est':60,'auto':30,'aula':10},
            # Het.Dir.Inv(50) + Auto(20) + Par(15) + Decano(15) = 100
            'investigacion': {'hetero_dir':50,'auto':20,'pares':15,'hetero_dec':15},
            # Het.Est(50) + Auto(20) + Het.Dir.Acad(15) + Het.Dir.Inv(15) = 100
            'vinculacion':   {'hetero_est':50,'auto':20,'hetero_dir':15,'hetero_inv':15},
            # Coevalúa.Dir(50) + Het.Doc(30) + Auto(20) = 100
            'gestion':       {'hetero_dir':50,'hetero_est':30,'auto':20},
            'administrativo':{'hetero_dir':50,'hetero_est':30,'auto':20},
        }

        recs = []
        for (ced, modelo), info in model_scores.items():
            scores  = info['scores']
            weights = MODEL_WEIGHTS.get(modelo, {})
            if not scores:
                continue
            total_peso, total_score = 0, 0.0
            comp_vals: dict = {}
            for comp, w in weights.items():
                if comp in scores:
                    total_score += scores[comp]['puntaje'] * w / 100
                    total_peso  += w
                    comp_vals[comp] = scores[comp]['puntaje']
            if total_peso == 0:
                continue
            puntaje  = round(total_score / total_peso * 100, 2)
            programa = info['programa']
            s = staff.get(ced, {})
            # n_evaluadores: tomar el conteo del componente hetero_est (estudiantes)
            n_ev_map = info.get('n_evaluadores', {})
            n_ev = n_ev_map.get('hetero_est') or n_ev_map.get('hetero_dir') or (
                max(n_ev_map.values()) if n_ev_map else None
            )

            _MODELO_FACULTAD = {'tecnologado': 'Tecnologado', 'posgrado': 'Posgrado'}
            rec = {
                'docente_nombre': info['nombre'] or self._build_nombre(ced, staff),
                'facultad':       _MODELO_FACULTAD.get(modelo) or _map_facultad(programa), 'carrera': programa,
                'periodo': '202502', 'anio': 2025, 'modelo': modelo, 'sistema': '360', 'cedula': ced,
                'puntaje_100':    puntaje, 'promedio': round(puntaje / 100 * 5, 2),
                'nivel_desempeno': _nivel_from_puntaje(puntaje),
                'comp_auto':       round(comp_vals.get('auto', 0), 2),
                'comp_pares':      round(comp_vals.get('pares', 0), 2),
                'comp_hetero_dir': round(comp_vals.get('hetero_dir', 0), 2),
                'comp_hetero_est': round(comp_vals.get('hetero_est', comp_vals.get('hetero_dec', 0)), 2),
                'antiguedad_anos': s.get('antiguedad_anos'),
                'funcion_docente': s.get('funcion', 'DOCENCIA') or 'DOCENCIA',
                'sexo':            s.get('genero', ''),
                'archivo_fuente':  'eval_detalladas_2025 + CSV_202566',
                'n_evaluadores':   n_ev,
            }
            if modelo in ('docencia', 'abp', 'tecnologado'):
                # Het.Est(50) + Pares(20) + CEV(10) + Auto(20)
                h = comp_vals.get('hetero_est', 0)
                rec['het_estudiantil'] = round(h / 100 * 50, 2)
                rec['eval_pares']      = round(comp_vals.get('pares', 0) / 100 * 20, 2)
                rec['aula_virtual']    = round(comp_vals.get('aula',  0) / 100 * 10, 2)  # CEV peso=10
                rec['autoevaluacion']  = round(comp_vals.get('auto',  0) / 100 * 20, 2)  # Auto peso=20
            elif modelo == 'servicios':
                # Salud — Servicios Hospitalarios: sólo Het.Est.(100%)
                h = comp_vals.get('hetero_est', 0)
                rec['het_estudiantil'] = round(h, 2)  # ya es sobre 100
            elif modelo == 'posgrado':
                # Het.Est(60) + Auto(30) + CEV(10)
                h = comp_vals.get('hetero_est', 0)
                rec['het_estudiantil'] = round(h / 100 * 60, 2)
                rec['aula_virtual']    = round(comp_vals.get('aula', 0) / 100 * 10, 2)
                rec['autoevaluacion']  = round(comp_vals.get('auto', 0) / 100 * 30, 2)
            recs.append(rec)
        return recs


    # ── POSGRADO HISTÓRICO (2023-2025) ────────────────────────────────────────
    def _source_posgrado_historico(self, staff: dict) -> list:
        """
        Lee datos de evaluaciones de posgrado desde BASE/posgrado/:
          - CSV con columnas NUM_DOCU / SVRTSR3_TERM_CODE / PUNTAJE / PESO → heteroevaluación
          - XLSX con columnas usuario_evaluado / periodo_evaluacion / calificacion / peso → autoevaluación
        Genera registros sistema='360', modelo='posgrado' para cada (cedula, periodo) encontrado.
        """
        if not os.path.isdir(POSGRADO_DIR):
            print(f"[ETL] Posgrado dir no encontrado: {POSGRADO_DIR} — omitiendo datos históricos.")
            return []

        print(f"[ETL] Procesando datos históricos de posgrado desde {POSGRADO_DIR}...")

        # ── 1) Heteroevaluación desde CSVs ────────────────────────────────────
        hetero: dict = {}  # (ced, periodo) → {puntaje, nombre, anio, dept, nresp}

        for fname in os.listdir(POSGRADO_DIR):
            if not fname.lower().endswith('.csv'):
                continue
            fpath = os.path.join(POSGRADO_DIR, fname)
            try:
                df_h = pd.read_csv(fpath, encoding='latin1', sep=';', on_bad_lines='skip')
            except Exception:
                try:
                    df_h = pd.read_csv(fpath, encoding='utf-8-sig', sep=';', on_bad_lines='skip')
                except Exception:
                    continue

            # Necesitamos: cedula, periodo, puntaje, peso, pregunta
            col_doc   = next((c for c in df_h.columns if 'num_docu'       in c.lower()), None)
            col_term  = next((c for c in df_h.columns if 'term_code'      in c.lower()), None)
            col_punt  = next((c for c in df_h.columns if c.lower() == 'puntaje'), None)
            col_peso  = next((c for c in df_h.columns if c.lower() == 'peso' and 'total' not in c.lower()), None)
            col_preg  = next((c for c in df_h.columns if 'cod_pregunta'   in c.lower()), None)
            col_last  = next((c for c in df_h.columns if 'last_name'      in c.lower()), None)
            col_first = next((c for c in df_h.columns if 'first_name'     in c.lower()), None)
            col_dept  = next((c for c in df_h.columns if 'stvdept_desc'   in c.lower()), None)
            col_nresp = next((c for c in df_h.columns if 'numero_respuestas' in c.lower()), None)

            if not (col_doc and col_term and col_punt):
                continue  # archivo sin estructura esperada (e.g. CSV1 sin puntaje)

            df_h['_ced']    = df_h[col_doc].astype(str).str.strip().str.lstrip('0')
            df_h['_per']    = df_h[col_term].astype(str).str.strip()
            df_h['_anio']   = df_h['_per'].apply(
                lambda p: int(str(p)[:4]) if len(str(p)) >= 4 and str(p)[:4].isdigit() else 2023)
            df_h['_punt']   = pd.to_numeric(
                df_h[col_punt].astype(str).str.replace(',', '.', regex=False), errors='coerce')
            df_h['_peso']   = pd.to_numeric(df_h[col_peso], errors='coerce').fillna(1) if col_peso else 1.0
            df_h['_nom']    = (
                df_h[col_last].astype(str).str.strip() + ' ' +
                df_h[col_first].astype(str).str.strip()
            ).str.strip() if (col_last and col_first) else ''
            df_h['_dept']   = df_h[col_dept].astype(str).str.strip() if col_dept else ''
            df_h['_nresp']  = pd.to_numeric(df_h[col_nresp], errors='coerce') if col_nresp else np.nan
            df_h['_preg']   = df_h[col_preg].astype(str) if col_preg else '__'

            df_valid = df_h.dropna(subset=['_punt'])

            # Dedup: promedio de PUNTAJE por (cedula, periodo, pregunta)
            df_dd = df_valid.groupby(['_ced', '_per', '_preg']).agg(
                punt_q=('_punt',  'mean'),
                peso=  ('_peso',  'first'),
                anio=  ('_anio',  'first'),
                nombre=('_nom',   'first'),
                dept=  ('_dept',  'first'),
                nresp= ('_nresp', 'max'),
            ).reset_index()

            # Promedio ponderado por (cedula, periodo)
            for (ced, per), grp in df_dd.groupby(['_ced', '_per']):
                if not ced or ced in ('nan', ''):
                    continue
                peso_sum = grp['peso'].sum()
                if peso_sum == 0:
                    continue
                puntaje = float((grp['punt_q'] * grp['peso']).sum() / peso_sum)
                nresp_v = grp['nresp'].max()
                hetero[(ced, per)] = {
                    'puntaje': round(puntaje, 2),
                    'nombre':  str(grp['nombre'].iloc[0]).strip(),
                    'anio':    int(grp['anio'].iloc[0]),
                    'dept':    str(grp['dept'].iloc[0]).strip(),
                    'nresp':   int(nresp_v) if nresp_v and not pd.isna(nresp_v) else None,
                }

        # ── 2) Autoevaluación desde XLSXs ────────────────────────────────────
        auto: dict = {}  # (ced, periodo) → {puntaje, nombre}

        for fname in os.listdir(POSGRADO_DIR):
            if not fname.lower().endswith('.xlsx'):
                continue
            fpath = os.path.join(POSGRADO_DIR, fname)
            try:
                df_a = pd.read_excel(fpath, engine='openpyxl')
            except Exception:
                continue

            if 'usuario_evaluado' not in df_a.columns:
                continue

            col_per_a = next((c for c in df_a.columns if 'periodo' in c.lower()), None)
            col_cal   = next((c for c in df_a.columns if 'calificacion' in c.lower()), None)
            col_pes_a = next((c for c in df_a.columns if c.lower() == 'peso'), None)
            col_ap    = next((c for c in df_a.columns if 'apellidos_evaluado' in c.lower()), None)
            col_nm    = next((c for c in df_a.columns if 'nombres_evaluado'   in c.lower()), None)

            if not (col_per_a and col_cal and col_pes_a):
                continue

            df_a['_ced']  = df_a['usuario_evaluado'].astype(str).str.strip().str.lstrip('0')
            df_a['_per']  = df_a[col_per_a].astype(str).str.strip()
            df_a['_cal']  = pd.to_numeric(df_a[col_cal], errors='coerce').fillna(0)
            df_a['_peso'] = pd.to_numeric(df_a[col_pes_a], errors='coerce').fillna(0)
            # Instrumento 8: escala 1–4; contrib = (cal/4)*peso → suma = puntaje sobre 100
            df_a['_contrib'] = (df_a['_cal'] / 4.0) * df_a['_peso']
            df_a['_nom'] = (
                df_a[col_ap].astype(str).str.strip() + ' ' +
                df_a[col_nm].astype(str).str.strip()
            ).str.strip() if (col_ap and col_nm) else ''

            for (ced, per), grp in df_a.groupby(['_ced', '_per']):
                if not ced or ced in ('nan', ''):
                    continue
                auto_score = float(grp['_contrib'].sum())
                auto[(ced, per)] = {
                    'puntaje': round(min(auto_score, 100.0), 2),
                    'nombre':  str(grp['_nom'].iloc[0]).strip(),
                }

        # ── 3) Construir registros fusionando hetero + auto ───────────────────
        recs = []
        all_keys = set(hetero.keys()) | set(auto.keys())

        for (ced, per) in all_keys:
            h = hetero.get((ced, per))
            a = auto.get((ced, per))

            anio = h['anio'] if h else (
                int(str(per)[:4]) if len(str(per)) >= 4 and str(per)[:4].isdigit() else 2023)
            dept        = h['dept']    if h else ''
            nresp       = h.get('nresp') if h else None
            nombre_raw  = (h['nombre'] if h else '') or (a['nombre'] if a else '')

            s      = staff.get(ced, {})
            nombre = self._build_nombre(ced, staff, nombre_raw)

            # Puntaje: Het.Est(60%) + Auto(30%) + CEV(10%) → sin CEV escalamos a 90%
            het_p  = h['puntaje'] if h else 0.0
            aut_p  = a['puntaje'] if a else 0.0

            if h and a:
                puntaje = round((het_p * 0.60 + aut_p * 0.30) / 0.90, 2)
            elif h:
                puntaje = round(het_p, 2)
            elif a:
                puntaje = round(aut_p, 2)
            else:
                continue

            puntaje = min(puntaje, 100.0)

            recs.append({
                'docente_nombre':  nombre,
                'facultad':        'Posgrado',
                'carrera':         dept,
                'periodo':         str(per),
                'anio':            anio,
                'modelo':          'posgrado',
                'sistema':         '360',
                'cedula':          ced,
                'puntaje_100':     round(puntaje, 2),
                'promedio':        round(puntaje / 100 * 5, 2),
                'nivel_desempeno': _nivel_from_puntaje(puntaje),
                'het_estudiantil': round(het_p / 100 * 60, 2),
                'autoevaluacion':  round(aut_p / 100 * 30, 2),
                'comp_hetero_est': round(het_p, 2),
                'comp_auto':       round(aut_p, 2),
                'sexo':            s.get('genero', ''),
                'antiguedad_anos': s.get('antiguedad_anos'),
                'funcion_docente': s.get('funcion', 'DOCENCIA') or 'DOCENCIA',
                'archivo_fuente':  'posgrado/historico',
                'n_evaluadores':   nresp,
            })

        print(f"[ETL] Posgrado histórico: {len(recs)} registros ({len(hetero)} hetero, {len(auto)} auto).")
        return recs

    # ── Eval detalladas por período (202401, 202402, 202501, …) ──────────────
    def _source_eval_detalladas_periodo(
        self, staff: dict, dir_path: str, periodo: str, anio: int
    ) -> list:
        """
        Procesa archivos XLSX de evaluaciones detalladas desde un directorio dado.
        Usa el mismo INSTR_MAP que el pipeline 202502 pero sin CSV hetero ni
        reclasificación por programa. Genera registros sistema='360'.
        Nunca sobreescribirá período 202502 (usa dir_path separado).
        """
        if not os.path.isdir(dir_path):
            return []

        MAX_CAL = {3: 4, 10: 4, 11: 4, 12: 4, 13: 4}
        INSTR_MAP = {
            1:  ('docencia',     'auto',       20),
            2:  ('docencia',     'pares',      20),
            3:  ('docencia',     'aula',       10),
            4:  ('docencia',     'hetero_est', 50),
            5:  ('abp',          'auto',       20),
            6:  ('abp',          'hetero_est', 50),
            7:  ('tecnologado',  'hetero_est', 50),
            8:  ('posgrado',     'auto',       30),
            9:  ('posgrado',     'hetero_est', 60),
            10: ('investigacion','auto',       20),
            11: ('investigacion','hetero_dir', 50),
            12: ('investigacion','pares',      15),
            13: ('investigacion','hetero_dec', 15),
            14: ('vinculacion',  'auto',       20),
            15: ('vinculacion',  'hetero_dir', 15),
            16: ('vinculacion',  'hetero_est', 50),
            17: ('vinculacion',  'hetero_inv', 15),
            18: ('gestion',      'auto',       20),
            19: ('gestion',      'hetero_dir', 50),
            20: ('gestion',      'hetero_est', 30),
            170:('vinculacion',  'hetero_inv', 15),
        }
        MODEL_WEIGHTS = {
            'docencia':      {'hetero_est':50,'pares':20,'aula':10,'auto':20},
            'abp':           {'hetero_est':50,'pares':20,'aula':10,'auto':20},
            'tecnologado':   {'hetero_est':50,'pares':20,'aula':10,'auto':20},
            'servicios':     {'hetero_est':100},
            'posgrado':      {'hetero_est':60,'auto':30,'aula':10},
            'investigacion': {'hetero_dir':50,'auto':20,'pares':15,'hetero_dec':15},
            'vinculacion':   {'hetero_est':50,'auto':20,'hetero_dir':15,'hetero_inv':15},
            'gestion':       {'hetero_dir':50,'hetero_est':30,'auto':20},
        }

        try:
            xlsx_files = [f for f in os.listdir(dir_path) if f.endswith('.xlsx')]
            if not xlsx_files:
                return []
            frames = []
            for f in xlsx_files:
                try:
                    frames.append(pd.read_excel(os.path.join(dir_path, f), engine='openpyxl'))
                except Exception:
                    pass
            if not frames:
                return []
            df = pd.concat(frames, ignore_index=True)
        except Exception as e:
            print(f"[ETL] Error leyendo {dir_path}: {e}")
            return []

        # Normalizar columnas requeridas
        req = ['usuario_evaluado', 'cod_instrumento', 'calificacion', 'peso']
        for col in req:
            if col not in df.columns:
                print(f"[ETL] {dir_path}: falta columna {col} — omitiendo.")
                return []

        df['cal_norm'] = pd.to_numeric(df['calificacion'], errors='coerce').fillna(0)
        df['peso_num'] = pd.to_numeric(df['peso'], errors='coerce').fillna(0)
        df['max_cal']  = df['cod_instrumento'].apply(
            lambda c: MAX_CAL.get(int(c) if str(c).strip().isdigit() else 0, 3))
        df['contrib']  = (df['cal_norm'] / df['max_cal'].replace(0, 1)) * df['peso_num']
        df['_ced']     = df['usuario_evaluado'].astype(str).str.strip().str.lstrip('0')

        # Columnas opcionales para nombre
        col_ap = 'apellidos_evaluado' if 'apellidos_evaluado' in df.columns else None
        col_nm = 'nombres_evaluado'   if 'nombres_evaluado'   in df.columns else None
        col_pr = 'programa'           if 'programa'           in df.columns else None

        # Score por (cedula, instrumento)
        group_cols = ['_ced', 'cod_instrumento']
        if col_ap: group_cols += ['apellidos_evaluado']
        if col_nm: group_cols += ['nombres_evaluado']
        if col_pr: group_cols += ['programa']

        agg_cols = ['_ced', 'cod_instrumento']
        by_instr = df.groupby(agg_cols).agg(
            score=('contrib', 'sum'),
            max_score=('peso_num', 'sum'),
        ).reset_index()
        by_instr['puntaje_100'] = (
            by_instr['score'] / by_instr['max_score'].replace(0, 1) * 100
        ).round(2)

        # Nombres y programa (primer valor por cedula)
        extras: dict = {}
        for _, row in df.iterrows():
            ced = str(row['_ced']).strip()
            if ced not in extras:
                ap = _clean_nombre(row.get(col_ap, '')) if col_ap else ''
                nm = _clean_nombre(row.get(col_nm, '')) if col_nm else ''
                pr = _clean_nombre(row.get(col_pr, '')) if col_pr else ''
                extras[ced] = {'nombre': f"{ap} {nm}".strip(), 'programa': pr}

        # Acumular scores por (ced, modelo)
        model_scores: dict = {}
        for _, row in by_instr.iterrows():
            ced = str(row['_ced']).strip()
            try:
                cod = int(float(row['cod_instrumento']))
            except Exception:
                continue
            if cod not in INSTR_MAP:
                continue
            modelo, comp, peso = INSTR_MAP[cod]
            key = (ced, modelo)
            if key not in model_scores:
                info = extras.get(ced, {})
                model_scores[key] = {
                    'nombre':   self._build_nombre(ced, staff, info.get('nombre', '')),
                    'programa': info.get('programa', ''),
                    'scores':   {},
                }
            puntaje_100 = float(row['puntaje_100']) if not pd.isna(row['puntaje_100']) else 0.0
            model_scores[key]['scores'][comp] = {'puntaje': puntaje_100, 'peso': peso}

        _MODELO_FACULTAD = {'tecnologado': 'Tecnologado', 'posgrado': 'Posgrado'}
        recs = []
        for (ced, modelo), info in model_scores.items():
            scores  = info['scores']
            weights = MODEL_WEIGHTS.get(modelo, {})
            if not scores:
                continue
            total_peso, total_score = 0, 0.0
            comp_vals: dict = {}
            for comp, w in weights.items():
                if comp in scores:
                    total_score += scores[comp]['puntaje'] * w / 100
                    total_peso  += w
                    comp_vals[comp] = scores[comp]['puntaje']
            if total_peso == 0:
                continue
            puntaje = round(total_score / total_peso * 100, 2)
            s = staff.get(ced, {})
            programa = info.get('programa', '')
            rec = {
                'docente_nombre':  info['nombre'] or self._build_nombre(ced, staff),
                'facultad':        _MODELO_FACULTAD.get(modelo) or _map_facultad(programa),
                'carrera':         programa,
                'periodo':         periodo,
                'anio':            anio,
                'modelo':          modelo,
                'sistema':         '360',
                'cedula':          ced,
                'puntaje_100':     puntaje,
                'promedio':        round(puntaje / 100 * 5, 2),
                'nivel_desempeno': _nivel_from_puntaje(puntaje),
                'comp_auto':       round(comp_vals.get('auto', 0), 2),
                'comp_pares':      round(comp_vals.get('pares', 0), 2),
                'comp_hetero_dir': round(comp_vals.get('hetero_dir', 0), 2),
                'comp_hetero_est': round(comp_vals.get('hetero_est', comp_vals.get('hetero_dec', 0)), 2),
                'sexo':            s.get('genero', ''),
                'antiguedad_anos': s.get('antiguedad_anos'),
                'funcion_docente': s.get('funcion', 'DOCENCIA') or 'DOCENCIA',
                'tiempo_servicio': _map_tiempo_servicio(s.get('tiempo_dedicacion', '')),
                'nivel_estudio':   s.get('nivel_instruccion', ''),
                'archivo_fuente':  f'eval_detalladas_{periodo}',
            }
            if modelo in ('docencia', 'abp', 'tecnologado'):
                h = comp_vals.get('hetero_est', 0)
                rec['het_estudiantil'] = round(h / 100 * 50, 2)
                rec['eval_pares']      = round(comp_vals.get('pares', 0) / 100 * 20, 2)
                rec['aula_virtual']    = round(comp_vals.get('aula', 0) / 100 * 10, 2)
                rec['autoevaluacion']  = round(comp_vals.get('auto', 0) / 100 * 20, 2)
            elif modelo == 'posgrado':
                h = comp_vals.get('hetero_est', 0)
                rec['het_estudiantil'] = round(h / 100 * 60, 2)
                rec['aula_virtual']    = round(comp_vals.get('aula', 0) / 100 * 10, 2)
                rec['autoevaluacion']  = round(comp_vals.get('auto', 0) / 100 * 30, 2)
            elif modelo == 'servicios':
                rec['het_estudiantil'] = round(comp_vals.get('hetero_est', 0), 2)
            recs.append(rec)

        print(f"[ETL] eval_detalladas {periodo}: {len(recs)} registros desde {dir_path}")
        return recs

    # ── PUCETEC hetero histórico (CSV) ────────────────────────────────────────
    def _source_pucetec_hetero(self, staff: dict) -> list:
        """
        Lee el CSV de heteroevaluación PUCETEC histórica (2023–2025).
        Mismo formato que los CSV de posgrado hetero:
        NUM_DOCU, SVRTSR3_TERM_CODE, PUNTAJE, PESO, COD_PREGUNTA, STVDEPT_DESC.
        Genera registros sistema='360', modelo='tecnologado'.
        """
        # Buscar el CSV de PUCETEC en el directorio base
        pucetec_csv = None
        for fname in (os.listdir(BASE) if os.path.isdir(BASE) else []):
            if 'pucetec' in fname.lower() and fname.lower().endswith('.csv'):
                pucetec_csv = os.path.join(BASE, fname)
                break
        if not pucetec_csv:
            return []

        print(f"[ETL] PUCETEC hetero: procesando {pucetec_csv} ...")
        try:
            df_p = pd.read_csv(pucetec_csv, encoding='latin1', sep=';', on_bad_lines='skip')
        except Exception:
            try:
                df_p = pd.read_csv(pucetec_csv, encoding='utf-8-sig', sep=';', on_bad_lines='skip')
            except Exception as e:
                print(f"[ETL] PUCETEC CSV error: {e}")
                return []

        col_doc  = next((c for c in df_p.columns if 'num_docu'     in c.lower()), None)
        col_term = next((c for c in df_p.columns if 'term_code'    in c.lower()), None)
        col_punt = next((c for c in df_p.columns if c.lower() == 'puntaje'), None)
        col_peso = next((c for c in df_p.columns if c.lower() == 'peso' and 'total' not in c.lower()), None)
        col_preg = next((c for c in df_p.columns if 'cod_pregunta' in c.lower()), None)
        col_last = next((c for c in df_p.columns if 'last_name'    in c.lower()), None)
        col_frst = next((c for c in df_p.columns if 'first_name'   in c.lower()), None)
        col_dept = next((c for c in df_p.columns if 'stvdept_desc' in c.lower()), None)

        if not (col_doc and col_term and col_punt):
            print("[ETL] PUCETEC CSV: columnas insuficientes — omitiendo.")
            return []

        df_p['_ced']  = df_p[col_doc].astype(str).str.strip().str.lstrip('0')
        df_p['_per']  = df_p[col_term].astype(str).str.strip()
        df_p['_anio'] = df_p['_per'].apply(
            lambda p: int(str(p)[:4]) if len(str(p)) >= 4 and str(p)[:4].isdigit() else 2023)
        df_p['_punt'] = pd.to_numeric(
            df_p[col_punt].astype(str).str.replace(',', '.', regex=False), errors='coerce')
        df_p['_peso'] = pd.to_numeric(df_p[col_peso], errors='coerce').fillna(1) if col_peso else 1.0
        df_p['_nom']  = (
            df_p[col_last].astype(str).str.strip() + ' ' +
            df_p[col_frst].astype(str).str.strip()
        ).str.strip() if (col_last and col_frst) else ''
        df_p['_dept'] = df_p[col_dept].astype(str).str.strip() if col_dept else ''
        df_p['_preg'] = df_p[col_preg].astype(str) if col_preg else '__'

        df_valid = df_p.dropna(subset=['_punt'])
        # Dedup por (ced, periodo, pregunta)
        df_dd = df_valid.groupby(['_ced', '_per', '_preg']).agg(
            punt_q=('_punt',  'mean'),
            peso  =('_peso',  'first'),
            anio  =('_anio',  'first'),
            nombre=('_nom',   'first'),
            dept  =('_dept',  'first'),
        ).reset_index()

        recs = []
        for (ced, per), grp in df_dd.groupby(['_ced', '_per']):
            if not ced or ced in ('nan', ''):
                continue
            peso_sum = grp['peso'].sum()
            if peso_sum == 0:
                continue
            puntaje = float((grp['punt_q'] * grp['peso']).sum() / peso_sum)
            puntaje = min(round(puntaje, 2), 100.0)
            anio    = int(grp['anio'].iloc[0])
            dept    = str(grp['dept'].iloc[0]).strip()
            nombre_raw = str(grp['nombre'].iloc[0]).strip()
            s = staff.get(ced, {})

            recs.append({
                'docente_nombre':  self._build_nombre(ced, staff, nombre_raw),
                'facultad':        'Tecnologado',
                'carrera':         dept,
                'periodo':         str(per),
                'anio':            anio,
                'modelo':          'tecnologado',
                'sistema':         '360',
                'cedula':          ced,
                'puntaje_100':     puntaje,
                'promedio':        round(puntaje / 100 * 5, 2),
                'nivel_desempeno': _nivel_from_puntaje(puntaje),
                'het_estudiantil': round(puntaje / 100 * 50, 2),
                'comp_hetero_est': round(puntaje, 2),
                'sexo':            s.get('genero', ''),
                'antiguedad_anos': s.get('antiguedad_anos'),
                'funcion_docente': s.get('funcion', 'DOCENCIA') or 'DOCENCIA',
                'tiempo_servicio': _map_tiempo_servicio(s.get('tiempo_dedicacion', '')),
                'nivel_estudio':   s.get('nivel_instruccion', ''),
                'archivo_fuente':  os.path.basename(pucetec_csv),
            })

        print(f"[ETL] PUCETEC hetero: {len(recs)} registros.")
        return recs

    # ── MEIPA componentes completos (PUCESE DATA) ─────────────────────────────
    def _source_meipa_pucese_data(self, staff: dict) -> list:
        """
        Lee los archivos de PUCESE DATA (pucese_data/) que contienen los
        4 componentes MEIPA completos para grado (202301, 202302, 202401):
          - hetero.xlsx   → Het.Estudiantil (40%) — también datos demográficos
          - *_Eval.xlsx   → sheets: autoevaluacion(20%), pares(20%), coordinador(20%)
        Calificación 1-5 → normalizada a 0-100.
        Genera registros sistema='meipa', modelo='docencia'.
        """
        if not os.path.isdir(PUCESE_DATA_DIR):
            return []

        print(f"[ETL] MEIPA PUCESE DATA: procesando {PUCESE_DATA_DIR} ...")

        # ── 1. Het.Estudiantil desde hetero.xlsx ─────────────────────────
        het_scores: dict = {}   # (ced, periodo) → {'puntaje':float, 'nombre':str, demo:{}}
        hetero_path = os.path.join(PUCESE_DATA_DIR, 'hetero.xlsx')
        if os.path.exists(hetero_path):
            try:
                xl = pd.ExcelFile(hetero_path)
                for sh in xl.sheet_names:
                    df_h = pd.read_excel(hetero_path, sheet_name=sh)
                    col_doc  = next((c for c in df_h.columns if 'num_docu' in c.lower()), None)
                    col_term = next((c for c in df_h.columns if 'term_code' in c.lower()), None)
                    col_punt = next((c for c in df_h.columns if c.upper() == 'PUNTAJE'), None)
                    col_peso = next((c for c in df_h.columns if c.upper() == 'PESO' and 'TOTAL' not in c.upper()), None)
                    col_preg = next((c for c in df_h.columns if 'cod_pregunta' in c.lower()), None)
                    col_last = next((c for c in df_h.columns if 'last_name' in c.lower()), None)
                    col_frst = next((c for c in df_h.columns if 'first_name' in c.lower()), None)
                    col_gen  = next((c for c in df_h.columns if c.upper() == 'GENDER'), None)
                    col_ded  = next((c for c in df_h.columns if c.upper() == 'DED_TIME'), None)
                    col_ant  = next((c for c in df_h.columns if c.upper() == 'ANTIQUE'), None)
                    col_age  = next((c for c in df_h.columns if c.upper() == 'AGE'), None)
                    if not (col_doc and col_term and col_punt):
                        continue
                    df_h['_ced']  = df_h[col_doc].astype(str).str.strip().str.lstrip('0')
                    df_h['_per']  = df_h[col_term].astype(str).str.strip()
                    df_h['_punt'] = pd.to_numeric(
                        df_h[col_punt].astype(str).str.replace(',', '.', regex=False), errors='coerce')
                    df_h['_peso'] = pd.to_numeric(df_h[col_peso], errors='coerce').fillna(1) if col_peso else 1.0
                    df_h['_preg'] = df_h[col_preg].astype(str) if col_preg else '__'
                    df_h['_nom']  = (df_h[col_last].astype(str).str.strip() + ' ' +
                                     df_h[col_frst].astype(str).str.strip()).str.strip() if (col_last and col_frst) else ''

                    df_valid = df_h.dropna(subset=['_punt'])
                    df_dd = df_valid.groupby(['_ced', '_per', '_preg']).agg(
                        punt_q=('_punt', 'mean'),
                        peso=('_peso', 'first'),
                    ).reset_index()

                    for (ced, per), grp in df_dd.groupby(['_ced', '_per']):
                        if not ced or ced in ('nan',):
                            continue
                        ps = grp['peso'].sum()
                        puntaje = float((grp['punt_q'] * grp['peso']).sum() / ps) if ps > 0 else 0.0
                        puntaje = min(round(puntaje, 2), 100.0)
                        # Demo data (first row for this docente/periodo)
                        mask = (df_h['_ced'] == ced) & (df_h['_per'] == per)
                        row0 = df_h[mask].iloc[0] if mask.any() else None
                        demo = {}
                        if row0 is not None:
                            if col_gen:  demo['sexo']   = _clean_nombre(str(row0.get(col_gen, ''))) or ''
                            if col_ded:  demo['ded']    = str(row0.get(col_ded, '')).strip().upper()
                            if col_ant:  demo['antique']= str(row0.get(col_ant, '')).strip()
                            if col_age:
                                try: demo['edad'] = int(float(row0.get(col_age, 0)))
                                except: pass
                        het_scores[(ced, per)] = {
                            'puntaje': puntaje,
                            'nombre':  df_h[mask]['_nom'].iloc[0] if mask.any() else '',
                            'demo':    demo,
                        }
            except Exception as e:
                print(f"[ETL] hetero.xlsx error: {e}")

        # ── 2. Auto / Pares / Coordinador desde *_Eval.xlsx / *_Eva.xlsx ─
        #       calificacion 1-5 → avg/5 * 100
        comp_scores: dict = {}  # (ced, periodo) → {'auto': float, 'pares': float, 'coord': float}

        def _score_sheet(df_s, col_ced_name, col_cal_name) -> dict:
            """(ced, periodo) → promedio 0-100"""
            result = {}
            df_s['_ced'] = df_s[col_ced_name].astype(str).str.strip().str.lstrip('0')
            df_s['_per'] = df_s['periodo_evaluacion'].astype(str).str.strip()
            df_s['_cal'] = pd.to_numeric(df_s[col_cal_name], errors='coerce')
            for (ced, per), grp in df_s.dropna(subset=['_cal']).groupby(['_ced', '_per']):
                if not ced or ced in ('nan',):
                    continue
                avg = grp['_cal'].mean()
                result[(ced, per)] = round(min(avg / 5 * 100, 100.0), 2)
            return result

        eval_files = [f for f in os.listdir(PUCESE_DATA_DIR)
                      if (f.endswith('_Eval.xlsx') or f.endswith('_Eva.xlsx')) and f != 'hetero.xlsx']
        for fname in eval_files:
            fpath = os.path.join(PUCESE_DATA_DIR, fname)
            try:
                xl = pd.ExcelFile(fpath)
                for sh in xl.sheet_names:
                    df_s = pd.read_excel(fpath, sheet_name=sh)
                    if 'periodo_evaluacion' not in df_s.columns or 'usuario_evaluado' not in df_s.columns:
                        continue
                    cal_col = next((c for c in df_s.columns if 'calificacion' in c.lower()), None)
                    if not cal_col:
                        continue
                    scores = _score_sheet(df_s, 'usuario_evaluado', cal_col)
                    sh_lower = sh.lower()
                    comp = ('auto'  if 'auto' in sh_lower else
                            'pares' if 'par'  in sh_lower else
                            'coord' if 'coord' in sh_lower else None)
                    if not comp:
                        continue
                    for key, val in scores.items():
                        if key not in comp_scores:
                            comp_scores[key] = {}
                        # If same period already has value, average them
                        if comp in comp_scores[key]:
                            comp_scores[key][comp] = round((comp_scores[key][comp] + val) / 2, 2)
                        else:
                            comp_scores[key][comp] = val
            except Exception as e:
                print(f"[ETL] {fname} error: {e}")

        # ── 3. Construir registros MEIPA completos ────────────────────────
        all_keys = set(het_scores.keys()) | set(comp_scores.keys())
        recs = []
        for (ced, per) in all_keys:
            het_info   = het_scores.get((ced, per), {})
            comps      = comp_scores.get((ced, per), {})
            het_puntaje= het_info.get('puntaje', 0.0)
            auto_p     = comps.get('auto',  0.0)
            pares_p    = comps.get('pares', 0.0)
            coord_p    = comps.get('coord', 0.0)
            demo       = het_info.get('demo', {})

            # MEIPA: Het(40) + Auto(20) + Coord(20) + Pares(20) = 100
            # Solo considerar componentes disponibles
            total_peso, total_score = 0, 0.0
            if het_puntaje:  total_score += het_puntaje * 40;  total_peso += 40
            if auto_p:       total_score += auto_p * 20;        total_peso += 20
            if coord_p:      total_score += coord_p * 20;       total_peso += 20
            if pares_p:      total_score += pares_p * 20;       total_peso += 20
            if total_peso == 0:
                continue
            puntaje_100 = round(total_score / total_peso, 2)

            # Determinar periodo normalizado (202301→'202301', 202361→'202301' etc.)
            try:
                anio = int(str(per)[:4])
            except:
                anio = 2023
            periodo_norm = str(per)

            s = staff.get(ced, {})
            nombre_raw = str(het_info.get('nombre', '')).strip()

            # Demo: preferir hetero.xlsx, luego staff lookup
            sexo_val = demo.get('sexo') or s.get('genero', '')
            ded_raw  = demo.get('ded',  '') or s.get('tiempo_dedicacion', '')
            ts_val   = _map_tiempo_servicio(ded_raw)
            niv_val  = s.get('nivel_instruccion', '')
            edad_val = demo.get('edad')
            # Antigüedad desde ANTIQUE string p.ej. "4 AÑOS 3 MESES"
            antig_val = s.get('antiguedad_anos')
            if not antig_val and demo.get('antique'):
                antig_val = _parse_antiguedad(demo['antique'])

            recs.append({
                'docente_nombre':  self._build_nombre(ced, staff, nombre_raw),
                'facultad':        s.get('unidad_org', '') or '',
                'carrera':         '',
                'periodo':         periodo_norm,
                'anio':            anio,
                'modelo':          'docencia',
                'sistema':         'meipa',
                'cedula':          ced,
                'puntaje_100':     puntaje_100,
                'promedio':        round(puntaje_100 / 100 * 5, 2),
                'nivel_desempeno': _nivel_from_puntaje(puntaje_100),
                'comp_hetero_est': round(het_puntaje, 2),
                'comp_auto':       round(auto_p, 2),
                'comp_pares':      round(pares_p, 2),
                'comp_hetero_dir': round(coord_p, 2),
                'sexo':            sexo_val,
                'edad':            edad_val,
                'tiempo_servicio': ts_val,
                'antiguedad_anos': antig_val,
                'nivel_estudio':   niv_val,
                'funcion_docente': s.get('funcion', 'DOCENCIA') or 'DOCENCIA',
                'archivo_fuente':  'pucese_data/meipa_completo',
            })

        print(f"[ETL] MEIPA PUCESE DATA: {len(recs)} registros completos "
              f"({len(het_scores)} het, {len(comp_scores)} comp).")
        return recs


etl_service = ETLService()
