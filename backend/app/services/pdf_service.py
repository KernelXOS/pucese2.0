"""
Servicio de generación de PDF por docente.
Usa Jinja2 para renderizar HTML y WeasyPrint / xhtml2pdf para convertir a PDF.
Trabaja exclusivamente con la tabla `evaluaciones` (modelo Evaluacion).
"""
import os, json as _json
from datetime import datetime
from typing import Optional, Tuple
from collections import defaultdict

from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.evaluacion import Evaluacion


# ── SVG Chart Generators ───────────────────────────────────────────────────────

def _svg_components_chart(componentes: list) -> str:
    """Genera SVG de barras horizontales para los componentes de evaluación."""
    if not componentes:
        return ""
    row_h = 32
    pad_l = 160
    pad_r = 70
    pad_t = 10
    w = 520
    h = pad_t + len(componentes) * row_h + 10

    COLOR_MAP = {
        "excelente":  "#059669",
        "bueno":      "#0056b3",
        "regular":    "#d97706",
        "deficiente": "#dc2626",
    }
    MAX_VAL = 100.0
    bar_w = w - pad_l - pad_r

    lines = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" style="font-family:Helvetica,Arial,sans-serif;">']

    # guías verticales
    for tick in [25, 50, 75, 100]:
        x = pad_l + bar_w * tick / MAX_VAL
        lines.append(f'<line x1="{x:.1f}" y1="{pad_t}" x2="{x:.1f}" y2="{h-5}" stroke="#e2e8f0" stroke-width="1"/>')
        lines.append(f'<text x="{x:.1f}" y="{h}" text-anchor="middle" font-size="7" fill="#cbd5e1">{tick}</text>')

    for i, comp in enumerate(componentes):
        y = pad_t + i * row_h
        val = min(float(comp.get("pct", 0)), 100.0)
        color = COLOR_MAP.get(comp.get("nivel_css", "bueno"), "#0056b3")
        fill_w = bar_w * val / MAX_VAL

        # etiqueta izquierda
        label = comp.get("label", "")[:24]
        lines.append(f'<text x="{pad_l-6}" y="{y+18}" text-anchor="end" font-size="8" fill="#374151" font-weight="600">{label}</text>')

        # fondo barra
        lines.append(f'<rect x="{pad_l}" y="{y+8}" width="{bar_w}" height="14" rx="3" fill="#f1f5f9"/>')
        # barra coloreada
        if fill_w > 0:
            lines.append(f'<rect x="{pad_l}" y="{y+8}" width="{fill_w:.1f}" height="14" rx="3" fill="{color}"/>')
        # valor
        lines.append(f'<text x="{pad_l+bar_w+6}" y="{y+19}" font-size="8.5" font-weight="800" fill="{color}">{comp.get("valor_fmt","—")}</text>')

        # peso
        peso = comp.get("peso", "")
        lines.append(f'<text x="{pad_l+bar_w+42}" y="{y+19}" font-size="7" fill="#94a3b8">{peso}%</text>')

    lines.append('</svg>')
    return "\n".join(lines)


