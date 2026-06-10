import React from 'react'
import { TrendingUp, BrainCircuit, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react'
import { Plot } from '../shared'

export default function PrediccionView(props: any) {
  const { tendencias, prediccion, loadingPrediccion, fetchPrediccion } = props
            const preds: any[] = prediccion?.predicciones || []
            const resumen = prediccion?.resumen || {}
            const alertasIA: string = prediccion?.alertas_ia || ''
            const enRiesgo = preds.filter(p => p.clasificacion === 'bajando')
            const enMejora = preds.filter(p => p.clasificacion === 'subiendo')

            const sColor = (v: number) => v >= 85 ? '#16a34a' : v >= 70 ? '#ca8a04' : '#dc2626'
            const sBg    = (v: number) => v >= 85 ? '#f0fdf4' : v >= 70 ? '#fefce8' : '#fef2f2'

            return (
              <div>
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl" style={{ background:'linear-gradient(135deg,#581c87,#7e22ce)' }}>
                    <TrendingUp size={22} style={{ color:'#d8b4fe' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[17px] font-black text-slate-800 leading-tight">Predicción de Tendencias y Alertas</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Proyección al próximo período (I-2026) basada en la evolución histórica · IA + análisis estadístico
                    </p>
                  </div>
                  {loadingPrediccion && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-purple-500 animate-spin" />
                      <span className="text-xs">Calculando proyecciones…</span>
                    </div>
                  )}
                </div>

                {loadingPrediccion ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                    <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-purple-500 animate-spin" />
                    <p className="font-bold text-sm">Analizando tendencias con IA…</p>
                  </div>
                ) : preds.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                    <AlertCircle size={36} className="opacity-40" />
                    <p className="font-bold">No hay suficientes datos para proyectar</p>
                    <p className="text-xs">Se necesitan al menos 2 períodos con datos por carrera</p>
                  </div>
                ) : (
                  <>
                    {/* Resumen */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5" style={{ borderTop:'3px solid #dc2626' }}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-2">En Riesgo</p>
                        <p className="font-black text-red-600" style={{ fontSize:30 }}>{resumen.en_riesgo ?? enRiesgo.length}</p>
                        <p className="text-[10px] text-slate-400 mt-1">carreras en descenso</p>
                      </div>
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5" style={{ borderTop:'3px solid #94a3b8' }}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-2">Estables</p>
                        <p className="font-black text-slate-600" style={{ fontSize:30 }}>{resumen.estables ?? 0}</p>
                        <p className="text-[10px] text-slate-400 mt-1">sin cambio relevante</p>
                      </div>
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5" style={{ borderTop:'3px solid #16a34a' }}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-2">En Mejora</p>
                        <p className="font-black text-green-600" style={{ fontSize:30 }}>{resumen.en_mejora ?? enMejora.length}</p>
                        <p className="text-[10px] text-slate-400 mt-1">carreras subiendo</p>
                      </div>
                    </div>

                    {/* Gráfico: cambio proyectado por carrera */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-500" />
                        <span className="text-[13px] font-black text-slate-700">Cambio Proyectado al Próximo Período</span>
                        <span className="ml-auto text-[10px] text-slate-400">verde = mejora · rojo = caída</span>
                      </div>
                      <div className="p-4">
                        <Plot
                          data={[{
                            type: 'bar' as const, orientation: 'h' as const,
                            x: [...preds].sort((a,b)=>a.cambio_proyectado-b.cambio_proyectado).map(p=>p.cambio_proyectado),
                            y: [...preds].sort((a,b)=>a.cambio_proyectado-b.cambio_proyectado).map(p=>p.carrera),
                            marker: { color: [...preds].sort((a,b)=>a.cambio_proyectado-b.cambio_proyectado).map(p=>p.cambio_proyectado < 0 ? '#dc2626' : '#16a34a'), opacity:0.85 },
                            text: [...preds].sort((a,b)=>a.cambio_proyectado-b.cambio_proyectado).map(p=>`${p.cambio_proyectado>0?'+':''}${p.cambio_proyectado}`),
                            textposition: 'outside' as const, textfont:{ size:10, family:'Inter' },
                            hovertemplate: '<b>%{y}</b><br>Cambio proyectado: %{x:+.1f} pts<extra></extra>',
                          }]}
                          layout={{
                            autosize:true, height: Math.max(300, preds.length*30),
                            paper_bgcolor:'white', plot_bgcolor:'white',
                            font:{ family:'Inter', size:10, color:'#64748b' },
                            margin:{ t:10, b:40, l:200, r:50 },
                            xaxis:{ zeroline:true, zerolinecolor:'#cbd5e1', showgrid:true, gridcolor:'#f0f4f8', ticksuffix:' pts' },
                            yaxis:{ tickfont:{ size:10, color:'#334155' }, showgrid:false },
                          }}
                          config={{ displayModeBar:false, responsive:true }}
                          style={{ width:'100%' }} useResizeHandler
                        />
                      </div>
                    </div>

                    {/* Cards: en riesgo / en mejora */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                      {/* En riesgo */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100" style={{ background:'#fef2f2' }}>
                          <span className="text-base">&#9888;</span>
                          <span className="text-[11px] font-black text-red-700 uppercase tracking-[0.1em]">Carreras en Riesgo</span>
                          <span className="ml-auto text-[10px] text-slate-400">{enRiesgo.length}</span>
                        </div>
                        <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
                          {enRiesgo.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">Ninguna carrera en descenso 🎉</p>}
                          {enRiesgo.map((p, i) => (
                            <div key={i} className="rounded-xl border border-red-100 p-3" style={{ background:'#fffafa' }}>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="font-bold text-slate-800 text-[12px] truncate" title={p.carrera}>{p.carrera}</span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                                  style={{ background: p.riesgo==='alto' ? '#fee2e2' : '#fef3c7', color: p.riesgo==='alto' ? '#b91c1c' : '#b45309' }}>
                                  riesgo {p.riesgo}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] mb-1.5">
                                {p.serie.map((s: any, j: number) => (
                                  <span key={j} className="px-1.5 py-0.5 rounded font-bold tabular-nums"
                                    style={{ background:sBg(s.valor), color:sColor(s.valor) }}>{s.valor}</span>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="text-slate-500">Último <b className="text-slate-700">{p.ultimo_valor}</b></span>
                                <ChevronRight size={12} className="text-slate-300" />
                                <span className="text-red-600 font-black">{p.proyeccion} <span className="font-normal text-slate-400">proy.</span></span>
                                <span className="ml-auto font-black text-red-600">{p.cambio_proyectado} pts</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* En mejora */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100" style={{ background:'#f0fdf4' }}>
                          <span className="text-base">&#128200;</span>
                          <span className="text-[11px] font-black text-emerald-800 uppercase tracking-[0.1em]">Carreras en Mejora</span>
                          <span className="ml-auto text-[10px] text-slate-400">{enMejora.length}</span>
                        </div>
                        <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
                          {enMejora.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">Sin carreras en mejora marcada</p>}
                          {enMejora.map((p, i) => (
                            <div key={i} className="rounded-xl border border-emerald-100 p-3" style={{ background:'#fafffb' }}>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="font-bold text-slate-800 text-[12px] truncate" title={p.carrera}>{p.carrera}</span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0" style={{ background:'#dcfce7', color:'#16a34a' }}>
                                  +{p.cambio_proyectado} pts
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] mb-1.5">
                                {p.serie.map((s: any, j: number) => (
                                  <span key={j} className="px-1.5 py-0.5 rounded font-bold tabular-nums"
                                    style={{ background:sBg(s.valor), color:sColor(s.valor) }}>{s.valor}</span>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="text-slate-500">Último <b className="text-slate-700">{p.ultimo_valor}</b></span>
                                <ChevronRight size={12} className="text-slate-300" />
                                <span className="text-emerald-600 font-black">{p.proyeccion} <span className="font-normal text-slate-400">proy.</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Alertas IA */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2" style={{ background:'linear-gradient(135deg,#faf5ff,#fff)' }}>
                        <BrainCircuit size={16} style={{ color:'#9333ea' }} />
                        <span className="text-[13px] font-black text-slate-700">Análisis y Alertas — Inteligencia Artificial</span>
                        <span className="ml-auto text-[9px] font-bold text-purple-400 uppercase tracking-[0.15em]">Gemini</span>
                      </div>
                      <div className="p-5">
                        {alertasIA === '__IA_BUSY__' ? (
                          <div className="flex flex-col items-center gap-3 py-6 text-center">
                            <AlertCircle size={28} className="text-amber-400" />
                            <p className="text-sm font-bold text-slate-600">El servidor de IA está saturado en este momento</p>
                            <p className="text-xs text-slate-400 max-w-sm">Google reporta alta demanda temporal. Las proyecciones de arriba ya están calculadas; solo falta el texto de la IA.</p>
                            <button onClick={fetchPrediccion} disabled={loadingPrediccion}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-95 disabled:opacity-60"
                              style={{ background:'linear-gradient(135deg,#9333ea,#7e22ce)', boxShadow:'0 4px 14px rgba(147,51,234,0.35)' }}>
                              <RefreshCw size={13} className={loadingPrediccion ? 'animate-spin' : ''} />
                              {loadingPrediccion ? 'Reintentando…' : 'Reintentar análisis IA'}
                            </button>
                          </div>
                        ) : alertasIA === '__IA_ERROR__' || !alertasIA ? (
                          <div className="flex flex-col items-center gap-3 py-6 text-center">
                            <BrainCircuit size={26} className="text-slate-300" />
                            <p className="text-sm font-bold text-slate-500">Análisis IA no disponible</p>
                            <p className="text-xs text-slate-400 max-w-sm">No se pudo generar el texto (verifica la API key de Gemini en el servidor). Las proyecciones de arriba se calculan sin IA.</p>
                            <button onClick={fetchPrediccion} disabled={loadingPrediccion}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 transition-all hover:bg-slate-200 disabled:opacity-60">
                              <RefreshCw size={13} className={loadingPrediccion ? 'animate-spin' : ''} />
                              {loadingPrediccion ? 'Reintentando…' : 'Reintentar'}
                            </button>
                          </div>
                        ) : (
                          <p className="text-[12px] text-slate-700 leading-relaxed whitespace-pre-wrap">{alertasIA}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
}
