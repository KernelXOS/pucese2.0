import React, { useState } from 'react'
import { api } from '../services/api'
import { BrainCircuit, FileText, Search, Copy } from 'lucide-react'
import { PREGUNTAS_GENERAL, PREGUNTAS_CARRERAS, PREGUNTAS_DOCENTES, MarkdownView } from '../shared'

export default function AIConsultaPanel({ anio }: { anio?: number }) {
  const [pregunta, setPregunta]         = useState('')
  const [respuesta, setRespuesta]       = useState('')
  const [loading, setLoading]           = useState(false)
  const [loadingInforme, setLoadingInforme] = useState(false)
  const [preguntaActiva, setPreguntaActiva] = useState<string | null>(null)
  const [tabPreg, setTabPreg]           = useState<'general'|'carreras'|'docentes'>('general')
  const [modoInforme, setModoInforme]   = useState(false)
  const [informe, setInforme]           = useState('')

  const TABS_MAP = { general: PREGUNTAS_GENERAL, carreras: PREGUNTAS_CARRERAS, docentes: PREGUNTAS_DOCENTES }
  const TABS_LABEL = { general: 'General', carreras: 'Por Carrera', docentes: 'Por Docente' }

  const preguntar = async (q: string) => {
    if (!q.trim() || loading) return
    setLoading(true)
    setModoInforme(false)
    setRespuesta('')
    setPreguntaActiva(q)
    setPregunta('')
    try {
      const res = await api.consultaIA(q, anio)
      setRespuesta(res.data.respuesta)
    } catch {
      setRespuesta('⚠️ Error al conectar con la IA. Verifica que la API Key de Gemini esté configurada.')
    } finally {
      setLoading(false)
    }
  }

  const generarInforme = async () => {
    if (loadingInforme) return
    setLoadingInforme(true)
    setModoInforme(true)
    setRespuesta('')
    setInforme('')
    try {
      const res = await api.informeIA()
      setInforme(res.data.informe)
    } catch {
      setInforme('⚠️ Error al generar el informe. Verifica que la API Key de Gemini esté configurada.')
    } finally {
      setLoadingInforme(false)
    }
  }

  const copiarTexto = (txt: string) => {
    navigator.clipboard.writeText(txt).catch(() => {})
  }

  const contenidoActual = modoInforme ? informe : respuesta
  const isWorking = modoInforme ? loadingInforme : loading

  return (
    <div className="bg-white border border-slate-200 overflow-hidden mb-6"
      style={{ borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderLeft: '3px solid #4f46e5' }}>

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BrainCircuit size={14} className="text-indigo-400" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Inteligencia Artificial ·</span>
          <h3 className="text-[13px] font-bold text-slate-700">Análisis IA sobre Evaluación Docente</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generarInforme}
            disabled={loadingInforme || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg,#059669,#0891b2)', boxShadow: '0 2px 8px rgba(5,150,105,0.25)' }}
          >
            {loadingInforme
              ? <><div className="w-2.5 h-2.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Generando…</>
              : <><FileText size={10} /> Generar Informe IA</>
            }
          </button>
          <span className="text-[9px] font-bold px-2 py-1 rounded text-indigo-500 border border-indigo-100 bg-indigo-50">
            Gemini
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Tabs de categorías */}
        <div>
          <div className="flex gap-1 mb-3">
            {(Object.keys(TABS_MAP) as Array<keyof typeof TABS_MAP>).map(t => (
              <button key={t} onClick={() => setTabPreg(t)}
                className="text-[9px] font-bold px-3 py-1 rounded-full border transition-all"
                style={{
                  background: tabPreg === t ? '#eef2ff' : '#f8fafc',
                  borderColor: tabPreg === t ? '#4f46e5' : '#e2e8f0',
                  color: tabPreg === t ? '#4f46e5' : '#94a3b8',
                }}>
                {TABS_LABEL[t]}
              </button>
            ))}
            <span className="ml-auto text-[9px] text-slate-400 font-medium self-center">Haz clic para consultar</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TABS_MAP[tabPreg].map(q => (
              <button key={q} onClick={() => preguntar(q)} disabled={loading || loadingInforme}
                className="text-[10px] font-semibold px-3 py-1.5 rounded-full border transition-all disabled:opacity-50 text-left"
                style={{
                  borderColor: preguntaActiva === q && respuesta && !modoInforme ? '#4f46e5' : '#e2e8f0',
                  background:  preguntaActiva === q && respuesta && !modoInforme ? '#eef2ff' : '#f8fafc',
                  color:       preguntaActiva === q && respuesta && !modoInforme ? '#4f46e5' : '#64748b',
                }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input libre */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Escribe cualquier pregunta sobre los datos… (Enter para enviar)"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 transition-all"
              value={pregunta}
              onChange={e => setPregunta(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && preguntar(pregunta)}
              disabled={loading || loadingInforme}
            />
          </div>
          <button
            onClick={() => preguntar(pregunta)}
            disabled={loading || loadingInforme || !pregunta.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 12px rgba(79,70,229,0.25)' }}
          >
            {loading
              ? <><div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Analizando…</>
              : <><BrainCircuit size={12} /> Consultar</>
            }
          </button>
        </div>

        {/* Área de respuesta */}
        {(isWorking || contenidoActual) && (
          <div className="rounded-xl border overflow-hidden"
            style={{ borderColor: modoInforme ? '#a7f3d0' : '#c7d2fe', background: modoInforme ? '#f0fdf4' : '#eef2ff20' }}>
            {/* Sub-header de respuesta */}
            <div className="px-4 py-2 border-b flex items-center justify-between"
              style={{ borderColor: modoInforme ? '#a7f3d0' : '#c7d2fe', background: modoInforme ? '#d1fae5' : '#eef2ff' }}>
              <div className="flex items-center gap-2">
                {isWorking
                  ? <div className="w-3 h-3 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
                  : <BrainCircuit size={12} className={modoInforme ? 'text-emerald-600' : 'text-indigo-500'} />}
                <span className="text-[9px] font-black uppercase tracking-widest"
                  style={{ color: modoInforme ? '#059669' : '#4f46e5' }}>
                  {isWorking
                    ? (modoInforme ? 'Generando informe completo…' : 'Analizando datos reales…')
                    : (modoInforme ? 'Informe Ejecutivo IA' : `Respuesta a: "${preguntaActiva}"`)
                  }
                </span>
              </div>
              {!isWorking && contenidoActual && (
                <button onClick={() => copiarTexto(contenidoActual)}
                  className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded border transition-all hover:bg-white"
                  style={{ borderColor: modoInforme ? '#6ee7b7' : '#c7d2fe', color: modoInforme ? '#059669' : '#4f46e5' }}>
                  <Copy size={9} /> Copiar
                </button>
              )}
            </div>
            {/* Contenido */}
            <div className="p-5 max-h-[600px] overflow-y-auto">
              {isWorking
                ? <div className="flex items-center gap-3 text-slate-400 py-4">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin flex-shrink-0" />
                    <span className="text-xs font-semibold animate-pulse">
                      {modoInforme
                        ? 'Analizando todos los datos: ranking, tendencias, carreras, demografía… Esto puede tardar ~15s'
                        : 'Consultando datos reales de evaluación docente…'}
                    </span>
                  </div>
                : <MarkdownView text={contenidoActual} />
              }
            </div>
          </div>
        )}

        {!isWorking && !contenidoActual && (
          <div className="flex items-start gap-3 py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
            <BrainCircuit size={18} className="text-indigo-200 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-slate-600 mb-1">¿Qué puedo analizar?</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Selecciona una pregunta frecuente, escribe la tuya, o haz clic en <strong>Generar Informe IA</strong> para obtener
                un análisis ejecutivo completo con ranking, tendencias, carreras con problemas y recomendaciones estratégicas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Comparativo panel ─────────────────────────────────────────────────────────