def _svg_historico_chart(periodos_lista: list, hist_modelos: list) -> str:
    """Genera SVG de barras agrupadas para el histórico de puntajes."""
    if not periodos_lista or not hist_modelos:
        return ""

    # Tomar máx 8 períodos para que quepa bien
    periodos = periodos_lista[-8:]
    n_p = len(periodos)
    n_m = len(hist_modelos)

    w = 520
    h = 180
    pad_l = 35
    pad_r = 10
    pad_t = 15
    pad_b = 45
    chart_w = w - pad_l - pad_r
    chart_h = h - pad_t - pad_b

    COLORS = ["#0056b3", "#059669", "#d97706", "#7c3aed", "#dc2626"]
    group_w = chart_w / n_p
    bar_w = min(group_w / (n_m + 1), 22)

    lines = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" style="font-family:Helvetica,Arial,sans-serif;">']

    # guías horizontales
    for tick in [60, 70, 80, 90, 100]:
        y = pad_t + chart_h - chart_h * (tick - 50) / 55
        lines.append(f'<line x1="{pad_l}" y1="{y:.1f}" x2="{w-pad_r}" y2="{y:.1f}" stroke="#f1f5f9" stroke-width="1"/>')
        lines.append(f'<text x="{pad_l-3}" y="{y+3:.1f}" text-anchor="end" font-size="7" fill="#cbd5e1">{tick}</text>')

    # línea meta 90
    y90 = pad_t + chart_h - chart_h * (90 - 50) / 55
    lines.append(f'<line x1="{pad_l}" y1="{y90:.1f}" x2="{w-pad_r}" y2="{y90:.1f}" stroke="#10b981" stroke-width="1" stroke-dasharray="4,3"/>')
    lines.append(f'<text x="{w-pad_r+2}" y="{y90+3:.1f}" font-size="6.5" fill="#10b981">90</text>')

    for pi, pinfo in enumerate(periodos):
        p_label = pinfo.get("label", pinfo.get("periodo", ""))[-6:]
        cx = pad_l + (pi + 0.5) * group_w

        # barras por modelo
        total_bar_w = bar_w * n_m
        x_start = cx - total_bar_w / 2

        for mi, mod in enumerate(hist_modelos):
            # Buscar índice real en periodos_lista
            real_idx = next((k for k, p in enumerate(periodos_lista) if p.get("periodo") == pinfo.get("periodo")), None)
            if real_idx is None or real_idx >= len(mod["celdas"]):
                continue
            celda = mod["celdas"][real_idx]
            val = celda.get("valor")
            if val is None:
                continue
            val = max(float(val), 50.0)
            bar_h_px = chart_h * (val - 50) / 55
            bx = x_start + mi * bar_w
            by = pad_t + chart_h - bar_h_px
            color = COLORS[mi % len(COLORS)]
            lines.append(f'<rect x="{bx:.1f}" y="{by:.1f}" width="{bar_w-1:.1f}" height="{bar_h_px:.1f}" rx="2" fill="{color}" opacity="0.85"/>')
            # valor encima si hay espacio
            if bar_h_px > 18:
                lines.append(f'<text x="{bx+bar_w/2-0.5:.1f}" y="{by+10:.1f}" text-anchor="middle" font-size="6" fill="white" font-weight="800">{float(celda["valor"]):.0f}</text>')

        # etiqueta período
        lines.append(f'<text x="{cx:.1f}" y="{h-pad_b+12}" text-anchor="middle" font-size="7" fill="#64748b">{p_label}</text>')

    # leyenda
    lex = pad_l
    for mi, mod in enumerate(hist_modelos[:4]):
        color = COLORS[mi % len(COLORS)]
        lines.append(f'<rect x="{lex}" y="{h-14}" width="8" height="8" rx="2" fill="{color}"/>')
        lbl = mod.get("label", "")[:16]
        lines.append(f'<text x="{lex+10}" y="{h-7}" font-size="7" fill="#374151">{lbl}</text>')
        lex += len(lbl) * 5 + 20

    lines.append('</svg>')
    return "\n".join(lines)


