from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.evaluacion import Evaluacion
import time as _time

_kpi_cache: dict = {}
_CACHE_TTL = 300  # 5 minutes

# Weight definitions per model
MODEL_CONFIG = {
    # Het.Est(50) + Pares(20) + CEV/aula_virtual(10) + Auto(20) = 100
    'docencia':       {'components': [('het_estudiantil',50),('eval_pares',20),('aula_virtual',10),('autoevaluacion',20)], 'label': 'Docencia'},
    'abp':            {'components': [('het_estudiantil',50),('eval_pares',20),('aula_virtual',10),('autoevaluacion',20)], 'label': 'Salud / ABP'},
    'tecnologado':    {'components': [('het_estudiantil',50),('eval_pares',20),('aula_virtual',10),('autoevaluacion',20)], 'label': 'Tecnologado'},
    # Het.Est(60) + Auto(30) + CEV(10) = 100  (sin pares)
    'posgrado':       {'components': [('het_estudiantil',60),('autoevaluacion',30),('aula_virtual',10)],                   'label': 'Posgrado'},
    # Het.Dir.Invest(50) + Auto(20) + Par(15) + Decano(15) = 100
    'investigacion':  {'components': [('comp_hetero_dir',50),('comp_auto',20),('comp_pares',15),('comp_hetero_est',15)],   'label': 'Investigación'},
    # Het.Est(50) + Auto(20) + Het.Dir.Acad(15) + Het.Dir.Invest(15) = 100
    'vinculacion':    {'components': [('comp_hetero_est',50),('comp_auto',20),('comp_hetero_dir',15),('comp_pares',15)],   'label': 'Vinculación'},
    # Coevalúa.Dir(50) + Het.Docentes(30) + Auto(20) = 100
    'gestion':        {'components': [('comp_hetero_dir',50),('comp_hetero_est',30),('comp_auto',20)],                     'label': 'Gestión'},
    'administrativo': {'components': [('comp_hetero_dir',50),('comp_hetero_est',30),('comp_auto',20)],                     'label': 'Administrativo'},
    # Salud — Servicios Hospitalarios: sólo Heteroevaluación Estudiantil (100%)
    'servicios':      {'components': [('het_estudiantil',100)],                                                             'label': 'Salud / Servicios'},
}

MEIPA_MODEL_CONFIG = {
    'docencia': {
        'components': [
            ('comp_hetero_est', 40),
            ('comp_auto',       20),
            ('comp_hetero_dir', 20),
            ('comp_pares',      20),
        ],
        'label': 'MEIPA — Docencia',
    }
}


def _norm_periodo(p: str) -> str:
    """Normaliza el código de período al formato 'YYYY-[I|II]' que usa la DB.
    Acepta tanto '202402' (frontend) como '2024-II' (DB) → siempre devuelve 'YYYY-[I|II]'.
    """
    if not p:
        return p
    s = p.strip()
    # Ya está en formato DB: '2024-II', '2025-I'
    if '-' in s:
        return s
    # Formato numérico del frontend: '202402' → '2024-II'
    if len(s) == 6 and s.isdigit():
        year = s[:4]
        sem  = 'II' if int(s[4:]) >= 2 else 'I'
        return f'{year}-{sem}'
    return s


def _all_codes_for_sem(periodo: str) -> list:
    """
    Given a canonical period code (e.g. '202302'), return ALL raw DB codes
    that represent the same academic semester, including tecnologado and posgrado variants.
    """
    if not periodo or len(periodo) != 6 or not periodo.isdigit():
        return [periodo]
    year = periodo[:4]
    suf  = int(periodo[4:])
    if suf <= 1:  # Semester I
        codes = [periodo]
        codes += [f'{year}{s:02d}' for s in range(10, 21)]   # TEC-I (10-20)
        codes += [f'{year}{s:02d}' for s in range(70, 74)]   # Posg-I real (70-73)
        return codes
    else:  # Semester II
        codes = [periodo]
        codes += [f'{year}{s:02d}' for s in range(21, 31)]   # TEC-II (21-30)
        codes += [f'{year}56', f'{year}66']                   # MECDI G·II (202456,202466 etc)
        codes += [f'{year}{s:02d}' for s in range(74, 80)]   # Posg-II real (74-79)
        return codes


def _base_q(db: Session, modelo: str = None, anio: int = None, sistema: str = None, periodo: str = None):
    q = db.query(Evaluacion)
    if modelo:
        q = q.filter(Evaluacion.modelo == modelo)
    if periodo:
        # Expand canonical code to all equivalent DB codes (covers tec/posgrado variants)
        codes = _all_codes_for_sem(str(periodo))
        if len(codes) == 1:
            q = q.filter(Evaluacion.periodo == codes[0])
        else:
            q = q.filter(Evaluacion.periodo.in_(codes))
    elif anio:
        # Solo filtrar por año cuando no hay período específico
        q = q.filter(Evaluacion.anio == anio)
    if sistema:
        q = q.filter(Evaluacion.sistema == sistema)
    return q


