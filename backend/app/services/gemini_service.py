from google import genai
from app.core.config import settings
import json

class GeminiService:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None and settings.GEMINI_API_KEY:
            try:
                self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                print(f"Error inicializando Gemini: {e}")
        return self._client

    def _build_context_text(self, context: dict) -> str:
        """Convierte el contexto de datos en texto estructurado para el prompt."""
        lines = []

        # ── RESUMEN POR SISTEMA ────────────────────────────────────────────
        comp = context.get('comparativo', {})
        meipa = comp.get('meipa', {})
        tres60 = comp.get('360', {})
        lines.append("=== RESUMEN INSTITUCIONAL ===")
        lines.append(f"  MEIPA (evaluación docente PUCE-E): promedio {meipa.get('promedio','N/D')}/100, {meipa.get('n',0)} registros")
        lines.append(f"  MECDI/360 (evaluación 360°):        promedio {tres60.get('promedio','N/D')}/100, {tres60.get('n',0)} registros")

        # ── TENDENCIA TEMPORAL ────────────────────────────────────────────
        tend = context.get('tendencias', [])
        if tend:
            lines.append("\n=== TENDENCIA POR PERÍODO ===")
            for t in tend[:14]:
                lines.append(f"  Período {t.get('periodo','?')}: {t.get('promedio','?')}/100 — {t.get('n',0)} evaluaciones")

        # ── RANKING DOCENTES ──────────────────────────────────────────────
        ranking = context.get('ranking_top', [])
        if ranking:
            lines.append("\n=== TOP 30 DOCENTES MEJOR EVALUADOS ===")
            for i, r in enumerate(ranking[:30]):
                lines.append(f"  {i+1}. {r.get('nombre','?')} | {r.get('facultad','?')} | {r.get('puntaje_100','?')}/100 | {str(r.get('sistema','')).upper()} {r.get('modelo','')}")

        # ── DOCENTES CRÍTICOS ─────────────────────────────────────────────
        criticos = context.get('criticos', [])
        if criticos:
            lines.append(f"\n=== DOCENTES QUE NECESITAN APOYO ({len(criticos)} total) ===")
            for r in criticos[:20]:
                lines.append(f"  - {r.get('nombre','?')} | {r.get('facultad','?')} | {r.get('puntaje_100','?')}/100 | {str(r.get('sistema','')).upper()}")

        # ── RANKING DE CARRERAS / FACULTADES ─────────────────────────────
        por_fac = comp.get('por_facultad', [])
        if por_fac:
            lines.append("\n=== RANKING DE CARRERAS/UNIDADES ACADÉMICAS ===")
            for i, f in enumerate(por_fac[:20]):
                lines.append(f"  {i+1}. {f.get('facultad','?')}: {f.get('promedio','?')}/100 ({f.get('n',0)} registros)")

        # ── COMPETENCIAS POR CARRERA (mejor y peor componente) ───────────
        comp_carr = context.get('competencias_por_carrera', [])
        if comp_carr:
            lines.append("\n=== ANÁLISIS DE COMPETENCIAS POR CARRERA ===")
            lines.append("  (mejor y peor componente evaluado)")
            for c in comp_carr[:20]:
                nombre = c.get('carrera', '?')
                prom   = c.get('promedio', '?')
                mejor  = c.get('mejor_componente', '?')
                peor   = c.get('peor_componente', '?')
                mejor_v = c.get('mejor_val', '?')
                peor_v  = c.get('peor_val', '?')
                n = c.get('n', '?')
                lines.append(f"  {nombre}: prom={prom}/100, n={n}")
                lines.append(f"    ✓ Mejor: {mejor} ({mejor_v}/100)")
                lines.append(f"    ✗ Peor:  {peor} ({peor_v}/100)")

        # ── VARIABLES / COMPONENTES INSTITUCIONALES ───────────────────────
        variables = context.get('variables', {})
        comps = variables.get('componentes', {})
        if comps:
            lines.append("\n=== COMPONENTES DE EVALUACIÓN (PROMEDIO INSTITUCIONAL) ===")
            for comp_name, comp_data in comps.items():
                prom = comp_data.get('promedio', '?') if isinstance(comp_data, dict) else comp_data
                lines.append(f"  {comp_name}: {prom}/100")

        # ── ANÁLISIS DEMOGRÁFICO ──────────────────────────────────────────
        por_genero  = comp.get('por_genero', {})
        por_edad    = comp.get('por_edad', {})
        por_ant     = comp.get('por_antiguedad', {})
        genero_edad = comp.get('genero_edad', {})

        if por_genero:
            lines.append(f"\n=== POR GÉNERO === {por_genero}")
        if por_edad:
            lines.append(f"=== POR RANGO DE EDAD === {por_edad}")
        if por_ant:
            lines.append(f"=== POR ANTIGÜEDAD === {por_ant}")
        if genero_edad:
            lines.append(f"=== CRUCE GÉNERO × EDAD === {genero_edad}")

        return "\n".join(lines)

    def answer_question(self, pregunta: str, context: dict) -> str:
        current_client = self.client
        if not current_client:
            return "Gemini API Key no configurada."

        context_text = self._build_context_text(context)

        prompt = f"""Eres un analista experto en calidad educativa universitaria de la PUCESE (Pontificia Universidad Católica del Ecuador - Sede Esmeraldas).
Tienes acceso completo a los resultados reales de evaluaciones docentes y debes responder con datos concretos, nombres reales y análisis profundo.

PREGUNTA:
"{pregunta}"

{context_text}

=== INSTRUCCIONES ===
- Responde directamente con datos reales del contexto.
- Si preguntan por una carrera específica, analiza sus componentes (mejor/peor), tendencia y docentes.
- Si preguntan sobre problemas o causas, explica los factores cuantitativos (qué componentes fallan, diferencias por período, etc.).
- Menciona nombres, puntajes y facultades cuando sea relevante.
- Usa formato markdown: **negrita** para nombres/datos clave, listas con -, titulillos con ##.
- Máximo 400 palabras. Sé preciso y orientado a la acción.
- Si los datos son insuficientes para la pregunta específica, indícalo y ofrece lo que sí tienes.
"""
        try:
            response = current_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text
        except Exception as e:
            return f"Error generando respuesta: {str(e)}"

    def generate_informe_ia(self, data: dict) -> str:
        """Genera un informe ejecutivo completo en markdown."""
        current_client = self.client
        if not current_client:
            return "Gemini API Key no configurada."

        context_text = self._build_context_text(data)

        # Calcular estadísticas adicionales para el informe
        ranking = data.get('ranking_top', [])
        criticos = data.get('criticos', [])
        comp_carr = data.get('competencias_por_carrera', [])
        tend = data.get('tendencias', [])

        # Carrera con mejor y peor promedio
        mejor_carrera = comp_carr[0] if comp_carr else {}
        peor_carrera  = comp_carr[-1] if comp_carr else {}

        # Evolución: primera y última tendencia
        prim_tend = tend[0] if tend else {}
        ult_tend  = tend[-1] if tend else {}

        prompt = f"""Eres un experto en gestión académica universitaria. Genera un INFORME EJECUTIVO COMPLETO sobre el desempeño docente de la PUCESE (Pontificia Universidad Católica del Ecuador, Sede Esmeraldas).

{context_text}

=== INSTRUCCIONES PARA EL INFORME ===
Genera el informe en formato Markdown con las siguientes secciones OBLIGATORIAS:

## 1. Resumen Ejecutivo
- 3-4 párrafos con los hallazgos más importantes
- Promedio general, tendencia, sistemas

## 2. Análisis por Sistema de Evaluación
- Comparar MEIPA vs MECDI/360 con cifras exactas
- Fortalezas y debilidades de cada sistema

## 3. Carreras con Mejor y Peor Desempeño
- Top 5 carreras mejor evaluadas (con puntajes y fortalezas específicas)
- 5 carreras que necesitan más atención (con puntajes y componentes que fallan)
- Para cada carrera en atención: explicar POR QUÉ tiene ese puntaje (qué componente es el más bajo)

## 4. Análisis de Componentes de Evaluación
- Qué dimensión (hetero-estudiante, pares, autoevaluación, etc.) tiene el promedio más bajo
- Qué carreras concentran los problemas en ese componente

## 5. Análisis Demográfico
- Diferencias por género, edad y antigüedad
- Hallazgos relevantes sobre qué perfil docente obtiene mejores resultados

## 6. Docentes Destacados
- Mencionar a los 5 docentes mejor evaluados con sus datos

## 7. Docentes que Requieren Atención
- Listar docentes con puntajes bajos (sin exponer datos sensibles de manera negativa, con enfoque constructivo)

## 8. Tendencia Institucional
- Evolución del promedio por período
- Si hay mejora o deterioro y en qué porcentaje

## 9. Recomendaciones Estratégicas
- 5-7 recomendaciones concretas y accionables basadas en los datos
- Ordenadas por prioridad

## 10. Alertas Académicas
- 3-5 alertas específicas para las autoridades que requieren atención inmediata

---
NOTAS:
- Usa datos reales del contexto (cifras exactas, nombres específicos)
- El tono debe ser profesional, constructivo y orientado a la mejora continua
- Incluye cifras concretas en cada sección
- Extensión: completo y detallado, sin límite de palabras
"""
        try:
            response = current_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text
        except Exception as e:
            return f"Error generando informe: {str(e)}"

    def generate_executive_analysis(self, kpis: dict):
        current_client = self.client
        if not current_client:
            return f"Gemini API Key no configurada o inválida. (Key presente: {'Sí' if settings.GEMINI_API_KEY else 'No'})"

        prompt = f"""
        Actúa como un experto en gestión académica universitaria.
        Analiza los siguientes KPIs de evaluación docente y genera un informe ejecutivo:
        -------------------------------------------------------------------------------------------------------------------------------------------
        - Promedio Institucional: {kpis['promedio_general']}
        - Total de Evaluaciones: {kpis['total_evaluaciones']}
        - Mejor Docente: {kpis['mejor_docente']}
        - Peor Docente: {kpis['peor_docente']}
        - Promedio por Facultad: {kpis['promedio_por_facultad']}

        Variables críticas (Promedios por dimensión):
        {kpis.get('variables', 'No disponibles')}

        El informe debe incluir:
        1. Interpretación automática de los resultados.
        2. Recomendaciones estratégicas para la universidad.
        3. Alertas académicas basadas en los datos.
        4. Un resumen ejecutivo para las autoridades.

        Usa un tono profesional, constructivo y orientado a la mejora continua.
        Formatea la respuesta con Markdown (## para secciones, **negrita** para datos clave, listas con -).
        """

        try:
            response = current_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text
        except Exception as e:
            return f"Error generando análisis: {str(e)}"

gemini_service = GeminiService()