def _build_resumen(ctx: dict) -> str:
    """Genera un párrafo de resumen automático del desempeño docente."""
    nombre     = ctx.get("nombre_completo", "El/la docente")
    puntaje    = ctx.get("puntaje_fmt", "—")
    nivel      = ctx.get("nivel_desempeno", "—")
    ranking    = ctx.get("ranking_str", "—")
    percentil  = ctx.get("percentil_str", "—")
    periodo    = ctx.get("periodo_label", "—")
    facultad   = ctx.get("facultad", "—")
    carrera    = ctx.get("carrera", "—")
    modelo     = ctx.get("modelo_label", "—")
    sistema    = ctx.get("sistema_label", "—")
    dedicacion = ctx.get("dedicacion", "—")
    n_eval     = ctx.get("n_evaluadores", "—")
    diff_str   = ctx.get("diff_str", "0")
    prom_inst  = ctx.get("promedio_inst_str", "—")
    componentes = ctx.get("componentes", [])
    hist_mod    = ctx.get("historico_modelos", [])

    # Tendencia histórica
    tendencia_txt = ""
    for mod in hist_mod:
        t = mod.get("tendencia", 0)
        if t > 0:
            tendencia_txt = f"muestra una tendencia positiva de +{abs(t):.1f} puntos respecto al período anterior"
        elif t < 0:
            tendencia_txt = f"registra una variación de {t:.1f} puntos respecto al período anterior"
        break

    # Mejor y peor componente
    mejor_comp  = max(componentes, key=lambda c: c.get("pct", 0), default=None)
    peor_comp   = min(componentes, key=lambda c: c.get("pct", 0), default=None)

    # Diferencia vs institución
    try:
        diff_val = float(diff_str.replace("+", ""))
        if diff_val > 0:
            vs_inst = f"supera el promedio institucional ({prom_inst}/100) por {diff_val:.1f} puntos"
        elif diff_val < 0:
            vs_inst = f"se ubica {abs(diff_val):.1f} puntos por debajo del promedio institucional ({prom_inst}/100)"
        else:
            vs_inst = f"iguala el promedio institucional ({prom_inst}/100)"
    except Exception:
        vs_inst = f"el promedio institucional es {prom_inst}/100"

    partes = [
        f"En el período {periodo}, {nombre.title()} obtuvo una calificación de {puntaje}/100 "
        f"en el sistema {sistema} — modelo {modelo}, lo que corresponde al nivel <strong>{nivel}</strong>. "
        f"Su desempeño {vs_inst}, ocupando la posición {ranking} (percentil {percentil}) a nivel institucional."
    ]

    if tendencia_txt:
        partes.append(f"Históricamente, {tendencia_txt}.")

    if mejor_comp and peor_comp and mejor_comp["label"] != peor_comp["label"]:
        partes.append(
            f"Entre los componentes evaluados, destaca <strong>{mejor_comp['label']}</strong> "
            f"con {mejor_comp['valor_fmt']}/100 ({mejor_comp['nivel']}), mientras que "
            f"<strong>{peor_comp['label']}</strong> ({peor_comp['valor_fmt']}/100) "
            f"representa el área con mayor oportunidad de mejora."
        )

    if carrera and carrera != "—" and carrera != facultad:
        partes.append(f"Pertenece a la carrera/programa: <strong>{carrera}</strong>" +
                      (f", unidad académica {facultad}." if facultad and facultad != "—" else "."))
    elif facultad and facultad != "—":
        partes.append(f"El/la docente pertenece a la unidad académica: <strong>{facultad}</strong>.")

    extras = []
    if dedicacion and dedicacion != "—":
        extras.append(f"dedicación <strong>{dedicacion}</strong>")
    if n_eval and n_eval != "—":
        extras.append(f"<strong>{n_eval}</strong> evaluadores participaron en este período")
    if extras:
        partes.append("Datos adicionales: " + " · ".join(extras) + ".")

    return " ".join(partes)


# ── Helpers ────────────────────────────────────────────────────────────────────

def nivel_from_puntaje(p) -> str:
    if p is None:
        return "Sin datos"
    p = float(p)
    if p >= 90:
        return "Excelente"
    if p >= 75:
        return "Bueno"
    if p >= 60:
        return "Regular"
    return "Deficiente"


LOGO_URL    = "https://jorgebanet.com/puce/wp-content/uploads/2025/11/cropped-Logo_PUCESD.png"
TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")

MODELO_LABELS = {
    "docencia":      "Docencia",
    "abp":           "Salud / ABP",
    "posgrado":      "Posgrado",
    "tecnologado":   "Tecnologado",
    "investigacion": "Investigación",
    "vinculacion":   "Vinculación",
    "gestion":       "Gestión",
    "servicios":     "Salud / Servicios",
    "meipa":         "MEIPA",
    "administrativo":"Administrativo",
}