class KPIService:

    def get_institutional_kpis(
        self,
        db: Session,
        modelo: str = None,
        anio: int = None,
        sistema: str = None,
        periodo: str = None,
    ):
        q = _base_q(db, modelo, anio, sistema, periodo)
        total = q.count()
        if total == 0:
            return None

        total_docentes   = q.with_entities(func.count(func.distinct(Evaluacion.docente_nombre))).scalar()
        total_facultades = q.with_entities(func.count(func.distinct(Evaluacion.facultad))).scalar()

        promedio_100 = q.with_entities(func.avg(Evaluacion.puntaje_100)).scalar() or 0
        promedio_gral_100 = round(promedio_100, 2)
        promedio_gral_5   = round(promedio_gral_100 / 100 * 5, 2)

        mejor = q.with_entities(
            Evaluacion.docente_nombre, Evaluacion.facultad,
            func.avg(Evaluacion.puntaje_100).label('avg_score')
        ).group_by(Evaluacion.docente_nombre, Evaluacion.facultad).order_by(
            func.avg(Evaluacion.puntaje_100).desc()
        ).first()

        peor = q.with_entities(
            Evaluacion.docente_nombre, Evaluacion.facultad,
            func.avg(Evaluacion.puntaje_100).label('avg_score')
        ).group_by(Evaluacion.docente_nombre, Evaluacion.facultad).order_by(
            func.avg(Evaluacion.puntaje_100).asc()
        ).first()

        por_facultad = q.with_entities(
            Evaluacion.facultad, func.avg(Evaluacion.puntaje_100)
        ).group_by(Evaluacion.facultad).all()

        dist_nivel = q.with_entities(
            Evaluacion.nivel_desempeno, func.count(Evaluacion.id)
        ).filter(Evaluacion.nivel_desempeno != None).group_by(Evaluacion.nivel_desempeno).all()

        # Choose component config based on sistema
        if sistema == 'meipa':
            cfg = MEIPA_MODEL_CONFIG.get(modelo or 'docencia', MEIPA_MODEL_CONFIG['docencia'])
        else:
            cfg = MODEL_CONFIG.get(modelo or 'docencia', MODEL_CONFIG['docencia'])

        componentes = {}
        for col, peso in cfg['components']:
            col_attr = getattr(Evaluacion, col, None)
            if col_attr is None:
                continue
            avg_val = q.with_entities(func.avg(col_attr)).scalar() or 0
            n_val   = q.with_entities(func.count(Evaluacion.id)).filter(col_attr > 0).scalar() or 0
            componentes[col] = {'peso': peso, 'promedio': round(avg_val, 2), 'n_docentes': n_val}

        anios_disponibles   = [r[0] for r in db.query(func.distinct(Evaluacion.anio)).order_by(Evaluacion.anio).all() if r[0]]
        modelos_disponibles = [r[0] for r in db.query(func.distinct(Evaluacion.modelo)).all() if r[0]]
        sistemas_disponibles= [r[0] for r in db.query(func.distinct(Evaluacion.sistema)).all() if r[0]]

        return {
            'promedio_general':        promedio_gral_5,
            'promedio_general_100':    promedio_gral_100,
            'mejor_docente':           mejor[0] if mejor else 'N/A',
            'mejor_docente_facultad':  mejor[1] if mejor else 'N/A',
            'mejor_docente_score':     round(mejor[2], 2) if mejor else 0,
            'peor_docente':            peor[0] if peor else 'N/A',
            'total_evaluaciones':      total,
            'total_docentes':          total_docentes,
            'total_facultades':        total_facultades,
            'promedio_por_facultad':   {f: round(p, 2) for f, p in por_facultad if f},
            'distribucion_nivel':      {n if n else 'Sin datos': c for n, c in dist_nivel},
            'componentes':             componentes,
            'modelo_label':            cfg['label'],
            'anios_disponibles':       anios_disponibles,
            'modelos_disponibles':     modelos_disponibles,
            'sistemas_disponibles':    sistemas_disponibles,
        }

    def get_meipa_kpis(self, db: Session, anio: int = None):
        """Return aggregated MEIPA-specific metrics."""
        return self.get_institutional_kpis(db, modelo='docencia', anio=anio, sistema='meipa')

    def get_analytics(
        self,
        db: Session,
        sistema: str = None,
        modelo: str = None,
        anio: int = None,
        periodo: str = None,
    ) -> dict:
        """
        Return breakdowns:
          por_genero:    {M: avg, F: avg}
          por_edad:      {'<30': avg, '31-45': avg, '46-60': avg, '61+': avg}
          por_antiguedad:{'0-3 años': avg, '4-10 años': avg, '11-20 años': avg, '20+ años': avg}
          por_funcion:   {'DOCENCIA': avg, 'COORDINACIÓN': avg, ...}
        """
        q = _base_q(db, modelo, anio, sistema, periodo)

        # ── Por género ────────────────────────────────────────────────────────
        rows_g = q.with_entities(Evaluacion.sexo, func.avg(Evaluacion.puntaje_100))\
                   .filter(Evaluacion.sexo != None, Evaluacion.sexo != '')\
                   .group_by(Evaluacion.sexo).all()
        # Normalise gender labels from different source formats
        _GENERO_NORM = {
            'mujer': 'Mujer', 'femenino': 'Mujer', 'f': 'Mujer',
            'hombre': 'Hombre', 'masculino': 'Hombre', 'm': 'Hombre',
        }
        _merged: dict = {}
        for g, v in rows_g:
            key = _GENERO_NORM.get(str(g).lower().strip(), str(g).strip())
            _merged[key] = (_merged.get(key, []))
            _merged[key].append(float(v or 0))
        por_genero = {k: round(sum(vs)/len(vs), 2) for k, vs in _merged.items() if vs}

        # ── Por edad (bracket) ────────────────────────────────────────────────
        edad_rows = q.with_entities(Evaluacion.edad, Evaluacion.puntaje_100)\
                     .filter(Evaluacion.edad != None, Evaluacion.puntaje_100 != None).all()
        brackets_edad = {'<30': [], '31-45': [], '46-60': [], '61+': []}
        for edad, pun in edad_rows:
            if edad and pun is not None:
                if edad < 30:
                    brackets_edad['<30'].append(pun)
                elif edad <= 45:
                    brackets_edad['31-45'].append(pun)
                elif edad <= 60:
                    brackets_edad['46-60'].append(pun)
                else:
                    brackets_edad['61+'].append(pun)
        por_edad = {k: round(sum(v)/len(v), 2) if v else None for k, v in brackets_edad.items()}

        # ── Por antigüedad ────────────────────────────────────────────────────
        antig_rows = q.with_entities(Evaluacion.antiguedad_anos, Evaluacion.puntaje_100)\
                      .filter(Evaluacion.antiguedad_anos != None, Evaluacion.puntaje_100 != None).all()
        brackets_ant = {'0-3 años': [], '4-10 años': [], '11-20 años': [], '20+ años': []}
        for ant, pun in antig_rows:
            if ant is not None and pun is not None:
                if ant <= 3:
                    brackets_ant['0-3 años'].append(pun)
                elif ant <= 10:
                    brackets_ant['4-10 años'].append(pun)
                elif ant <= 20:
                    brackets_ant['11-20 años'].append(pun)
                else:
                    brackets_ant['20+ años'].append(pun)
        por_antiguedad = {k: round(sum(v)/len(v), 2) if v else None for k, v in brackets_ant.items()}

        # ── Por función ───────────────────────────────────────────────────────
        rows_f = q.with_entities(Evaluacion.funcion_docente, func.avg(Evaluacion.puntaje_100))\
                   .filter(Evaluacion.funcion_docente != None, Evaluacion.funcion_docente != '')\
                   .group_by(Evaluacion.funcion_docente).all()
        por_funcion = {f: round(v or 0, 2) for f, v in rows_f}

        return {
            'por_genero':      por_genero,
            'por_edad':        por_edad,
            'por_antiguedad':  por_antiguedad,
            'por_funcion':     por_funcion,
        }

    def get_comparativo(self, db: Session, anio: int = None) -> dict:
        """Full overview: MEIPA vs 360, models, trends, faculty, gender, age, seniority, cross-analysis."""
        cache_key = f"comparativo_{anio}"
        _now = _time.time()
        if cache_key in _kpi_cache and _now - _kpi_cache[cache_key]['ts'] < _CACHE_TTL:
            return _kpi_cache[cache_key]['data']

        _GENERO_NORM = {
            'mujer': 'Mujer', 'femenino': 'Mujer', 'f': 'Mujer',
            'hombre': 'Hombre', 'masculino': 'Hombre', 'm': 'Hombre',
        }
        AGE_BRACKETS    = ['< 30 años', '31-45 años', '46-60 años', '61+ años']
        ANTIG_BRACKETS  = ['0-3 años', '4-10 años', '11-20 años', '20+ años']

        def avg_for(sistema, modelo=None):
            q = _base_q(db, modelo, anio, sistema)
            v = q.with_entities(func.avg(Evaluacion.puntaje_100)).scalar()
            n = q.count()
            return {'promedio': round(v, 2) if v else None, 'n': n}

        meipa_overall  = avg_for('meipa')
        tres60_overall = avg_for('360')

        modelos_360    = ['docencia', 'abp', 'servicios', 'posgrado', 'tecnologado', 'vinculacion', 'gestion', 'administrativo', 'investigacion']
        por_modelo_360 = {m: avg_for('360', m) for m in modelos_360}

        def trend(sistema):
            q = db.query(Evaluacion)
            if sistema:
                q = q.filter(Evaluacion.sistema == sistema)
            if anio:
                q = q.filter(Evaluacion.anio == anio)
            rows = q.with_entities(Evaluacion.anio, func.avg(Evaluacion.puntaje_100))\
                    .filter(Evaluacion.anio != None)\
                    .group_by(Evaluacion.anio)\
                    .order_by(Evaluacion.anio).all()
            return [{'anio': r[0], 'promedio': round(r[1], 2) if r[1] else None} for r in rows]

        # ── Base query (all records, optional year filter) ────────────────────
        q_all = db.query(Evaluacion)
        if anio:
            q_all = q_all.filter(Evaluacion.anio == anio)

        # ── Facultades ────────────────────────────────────────────────────────
        rows_fac = (
            q_all.with_entities(Evaluacion.facultad,
                                func.avg(Evaluacion.puntaje_100),
                                func.count())
            .filter(Evaluacion.facultad != None, Evaluacion.facultad != '')
            .group_by(Evaluacion.facultad)
            .order_by(func.avg(Evaluacion.puntaje_100).desc())
            .all()
        )
        por_facultad = [{'facultad': f, 'promedio': round(p, 2), 'n': n}
                        for f, p, n in rows_fac if f]

        # ── Por género ────────────────────────────────────────────────────────
        rows_g = (
            q_all.with_entities(Evaluacion.sexo, func.avg(Evaluacion.puntaje_100))
            .filter(Evaluacion.sexo != None, Evaluacion.sexo != '')
            .group_by(Evaluacion.sexo).all()
        )
        _mg: dict = {}
        for g, v in rows_g:
            key = _GENERO_NORM.get(str(g).lower().strip(), str(g).strip())
            _mg.setdefault(key, []).append(float(v or 0))
        por_genero = {k: round(sum(vs)/len(vs), 2) for k, vs in _mg.items()}

        # ── Por edad ──────────────────────────────────────────────────────────
        edad_rows = (
            q_all.with_entities(Evaluacion.edad, Evaluacion.puntaje_100)
            .filter(Evaluacion.edad != None, Evaluacion.puntaje_100 != None).all()
        )
        _be: dict = {b: [] for b in AGE_BRACKETS}
        for edad, pun in edad_rows:
            if edad is None or pun is None: continue
            if edad < 30:   _be['< 30 años'].append(pun)
            elif edad <= 45: _be['31-45 años'].append(pun)
            elif edad <= 60: _be['46-60 años'].append(pun)
            else:            _be['61+ años'].append(pun)
        por_edad = {k: round(sum(v)/len(v), 2) if v else None for k, v in _be.items()}

        # ── Por antigüedad ────────────────────────────────────────────────────
        antig_rows = (
            q_all.with_entities(Evaluacion.antiguedad_anos, Evaluacion.puntaje_100)
            .filter(Evaluacion.antiguedad_anos != None, Evaluacion.puntaje_100 != None).all()
        )
        _ba: dict = {b: [] for b in ANTIG_BRACKETS}
        for ant, pun in antig_rows:
            if ant is None or pun is None: continue
            if ant <= 3:    _ba['0-3 años'].append(pun)
            elif ant <= 10: _ba['4-10 años'].append(pun)
            elif ant <= 20: _ba['11-20 años'].append(pun)
            else:           _ba['20+ años'].append(pun)
        por_antiguedad = {k: round(sum(v)/len(v), 2) if v else None for k, v in _ba.items()}

        # ── Género × Edad cross-analysis ──────────────────────────────────────
        gedad_rows = (
            q_all.with_entities(Evaluacion.sexo, Evaluacion.edad, Evaluacion.puntaje_100)
            .filter(Evaluacion.sexo != None, Evaluacion.edad != None,
                    Evaluacion.puntaje_100 != None).all()
        )
        _cross: dict = {g: {b: [] for b in AGE_BRACKETS} for g in ('Mujer', 'Hombre')}
        for sexo, edad, pun in gedad_rows:
            gkey = _GENERO_NORM.get(str(sexo).lower().strip(), str(sexo).strip())
            if gkey not in _cross: continue
            if edad < 30:   bkt = '< 30 años'
            elif edad <= 45: bkt = '31-45 años'
            elif edad <= 60: bkt = '46-60 años'
            else:            bkt = '61+ años'
            _cross[gkey][bkt].append(pun)
        genero_edad = {
            g: {b: round(sum(v)/len(v), 2) if v else None for b, v in brackets.items()}
            for g, brackets in _cross.items()
        }

        # ── Género × Antigüedad cross-analysis ────────────────────────────────
        gantig_rows = (
            q_all.with_entities(Evaluacion.sexo, Evaluacion.antiguedad_anos, Evaluacion.puntaje_100)
            .filter(Evaluacion.sexo != None, Evaluacion.antiguedad_anos != None,
                    Evaluacion.puntaje_100 != None).all()
        )
        _crossa: dict = {g: {b: [] for b in ANTIG_BRACKETS} for g in ('Mujer', 'Hombre')}
        for sexo, ant, pun in gantig_rows:
            gkey = _GENERO_NORM.get(str(sexo).lower().strip(), str(sexo).strip())
            if gkey not in _crossa: continue
            if ant <= 3:    bkt = '0-3 años'
            elif ant <= 10: bkt = '4-10 años'
            elif ant <= 20: bkt = '11-20 años'
            else:           bkt = '20+ años'
            _crossa[gkey][bkt].append(pun)
        genero_antiguedad = {
            g: {b: round(sum(v)/len(v), 2) if v else None for b, v in brackets.items()}
            for g, brackets in _crossa.items()
        }

        # ── Mejores y Peores por modelo 360 ──────────────────────────────────
        RANKING_MODELS = {
            'Docencia':             'docencia',
            'Salud / ABP':          'abp',
            'Salud / Servicios':    'servicios',
            'Vinculación':          'vinculacion',
            'Investigación':        'investigacion',
            'Gestión':              'gestion',
        }
        mejores_peores = {}
        for label, modelo in RANKING_MODELS.items():
            q_m = db.query(Evaluacion).filter(
                Evaluacion.sistema == '360',
                Evaluacion.modelo == modelo,
                Evaluacion.puntaje_100.isnot(None),
                Evaluacion.docente_nombre.isnot(None),
            )
            if anio:
                q_m = q_m.filter(Evaluacion.anio == anio)
            rows = q_m.with_entities(
                Evaluacion.docente_nombre,
                Evaluacion.facultad,
                Evaluacion.cedula,
                func.avg(Evaluacion.puntaje_100).label('puntaje'),
                Evaluacion.nivel_desempeno,
            ).group_by(
                Evaluacion.docente_nombre, Evaluacion.facultad, Evaluacion.cedula, Evaluacion.nivel_desempeno
            ).order_by(func.avg(Evaluacion.puntaje_100).desc()).all()

            def _td(r):
                return {
                    'nombre':   r[0] or 'Sin nombre',
                    'facultad': r[1] or '',
                    'puntaje':  round(float(r[3] or 0), 1),
                    'nivel':    r[4] or 'Sin datos',
                }

            all_ranked = [_td(r) for r in rows]
            mejores_peores[label] = {
                'mejores': all_ranked[:5],
                'peores':  list(reversed(all_ranked[-5:])) if len(all_ranked) >= 5 else list(reversed(all_ranked)),
                'total':   len(all_ranked),
            }

        # ── Estadísticas descriptivas por sistema y por modelo ───────────────
        import statistics as _stat

        def _puntajes(sistema_f=None, modelo_f=None):
            q2 = db.query(Evaluacion.puntaje_100).filter(Evaluacion.puntaje_100.isnot(None))
            if anio:      q2 = q2.filter(Evaluacion.anio == anio)
            if sistema_f: q2 = q2.filter(Evaluacion.sistema == sistema_f)
            if modelo_f:  q2 = q2.filter(Evaluacion.modelo == modelo_f)
            return [float(r[0]) for r in q2.all()]

        def _desc(vals):
            if not vals:
                return None
            n = len(vals)
            mean = sum(vals) / n
            variance = sum((v - mean) ** 2 for v in vals) / n
            sorted_v = sorted(vals)
            mid = n // 2
            median = (sorted_v[mid - 1] + sorted_v[mid]) / 2 if n % 2 == 0 else sorted_v[mid]
            bins: dict = {}
            for v in vals:
                b = int(v // 5) * 5
                key = f"{b}–{b+5}"
                bins[key] = bins.get(key, 0) + 1
            moda_bin = max(bins, key=lambda k: bins[k])
            return {
                'n': n, 'media': round(mean, 2), 'mediana': round(median, 2),
                'varianza': round(variance, 2), 'desv_std': round(variance ** 0.5, 2),
                'moda_rango': moda_bin, 'moda_freq': bins[moda_bin],
                'min': round(sorted_v[0], 2), 'max': round(sorted_v[-1], 2),
            }

        estadisticas = {
            'meipa': _desc(_puntajes('meipa')),
            '360':   _desc(_puntajes('360')),
            'por_modelo': {
                m: _desc(_puntajes('360', m))
                for m in ['docencia', 'abp', 'servicios', 'vinculacion', 'investigacion', 'gestion', 'tecnologado', 'posgrado']
            },
        }

        # ── Variables detalle: best/worst components + teachers per model ───
        # (col, label, max_db_value)  — max_db_value is used to normalize to %
        _VARS_CFG = {
            '360_docencia': ('360', 'docencia', [
                ('het_estudiantil', 'Heteroevaluación Estudiantil', 50),
                ('eval_pares',      'Evaluación por Pares',         20),
                ('aula_virtual',    'Aula Virtual / CEV',           10),
                ('autoevaluacion',  'Autoevaluación',               20),
            ]),
            '360_abp': ('360', 'abp', [
                ('het_estudiantil', 'Het. Estudiantil (Med.)',       50),
                ('eval_pares',      'Evaluación por Pares',          20),
                ('aula_virtual',    'Aula Virtual / CEV',            10),
                ('autoevaluacion',  'Autoevaluación',                20),
            ]),
            '360_servicios': ('360', 'servicios', [
                ('het_estudiantil', 'Het. Estudiantil (Hosp.)',     100),
            ]),
            '360_vinculacion': ('360', 'vinculacion', [
                ('comp_hetero_est', 'Het. Estudiantil',              100),
                ('comp_hetero_dir', 'Het. Dir. Académico',           100),
                ('comp_auto',       'Autoevaluación',                100),
            ]),
            '360_investigacion': ('360', 'investigacion', [
                ('comp_hetero_dir', 'Het. Dir. Investigación',       100),
                ('comp_pares',      'Coevaluación Par',              100),
                ('comp_hetero_est', 'Het. Decano / Coord.',          100),
                ('comp_auto',       'Autoevaluación',                100),
            ]),
            '360_gestion': ('360', 'gestion', [
                ('comp_hetero_dir', 'Coevalúa. Directivo Superior',  100),
                ('comp_hetero_est', 'Het. Docentes',                 100),
                ('comp_auto',       'Autoevaluación',                100),
            ]),
            'meipa_docencia': ('meipa', 'docencia', [
                ('comp_hetero_est', 'Heteroevaluación Estudiantil',  100),
                ('comp_hetero_dir', 'Coord. → Docente',              100),
                ('comp_pares',      'Evaluación por Pares',          100),
                ('comp_auto',       'Autoevaluación',                100),
            ]),
        }

        def _teacher_fmt(r, mx):
            raw = float(r[2] or 0)
            return {'nombre': r[0] or 'Sin nombre', 'cedula': r[1] or '—',
                    'comp_pct': round(min(100.0, raw / mx * 100), 1),
                    'puntaje': round(float(r[3] or 0), 1)}

        variables_detalle = {}
        for cfg_key, (sistema_f, modelo_f, comps) in _VARS_CFG.items():
            q_base = db.query(Evaluacion).filter(
                Evaluacion.sistema == sistema_f,
                Evaluacion.modelo == modelo_f,
                Evaluacion.puntaje_100.isnot(None),
            )
            if anio:
                q_base = q_base.filter(Evaluacion.anio == anio)

            comp_rows = []
            for col_key, label, max_val in comps:
                col = getattr(Evaluacion, col_key, None)
                if col is None:
                    continue
                q_c = q_base.filter(col.isnot(None), col > 0)
                avg_raw = q_c.with_entities(func.avg(col)).scalar()
                n_c = q_c.with_entities(func.count(Evaluacion.id)).scalar() or 0
                if avg_raw is None or n_c == 0:
                    continue
                avg_pct = round(min(100.0, float(avg_raw) / max_val * 100), 1)

                top5 = q_c.with_entities(
                    Evaluacion.docente_nombre, Evaluacion.cedula,
                    func.avg(col).label('comp_v'),
                    func.avg(Evaluacion.puntaje_100).label('tot'),
                ).group_by(Evaluacion.docente_nombre, Evaluacion.cedula)\
                 .order_by(func.avg(col).desc()).limit(5).all()

                bot5 = q_c.with_entities(
                    Evaluacion.docente_nombre, Evaluacion.cedula,
                    func.avg(col).label('comp_v'),
                    func.avg(Evaluacion.puntaje_100).label('tot'),
                ).group_by(Evaluacion.docente_nombre, Evaluacion.cedula)\
                 .order_by(func.avg(col).asc()).limit(5).all()

                comp_rows.append({
                    'label': label, 'key': col_key,
                    'avg_pct': avg_pct, 'n': n_c,
                    'top5': [_teacher_fmt(r, max_val) for r in top5],
                    'bot5': [_teacher_fmt(r, max_val) for r in bot5],
                })

            comp_rows.sort(key=lambda x: x['avg_pct'], reverse=True)
            variables_detalle[cfg_key] = comp_rows

        # ── Tendencia por período (string) ────────────────────────────────────
        def trend_periodo(sistema):
            q2 = db.query(Evaluacion)
            if sistema:
                q2 = q2.filter(Evaluacion.sistema == sistema)
            if anio:
                q2 = q2.filter(Evaluacion.anio == anio)
            rows2 = (
                q2.with_entities(
                    Evaluacion.anio,
                    Evaluacion.periodo,
                    func.avg(Evaluacion.puntaje_100),
                    func.count(Evaluacion.id),
                )
                .filter(Evaluacion.periodo.isnot(None))
                .group_by(Evaluacion.anio, Evaluacion.periodo)
                .order_by(Evaluacion.anio, Evaluacion.periodo)
                .all()
            )
            return [
                {'anio': r[0], 'periodo': r[1], 'promedio': round(float(r[2]), 2) if r[2] else None, 'n': r[3]}
                for r in rows2
            ]

        # ── Por modelo × período ───────────────────────────────────────────────
        modelos_all = ['docencia','abp','servicios','posgrado','tecnologado','vinculacion','gestion','administrativo','investigacion']
        por_modelo_por_periodo: dict = {}
        for m in modelos_all:
            rows_mp = (
                db.query(Evaluacion)
                .filter(
                    Evaluacion.sistema == '360',
                    Evaluacion.modelo == m,
                    Evaluacion.periodo.isnot(None),
                    Evaluacion.puntaje_100.isnot(None),
                )
                .with_entities(
                    Evaluacion.anio, Evaluacion.periodo,
                    func.avg(Evaluacion.puntaje_100), func.count(Evaluacion.id),
                )
                .group_by(Evaluacion.anio, Evaluacion.periodo)
                .order_by(Evaluacion.anio, Evaluacion.periodo)
                .all()
            )
            if rows_mp:
                por_modelo_por_periodo[m] = [
                    {'anio': r[0], 'periodo': r[1], 'promedio': round(float(r[2]), 2) if r[2] else None, 'n': r[3]}
                    for r in rows_mp
                ]

        # ── Género × período ──────────────────────────────────────────────────
        rows_gp = (
            q_all.with_entities(
                Evaluacion.anio, Evaluacion.periodo, Evaluacion.sexo,
                func.avg(Evaluacion.puntaje_100),
            )
            .filter(Evaluacion.periodo.isnot(None), Evaluacion.sexo.isnot(None), Evaluacion.sexo != '')
            .group_by(Evaluacion.anio, Evaluacion.periodo, Evaluacion.sexo)
            .order_by(Evaluacion.anio, Evaluacion.periodo)
            .all()
        )
        _gp_map: dict = {}
        for anio_v, per, sexo, prom in rows_gp:
            key = _GENERO_NORM.get(str(sexo).lower().strip(), str(sexo).strip())
            _gp_map.setdefault(per, {'periodo': per, 'anio': anio_v})
            _gp_map[per][key] = round(float(prom), 2) if prom else None
        genero_por_periodo = sorted(_gp_map.values(), key=lambda x: (x.get('anio') or 0, x.get('periodo') or ''))

        # ── Edad × período ────────────────────────────────────────────────────
        rows_ep = (
            q_all.with_entities(Evaluacion.anio, Evaluacion.periodo, Evaluacion.edad, Evaluacion.puntaje_100)
            .filter(Evaluacion.periodo.isnot(None), Evaluacion.edad.isnot(None), Evaluacion.puntaje_100.isnot(None))
            .all()
        )
        _ep_map: dict = {}
        for anio_v, per, edad, pun in rows_ep:
            if edad is None or pun is None:
                continue
            _ep_map.setdefault(per, {'periodo': per, 'anio': anio_v, **{b: [] for b in AGE_BRACKETS}})
            if edad < 30:    _ep_map[per]['< 30 años'].append(float(pun))
            elif edad <= 45: _ep_map[per]['31-45 años'].append(float(pun))
            elif edad <= 60: _ep_map[per]['46-60 años'].append(float(pun))
            else:            _ep_map[per]['61+ años'].append(float(pun))
        edad_por_periodo = []
        for per, d in sorted(_ep_map.items(), key=lambda x: (x[1].get('anio') or 0, x[0])):
            row = {'periodo': per, 'anio': d.get('anio')}
            for b in AGE_BRACKETS:
                vals_b = d.get(b, [])
                row[b] = round(sum(vals_b)/len(vals_b), 2) if vals_b else None
            edad_por_periodo.append(row)

        # ── Antigüedad × período ──────────────────────────────────────────────
        rows_ap = (
            q_all.with_entities(Evaluacion.anio, Evaluacion.periodo, Evaluacion.antiguedad_anos, Evaluacion.puntaje_100)
            .filter(Evaluacion.periodo.isnot(None), Evaluacion.antiguedad_anos.isnot(None), Evaluacion.puntaje_100.isnot(None))
            .all()
        )
        _ap_map: dict = {}
        for anio_v, per, ant, pun in rows_ap:
            if ant is None or pun is None:
                continue
            _ap_map.setdefault(per, {'periodo': per, 'anio': anio_v, **{b: [] for b in ANTIG_BRACKETS}})
            if ant <= 3:    _ap_map[per]['0-3 años'].append(float(pun))
            elif ant <= 10: _ap_map[per]['4-10 años'].append(float(pun))
            elif ant <= 20: _ap_map[per]['11-20 años'].append(float(pun))
            else:           _ap_map[per]['20+ años'].append(float(pun))
        antiguedad_por_periodo = []
        for per, d in sorted(_ap_map.items(), key=lambda x: (x[1].get('anio') or 0, x[0])):
            row = {'periodo': per, 'anio': d.get('anio')}
            for b in ANTIG_BRACKETS:
                vals_b = d.get(b, [])
                row[b] = round(sum(vals_b)/len(vals_b), 2) if vals_b else None
            antiguedad_por_periodo.append(row)

        # ── Facultad × período ────────────────────────────────────────────────
        rows_fp = (
            q_all.with_entities(
                Evaluacion.anio, Evaluacion.periodo, Evaluacion.facultad,
                func.avg(Evaluacion.puntaje_100), func.count(Evaluacion.id),
            )
            .filter(Evaluacion.periodo.isnot(None), Evaluacion.facultad.isnot(None), Evaluacion.facultad != '')
            .group_by(Evaluacion.anio, Evaluacion.periodo, Evaluacion.facultad)
            .order_by(Evaluacion.anio, Evaluacion.periodo, Evaluacion.facultad)
            .all()
        )
        facultad_por_periodo = [
            {'anio': r[0], 'periodo': r[1], 'facultad': r[2], 'promedio': round(float(r[3]), 2) if r[3] else None, 'n': r[4]}
            for r in rows_fp if r[2]
        ]

        # ── Género×Edad × período ─────────────────────────────────────────────
        rows_gep = (
            q_all.with_entities(
                Evaluacion.anio, Evaluacion.periodo,
                Evaluacion.sexo, Evaluacion.edad, Evaluacion.puntaje_100
            )
            .filter(
                Evaluacion.periodo.isnot(None),
                Evaluacion.sexo.isnot(None), Evaluacion.sexo != '',
                Evaluacion.edad.isnot(None),
                Evaluacion.puntaje_100.isnot(None),
            )
            .all()
        )
        _gep: dict = {}  # (periodo, genero, bracket) -> {anio, vals}
        for anio_v, per, sexo, edad, pun in rows_gep:
            gkey = _GENERO_NORM.get(str(sexo).lower().strip(), str(sexo).strip())
            if edad < 30:    bkt = '< 30 años'
            elif edad <= 45: bkt = '31-45 años'
            elif edad <= 60: bkt = '46-60 años'
            else:            bkt = '61+ años'
            k = (per, gkey, bkt)
            if k not in _gep:
                _gep[k] = {'anio': anio_v, 'vals': []}
            _gep[k]['vals'].append(float(pun))
        genero_edad_por_periodo = [
            {'periodo': per, 'anio': d['anio'], 'genero': gen, 'bracket': bkt,
             'promedio': round(sum(d['vals'])/len(d['vals']), 2) if d['vals'] else None}
            for (per, gen, bkt), d in sorted(_gep.items(), key=lambda x: (x[1].get('anio') or 0, x[0][0]))
            if d.get('vals')
        ]

        # ── Género×Antigüedad × período ───────────────────────────────────────
        rows_gap = (
            q_all.with_entities(
                Evaluacion.anio, Evaluacion.periodo,
                Evaluacion.sexo, Evaluacion.antiguedad_anos, Evaluacion.puntaje_100
            )
            .filter(
                Evaluacion.periodo.isnot(None),
                Evaluacion.sexo.isnot(None), Evaluacion.sexo != '',
                Evaluacion.antiguedad_anos.isnot(None),
                Evaluacion.puntaje_100.isnot(None),
            )
            .all()
        )
        _gap: dict = {}
        for anio_v, per, sexo, ant, pun in rows_gap:
            gkey = _GENERO_NORM.get(str(sexo).lower().strip(), str(sexo).strip())
            if ant <= 3:    bkt = '0-3 años'
            elif ant <= 10: bkt = '4-10 años'
            elif ant <= 20: bkt = '11-20 años'
            else:           bkt = '20+ años'
            k = (per, gkey, bkt)
            _gap.setdefault(k, {'anio': anio_v, 'vals': []})['vals'].append(float(pun))
        genero_antiguedad_por_periodo = [
            {'periodo': per, 'anio': d['anio'], 'genero': gen, 'bracket': bkt,
             'promedio': round(sum(d['vals'])/len(d['vals']), 2) if d['vals'] else None}
            for (per, gen, bkt), d in sorted(_gap.items(), key=lambda x: (x[1].get('anio') or 0, x[0][0]))
            if d.get('vals')
        ]

        _result = {
            'meipa':                         meipa_overall,
            '360':                           tres60_overall,
            'por_modelo_360':                por_modelo_360,
            'tendencia_meipa':               trend('meipa'),
            'tendencia_360':                 trend('360'),
            'tendencia_periodos_meipa':      trend_periodo('meipa'),
            'tendencia_periodos_360':        trend_periodo('360'),
            'por_modelo_por_periodo':        por_modelo_por_periodo,
            'genero_por_periodo':            genero_por_periodo,
            'edad_por_periodo':              edad_por_periodo,
            'antiguedad_por_periodo':        antiguedad_por_periodo,
            'facultad_por_periodo':          facultad_por_periodo,
            'genero_edad_por_periodo':       genero_edad_por_periodo,
            'genero_antiguedad_por_periodo': genero_antiguedad_por_periodo,
            'por_facultad':                  por_facultad,
            'por_genero':                    por_genero,
            'por_edad':                      por_edad,
            'por_antiguedad':                por_antiguedad,
            'genero_edad':                   genero_edad,
            'genero_antiguedad':             genero_antiguedad,
            'mejores_peores':                mejores_peores,
            'estadisticas':                  estadisticas,
            'variables_detalle':             variables_detalle,
        }
        _kpi_cache[cache_key] = {'data': _result, 'ts': _now}
        return _result

    def get_ranking_docentes(self, db: Session, modelo: str = None, anio: int = None,
                              limit: int = 1000, sistema: str = None, periodo: str = None):
        q = _base_q(db, modelo, anio, sistema, periodo)
        ranking = q.with_entities(
            Evaluacion.docente_nombre,
            Evaluacion.facultad,
            Evaluacion.periodo,
            Evaluacion.anio,
            Evaluacion.modelo,
            func.avg(Evaluacion.puntaje_100).label('puntaje_100'),
            func.avg(Evaluacion.promedio).label('promedio'),
            func.avg(Evaluacion.het_estudiantil).label('het_estudiantil'),
            func.avg(Evaluacion.eval_pares).label('eval_pares'),
            func.avg(Evaluacion.aula_virtual).label('aula_virtual'),
            func.avg(Evaluacion.autoevaluacion).label('autoevaluacion'),
            func.avg(Evaluacion.comp_auto).label('comp_auto'),
            func.avg(Evaluacion.comp_pares).label('comp_pares'),
            func.avg(Evaluacion.comp_hetero_dir).label('comp_hetero_dir'),
            func.avg(Evaluacion.comp_hetero_est).label('comp_hetero_est'),
            Evaluacion.nivel_desempeno,
            Evaluacion.cedula,
            Evaluacion.sistema,
        ).group_by(Evaluacion.docente_nombre, Evaluacion.facultad, Evaluacion.modelo,
                   Evaluacion.nivel_desempeno, Evaluacion.cedula, Evaluacion.sistema,
                   Evaluacion.periodo, Evaluacion.anio)\
         .order_by(func.avg(Evaluacion.puntaje_100).desc())\
         .limit(limit).all()

        return [{
            'nombre':          r[0],
            'facultad':        r[1],
            'periodo':         r[2],
            'anio':            r[3],
            'modelo':          r[4],
            'puntaje_100':     round(r[5] or 0, 2),
            'promedio':        round(r[6] or 0, 2),
            'het_estudiantil': round(r[7] or 0, 2),
            'eval_pares':      round(r[8] or 0, 2),
            'aula_virtual':    round(r[9] or 0, 2),
            'autoevaluacion':  round(r[10] or 0, 2),
            'comp_auto':       round(r[11] or 0, 2),
            'comp_pares':      round(r[12] or 0, 2),
            'comp_hetero_dir': round(r[13] or 0, 2),
            'comp_hetero_est': round(r[14] or 0, 2),
            'nivel':           r[15] or 'Sin datos',
            'cedula':          r[16] or '',
            'sistema':         r[17] or '',
        } for r in ranking]

    def get_todos_docentes(self, db: Session, anio: int = None, modelo: str = None, sistema: str = None, periodo: str = None) -> list:
        """All teachers grouped by (cedula, sistema, modelo) with per-component normalized %."""
        _COMP_CFG: dict = {
            ('360', 'docencia'):     [('het_estudiantil',50),('eval_pares',20),('aula_virtual',10),('autoevaluacion',20)],
            ('360', 'abp'):          [('het_estudiantil',50),('eval_pares',20),('aula_virtual',10),('autoevaluacion',20)],
            ('360', 'tecnologado'):  [('het_estudiantil',50),('eval_pares',20),('aula_virtual',10),('autoevaluacion',20)],
            ('360', 'posgrado'):     [('het_estudiantil',60),('autoevaluacion',30),('aula_virtual',10)],
            ('360', 'vinculacion'):  [('comp_hetero_est',100),('comp_hetero_dir',100),('comp_auto',100)],
            ('360', 'investigacion'):[('comp_hetero_dir',100),('comp_pares',100),('comp_hetero_est',100),('comp_auto',100)],
            ('360', 'gestion'):      [('comp_hetero_dir',100),('comp_hetero_est',100),('comp_auto',100)],
            ('360', 'administrativo'):[('comp_hetero_dir',100),('comp_hetero_est',100),('comp_auto',100)],
            ('360', 'servicios'):    [('het_estudiantil',100)],
            ('meipa', 'docencia'):   [('comp_hetero_est',100),('comp_hetero_dir',100),('comp_pares',100),('comp_auto',100)],
        }
        _COMP_LABELS: dict = {
            'het_estudiantil': 'Het. Estudiantil',
            'eval_pares':      'Eval. Pares',
            'aula_virtual':    'Aula Virtual / CEV',
            'autoevaluacion':  'Autoevaluación',
            'comp_hetero_est': 'Het. Estudiantil',
            'comp_hetero_dir': 'Het. Directivo',
            'comp_auto':       'Autoevaluación',
            'comp_pares':      'Coevaluación Par',
        }
        _COMP_LABELS_360: dict = {
            ('360', 'vinculacion',  'comp_hetero_est'): 'Het. Estudiantil',
            ('360', 'vinculacion',  'comp_hetero_dir'): 'Het. Dir. Académico',
            ('360', 'investigacion','comp_hetero_dir'): 'Het. Dir. Investigación',
            ('360', 'investigacion','comp_hetero_est'): 'Het. Decano / Coord.',
            ('360', 'investigacion','comp_pares'):      'Coevaluación Par',
            ('360', 'gestion',      'comp_hetero_dir'): 'Coevalúa. Directivo',
            ('360', 'gestion',      'comp_hetero_est'): 'Het. Docentes',
            ('meipa','docencia',    'comp_hetero_est'): 'Het. Estudiantil',
            ('meipa','docencia',    'comp_hetero_dir'): 'Coord. → Docente',
            ('meipa','docencia',    'comp_pares'):      'Eval. Pares',
        }

        q = db.query(Evaluacion).filter(
            Evaluacion.puntaje_100.isnot(None),
            Evaluacion.puntaje_100 > 0,
        )
        if modelo:
            q = q.filter(Evaluacion.modelo == modelo)
        if sistema:
            q = q.filter(Evaluacion.sistema == sistema)
        if periodo:
            _codes = _all_codes_for_sem(str(periodo))
            if len(_codes) == 1:
                q = q.filter(Evaluacion.periodo == _codes[0])
            else:
                q = q.filter(Evaluacion.periodo.in_(_codes))
        elif anio:
            q = q.filter(Evaluacion.anio == anio)

        from collections import defaultdict
        groups: dict = defaultdict(list)
        for rec in q.all():
            key = (rec.cedula or rec.docente_nombre, rec.sistema, rec.modelo)
            groups[key].append(rec)

        result = []
        for (ced, sis, mod), recs in groups.items():
            nombre = next((r.docente_nombre for r in recs if r.docente_nombre and not r.docente_nombre.startswith('CED-')), None) \
                     or next((r.docente_nombre for r in recs if r.docente_nombre), f'CED-{ced}')
            facultad = next((r.facultad for r in recs if r.facultad), '')
            valid_niveles = ('Excelente', 'Bueno', 'Regular', 'Deficiente')
            nivel = next((r.nivel_desempeno for r in recs if r.nivel_desempeno in valid_niveles), 'Sin datos')
            puntaje = round(sum(r.puntaje_100 for r in recs) / len(recs), 1)

            cfg = _COMP_CFG.get((sis, mod), [])
            componentes = []
            for col_key, max_val in cfg:
                vals = [getattr(r, col_key) for r in recs if (getattr(r, col_key) or 0) > 0]
                if not vals:
                    continue
                avg_val = sum(vals) / len(vals)
                pct = round(min(100.0, avg_val / max_val * 100), 1)
                label = _COMP_LABELS_360.get((sis, mod, col_key)) or _COMP_LABELS.get(col_key, col_key)
                componentes.append({'label': label, 'pct': pct})

            componentes.sort(key=lambda x: x['pct'], reverse=True)
            n_ev         = next((r.n_evaluadores for r in recs if r.n_evaluadores and r.n_evaluadores > 0), None)
            funcion_doc  = next((r.funcion_docente for r in recs if r.funcion_docente), None)
            tiempo_serv  = next((r.tiempo_servicio  for r in recs if r.tiempo_servicio),  None)
            result.append({
                'nombre':          nombre,
                'cedula':          ced or '',
                'sistema':         sis or '',
                'modelo':          mod or '',
                'facultad':        facultad,
                'puntaje':         puntaje,
                'nivel':           nivel,
                'componentes':     componentes,
                'n_evaluadores':   n_ev,
                'funcion_docente': funcion_doc,
                'tiempo_servicio': tiempo_serv,
            })

        result.sort(key=lambda x: x['puntaje'], reverse=True)
        return result

    def get_docentes_criticos(self, db: Session, modelo: str = None, anio: int = None,
                               threshold: float = 3.5, sistema: str = None, periodo: str = None):
        q = _base_q(db, modelo, anio, sistema, periodo)
        threshold_100 = threshold / 5 * 100
        criticos = q.with_entities(
            Evaluacion.docente_nombre,
            Evaluacion.facultad,
            func.avg(Evaluacion.puntaje_100).label('puntaje_100'),
        ).group_by(Evaluacion.docente_nombre, Evaluacion.facultad)\
         .having(func.avg(Evaluacion.puntaje_100) < threshold_100)\
         .order_by(func.avg(Evaluacion.puntaje_100).asc()).all()
        return [{'nombre': r[0], 'facultad': r[1], 'puntaje_100': round(r[2], 2),
                 'promedio': round(r[2] / 100 * 5, 2)} for r in criticos]

    def get_tendencias(self, db: Session, modelo: str = None, sistema: str = None):
        q = db.query(Evaluacion)
        if modelo:
            q = q.filter(Evaluacion.modelo == modelo)
        if sistema:
            q = q.filter(Evaluacion.sistema == sistema)

        # Por período (granularidad fina: I-2023, II-2023, I-2024, …)
        por_per = q.with_entities(
            Evaluacion.periodo, Evaluacion.anio, func.avg(Evaluacion.puntaje_100)
        ).filter(
            Evaluacion.anio.isnot(None), Evaluacion.periodo.isnot(None)
        ).group_by(Evaluacion.periodo, Evaluacion.anio)\
         .order_by(Evaluacion.anio, Evaluacion.periodo).all()

        # Por año (agregado, para backward-compat con código existente)
        por_anio = q.with_entities(Evaluacion.anio, func.avg(Evaluacion.puntaje_100))\
            .filter(Evaluacion.anio.isnot(None))\
            .group_by(Evaluacion.anio)\
            .order_by(Evaluacion.anio).all()

        return {
            'por_periodo': [
                {'periodo': t[0], 'anio': t[1],
                 'puntaje_100': round(t[2], 2),
                 'promedio': round(t[2] / 100 * 5, 2)}
                for t in por_per
            ],
            'por_anio': [
                {'anio': t[0], 'puntaje_100': round(t[1], 2),
                 'promedio': round(t[1] / 100 * 5, 2)}
                for t in por_anio
            ],
        }

    def get_variables_kpis(self, db: Session, modelo: str = None, anio: int = None, sistema: str = None, periodo: str = None):
        q = _base_q(db, modelo, anio, sistema, periodo)
        if sistema == 'meipa':
            cfg = MEIPA_MODEL_CONFIG.get(modelo or 'docencia', MEIPA_MODEL_CONFIG['docencia'])
        else:
            cfg = MODEL_CONFIG.get(modelo or 'docencia', MODEL_CONFIG['docencia'])
        results = {}
        for col, peso in cfg['components']:
            col_attr = getattr(Evaluacion, col, None)
            if col_attr is None:
                continue
            avg_val = q.with_entities(func.avg(col_attr)).scalar() or 0
            n_val   = q.with_entities(func.count(Evaluacion.id)).filter(col_attr > 0).scalar() or 0
            results[col] = {'promedio': round(avg_val, 2), 'peso': peso, 'n_docentes': n_val}
        sorted_r = sorted(results.items(), key=lambda x: x[1]['promedio'])
        return {
            'componentes': results,
            'mas_baja': sorted_r[0] if sorted_r else None,
            'mas_alta':  sorted_r[-1] if sorted_r else None,
        }

    def get_demograficos(self, db: Session, modelo: str = None, anio: int = None, sistema: str = None, periodo: str = None):
        q = _base_q(db, modelo, anio, sistema, periodo)
        sexo_raw = q.with_entities(Evaluacion.sexo, func.count(Evaluacion.id)).group_by(Evaluacion.sexo).all()
        _GN = {'mujer':'Mujer','femenino':'Mujer','f':'Mujer','hombre':'Hombre','masculino':'Hombre','m':'Hombre'}
        _sex_merged: dict = {}
        for s, c in sexo_raw:
            key = _GN.get(str(s or '').lower().strip(), str(s or 'No definido').strip())
            _sex_merged[key] = _sex_merged.get(key, 0) + (c or 0)
        sexo_dist = list(_sex_merged.items())
        edades = [e[0] for e in q.with_entities(Evaluacion.edad).all() if e[0]]
        rangos = {
            '20-30': len([e for e in edades if 20 <= e <= 30]),
            '31-45': len([e for e in edades if 31 <= e <= 45]),
            '46-60': len([e for e in edades if 46 <= e <= 60]),
            '61+':   len([e for e in edades if e > 60]),
        }
        carrera_dist = q.with_entities(Evaluacion.carrera, func.count(Evaluacion.id))\
            .filter(Evaluacion.carrera != None).group_by(Evaluacion.carrera).all()
        nivel_dist = q.with_entities(Evaluacion.nivel_desempeno, func.count(Evaluacion.id))\
            .filter(Evaluacion.nivel_desempeno != None).group_by(Evaluacion.nivel_desempeno).all()
        return {
            'sexo':            dict(sexo_dist),
            'edad':            rangos,
            'carrera':         {c if c else 'Sin carrera': n for c, n in carrera_dist},
            'nivel_desempeno': {n if n else 'Sin datos': c for n, c in nivel_dist},
        }


    def get_competencias_preguntas(self) -> dict:
        """
        Lee los archivos eval_detalladas para calcular el ranking de
        competencias y preguntas (mejor / peor puntuadas) por periodo.
        No toca la BD — trabaja directo sobre los Excel del ETL.
        """
        import glob, os, warnings, unicodedata
        import pandas as pd
        warnings.filterwarnings('ignore')

        try:
            from app.services.etl_service import BASE
        except Exception:
            BASE = '/app/data'

        # Recoger todos los archivos detallados disponibles — busca cualquier carpeta eval_det*
        eval_dirs = glob.glob(os.path.join(BASE, 'eval_det*'))
        # incluir subcarpeta posgrado si existe
        posgrado_dir = os.path.join(BASE, 'posgrado')
        if os.path.isdir(posgrado_dir):
            eval_dirs.append(posgrado_dir)
        files = []
        for d in eval_dirs:
            if os.path.isdir(d):
                files += glob.glob(os.path.join(d, '*.xlsx'))

        if not files:
            return {}

        # Primera pasada: leer todos los archivos y separar los que tienen competencia
        # de los que no la tienen (para enriquecerlos después)
        dfs_with    = []   # tienen columna 'competencia'
        dfs_without = []   # no tienen 'competencia' pero tienen pregunta+calificacion

        for fpath in files:
            try:
                df = pd.read_excel(fpath, dtype=str)
                df.columns = [str(c).strip().lower().replace(' ', '_') for c in df.columns]
                base_needed = {'pregunta', 'calificacion', 'periodo_evaluacion'}
                if not base_needed.issubset(set(df.columns)):
                    continue
                extra_cols = [c for c in ['programa', 'carrera', 'modelo', 'cod_instrumento', 'num_pregunta'] if c in df.columns]
                if 'competencia' in df.columns:
                    dfs_with.append(df[list(base_needed) + ['competencia'] + extra_cols])
                else:
                    dfs_without.append(df[list(base_needed) + extra_cols])
            except Exception:
                continue

        if not dfs_with and not dfs_without:
            return {}

        # Construir mapeo (cod_instrumento, num_pregunta) → competencia
        # y (cod_instrumento, pregunta_text) → competencia
        # usando los archivos que ya tienen la columna competencia
        comp_map_num  = {}   # (cod, num) → competencia
        comp_map_text = {}   # (cod, pregunta_lower) → competencia
        if dfs_with:
            ref_df = pd.concat(dfs_with, ignore_index=True)
            for _, r in ref_df[['cod_instrumento','num_pregunta','pregunta','competencia']].dropna(
                    subset=['competencia','pregunta']).iterrows():
                cod  = str(r.get('cod_instrumento', '')).strip()
                nump = str(r.get('num_pregunta',    '')).strip()
                txt  = str(r.get('pregunta',         '')).strip().lower()[:80]
                comp = str(r['competencia']).strip()
                if comp and comp.lower() not in ('no definida', 'nan', ''):
                    if cod and nump:
                        comp_map_num[(cod, nump)] = comp
                    if cod and txt:
                        comp_map_text[(cod, txt)] = comp

        # Segunda pasada: enriquecer archivos sin competencia
        dfs_enriched = []
        for df in dfs_without:
            def _get_comp(row):
                cod  = str(row.get('cod_instrumento', '')).strip()
                nump = str(row.get('num_pregunta',    '')).strip()
                txt  = str(row.get('pregunta',        '')).strip().lower()[:80]
                return (comp_map_num.get((cod, nump))
                        or comp_map_text.get((cod, txt))
                        or None)
            df = df.copy()
            df['competencia'] = df.apply(_get_comp, axis=1)
            df = df.dropna(subset=['competencia'])
            if len(df) > 0:
                dfs_enriched.append(df[['pregunta','calificacion','periodo_evaluacion','competencia']
                                       + [c for c in ['programa','carrera','modelo','cod_instrumento'] if c in df.columns]])

        dfs = dfs_with + dfs_enriched

        if not dfs:
            return {}

        all_df = pd.concat(dfs, ignore_index=True)
        all_df['cal'] = pd.to_numeric(all_df['calificacion'], errors='coerce')
        # escala 1-4; cal=0 = sin respuesta → excluir
        all_df = all_df[all_df['cal'].between(1, 4)]
        # Puntaje sobre 100: 1→25, 2→50, 3→75, 4→100
        all_df['pct'] = (all_df['cal'] / 4) * 100

        def _clean(s):
            if not isinstance(s, str):
                return str(s)
            s = unicodedata.normalize('NFKD', s)
            s = ''.join(c for c in s if not unicodedata.combining(c))
            return s.strip()

        def _norm_name(s: str) -> str:
            """Collapse spaces and title-case for grouping."""
            import re
            s = _clean(s)
            s = re.sub(r'\s+', ' ', s).strip()
            return s.title()

        all_df['competencia']        = all_df['competencia'].apply(_norm_name)
        all_df['pregunta']           = all_df['pregunta'].apply(_clean)
        all_df['periodo_evaluacion'] = all_df['periodo_evaluacion'].apply(_clean)

        periodos = sorted(all_df['periodo_evaluacion'].unique().tolist())

        # ── Competencias ──────────────────────────────────────────────────────
        comp_g = (
            all_df.groupby('competencia')['pct']
            .agg(promedio='mean', n='count')
            .reset_index()
        )
        comp_g['promedio'] = comp_g['promedio'].round(2)
        comp_g = comp_g[comp_g['competencia'] != '']

        # Por periodo
        comp_p = (
            all_df.groupby(['competencia', 'periodo_evaluacion'])['pct']
            .mean().round(2).reset_index()
        )
        comp_p.columns = ['competencia', 'periodo', 'promedio']

        def _enrich_comp(rows):
            result = []
            for _, r in rows.iterrows():
                entry = {
                    'competencia': r['competencia'],
                    'promedio':    round(r['promedio'], 2),
                    'n':           int(r['n']),
                }
                for p in periodos:
                    val = comp_p[
                        (comp_p['competencia'] == r['competencia']) &
                        (comp_p['periodo'] == p)
                    ]['promedio']
                    entry[p] = round(float(val.values[0]), 2) if len(val) else None
                result.append(entry)
            return result

        comp_sorted = comp_g.sort_values('promedio', ascending=False)
        top_comp    = _enrich_comp(comp_sorted.head(6))
        worst_comp  = _enrich_comp(comp_sorted.tail(6).sort_values('promedio'))
        todas_comp  = _enrich_comp(comp_sorted)   # ← todas sin límite

        # ── Por carrera — normalizar con FACULTAD_MAP a las 19 carreras oficiales ──
        por_carrera_data: list = []
        carrera_col = next((c for c in ['programa', 'carrera'] if c in all_df.columns), None)
        if carrera_col:
            try:
                from app.services.etl_service import FACULTAD_MAP
            except Exception:
                FACULTAD_MAP = {}

            CARRERAS_OFICIALES_CP = {
                'Pedagogía Idiomas Nac. Ext.', 'Psicología', 'Derecho',
                'Contabilidad y Auditoría', 'Administración de Empresas',
                'Negocios Internacionales', 'Tecnologías de la Información',
                'Ing. Recursos Naturales Renova', 'Agroindustria',
                'Laboratorio Clínico', 'Enfermería', 'TC Enfermería',
                'Fisioterapia', 'Medicina', 'Educación Básica',
                'Edu. Básica Semi - Quinindé', 'Diseño Gráfico',
                'TG Desarrollo de Software', 'TG Gestión Culinaria',
            }

            def _map_carrera(raw: str) -> str:
                """Mapea nombre raw → carrera oficial usando FACULTAD_MAP."""
                if not raw or not isinstance(raw, str):
                    return ''
                s = raw.strip()
                # Búsqueda exacta primero
                if s in FACULTAD_MAP:
                    return FACULTAD_MAP[s]
                # Búsqueda case-insensitive
                s_lower = s.lower()
                for k, v in FACULTAD_MAP.items():
                    if k.lower() == s_lower:
                        return v
                # Búsqueda parcial: si alguna clave contiene el raw o viceversa
                for k, v in FACULTAD_MAP.items():
                    if s_lower in k.lower() or k.lower() in s_lower:
                        return v
                return ''

            all_df['_carrera'] = all_df[carrera_col].apply(
                lambda x: _map_carrera(str(x)) if isinstance(x, str) else ''
            )
            # Solo las 19 carreras oficiales
            df_oficial = all_df[all_df['_carrera'].isin(CARRERAS_OFICIALES_CP)]
            carreras_uniq = sorted(df_oficial['_carrera'].dropna().unique().tolist())

            for car in carreras_uniq:
                df_car = df_oficial[df_oficial['_carrera'] == car]
                if len(df_car) < 3:
                    continue
                cg = df_car.groupby('competencia')['pct'].agg(promedio='mean', n='count').reset_index()
                cg['promedio'] = cg['promedio'].round(2)
                cg = cg[cg['competencia'] != '']
                cp = df_car.groupby(['competencia','periodo_evaluacion'])['pct'].mean().round(2).reset_index()
                cp.columns = ['competencia','periodo','promedio']
                def _ec(rows, _cp=cp):
                    result = []
                    for _, r in rows.iterrows():
                        entry = {'competencia': r['competencia'], 'promedio': round(r['promedio'],2), 'n': int(r['n'])}
                        for p in periodos:
                            val = _cp[(_cp['competencia']==r['competencia'])&(_cp['periodo']==p)]['promedio']
                            entry[p] = round(float(val.values[0]),2) if len(val) else None
                        result.append(entry)
                    return result
                cg_s = cg.sort_values('promedio', ascending=False)
                por_carrera_data.append({
                    'carrera': car,
                    'n': int(len(df_car)),
                    'promedio': round(float(df_car['pct'].mean()), 2),
                    'competencias': _ec(cg_s),
                })

        # ── Preguntas ─────────────────────────────────────────────────────────
        preg_g = (
            all_df.groupby('pregunta')['pct']
            .agg(promedio='mean', n='count')
            .reset_index()
        )
        preg_g['promedio'] = preg_g['promedio'].round(2)
        preg_g = preg_g[preg_g['pregunta'] != '']

        # Por periodo
        preg_p = (
            all_df.groupby(['pregunta', 'periodo_evaluacion'])['pct']
            .mean().round(2).reset_index()
        )
        preg_p.columns = ['pregunta', 'periodo', 'promedio']

        def _enrich_preg(rows):
            result = []
            for _, r in rows.iterrows():
                entry = {
                    'pregunta': r['pregunta'],
                    'promedio': round(r['promedio'], 2),
                    'n':        int(r['n']),
                }
                for p in periodos:
                    val = preg_p[
                        (preg_p['pregunta'] == r['pregunta']) &
                        (preg_p['periodo'] == p)
                    ]['promedio']
                    entry[p] = round(float(val.values[0]), 2) if len(val) else None
                result.append(entry)
            return result

        preg_sorted = preg_g.sort_values('promedio', ascending=False)
        top_preg    = _enrich_preg(preg_sorted.head(6))
        worst_preg  = _enrich_preg(preg_sorted.tail(6).sort_values('promedio'))
        todas_preg  = _enrich_preg(preg_sorted)   # ← todas sin límite

        return {
            'periodos':            periodos,
            'competencias_top':    top_comp,
            'competencias_peor':   worst_comp,
            'todas_competencias':  todas_comp,
            'preguntas_top':       top_preg,
            'preguntas_peor':      worst_preg,
            'todas_preguntas':     todas_preg,
            'por_carrera':         por_carrera_data,
        }


    def clear_cache(self):
        _kpi_cache.clear()

    # ── Desempeño por variables demográficas ──────────────────────────────────
    def get_desempeno_por_variables(
        self, db: Session,
        anio: int = None, sistema: str = None, modelo: str = None
    ) -> dict:
        """
        Agrupa el puntaje_100 por tiempo_servicio, sexo, nivel_estudio,
        antigüedad y devuelve promedios, mejores docentes TC/TP,
        top evaluados y comparativa TC vs TP.
        """
        from collections import defaultdict

        q = db.query(Evaluacion).filter(
            Evaluacion.puntaje_100.isnot(None),
            Evaluacion.puntaje_100 > 0,
        )
        if anio:    q = q.filter(Evaluacion.anio    == anio)
        if sistema: q = q.filter(Evaluacion.sistema == sistema)
        if modelo:  q = q.filter(Evaluacion.modelo  == modelo)

        recs = q.all()

        def _group(key_fn):
            groups: dict = defaultdict(list)
            for r in recs:
                k = key_fn(r)
                if k and str(k).strip():
                    groups[str(k).strip()].append(r.puntaje_100)
            return sorted(
                [{'categoria': k, 'promedio': round(sum(v)/len(v), 1), 'n': len(v)}
                 for k, v in groups.items()],
                key=lambda x: x['promedio'], reverse=True
            )

        # ── Agrupación por antigüedad ─────────────────────────────────────
        def _antig_label(anos) -> str:
            if anos is None:
                return ''
            try:
                a = float(anos)
            except Exception:
                return ''
            if a < 1:   return '< 1 año'
            if a <= 5:  return '1-5 años'
            if a <= 10: return '6-10 años'
            if a <= 20: return '11-20 años'
            return '21+ años'

        ANTIG_ORDER = ['< 1 año', '1-5 años', '6-10 años', '11-20 años', '21+ años']
        antig_groups: dict = defaultdict(list)
        for r in recs:
            k = _antig_label(r.antiguedad_anos)
            if k:
                antig_groups[k].append(r.puntaje_100)
        por_antiguedad = [
            {'categoria': k, 'promedio': round(sum(v)/len(v), 1), 'n': len(v)}
            for k, v in sorted(antig_groups.items(), key=lambda x: ANTIG_ORDER.index(x[0]) if x[0] in ANTIG_ORDER else 99)
        ]

        # ── Info por cédula para TC/TP y evaluadores ─────────────────────
        ced_info: dict = defaultdict(lambda: {
            'puntajes': [], 'nombre': '', 'ts': '', 'facultad': '',
            'n_evals': [], 'periodos': set(),
        })
        for r in recs:
            k = r.cedula or r.docente_nombre or ''
            ced_info[k]['puntajes'].append(r.puntaje_100)
            if r.docente_nombre and not str(r.docente_nombre).startswith('CED-'):
                ced_info[k]['nombre'] = r.docente_nombre
            if r.tiempo_servicio:
                ced_info[k]['ts'] = r.tiempo_servicio
            if r.facultad:
                ced_info[k]['facultad'] = r.facultad
            if r.n_evaluadores and r.n_evaluadores > 0:
                ced_info[k]['n_evals'].append(r.n_evaluadores)
            if r.periodo:
                ced_info[k]['periodos'].add(r.periodo)

        # ── Mejor TC / TP + TC vs TP summary ─────────────────────────────
        mejor_tc = mejor_tp = None
        tc_puntajes: list = []
        tp_puntajes: list = []

        for ced, info in ced_info.items():
            if not info['puntajes']:
                continue
            avg = round(sum(info['puntajes']) / len(info['puntajes']), 1)
            ts  = (info.get('ts') or '').lower()
            n_ev_avg = round(sum(info['n_evals']) / len(info['n_evals'])) if info['n_evals'] else None
            entry = {
                'nombre':      info['nombre'] or ced,
                'cedula':      ced,
                'facultad':    info['facultad'],
                'puntaje':     avg,
                'n_evaluadores': n_ev_avg,
                'periodos':    len(info['periodos']),
            }
            if 'completo' in ts:
                tc_puntajes.append(avg)
                if not mejor_tc or avg > mejor_tc['puntaje']:
                    mejor_tc = entry
            elif 'parcial' in ts or 'medio' in ts:
                tp_puntajes.append(avg)
                if not mejor_tp or avg > mejor_tp['puntaje']:
                    mejor_tp = entry

        tc_vs_tp = {
            'tc': {
                'promedio': round(sum(tc_puntajes)/len(tc_puntajes), 1) if tc_puntajes else None,
                'n': len(tc_puntajes),
                'label': 'Tiempo Completo',
            },
            'tp': {
                'promedio': round(sum(tp_puntajes)/len(tp_puntajes), 1) if tp_puntajes else None,
                'n': len(tp_puntajes),
                'label': 'Tiempo Parcial / Medio',
            },
        }

        # ── Top 10 docentes por cantidad de evaluadores ───────────────────
        top_evaluados = []
        for ced, info in ced_info.items():
            if not info['n_evals']:
                continue
            top_evaluados.append({
                'nombre':        info['nombre'] or ced,
                'facultad':      info['facultad'],
                'n_evaluadores': sum(info['n_evals']),
                'puntaje':       round(sum(info['puntajes']) / len(info['puntajes']), 1),
                'ts':            info.get('ts', ''),
            })
        top_evaluados = sorted(top_evaluados, key=lambda x: x['n_evaluadores'], reverse=True)[:10]

        # ── Promedio general de evaluadores ──────────────────────────────
        all_n_evals = [r.n_evaluadores for r in recs if r.n_evaluadores and r.n_evaluadores > 0]
        n_evaluadores_promedio = round(sum(all_n_evals) / len(all_n_evals)) if all_n_evals else None

        return {
            'tiempo_servicio':      _group(lambda r: r.tiempo_servicio),
            'sexo':                 _group(lambda r: r.sexo),
            'nivel_estudio':        _group(lambda r: r.nivel_estudio),
            'antiguedad':           por_antiguedad,
            'mejor_tc':             mejor_tc,
            'mejor_tp':             mejor_tp,
            'tc_vs_tp':             tc_vs_tp,
            'top_evaluados':        top_evaluados,
            'n_evaluadores_promedio': n_evaluadores_promedio,
        }

    # ── get_todos_docentes actualizado con funcion_docente + tiempo_servicio ──
    # (ya existe arriba — solo agregamos campos al resultado)


    def get_competencias_por_carrera(
        self,
        db: Session,
        anio: int = None,
        sistema: str = None,
        modelo: str = None,
        periodo: str = None,
    ):
        """Avg of each component column grouped by facultad (normalized), returns best/worst per carrera."""
        # Solo estas 19 carreras oficiales PUCESE
        CARRERAS_OFICIALES = {
            'Pedagogía Idiomas Nac. Ext.',
            'Psicología',
            'Derecho',
            'Agroindustria',
            'Negocios Internacionales',
            'Contabilidad y Auditoría',
            'Laboratorio Clínico',
            'Administración de Empresas',
            'TC Enfermería',
            'Edu. Básica Semi - Quinindé',
            'Fisioterapia',
            'Enfermería',
            'Ing. Recursos Naturales Renova',
            'Tecnologías de la Información',
            'Educación Básica',
            'Diseño Gráfico',
            'TG Gestión Culinaria',
            'Medicina',
            'TG Desarrollo de Software',
        }
        COMP_LABELS = {
            'het_estudiantil':  'Heteroevaluación Estudiantil',
            'autoevaluacion':   'Autoevaluación',
            'eval_pares':       'Evaluación de Pares',
            'comp_hetero_dir':  'Coevaluación Directiva',
            'aula_virtual':     'Entorno Virtual (CEV)',
            'comp_hetero_est':  'Heteroevaluación Estudiantil (MEIPA)',
            'comp_auto':        'Autoevaluación (MEIPA)',
            'comp_pares':       'Eval. Pares (MEIPA)',
        }
        COMP_COLS = list(COMP_LABELS.keys())

        # Import FACULTAD_MAP to normalize raw facultad → official carrera name
        try:
            from app.services.etl_service import FACULTAD_MAP
        except Exception:
            FACULTAD_MAP = {}

        def _normalize_fac(raw: str) -> str:
            """Map raw facultad → official carrera name using FACULTAD_MAP."""
            if not raw:
                return ''
            raw_upper = raw.strip().upper()
            # Try exact match first
            for k, v in FACULTAD_MAP.items():
                if raw_upper == k.upper():
                    return v
            # Try prefix match (longest first)
            for k in sorted(FACULTAD_MAP.keys(), key=len, reverse=True):
                if raw_upper.startswith(k.upper()):
                    return FACULTAD_MAP[k]
            return raw.strip()  # fallback: keep as-is

        # Canonical period codes → display labels
        PERIOD_CODES = ['202301', '202302', '202401', '202402', '202501', '202502']
        PERIOD_LABELS = {
            '202301': 'I-2023', '202302': 'II-2023',
            '202401': 'I-2024', '202402': 'II-2024',
            '202501': 'I-2025', '202502': 'II-2025',
        }

        def _periodo_canonical(raw: str) -> str:
            """Map any raw period code → canonical 6-digit code."""
            if not raw:
                return ''
            raw = str(raw).strip()
            if len(raw) == 6 and raw.isdigit():
                suf = int(raw[4:])
                year = raw[:4]
                if suf == 0 or suf == 1 or (10 <= suf <= 20) or (70 <= suf <= 73):
                    return f'{year}01'
                return f'{year}02'
            if '-' in raw:
                parts = raw.split('-')
                year = parts[0] if parts[0].isdigit() else parts[1]
                sem  = parts[1] if parts[0].isdigit() else parts[0]
                if sem == 'I':  return f'{year}01'
                if sem == 'II': return f'{year}02'
            return raw

        q = _base_q(db, modelo=modelo, anio=anio, sistema=sistema, periodo=periodo)
        recs = q.filter(Evaluacion.facultad != None, Evaluacion.facultad != '').all()

        # Accumulate component values per (carrera, periodo)
        # buckets[fac][per_code][col] = [vals]
        from collections import defaultdict
        buckets: dict = {}
        for r in recs:
            raw_fac = r.facultad or ''
            fac = _normalize_fac(raw_fac)
            if not fac:
                continue
            if fac not in CARRERAS_OFICIALES:
                continue
            per = _periodo_canonical(r.periodo or '')
            if fac not in buckets:
                buckets[fac] = {'_total': {col: [] for col in COMP_COLS}, '_n': 0}
            buckets[fac]['_n'] += 1
            if per and per in PERIOD_CODES:
                if per not in buckets[fac]:
                    buckets[fac][per] = {col: [] for col in COMP_COLS}
                for col in COMP_COLS:
                    val = getattr(r, col, None)
                    if val is not None and val > 0:
                        buckets[fac][per][col].append(float(val))
            for col in COMP_COLS:
                val = getattr(r, col, None)
                if val is not None and val > 0:
                    buckets[fac]['_total'][col].append(float(val))

        def _avgs(data_dict):
            return {col: round(sum(v)/len(v), 2) for col in COMP_COLS
                    if (v := data_dict.get(col, [])) and len(v) > 0}

        result = []
        for fac, data in sorted(buckets.items()):
            avgs = _avgs(data['_total'])
            if not avgs:
                continue

            best_col  = max(avgs, key=lambda c: avgs[c])
            worst_col = min(avgs, key=lambda c: avgs[c])

            # Per-period promedio general (avg of all active components)
            por_periodo = {}
            for pcode in PERIOD_CODES:
                if pcode in data:
                    pavgs = _avgs(data[pcode])
                    if pavgs:
                        por_periodo[pcode] = round(sum(pavgs.values()) / len(pavgs), 2)

            result.append({
                'carrera':            fac,
                'n':                  data['_n'],
                'promedio':           round(sum(avgs.values()) / len(avgs), 2),
                'mejor_componente':   COMP_LABELS[best_col],
                'mejor_val':          round(avgs[best_col], 2),
                'peor_componente':    COMP_LABELS[worst_col],
                'peor_val':           round(avgs[worst_col], 2),
                'mejor_comp':         COMP_LABELS[best_col],
                'mejor_puntaje':      round(avgs[best_col], 2),
                'peor_comp':          COMP_LABELS[worst_col],
                'peor_puntaje':       round(avgs[worst_col], 2),
                'componentes':        {COMP_LABELS[c]: v for c, v in avgs.items()},
                'por_periodo':        por_periodo,  # {'202301': 82.5, '202402': 79.3, ...}
                'periodos_labels':    PERIOD_LABELS,
            })

        result.sort(key=lambda x: x['carrera'])
        return result

    def get_prediccion_tendencias(self, db: Session, anio: int = None) -> dict:
        """
        Predicción híbrida: calcula la tendencia (regresión lineal) y proyecta
        el siguiente período para cada carrera, usando los puntajes por período.
        Los NÚMEROS son deterministas (Python) — la IA solo añade narrativa aparte.
        """
        PERIOD_CODES = ['202301', '202302', '202401', '202402', '202501', '202502']
        PERIOD_LABELS = {
            '202301': 'I-2023', '202302': 'II-2023',
            '202401': 'I-2024', '202402': 'II-2024',
            '202501': 'I-2025', '202502': 'II-2025',
        }
        NEXT_CODE  = '202601'
        NEXT_LABEL = 'I-2026 (proyección)'

        # 19 carreras oficiales PUCESE (mismo whitelist que el resto del dashboard)
        CARRERAS_OFICIALES = {
            'Pedagogía Idiomas Nac. Ext.', 'Psicología', 'Derecho',
            'Contabilidad y Auditoría', 'Administración de Empresas',
            'Negocios Internacionales', 'Tecnologías de la Información',
            'Ing. Recursos Naturales Renova', 'Agroindustria',
            'Laboratorio Clínico', 'Enfermería', 'TC Enfermería',
            'Fisioterapia', 'Medicina', 'Educación Básica',
            'Edu. Básica Semi - Quinindé', 'Diseño Gráfico',
            'TG Desarrollo de Software', 'TG Gestión Culinaria',
        }

        def _canon_code(periodo) -> str:
            """Normaliza el código crudo al período calendario (mismo criterio
            que la tabla 'Análisis Temporal' del dashboard)."""
            s = str(periodo).strip()
            if len(s) < 5:
                return None
            y = s[:4]
            try:
                suf = int(s[4:])
            except ValueError:
                return None
            # Semestre I: 0,1 (grado) · 10-20 (tec) · 70-73 (posgrado)
            if suf in (0, 1) or (10 <= suf <= 20) or (70 <= suf <= 73):
                return f'{y}01'
            # Semestre II: 2 (grado) · 21-30 (tec) · 56,66 (MECDI) · 74-79 (posgrado)
            return f'{y}02'

        # ── Puntaje REAL (puntaje_100) por carrera × período calendario ──────
        # Misma fuente que 'facultad_por_periodo' del comparativo.
        rows = (
            db.query(
                Evaluacion.periodo,
                Evaluacion.facultad,
                func.avg(Evaluacion.puntaje_100),
            )
            .filter(
                Evaluacion.periodo.isnot(None),
                Evaluacion.facultad.isnot(None),
                Evaluacion.facultad != '',
                Evaluacion.puntaje_100.isnot(None),
            )
            .group_by(Evaluacion.periodo, Evaluacion.facultad)
            .all()
        )
        # acumular avgs por (carrera, código calendario) y promediar sin ponderar
        acc: dict = {}
        for periodo, facultad, prom in rows:
            if facultad not in CARRERAS_OFICIALES or prom is None:
                continue
            code = _canon_code(periodo)
            if not code or code not in PERIOD_CODES:
                continue
            acc.setdefault(facultad, {}).setdefault(code, []).append(float(prom))

        carreras = []
        for fac, codes in acc.items():
            por_periodo = {code: round(sum(v) / len(v), 2) for code, v in codes.items()}
            if not por_periodo:
                continue
            prom_global = round(sum(por_periodo.values()) / len(por_periodo), 2)
            carreras.append({'carrera': fac, 'n': 0, 'promedio': prom_global,
                             'por_periodo': por_periodo})

        def _linreg(xs, ys):
            """Regresión lineal simple. Devuelve (pendiente, intercepto)."""
            n = len(xs)
            if n < 2:
                return 0.0, (ys[0] if ys else 0.0)
            mx = sum(xs) / n
            my = sum(ys) / n
            denom = sum((x - mx) ** 2 for x in xs)
            if denom == 0:
                return 0.0, my
            slope = sum((xs[i] - mx) * (ys[i] - my) for i in range(n)) / denom
            intercept = my - slope * mx
            return slope, intercept

        predicciones = []
        for c in carreras:
            pp = c.get('por_periodo', {}) or {}
            # puntos ordenados por período disponible
            pts = [(i, pp[code]) for i, code in enumerate(PERIOD_CODES)
                   if code in pp and pp[code] is not None]
            if len(pts) < 2:
                continue  # no se puede proyectar con menos de 2 puntos
            xs = [p[0] for p in pts]
            ys = [p[1] for p in pts]
            slope, intercept = _linreg(xs, ys)

            next_idx = len(PERIOD_CODES)  # índice del período futuro
            proyeccion = round(intercept + slope * next_idx, 2)
            proyeccion = max(0.0, min(100.0, proyeccion))  # clamp 0-100

            ultimo = ys[-1]
            cambio_proy = round(proyeccion - ultimo, 2)

            # clasificación según pendiente por período
            if slope <= -1.5:
                clasificacion = 'bajando'
            elif slope >= 1.5:
                clasificacion = 'subiendo'
            else:
                clasificacion = 'estable'

            # nivel de riesgo: bajando + proyección baja
            if clasificacion == 'bajando' and proyeccion < 70:
                riesgo = 'alto'
            elif clasificacion == 'bajando':
                riesgo = 'medio'
            else:
                riesgo = 'bajo'

            serie = [{'codigo': code, 'label': PERIOD_LABELS[code], 'valor': pp[code]}
                     for code in PERIOD_CODES if code in pp and pp[code] is not None]

            predicciones.append({
                'carrera':       c['carrera'],
                'n':             c.get('n', 0),
                'promedio':      c.get('promedio'),
                'serie':         serie,
                'ultimo_valor':  ultimo,
                'pendiente':     round(slope, 2),
                'proyeccion':    proyeccion,
                'proyeccion_codigo': NEXT_CODE,
                'proyeccion_label':  NEXT_LABEL,
                'cambio_proyectado': cambio_proy,
                'clasificacion': clasificacion,
                'riesgo':        riesgo,
            })

        # ordenar: mayor riesgo / más bajada primero
        predicciones.sort(key=lambda x: (x['pendiente']))

        en_riesgo = [p for p in predicciones if p['clasificacion'] == 'bajando']
        en_mejora = [p for p in predicciones if p['clasificacion'] == 'subiendo']
        estables  = [p for p in predicciones if p['clasificacion'] == 'estable']

        return {
            'predicciones':   predicciones,
            'resumen': {
                'total':       len(predicciones),
                'en_riesgo':   len(en_riesgo),
                'en_mejora':   len(en_mejora),
                'estables':    len(estables),
            },
            'periodos_labels': PERIOD_LABELS,
        }


    # ══════════════════════════════════════════════════════════════════════
    # MÓDULO 1 — CARACTERIZACIÓN DEL CUERPO DOCENTE
    # Devuelve CONTEOS (no promedios): cuántos docentes por período, género,
    # carrera, edad y antigüedad.
    # ══════════════════════════════════════════════════════════════════════
    def get_caracterizacion(
        self,
        db: Session,
        sistema: str = None,
        anio: int = None,
        periodo: str = None,
        modelo: str = None,
    ) -> dict:
        q = _base_q(db, modelo, anio, sistema, periodo)

        _GENERO_NORM = {
            'mujer': 'Mujer', 'femenino': 'Mujer', 'f': 'Mujer',
            'hombre': 'Hombre', 'masculino': 'Hombre', 'm': 'Hombre',
        }
        AGE_BRACKETS   = ['< 30 años', '31-45 años', '46-60 años', '61+ años']
        ANTIG_BRACKETS = ['0-3 años', '4-10 años', '11-20 años', '20+ años']

        total_evaluaciones = q.count()
        total_docentes = (
            q.with_entities(func.count(func.distinct(Evaluacion.cedula))).scalar()
            or q.with_entities(func.count(func.distinct(Evaluacion.docente_nombre))).scalar()
            or 0
        )

        # Por período raw + desglose género
        per_rows = (
            q.with_entities(Evaluacion.periodo, Evaluacion.sexo, func.count(Evaluacion.id))
            .filter(Evaluacion.periodo.isnot(None))
            .group_by(Evaluacion.periodo, Evaluacion.sexo)
            .order_by(Evaluacion.periodo).all()
        )
        periodos_dict: dict = {}
        for p, sexo, cnt in per_rows:
            if p not in periodos_dict:
                periodos_dict[p] = {'periodo': p, 'total': 0, 'Hombre': 0, 'Mujer': 0}
            gkey = _GENERO_NORM.get(str(sexo or '').lower().strip(), 'Otro') if sexo else 'Otro'
            periodos_dict[p]['total'] += cnt
            if gkey in ('Hombre', 'Mujer'):
                periodos_dict[p][gkey] = periodos_dict[p].get(gkey, 0) + cnt

        # Consolidar al semestre canónico YYYY-I / YYYY-II
        def _sem_key(code: str):
            if not code or len(code) < 4:
                return (code, '')
            if '-' in code:
                parts = code.split('-')
                yr = parts[0] if parts[0].isdigit() else parts[1]
                sem = next((p for p in parts if p in ('I', 'II')), '')
                return (yr, sem)
            if len(code) == 6 and code.isdigit():
                yr = code[:4]
                suf = int(code[4:])
                sem = 'I' if (suf == 0 or suf == 1 or (10 <= suf <= 20) or (70 <= suf <= 73)) else 'II'
                return (yr, sem)
            return (code, '')

        sem_dict: dict = {}
        for row in sorted(periodos_dict.values(), key=lambda x: x['periodo']):
            yr, sem = _sem_key(row['periodo'])
            if not sem:
                continue
            key = f'{yr}-{sem}'
            if key not in sem_dict:
                sem_dict[key] = {'periodo': key, 'label': f'{sem} Período {yr}', 'total': 0, 'Hombre': 0, 'Mujer': 0}
            sem_dict[key]['total']  += row.get('total', 0)
            sem_dict[key]['Hombre'] += row.get('Hombre', 0)
            sem_dict[key]['Mujer']  += row.get('Mujer', 0)
        por_periodo_sem = sorted(sem_dict.values(), key=lambda x: x['periodo'])

        # Por género total
        genero_rows = (
            q.with_entities(Evaluacion.sexo, func.count(Evaluacion.id))
            .filter(Evaluacion.sexo.isnot(None), Evaluacion.sexo != '')
            .group_by(Evaluacion.sexo).all()
        )
        _mg: dict = {}
        for g, cnt in genero_rows:
            key = _GENERO_NORM.get(str(g).lower().strip(), str(g).strip())
            _mg[key] = _mg.get(key, 0) + cnt
        por_genero = _mg

        # Por carrera — usa Evaluacion.facultad + FACULTAD_MAP (igual que el ranking)
        CARRERAS_OFICIALES_C = {
            'Pedagogía Idiomas Nac. Ext.',
            'Psicología',
            'Derecho',
            'Agroindustria',
            'Negocios Internacionales',
            'Contabilidad y Auditoría',
            'Laboratorio Clínico',
            'Administración de Empresas',
            'TC Enfermería',
            'Edu. Básica Semi - Quinindé',
            'Fisioterapia',
            'Enfermería',
            'Ing. Recursos Naturales Renova',
            'Tecnologías de la Información',
            'Educación Básica',
            'Diseño Gráfico',
            'TG Gestión Culinaria',
            'Medicina',
            'TG Desarrollo de Software',
        }
        try:
            from app.services.etl_service import FACULTAD_MAP as _FM
        except Exception:
            _FM = {}
        _FM_SORTED = sorted(_FM.keys(), key=len, reverse=True)

        def _norm_carrera(raw: str) -> str:
            if not raw:
                return ''
            ru = raw.strip().upper()
            for k in _FM_SORTED:
                if ru == k.upper() or ru.startswith(k.upper()):
                    return _FM[k]
            return raw.strip()

        fac_rows = (
            q.with_entities(Evaluacion.facultad, Evaluacion.sexo, func.count(Evaluacion.id))
            .filter(Evaluacion.facultad.isnot(None), Evaluacion.facultad != '')
            .group_by(Evaluacion.facultad, Evaluacion.sexo).all()
        )
        carreras_dict: dict = {}
        for raw_fac, sexo, cnt in fac_rows:
            carrera = _norm_carrera(raw_fac)
            if not carrera or carrera not in CARRERAS_OFICIALES_C:
                continue
            if carrera not in carreras_dict:
                carreras_dict[carrera] = {'carrera': carrera, 'total': 0, 'Hombre': 0, 'Mujer': 0}
            gkey = _GENERO_NORM.get(str(sexo or '').lower().strip(), 'Otro') if sexo else 'Otro'
            carreras_dict[carrera]['total'] += cnt
            if gkey in ('Hombre', 'Mujer'):
                carreras_dict[carrera][gkey] = carreras_dict[carrera].get(gkey, 0) + cnt
        por_carrera = sorted(carreras_dict.values(), key=lambda x: x['total'], reverse=True)

        # Por rango de edad (conteos)
        edad_rows = (
            q.with_entities(Evaluacion.edad, Evaluacion.sexo)
            .filter(Evaluacion.edad.isnot(None)).all()
        )
        edad_dict = {b: {'rango': b, 'total': 0, 'Hombre': 0, 'Mujer': 0} for b in AGE_BRACKETS}
        for edad, sexo in edad_rows:
            if edad is None: continue
            if edad < 30:    bkt = '< 30 años'
            elif edad <= 45: bkt = '31-45 años'
            elif edad <= 60: bkt = '46-60 años'
            else:            bkt = '61+ años'
            gkey = _GENERO_NORM.get(str(sexo or '').lower().strip(), 'Otro') if sexo else 'Otro'
            edad_dict[bkt]['total'] += 1
            if gkey in ('Hombre', 'Mujer'):
                edad_dict[bkt][gkey] += 1
        por_edad = [v for v in edad_dict.values() if v['total'] > 0]

        # Por antigüedad (conteos)
        ant_rows = (
            q.with_entities(Evaluacion.antiguedad_anos, Evaluacion.sexo)
            .filter(Evaluacion.antiguedad_anos.isnot(None)).all()
        )
        ant_dict = {b: {'rango': b, 'total': 0, 'Hombre': 0, 'Mujer': 0} for b in ANTIG_BRACKETS}
        for ant, sexo in ant_rows:
            if ant is None: continue
            if ant <= 3:    bkt = '0-3 años'
            elif ant <= 10: bkt = '4-10 años'
            elif ant <= 20: bkt = '11-20 años'
            else:           bkt = '20+ años'
            gkey = _GENERO_NORM.get(str(sexo or '').lower().strip(), 'Otro') if sexo else 'Otro'
            ant_dict[bkt]['total'] += 1
            if gkey in ('Hombre', 'Mujer'):
                ant_dict[bkt][gkey] += 1
        por_antiguedad = [v for v in ant_dict.values() if v['total'] > 0]

        # Por facultad (conteos)
        fac_rows = (
            q.with_entities(Evaluacion.facultad, func.count(Evaluacion.id))
            .filter(Evaluacion.facultad.isnot(None), Evaluacion.facultad != '')
            .group_by(Evaluacion.facultad)
            .order_by(func.count(Evaluacion.id).desc()).all()
        )
        por_facultad = [{'facultad': f, 'total': cnt} for f, cnt in fac_rows]

        return {
            'total_evaluaciones': total_evaluaciones,
            'total_docentes':     total_docentes,
            'por_periodo':        por_periodo_sem,
            'por_genero':         por_genero,
            'por_carrera':        por_carrera,
            'por_edad':           por_edad,
            'por_antiguedad':     por_antiguedad,
            'por_facultad':       por_facultad,
        }

    # ══════════════════════════════════════════════════════════════════════
    # MÓDULO 2 — REPORTE DE COMPETENCIAS
    # ══════════════════════════════════════════════════════════════════════
    def get_reporte_competencias(
        self,
        db: Session,
        sistema: str = None,
        anio: int = None,
        periodo: str = None,
        modelo: str = None,
    ) -> dict:
        EMPTY = {'por_modelo': [], 'por_carrera': [], 'tend_competencias': []}
        q = _base_q(db, modelo, anio, sistema, periodo)
        if q.count() == 0:
            return EMPTY

        # Todos los componentes posibles en ambos sistemas
        ALL_COMPS = [
            ('het_estudiantil',  'Heteroeval. Estudiantil',  50),
            ('eval_pares',       'Eval. de Pares',            20),
            ('aula_virtual',     'Entorno Virtual / TIC',     10),
            ('autoevaluacion',   'Autoevaluación',            20),
            ('comp_hetero_est',  'Heteroeval. Estudiantil',   40),
            ('comp_auto',        'Autoevaluación',            20),
            ('comp_hetero_dir',  'Heteroeval. Directivo',     20),
            ('comp_pares',       'Eval. de Pares',            20),
        ]
        COMP_LABELS = {c[0]: c[1] for c in ALL_COMPS}

        def _comp_avgs_for(qry):
            result = []
            for col_key, label, peso in ALL_COMPS:
                col_attr = getattr(Evaluacion, col_key, None)
                if col_attr is None:
                    continue
                avg_val = qry.with_entities(func.avg(col_attr)).scalar()
                if not avg_val or float(avg_val) <= 0:
                    continue
                n_v = qry.with_entities(
                    func.count(Evaluacion.id)
                ).filter(col_attr.isnot(None)).scalar() or 0
                result.append({
                    'key': col_key, 'label': label, 'peso': peso,
                    'promedio': round(float(avg_val), 2), 'n': n_v,
                })
            return result

        MODEL_LABELS = {
            'docencia': 'Docencia', 'posgrado': 'Posgrado', 'abp': 'Salud / ABP',
            'tecnologado': 'Tecnologado', 'vinculacion': 'Vinculación',
            'gestion': 'Gestión', 'investigacion': 'Investigación',
            'administrativo': 'Administrativo', 'servicios': 'Servicios',
        }

        # ── Por modelo: detecta modelos con datos reales ──────────────────
        real_models = [
            r[0] for r in
            q.with_entities(func.distinct(Evaluacion.modelo))
             .filter(Evaluacion.modelo.isnot(None), Evaluacion.modelo != '')
             .all()
            if r[0]
        ]
        resultados_modelos = []
        for mod in sorted(real_models):
            qm = q.filter(Evaluacion.modelo == mod)
            n_mod = qm.count()
            if n_mod == 0:
                continue
            comps = _comp_avgs_for(qm)
            if not comps:
                continue
            resultados_modelos.append({
                'modelo':      mod,
                'label':       MODEL_LABELS.get(mod, mod.title()),
                'n':           n_mod,
                'componentes': comps,
            })

        # Fallback: una sola entrada global si no detectamos modelos con datos
        if not resultados_modelos:
            comps_global = _comp_avgs_for(q)
            if comps_global:
                sis_lbl = ('MEIPA 2023-2024' if sistema == 'meipa'
                           else 'MECDI 2024-2025' if sistema == '360'
                           else 'Vista Global')
                resultados_modelos = [{
                    'modelo': 'global', 'label': sis_lbl,
                    'n': q.count(), 'componentes': comps_global,
                }]

        # ── Por carrera: mejor y peor componente ─────────────────────────
        _CARR_OFIC = {
            'Pedagogía Idiomas Nac. Ext.', 'Psicología', 'Derecho',
            'Agroindustria', 'Negocios Internacionales', 'Contabilidad y Auditoría',
            'Laboratorio Clínico', 'Administración de Empresas', 'TC Enfermería',
            'Edu. Básica Semi - Quinindé', 'Fisioterapia', 'Enfermería',
            'Ing. Recursos Naturales Renova', 'Tecnologías de la Información',
            'Educación Básica', 'Diseño Gráfico', 'TG Gestión Culinaria',
            'Medicina', 'TG Desarrollo de Software',
        }
        try:
            from app.services.etl_service import FACULTAD_MAP as _FM2
        except Exception:
            _FM2 = {}
        _FM2S = sorted(_FM2.keys(), key=len, reverse=True)

        def _nc2(raw: str) -> str:
            if not raw: return ''
            ru = raw.strip().upper()
            for k in _FM2S:
                if ru == k.upper() or ru.startswith(k.upper()):
                    return _FM2[k]
            return raw.strip()

        cc_rows = (
            q.with_entities(
                Evaluacion.facultad,
                func.avg(Evaluacion.het_estudiantil),
                func.avg(Evaluacion.eval_pares),
                func.avg(Evaluacion.aula_virtual),
                func.avg(Evaluacion.autoevaluacion),
                func.avg(Evaluacion.comp_auto),
                func.avg(Evaluacion.comp_pares),
                func.avg(Evaluacion.comp_hetero_dir),
                func.avg(Evaluacion.comp_hetero_est),
                func.avg(Evaluacion.puntaje_100),
                func.count(Evaluacion.id),
            )
            .filter(Evaluacion.facultad.isnot(None), Evaluacion.facultad != '')
            .group_by(Evaluacion.facultad)
            .order_by(func.avg(Evaluacion.puntaje_100).desc())
            .all()
        )
        # Merge rows with same normalized carrera (weighted average)
        bkts: dict = {}
        for row in cc_rows:
            carrera = _nc2(row[0])
            if not carrera or carrera not in _CARR_OFIC:
                continue
            vals = {
                'het_estudiantil': row[1], 'eval_pares': row[2],
                'aula_virtual':    row[3], 'autoevaluacion': row[4],
                'comp_auto':       row[5], 'comp_pares':     row[6],
                'comp_hetero_dir': row[7], 'comp_hetero_est': row[8],
            }
            prom = float(row[9] or 0)
            n    = int(row[10] or 0)
            if carrera not in bkts:
                bkts[carrera] = {'ps': 0, 'ns': 0, 'cs': {}, 'cc': {}}
            bkts[carrera]['ps'] += prom * n
            bkts[carrera]['ns'] += n
            for k, v in vals.items():
                if v is not None and float(v) > 0:
                    bkts[carrera]['cs'][k] = bkts[carrera]['cs'].get(k, 0) + float(v) * n
                    bkts[carrera]['cc'][k] = bkts[carrera]['cc'].get(k, 0) + n

        por_carrera = []
        for carrera, b in bkts.items():
            nt = b['ns']
            if nt == 0:
                continue
            prom_g = round(b['ps'] / nt, 2)
            cv = {k: round(b['cs'][k] / b['cc'][k], 2) for k in b['cs'] if b['cc'][k] > 0}
            if not cv:
                continue
            mj = max(cv, key=lambda k: cv[k])
            pj = min(cv, key=lambda k: cv[k])
            por_carrera.append({
                'carrera': carrera, 'promedio': prom_g, 'n': nt,
                'componentes': cv,
                'mejor_componente': COMP_LABELS.get(mj, mj),
                'mejor_valor':      cv[mj],
                'peor_componente':  COMP_LABELS.get(pj, pj),
                'peor_valor':       cv[pj],
            })
        por_carrera.sort(key=lambda x: x['promedio'], reverse=True)

        # ── Tendencia por período ─────────────────────────────────────────
        tend_rows = (
            q.with_entities(
                Evaluacion.periodo,
                func.avg(Evaluacion.het_estudiantil),
                func.avg(Evaluacion.eval_pares),
                func.avg(Evaluacion.aula_virtual),
                func.avg(Evaluacion.autoevaluacion),
                func.avg(Evaluacion.comp_auto),
                func.count(Evaluacion.id),
            )
            .filter(Evaluacion.periodo.isnot(None))
            .group_by(Evaluacion.periodo)
            .order_by(Evaluacion.periodo)
            .all()
        )
        tend_competencias = []
        for row in tend_rows:
            tend_competencias.append({
                'periodo':         row[0],
                'het_estudiantil': round(float(row[1]), 2) if row[1] else None,
                'eval_pares':      round(float(row[2]), 2) if row[2] else None,
                'aula_virtual':    round(float(row[3]), 2) if row[3] else None,
                'autoevaluacion':  round(float(row[4]), 2) if row[4] else None,
                'comp_auto':       round(float(row[5]), 2) if row[5] else None,
                'n':               int(row[6] or 0),
            })

        return {
            'por_modelo':        resultados_modelos,
            'por_carrera':       por_carrera,
            'tend_competencias': tend_competencias,
        }


kpi_service = KPIService()
