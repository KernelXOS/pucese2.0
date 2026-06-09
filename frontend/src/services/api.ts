import axios from 'axios';

// VITE_API_URL puede venir con o sin /evaluacion al final — normalizamos
const _RAW = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '')
const BASE = _RAW.endsWith('/evaluacion') ? _RAW.slice(0, -'/evaluacion'.length) : _RAW
const EVAL = `${BASE}/evaluacion`;
const DOC  = `${BASE}/docentes`;
const ETL  = `${BASE}/etl`;
const AUTH = `${BASE}/auth`;

// ── Auth token helpers ─────────────────────────────────────────────────────────
const TOKEN_KEY = 'pucese_token'
const USER_KEY  = 'pucese_user'

export const authStore = {
  getToken:        () => localStorage.getItem(TOKEN_KEY),
  setToken:        (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clearToken:      () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY) },
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
  getUser:         () => localStorage.getItem(USER_KEY) || 'Administrador',
  setUser:         (u: string) => localStorage.setItem(USER_KEY, u),
}

// ── Axios interceptor: add Bearer token to every request ──────────────────────
axios.interceptors.request.use(config => {
  const token = authStore.getToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// ── Axios interceptor: handle 401 → clear token (force re-login) ─────────────
axios.interceptors.response.use(
  res => res,
  err => {
    if (err?.response?.status === 401) {
      // Only clear if it's not the login endpoint itself
      const url: string = err?.config?.url || ''
      if (!url.includes('/auth/login')) {
        authStore.clearToken()
        window.location.reload()
      }
    }
    return Promise.reject(err)
  }
)

function params(opts: Record<string, string | number | undefined>) {
  const p: Record<string, string> = {};
  for (const [k, v] of Object.entries(opts)) {
    if (v !== undefined && v !== null && v !== '') p[k] = String(v);
  }
  return new URLSearchParams(p).toString();
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────────
  login: (username: string, password: string) => {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    return axios.post(`${AUTH}/login`, form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  },

  // ── Legacy (compatibilidad con dashboard actual) ───────────────────────────
  getKPIs: (modelo?: string, anio?: number, sistema?: string, periodo?: string) =>
    axios.get(`${EVAL}/kpis/institucionales?${params({ modelo, anio, sistema, periodo })}`),

  getRanking: (limit = 1000, modelo?: string, anio?: number, sistema?: string, periodo?: string) =>
    axios.get(`${EVAL}/ranking?${params({ limit, modelo, anio, sistema, periodo })}`),

  getCriticos: (threshold = 3.5, modelo?: string, anio?: number, sistema?: string, periodo?: string) =>
    axios.get(`${EVAL}/criticos?${params({ threshold, modelo, anio, sistema, periodo })}`),

  getTendencias: (modelo?: string, sistema?: string) =>
    axios.get(`${EVAL}/tendencias?${params({ modelo, sistema })}`),

  getVariables: (modelo?: string, anio?: number, sistema?: string, periodo?: string) =>
    axios.get(`${EVAL}/variables?${params({ modelo, anio, sistema, periodo })}`),

  getDemograficos: (modelo?: string, anio?: number, sistema?: string, periodo?: string) =>
    axios.get(`${EVAL}/demograficos?${params({ modelo, anio, sistema, periodo })}`),

  getAIAnalysis: (modelo?: string, anio?: number, sistema?: string, periodo?: string) =>
    axios.get(`${EVAL}/analisis-ia?${params({ modelo, anio, sistema, periodo })}`),

  getAnalytics: (sistema?: string, modelo?: string, anio?: number, periodo?: string) =>
    axios.get(`${EVAL}/analytics?${params({ sistema, modelo, anio, periodo })}`),

  getComparativo: (anio?: number) =>
    axios.get(`${EVAL}/comparativo?${params({ anio })}`),

  getTodosDocentes: (anio?: number, modelo?: string, sistema?: string, periodo?: string) =>
    axios.get(`${EVAL}/todos-docentes?${params({ anio, modelo, sistema, periodo })}`),

  processETL: () => axios.post(`${EVAL}/etl/process`),
  getETLStatus: () => axios.get(`${EVAL}/etl/status`),

  consultaIA: (pregunta: string, anio?: number) =>
    axios.post(`${EVAL}/consulta-ia`, { pregunta, anio }),

  informeIA: () =>
    axios.post(`${EVAL}/informe-ia`),

  // ── Nuevos: períodos ────────────────────────────────────────────────────────
  getPeriodos: () =>
    axios.get(`${EVAL}/etl/periodos`),

  getEstadoETL: () =>
    axios.get(`${EVAL}/etl/status`),

  procesarPeriodo: (periodo: string) =>
    axios.post(`${EVAL}/etl/process`),

  // ── Nuevos: docentes ────────────────────────────────────────────────────────
  getDocentes: (opts: { periodo?: string; facultad?: string; modelo?: string; q?: string; limit?: number }) =>
    axios.get(`${DOC}/?${params(opts)}`),

  getPerfilDocente: (cedula: string) =>
    axios.get(`${DOC}/${cedula}/perfil`),

  getCompetenciasDocente: (cedula: string) =>
    axios.get(`${EVAL}/competencias/${cedula}`),

  /** Descarga el PDF del docente. Retorna Blob. */
  descargarReportePDF: async (cedula: string, periodo?: string): Promise<void> => {
    const url = `${DOC}/${cedula}/reporte.pdf${periodo ? `?periodo=${periodo}` : ''}`;
    const resp = await axios.get(url, { responseType: 'blob' });
    const blob = new Blob([resp.data], { type: 'application/pdf' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = resp.headers['content-disposition']
      ?.split('filename="')[1]?.replace('"', '')
      || `Reporte_${cedula}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
  },

  // ── Competencias y Preguntas (Vista General) ────────────────────────────────
  getCompetenciasPreguntas: () =>
    axios.get(`${EVAL}/competencias-preguntas`),

  // ── Desempeño por variables demográficas ────────────────────────────────────
  getDesempenoPorVariables: (anio?: number, sistema?: string, modelo?: string) =>
    axios.get(`${EVAL}/desempeno-variables?${params({ anio, sistema, modelo })}`),

  // ── Mejor / peor competencia por carrera ─────────────────────────────────────
  getCompetenciasPorCarrera: (anio?: number, sistema?: string, modelo?: string, periodo?: string) =>
    axios.get(`${EVAL}/competencias-por-carrera?${params({ anio, sistema, modelo, periodo })}`),

  // ── Módulo Caracterización del Cuerpo Docente ────────────────────────────────
  getCaracterizacion: (sistema?: string, anio?: number, periodo?: string, modelo?: string) =>
    axios.get(`${EVAL}/caracterizacion?${params({ sistema, anio, periodo, modelo })}`),

  // ── Módulo Reporte de Competencias ───────────────────────────────────────────
  getReporteCompetencias: (sistema?: string, anio?: number, periodo?: string, modelo?: string) =>
    axios.get(`${EVAL}/reporte-competencias?${params({ sistema, anio, periodo, modelo })}`),

  // ── Predicción de tendencias + alertas IA ────────────────────────────────────
  getPrediccionTendencias: (anio?: number, conIa: boolean = true) =>
    axios.get(`${EVAL}/prediccion-tendencias?${params({ anio, con_ia: conIa ? 'true' : 'false' })}`),

  /** Descarga el PDF del informe general (todo, o filtrado por sistema/modelo/periodo). */
  descargarInformeGeneral: async (opts: {
    sistema?: string; modelo?: string; periodo?: string; filename?: string
  } = {}): Promise<void> => {
    const { sistema, modelo, periodo, filename } = opts
    const url = `${EVAL}/reporte-general.pdf?${params({ sistema, modelo, periodo })}`
    const resp = await axios.get(url, { responseType: 'blob' })
    const blob = new Blob([resp.data], { type: 'application/pdf' })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = filename
      || resp.headers['content-disposition']?.split('filename="')[1]?.replace('"', '')
      || `InformeGeneral.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(href)
  },
};