# (campo_en_Evaluacion, etiqueta, peso)
COMP_LABELS: dict = {
    "docencia":      [("het_estudiantil","Het. Estudiantil",50),("eval_pares","Eval. Pares",20),("aula_virtual","Entorno Virtual",10),("autoevaluacion","Autoevaluación",20)],
    "abp":           [("het_estudiantil","Het. Estudiantil (Salud)",50),("eval_pares","Eval. Pares",20),("aula_virtual","Entorno Virtual",10),("autoevaluacion","Autoevaluación",20)],
    "tecnologado":   [("het_estudiantil","Het. Estudiantil",50),("eval_pares","Eval. Pares",20),("aula_virtual","Entorno Virtual",10),("autoevaluacion","Autoevaluación",20)],
    "posgrado":      [("het_estudiantil","Het. Estudiantil Posgrado",60),("autoevaluacion","Autoevaluación",30),("aula_virtual","CEV / Coord. Posgrado",10)],
    "investigacion": [("comp_hetero_dir","Het. Dir. Investigación",50),("comp_auto","Autoevaluación",20),("comp_pares","Coevaluación Par",15),("comp_hetero_est","Het. Decano/Coord.",15)],
    "vinculacion":   [("comp_hetero_est","Het. Estudiantil",50),("comp_auto","Autoevaluación",20),("comp_hetero_dir","Het. Dir. Académico",30)],
    "gestion":       [("comp_hetero_dir","Coevalúa. Directivo",50),("comp_hetero_est","Het. Docentes",30),("comp_auto","Autoevaluación",20)],
    "administrativo":[("comp_hetero_dir","Coevalúa. Directivo",50),("comp_hetero_est","Het. Docentes",30),("comp_auto","Autoevaluación",20)],
    "servicios":     [("het_estudiantil","Het. Estudiantil (Práctica Hosp.)",100)],
}

MEIPA_COMP_KEYS = [
    ("comp_hetero_est","Het. Estudiantil",40),
    ("comp_auto","Autoevaluación",20),
    ("comp_hetero_dir","Coord→Docente",20),
    ("comp_pares","Eval. Pares",20),
]


def _fmt(val) -> str:
    if val is None:
        return "—"
    return f"{float(val):.1f}"


def _nivel_css(nivel: str) -> str:
    return {
        "Excelente":  "excelente",
        "Bueno":      "bueno",
        "Regular":    "regular",
        "Deficiente": "deficiente",
    }.get(nivel, "sin-datos")


def _antiguedad_str(anos) -> str:
    if anos is None:
        return "—"
    anos = float(anos)
    a = int(anos)
    m = int((anos - a) * 12)
    if a == 0:
        return f"{m} meses"
    if m == 0:
        return f"{a} años"
    return f"{a} años {m} meses"


def _norm_periodo(p: str) -> str:
    """Convierte código de período crudo (ej. 202571) en etiqueta legible (Posg-I-2025)."""
    if not p or p == "—":
        return p
    s = str(p).strip()
    if len(s) < 4:
        return s
    y = s[:4]
    try:
        suf = int(s[4:]) if len(s) > 4 else 0
    except ValueError:
        return s
    if suf == 0 or suf == 1:   return f"I-{y}"
    if suf == 2:                return f"II-{y}"
    if 10 <= suf <= 20:         return f"TEC-I-{y}"
    if 21 <= suf <= 30:         return f"TEC-II-{y}"
    if 51 <= suf <= 57:         return f"Posg-I-{y}"
    if 58 <= suf <= 65:         return f"Posg-II-{y}"
    if 60 <= suf <= 68:         return f"I-{y}"
    if 69 <= suf <= 80:         return f"II-{y}"
    if 70 <= suf <= 79:         return f"Posg-I-{y}"
    return f"{y}-{suf}"


# ── Core builders ──────────────────────────────────────────────────────────────

