"""
Servicio de generación de PDF por docente.
Usa Jinja2 para renderizar HTML y WeasyPrint / xhtml2pdf para convertir a PDF.
Trabaja exclusivamente con la tabla `evaluaciones` (modelo Evaluacion).
"""
import os
from datetime import datetime
from typing import Optional, Tuple
from collections import defaultdict

from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.evaluacion import Evaluacion


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

    periodo_str = ev.periodo or "—"
    sistema     = ev.sistema or "meipa"
    nivel       = ev.nivel_desempeno or nivel_from_puntaje(ev.puntaje_100)

    componentes                = _build_componentes(ev)
    rank_data                  = _build_ranking(cedula, periodo_str, ev.modelo or "docencia", float(ev.puntaje_100 or 0), db)
    periodos_lista, hist_mod   = _build_historico(cedula, db)

    for row in hist_mod:
        for i, p in enumerate(periodos_lista):
            if p["periodo"] == periodo_str:
                row["celdas"][i]["es_actual"] = True

    ranking_colors = {"Excelente": "#059669", "Bueno": "#0056b3", "Regular": "#d97706", "Deficiente": "#dc2626"}

    return {
        "cedula":            cedula,
        "nombre_completo":   ev.docente_nombre or cedula,
        "genero":            ev.sexo or "—",
        "facultad":          ev.facultad or "—",
        "funcion":           ev.funcion_docente or "—",
        "dedicacion":        "—",
        "antiguedad_str":    _antiguedad_str(ev.antiguedad_anos),
        "nivel_instruccion": ev.nivel_estudio or "—",
        "periodo_label":     periodo_str,
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
    p.funcion           = ctx["funcion"]
    p.dedicacion        = ctx["dedicacion"]
    p.antiguedad_str    = ctx["antiguedad_str"]
    p.nivel_instruccion = ctx["nivel_instruccion"]
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
