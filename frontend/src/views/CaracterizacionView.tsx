import React from 'react'
import { Users, RefreshCw } from 'lucide-react'
import { Plot, KPICard, ChartCard, flatBar } from '../shared'

export default function CaracterizacionView(props: any) {
  const { caracterizacion, loadingCaracterizacion, sistemaCaract, setSistemaCaract, modeloCaract, setModeloCaract, fetchCaracterizacion } = props
            const data = caracterizacion
            const porPeriodo: any[]  = data?.por_periodo    || []
            const porGenero: any     = data?.por_genero     || {}
            const porCarrera: any[]  = data?.por_carrera    || []
            const porEdad: any[]     = data?.por_edad       || []
            const porAntig: any[]    = data?.por_antiguedad || []
            const porFacultad: any[] = data?.por_facultad   || []
            const totalEv: number    = data?.total_evaluaciones || 0
            const totalDoc: number   = data?.total_docentes     || 0

            const hombresTotal = porGenero['Hombre'] || 0
            const mujeresTotal = porGenero['Mujer']  || 0
            const genTotal     = hombresTotal + mujeresTotal || 1

            const periLabels = porPeriodo.map((p: any) => p.label || p.periodo)
            const periHom    = porPeriodo.map((p: any) => p.Hombre || 0)
            const periMuj    = porPeriodo.map((p: any) => p.Mujer  || 0)
            const periTot    = porPeriodo.map((p: any) => p.total  || 0)

            const chartPeriodo = {
              data: [
                { type: 'bar', name: 'Hombres', x: periLabels, y: periHom,
                  marker: { color: '#1e40af', opacity: 0.9 },
                  hovertemplate: '<b>Hombres</b><br>%{x}: %{y}<extra></extra>' },
                { type: 'bar', name: 'Mujeres', x: periLabels, y: periMuj,
                  marker: { color: '#9f1239', opacity: 0.9 },
                  hovertemplate: '<b>Mujeres</b><br>%{x}: %{y}<extra></extra>' },
              ],
              layout: {
                autosize: true, paper_bgcolor: 'white', plot_bgcolor: 'white',
                font: { family: 'Inter', size: 9, color: '#64748b' },
                margin: { t: 24, b: 60, l: 44, r: 14 },
                barmode: 'stack',
                xaxis: { tickfont: { family: 'Inter', size: 9, color: '#334155' }, tickangle: -20, showgrid: false, zeroline: false },
                yaxis: { gridcolor: '#f0f4f8', tickfont: { family: 'Inter', size: 9 }, showgrid: true, zeroline: true },
                showlegend: true,
                legend: { font: { family: 'Inter', size: 10 }, orientation: 'h', y: -0.28, bgcolor: 'rgba(0,0,0,0)' },
              },
            }

            const chartGenero = {
              data: [{ type: 'pie', hole: 0.55, labels: ['Hombres', 'Mujeres'],
                values: [hombresTotal, mujeresTotal], marker: { colors: ['#1e40af', '#9f1239'] },
                textfont: { family: 'Inter', size: 10 },
                hovertemplate: '<b>%{label}</b><br>%{value} (%{percent})<extra></extra>' }],
              layout: { autosize: true, paper_bgcolor: 'white', plot_bgcolor: 'white',
                font: { family: 'Inter', size: 9, color: '#64748b' },
                margin: { t: 10, b: 30, l: 10, r: 10 }, showlegend: true,
                legend: { font: { family: 'Inter', size: 10 }, orientation: 'h', y: -0.1, bgcolor: 'rgba(0,0,0,0)' } },
            }

            const chartCarrera = flatBar(
              porCarrera.slice(0, 15).map((c: any) => c.carrera),
              porCarrera.slice(0, 15).map((c: any) => c.total),
              '#1e40af', { showMeta: false, marginB: 110, tickAngle: -38 }
            )
            const chartEdad = flatBar(
              porEdad.map((e: any) => e.rango), porEdad.map((e: any) => e.total),
              ['#1e40af', '#0891b2', '#059669', '#7c3aed'], { showMeta: false }
            )
            const chartAntig = flatBar(
              porAntig.map((a: any) => a.rango), porAntig.map((a: any) => a.total),
              ['#f59e0b', '#d97706', '#b45309', '#92400e'], { showMeta: false }
            )

            return (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg,#78350f,#b45309)' }}>
                    <Users size={22} style={{ color: '#fde68a' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[17px] font-black text-slate-800 leading-tight">Caracterización del Cuerpo Docente</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {sistemaCaract === 'meipa' ? 'Sistema MEIPA 2023-2024' : sistemaCaract === '360' ? 'Sistema MECDI 2024-2025' : 'Todos los sistemas'}
                      {modeloCaract ? ` · Modelo ${modeloCaract.charAt(0).toUpperCase()+modeloCaract.slice(1)}` : ''}
                      {' — volumen de evaluaciones por período, género, carrera, edad y antigüedad'}
                    </p>
                  </div>
                  {loadingCaracterizacion && <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-amber-500 animate-spin" />}
                  <button onClick={() => fetchCaracterizacion()} disabled={loadingCaracterizacion}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-all">
                    <RefreshCw size={11} className={loadingCaracterizacion ? 'animate-spin' : ''} /> Actualizar
                  </button>
                </div>

                {/* ── Filtros Sistema / Modelo ── */}
                {(() => {
                  const SISTEMAS = [
                    { val: '',      label: 'Todos los sistemas' },
                    { val: 'meipa', label: 'MEIPA  2023-2024'   },
                    { val: '360',   label: 'MECDI  2024-2025'   },
                  ]
                  const MODELOS = [
                    { val: '',              label: 'Todos los modelos' },
                    { val: 'docencia',      label: 'Docencia'          },
                    { val: 'posgrado',      label: 'Posgrado'          },
                    { val: 'tecnologado',   label: 'Tecnologado'       },
                    { val: 'vinculacion',   label: 'Vinculación'       },
                    { val: 'gestion',       label: 'Gestión'           },
                    { val: 'investigacion', label: 'Investigación'     },
                    { val: 'abp',           label: 'ABP'               },
                    { val: 'administrativo',label: 'Administrativo'    },
                    { val: 'servicios',     label: 'Servicios'         },
                  ]
                  const selStyle = (active: boolean) => ({
                    appearance: 'none' as const,
                    WebkitAppearance: 'none' as const,
                    padding: '6px 28px 6px 12px',
                    borderRadius: 8,
                    border: active ? '1.5px solid #f59e0b' : '1.5px solid #e2e8f0',
                    background: active ? 'linear-gradient(135deg,#fef3c7,#fde68a)' : '#f8fafc',
                    color: active ? '#92400e' : '#475569',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
                    minWidth: 160,
                  })
                  return (
                    <div className="flex flex-wrap items-center gap-3 mb-5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Filtrar:</span>
                      <div className="relative">
                        <select
                          value={sistemaCaract}
                          style={selStyle(!!sistemaCaract)}
                          onChange={e => {
                            const v = e.target.value
                            setSistemaCaract(v)
                            setCaracterizacion(null)
                            fetchCaracterizacion(v, modeloCaract)
                          }}
                        >
                          {SISTEMAS.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
                        </select>
                      </div>
                      <div className="relative">
                        <select
                          value={modeloCaract}
                          style={selStyle(!!modeloCaract)}
                          onChange={e => {
                            const v = e.target.value
                            setModeloCaract(v)
                            setCaracterizacion(null)
                            fetchCaracterizacion(sistemaCaract, v)
                          }}
                        >
                          {MODELOS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                        </select>
                      </div>
                      {(sistemaCaract || modeloCaract) && (
                        <button
                          onClick={() => {
                            setSistemaCaract('')
                            setModeloCaract('')
                            setCaracterizacion(null)
                            fetchCaracterizacion('', '')
                          }}
                          className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline"
                        >
                          Limpiar filtros
                        </button>
                      )}
                      {(sistemaCaract || modeloCaract) && (
                        <span className="ml-auto text-[9px] text-slate-400 font-semibold">
                          {sistemaCaract === 'meipa' ? '🎓 MEIPA' : sistemaCaract === '360' ? '🔄 MECDI' : ''}
                          {modeloCaract ? `  ·  ${modeloCaract.charAt(0).toUpperCase()+modeloCaract.slice(1)}` : ''}
                        </span>
                      )}
                    </div>
                  )
                })()}

                {!data && !loadingCaracterizacion ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <Users size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">Sin datos disponibles</p>
                    <button onClick={() => fetchCaracterizacion()} className="mt-4 px-4 py-2 rounded-lg text-xs font-bold text-white bg-amber-500 hover:bg-amber-600">Cargar datos</button>
                  </div>
                ) : (
                  <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                      {[
                        { title: 'Total Evaluaciones', value: totalEv.toLocaleString(), label: 'registros', footer: sistemaCaract === 'meipa' ? 'MEIPA 2023-2024' : sistemaCaract === '360' ? 'MECDI 2024-2025' : 'Todos los sistemas', accent: '#f59e0b' },
                        { title: 'Docentes Únicos', value: totalDoc.toLocaleString(), label: 'docentes', footer: 'Identificados', accent: '#1e40af' },
                        { title: 'Docentes Hombres', value: hombresTotal.toLocaleString(), label: `${Math.round(hombresTotal/genTotal*100)}%`, footer: 'Del total', accent: '#1e40af' },
                        { title: 'Docentes Mujeres', value: mujeresTotal.toLocaleString(), label: `${Math.round(mujeresTotal/genTotal*100)}%`, footer: 'Del total', accent: '#9f1239' },
                      ].map(k => <KPICard key={k.title} title={k.title} value={k.value} label={k.label} footer={k.footer} accent={k.accent} icon={null} iconBg={null} />)}
                    </div>

                    {/* Período + Género */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                      <div className="lg:col-span-2">
                        <ChartCard title="Evaluaciones por Período" sub="Evolución Semestral">
                          {periLabels.length > 0 ? (
                            <>
                              <Plot data={chartPeriodo.data} layout={chartPeriodo.layout} config={{ responsive: true, displayModeBar: false }} style={{ width: '100%', height: '240px' }} />
                              <div className="overflow-x-auto mt-3">
                                <table className="w-full text-[10px]">
                                  <thead><tr className="border-b border-slate-100">
                                    <th className="text-left pb-1.5 text-slate-400 font-bold uppercase tracking-wider">Período</th>
                                    <th className="text-right pb-1.5 text-[#1e40af] font-bold uppercase tracking-wider">Hombres</th>
                                    <th className="text-right pb-1.5 text-[#9f1239] font-bold uppercase tracking-wider">Mujeres</th>
                                  </tr></thead>
                                  <tbody>
                                    {porPeriodo.map((p: any, i: number) => (
                                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                                        <td className="py-1.5 font-semibold text-slate-700">{p.label || p.periodo}</td>
                                        <td className="py-1.5 text-right font-semibold" style={{ color: '#1e40af' }}>{(p.Hombre||0).toLocaleString()}</td>
                                        <td className="py-1.5 text-right font-semibold" style={{ color: '#9f1239' }}>{(p.Mujer||0).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          ) : <p className="text-xs text-slate-400 text-center py-10">Sin datos de períodos</p>}
                        </ChartCard>
                      </div>
                      <div>
                        <ChartCard title="Distribución por Género" sub="Global">
                          {(hombresTotal + mujeresTotal) > 0 ? (
                            <>
                              <Plot data={chartGenero.data} layout={chartGenero.layout} config={{ responsive: true, displayModeBar: false }} style={{ width: '100%', height: '180px' }} />
                              <div className="mt-3 space-y-2">
                                {[['Hombres', hombresTotal, '#1e40af'], ['Mujeres', mujeresTotal, '#9f1239']].map(([label, val, color]) => (
                                  <div key={label as string} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color as string }} />
                                    <span className="text-[10px] font-semibold text-slate-600 flex-1">{label}</span>
                                    <span className="text-[11px] font-black" style={{ color: color as string }}>{(val as number).toLocaleString()}</span>
                                    <span className="text-[9px] text-slate-400">{Math.round((val as number)/genTotal*100)}%</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : <p className="text-xs text-slate-400 text-center py-10">Sin datos</p>}
                        </ChartCard>
                      </div>
                    </div>

                    {/* Carrera + Edad + Antigüedad */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                      <div>
                        <ChartCard title="Docentes por Carrera" sub="Top 15">
                          {porCarrera.length > 0 ? (
                            <>
                              <Plot data={chartCarrera.data} layout={chartCarrera.layout} config={{ responsive: true, displayModeBar: false }} style={{ width: '100%', height: '260px' }} />
                              <div className="overflow-y-auto max-h-40 mt-2">
                                {porCarrera.map((c: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2 py-1 border-b border-slate-50">
                                    <span className="text-[9px] text-slate-400 w-4">{i+1}</span>
                                    <span className="text-[10px] font-semibold text-slate-700 flex-1 truncate">{c.carrera}</span>
                                    <span className="text-[10px] font-black text-slate-800">{c.total}</span>
                                    <span className="text-[9px] text-[#1e40af]">H:{c.Hombre||0}</span>
                                    <span className="text-[9px] text-[#9f1239]">M:{c.Mujer||0}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : <p className="text-xs text-slate-400 text-center py-10">Sin datos</p>}
                        </ChartCard>
                      </div>
                      <div>
                        <ChartCard title="Distribución por Edad" sub="Rangos etarios">
                          {porEdad.length > 0 ? (
                            <>
                              <Plot data={chartEdad.data} layout={chartEdad.layout} config={{ responsive: true, displayModeBar: false }} style={{ width: '100%', height: '180px' }} />
                              <div className="mt-3 space-y-1">
                                {porEdad.map((e: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2 py-1 border-b border-slate-50">
                                    <span className="text-[10px] font-semibold text-slate-600 flex-1">{e.rango}</span>
                                    <span className="text-[11px] font-black text-slate-800">{e.total}</span>
                                    <span className="text-[9px] text-[#1e40af]">H:{e.Hombre||0}</span>
                                    <span className="text-[9px] text-[#9f1239]">M:{e.Mujer||0}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : <p className="text-xs text-slate-400 text-center py-10">Sin datos de edad</p>}
                        </ChartCard>
                      </div>
                      <div>
                        <ChartCard title="Distribución por Antigüedad" sub="Años de servicio">
                          {porAntig.length > 0 ? (
                            <>
                              <Plot data={chartAntig.data} layout={chartAntig.layout} config={{ responsive: true, displayModeBar: false }} style={{ width: '100%', height: '180px' }} />
                              <div className="mt-3 space-y-1">
                                {porAntig.map((a: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2 py-1 border-b border-slate-50">
                                    <span className="text-[10px] font-semibold text-slate-600 flex-1">{a.rango}</span>
                                    <span className="text-[11px] font-black text-slate-800">{a.total}</span>
                                    <span className="text-[9px] text-[#1e40af]">H:{a.Hombre||0}</span>
                                    <span className="text-[9px] text-[#9f1239]">M:{a.Mujer||0}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : <p className="text-xs text-slate-400 text-center py-10">Sin datos de antigüedad</p>}
                        </ChartCard>
                      </div>
                    </div>

                    {/* Por facultad */}
                    {porFacultad.length > 0 && (
                      <ChartCard title="Evaluaciones por Unidad Académica / Facultad" sub="Conteo total">
                        <div className="space-y-2">
                          {porFacultad.map((f: any, i: number) => {
                            const pct = Math.round(f.total / (totalEv || 1) * 100)
                            return (
                              <div key={i} className="space-y-0.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-semibold text-slate-700 truncate pr-2">{f.facultad}</span>
                                  <span className="text-[11px] font-black text-slate-800 flex-shrink-0">{f.total} <span className="text-[9px] text-slate-400 font-normal">({pct}%)</span></span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#f59e0b' }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </ChartCard>
                    )}
                  </>
                )}
              </div>
            )
}