def _build_componentes(ev: Evaluacion) -> list:
    """Construye lista de componentes para el PDF desde un registro Evaluacion."""
    modelo  = ev.modelo  or "docencia"
    sistema = ev.sistema or "meipa"

    componentes = []
    defs = MEIPA_COMP_KEYS if sistema == "meipa" else COMP_LABELS.get(modelo, COMP_LABELS.get("docencia", []))

    for campo, label, peso in defs:
        valor = getattr(ev, campo, None)
        if valor is None:
            continue
        pct   = round(min(float(valor), 100.0), 1)
        nivel = nivel_from_puntaje(valor)
        componentes.append({
            "label":     label,
            "peso":      peso,
            "valor_fmt": _fmt(valor),
            "pct":       pct,
            "nivel":     nivel,
            "nivel_css": _nivel_css(nivel),
        })
    return componentes


def _build_historico(cedula: str, db: Session) -> Tuple[list, list]:
    """
    Construye la tabla histórica (todos los períodos × modelos) para un docente.
    Retorna (periodos_lista, modelos_rows).
    """
    evs = (
        db.query(Evaluacion)
        .filter(Evaluacion.cedula == cedula, Evaluacion.puntaje_100.isnot(None))
        .order_by(Evaluacion.anio, Evaluacion.periodo)
        .all()
    )
    if not evs:
        return [], []

    # Períodos únicos (ordenados)
    seen_p: dict = {}
    for ev in evs:
        p = ev.periodo or ""
        if p and p not in seen_p:
            seen_p[p] = {"periodo": p, "anio": ev.anio or 0, "sistema": ev.sistema or "meipa", "label": p}
    periodos_list = sorted(seen_p.values(), key=lambda x: (x["anio"], x["periodo"]))

    # Agrupar por modelo → período → lista de puntajes
    modelo_data: dict = defaultdict(lambda: defaultdict(list))
    for ev in evs:
        if ev.periodo and ev.modelo:
            modelo_data[ev.modelo][ev.periodo].append(ev.puntaje_100)

    modelos_rows = []
    for modelo, pdata in sorted(modelo_data.items()):
        celdas = []
        vals_crono = []
        for pinfo in periodos_list:
            p     = pinfo["periodo"]
            vals  = pdata.get(p, [])
            valor = round(sum(vals) / len(vals), 1) if vals else None
            celdas.append({
                "valor":     valor,
                "valor_fmt": _fmt(valor),
                "es_actual": False,
            })
            if valor is not None:
                vals_crono.append(valor)

        tendencia = 0.0
        if len(vals_crono) >= 2:
            tendencia = round(vals_crono[-1] - vals_crono[-2], 1)

        modelos_rows.append({
            "modelo":        modelo,
            "label":         MODELO_LABELS.get(modelo, modelo.capitalize()),
            "celdas":        celdas,
            "tendencia":     tendencia,
            "tendencia_fmt": f"{abs(tendencia):.1f}",
        })

    return periodos_list, modelos_rows


def _build_ranking(cedula: str, periodo: str, modelo: str, puntaje: float, db: Session) -> dict:
    """Calcula posición y percentil del docente en la institución para ese período/modelo."""
    _no_rank = {"ranking": "—", "percentil": "—", "promedio_inst": None, "diff": None, "diff_str": "—", "diff_color": "#64748b"}
    try:
        rows = (
            db.query(Evaluacion.cedula, func.avg(Evaluacion.puntaje_100).label("avg_p"))
            .filter(Evaluacion.periodo == periodo, Evaluacion.modelo == modelo, Evaluacion.puntaje_100.isnot(None))
            .group_by(Evaluacion.cedula)
            .all()
        )
    except Exception:
        db.rollback()
        return _no_rank

    if not rows:
        return _no_rank

    puntajes  = sorted([float(r.avg_p) for r in rows if r.avg_p is not None], reverse=True)
    promedio  = round(sum(puntajes) / len(puntajes), 1)
    pos       = next((i + 1 for i, v in enumerate(puntajes) if v <= puntaje), len(puntajes))
    percentil = round(((len(puntajes) - pos) / len(puntajes)) * 100) if puntajes else 0
    diff      = round(puntaje - promedio, 1)

    return {
        "ranking":       f"#{pos} / {len(puntajes)}",
        "percentil":     f"P{percentil}",
        "promedio_inst": promedio,
        "diff":          diff,
        "diff_color":    "#059669" if diff >= 0 else "#dc2626",
        "diff_str":      f"+{diff}" if diff >= 0 else str(diff),
    }


# ── PDF rendering helper ───────────────────────────────────────────────────────

def _render_pdf(template_name: str, ctx: dict) -> bytes:
    env      = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
    template = env.get_template(template_name)
    html_str = template.render(**ctx)

    try:
        from weasyprint import HTML as WP_HTML
        return WP_HTML(string=html_str, base_url=TEMPLATE_DIR).write_pdf()
    except Exception:
        pass  # WeasyPrint no disponible → intentar xhtml2pdf

    try:
        import io as _io
        from xhtml2pdf import pisa
        buf    = _io.BytesIO()
        status = pisa.CreatePDF(html_str, dest=buf)
        if status.err:
            raise RuntimeError("xhtml2pdf falló al generar el PDF")
        return buf.getvalue()
    except ImportError:
        raise RuntimeError("No se pudo generar el PDF. Instala weasyprint o xhtml2pdf.")


# ── Contexto de un docente (reutilizable para bulk) ────────────────────────────

_MODELO_PRIO = ["docencia","abp","tecnologado","posgrado","investigacion","vinculacion","gestion","servicios","administrativo","meipa"]


def _build_docente_ctx(cedula: str, db: Session, periodo_codigo: Optional[str] = None) -> Optional[dict]:
    """Construye el dict de contexto para un docente. Retorna None si no hay datos."""
    evs = (
        db.query(Evaluacion)
        .filter(Evaluacion.cedula == cedula)
        .order_by(Evaluacion.anio.desc(), Evaluacion.periodo.desc())
        .all()
    )
    if not evs:
        return None

    # Seleccionar período
    if periodo_codigo:
        evs_p = [e for e in evs if e.periodo == periodo_codigo]
    else:
        # Último período disponible
        latest_p = evs[0].periodo
        evs_p = [e for e in evs if e.periodo == latest_p]

    if not evs_p:
        evs_p = evs[:1]

    # Priorizar modelo
    ev: Optional[Evaluacion] = None
    for m in _MODELO_PRIO:
        ev = next((e for e in evs_p if e.modelo == m), None)
        if ev:
            break
    if not ev:
        ev = evs_p[0]

    periodo_str  = ev.periodo or "—"
    periodo_norm = _norm_periodo(periodo_str)
    sistema      = ev.sistema or "meipa"
    nivel        = ev.nivel_desempeno or nivel_from_puntaje(ev.puntaje_100)

    componentes                = _build_componentes(ev)
    rank_data                  = _build_ranking(cedula, periodo_str, ev.modelo or "docencia", float(ev.puntaje_100 or 0), db)
    periodos_lista, hist_mod   = _build_historico(cedula, db)

    # Normalizar etiquetas de período en el histórico
    for pinfo in periodos_lista:
        pinfo["label"] = _norm_periodo(pinfo.get("periodo", ""))

    for row in hist_mod:
        for i, p in enumerate(periodos_lista):
            if p["periodo"] == periodo_str:
                row["celdas"][i]["es_actual"] = True

    ranking_colors = {"Excelente": "#059669", "Bueno": "#0056b3", "Regular": "#d97706", "Deficiente": "#dc2626"}

    # Tipo dedicación: tiempo_servicio → etiqueta legible
    ded_raw = ev.tiempo_servicio or ""
    ded_map = {"TC": "Tiempo Completo", "TP": "Tiempo Parcial", "MT": "Medio Tiempo",
               "Tiempo Completo": "Tiempo Completo", "Tiempo Parcial": "Tiempo Parcial", "Medio Tiempo": "Medio Tiempo"}
    dedicacion = ded_map.get(ded_raw.strip().upper(), ded_raw) if ded_raw else "—"

    # Carrera: usar campo carrera primero, luego facultad
    carrera  = ev.carrera or ev.facultad or "—"
    facultad = ev.facultad or ev.carrera or "—"

    # Número de evaluadores
    n_eval = ev.n_evaluadores

    # Desglose materias+carreras (del campo materias_json almacenado en ETL)
    materias: list = []
    if getattr(ev, 'materias_json', None):
        try:
            materias = _json.loads(ev.materias_json)
        except Exception:
            materias = []

    return {
        "cedula":            cedula,
        "nombre_completo":   ev.docente_nombre or cedula,
        "genero":            ev.sexo or "—",
        "facultad":          facultad,
        "carrera":           carrera,
        "funcion":           ev.funcion_docente or "—",
        "dedicacion":        dedicacion,
        "antiguedad_str":    _antiguedad_str(ev.antiguedad_anos),
        "nivel_instruccion": ev.nivel_estudio or ev.grado or "—",
        "n_evaluadores":     n_eval if n_eval else "—",
        "periodo_label":     periodo_norm,
        "periodo_raw":       periodo_str,
        "sistema_label":     "Sistema MEIPA" if sistema == "meipa" else "Sistema 360°",
        "sistema_upper":     sistema.upper(),
        "puntaje_fmt":       _fmt(ev.puntaje_100),
        "nivel_desempeno":   nivel,
        "modelo_label":      MODELO_LABELS.get(ev.modelo or "docencia", ev.modelo or ""),
        "ranking_str":       rank_data["ranking"],
        "ranking_color":     ranking_colors.get(nivel, "#64748b"),
        "percentil_str":     rank_data["percentil"],
        "promedio_inst_str": _fmt(rank_data.get("promedio_inst")),
        "diff_str":          rank_data.get("diff_str", "—"),
        "diff_color":        rank_data.get("diff_color", "#64748b"),
        "componentes":       componentes,
        "historico":         periodos_lista,
        "historico_modelos": hist_mod,
        "materias":          materias,
    }


# ── Funciones públicas ─────────────────────────────────────────────────────────

def generar_pdf_docente(cedula: str, db: Session, periodo_codigo: Optional[str] = None) -> bytes:
    """
    Genera el PDF individual de un docente desde la tabla evaluaciones.
    Lanza ValueError si el docente no existe; RuntimeError si falla la renderización.
    """
    ctx = _build_docente_ctx(cedula, db, periodo_codigo)
    if not ctx:
        raise ValueError(f"Docente {cedula} no encontrado en la base de datos")

    ctx["logo_url"]          = LOGO_URL
    ctx["fecha_generacion"]  = datetime.now().strftime("%d/%m/%Y %H:%M")
    ctx["ia_comentario"]     = None
    ctx["resumen"]           = _build_resumen(ctx)
    ctx["svg_componentes"]   = _svg_components_chart(ctx.get("componentes", []))
    ctx["svg_historico"]     = _svg_historico_chart(ctx.get("historico", []), ctx.get("historico_modelos", []))

    # El template espera "docente" y "perfil" como objetos/dicts
    ctx["docente"] = {
        "cedula":          ctx["cedula"],
        "nombre_completo": ctx["nombre_completo"],
        "genero":          ctx["genero"],
    }

    class _Perfil:
        pass
    p = _Perfil()
    p.facultad          = ctx["facultad"]
    p.carrera           = ctx["carrera"]
    p.funcion           = ctx["funcion"]
    p.dedicacion        = ctx["dedicacion"]
    p.antiguedad_str    = ctx["antiguedad_str"]
    p.nivel_instruccion = ctx["nivel_instruccion"]
    p.n_evaluadores     = ctx["n_evaluadores"]
    ctx["perfil"] = p

    ctx["puntaje_actual"] = {
        "puntaje_fmt":     ctx["puntaje_fmt"],
        "nivel_desempeno": ctx["nivel_desempeno"],
        "modelo_label":    ctx["modelo_label"],
        "sistema":         ctx.get("sistema_upper", "").lower(),
    }

    return _render_pdf("reporte_docente.html", ctx)


def generar_pdf_bulk_docentes(cedulas: list, db: Session) -> bytes:
    """Genera un PDF con una página por docente."""
    fecha_gen    = datetime.now().strftime("%d/%m/%Y %H:%M")
    docentes_ctx = []

    for cedula in cedulas:
        try:
            ctx = _build_docente_ctx(cedula, db)
            if ctx:
                ctx["fecha_generacion"] = fecha_gen
                docentes_ctx.append(ctx)
        except Exception:
            pass  # silently skip

    if not docentes_ctx:
        raise ValueError("No se encontraron datos para los docentes solicitados")

    return _render_pdf("reporte_bulk_docentes.html", {
        "logo_url":         LOGO_URL,
        "fecha_generacion": fecha_gen,
        "docentes":         docentes_ctx,
    })


def generar_pdf_directorio(titulo: str, docentes_data: list) -> bytes:
    """
    Genera el PDF de directorio con el ranking completo de docentes.
    docentes_data: lista de dicts con nombre, cedula, facultad, sistema, modelo, puntaje, nivel.
    """
    from datetime import datetime as _dt

    MODELO_LABELS_DIR = {k: v for k, v in MODELO_LABELS.items()}
    NIVEL_COLOR       = {"Excelente":"#059669","Bueno":"#0056b3","Regular":"#d97706","Deficiente":"#dc2626"}

    def _score_color(p):
        if p is None: return "#94a3b8"
        p = float(p)
        if p >= 90: return "#059669"
        if p >= 75: return "#0056b3"
        if p >= 60: return "#d97706"
        return "#dc2626"

    total      = len(docentes_data)
    puntajes   = [float(d.get("puntaje") or 0) for d in docentes_data]
    promedio   = f"{sum(puntajes)/total:.1f}" if total else "0.0"
    nivel_count: dict = {}
    for d in docentes_data:
        n = d.get("nivel") or "Sin datos"
        nivel_count[n] = nivel_count.get(n, 0) + 1

    distribucion = []
    for label, key in [("Excelente","Excelente"),("Bueno","Bueno"),("Regular","Regular"),("Deficiente","Deficiente")]:
        n   = nivel_count.get(key, 0)
        pct = round(n / total * 100, 1) if total else 0
        distribucion.append({"label": label, "n": n, "pct": pct, "color": NIVEL_COLOR[key]})

    sorted_docs = sorted(docentes_data, key=lambda d: float(d.get("puntaje") or 0), reverse=True)
    top10       = []
    for d in sorted_docs[:10]:
        p      = float(d.get("puntaje") or 0)
        nombre = d.get("nombre") or ""
        partes = nombre.split()
        nombre_corto = " ".join(partes[:3]) if len(partes) >= 3 else nombre
        top10.append({"nombre_corto": nombre_corto, "puntaje_fmt": f"{p:.1f}", "pct": round(p,1), "color": _score_color(p)})

    docentes_ctx = []
    for d in sorted_docs:
        p      = float(d.get("puntaje") or 0)
        nivel  = d.get("nivel") or "Sin datos"
        docentes_ctx.append({
            "nombre":       d.get("nombre") or "—",
            "cedula":       d.get("cedula") or "",
            "facultad":     d.get("facultad") or "—",
            "sistema":      d.get("sistema") or "",
            "modelo_label": MODELO_LABELS_DIR.get(d.get("modelo") or "", (d.get("modelo") or "").capitalize()),
            "puntaje_fmt":  f"{p:.1f}",
            "score_color":  _score_color(p),
            "nivel":        nivel,
            "nivel_css":    nivel.replace(" ", "-"),
        })

    titulo_corto = titulo[:20] if len(titulo) > 20 else titulo

    ctx = {
        "logo_url":          LOGO_URL,
        "titulo":            titulo,
        "titulo_corto":      titulo_corto,
        "fecha_generacion":  _dt.now().strftime("%d/%m/%Y %H:%M"),
        "total":             total,
        "promedio":          promedio,
        "n_excelente":       nivel_count.get("Excelente", 0),
        "n_bueno":           nivel_count.get("Bueno", 0),
        "n_regular":         nivel_count.get("Regular", 0),
        "n_deficiente":      nivel_count.get("Deficiente", 0),
        "distribucion":      distribucion,
        "top10":             top10,
        "docentes":          docentes_ctx,
    }
    return _render_pdf("reporte_directorio.html", ctx)
