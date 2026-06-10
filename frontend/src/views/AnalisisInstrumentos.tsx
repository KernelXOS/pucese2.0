import React from 'react'
import { TrendingUp, Search, AlertCircle, Microscope, GraduationCap, Calendar, ChevronRight } from 'lucide-react'
import CompetenciasPreguntas from '../components/CompetenciasPreguntas'

export default function AnalisisInstrumentos(props: any) {
  const { ranking, compPreguntas, compPorCarrera, compDetalle, loadingCompDetalle, cdFiltroCarrera, setCdFiltroCarrera, cdFiltroPeriodo, setCdFiltroPeriodo, cdBusqueda, setCdBusqueda, cdOrden, setCdOrden } = props
            // Datos YA cargados en el dashboard — no necesitan fetch adicional
            const carrerasData: any[] = compPorCarrera || []
            const periodos: string[]  = compPreguntas?.periodos || []
            const topComp: any[]  = compPreguntas?.competencias_top  || []
            const peorComp: any[] = compPreguntas?.competencias_peor || []
            const topPreg: any[]  = compPreguntas?.preguntas_top     || []
            const peorPreg: any[] = compPreguntas?.preguntas_peor    || []
            // todas_competencias — preferir compPreguntas (ya cargado al inicio)
            const rawTodas: any[] = compPreguntas?.todas_competencias || compDetalle?.todas_competencias || []
            const todasComp: any[] = rawTodas.length > 0
              ? rawTodas
              : (() => {
                  const seen = new Set<string>()
                  const merged: any[] = []
                  for (const c of [...topComp, ...peorComp]) {
                    if (!seen.has(c.competencia)) { seen.add(c.competencia); merged.push(c) }
                  }
                  return merged.sort((a,b) => b.promedio - a.promedio)
                })()
            // por_carrera — competencias desglosadas por carrera
            const porCarreraComp: any[] = compPreguntas?.por_carrera || compDetalle?.por_carrera || []

            const periodLabel = (p: string) =>
              p === '202501' ? 'I-2025' : p === '202502' ? 'II-2025' :
              p === '202402' ? 'II-2024' : p === '202401' ? 'I-2024' : p

            const scoreColor = (v: number) =>
              v >= 85 ? '#16a34a' : v >= 70 ? '#ca8a04' : '#dc2626'

            const scoreBg = (v: number) =>
              v >= 85 ? '#f0fdf4' : v >= 70 ? '#fefce8' : '#fef2f2'

            // Filtros aplicados
            const filtPeriodo = cdFiltroPeriodo
            const filtCarrera = cdFiltroCarrera
            const busq = cdBusqueda.toLowerCase()

            const filterComp = (rows: any[]) => rows
              .filter(r => !busq || (r.competencia||r.pregunta||'').toLowerCase().includes(busq))
              .filter(r => filtPeriodo === '__todos__' || r[filtPeriodo] != null)

            const allCarreras = carrerasData.map((c: any) => c.carrera)
            const filtCarrerasData = carrerasData
              .filter((c: any) => cdFiltroCarrera === '__todas__' || c.carrera === cdFiltroCarrera)
              .filter((c: any) => !busq || c.carrera.toLowerCase().includes(busq) ||
                (c.mejor_componente || '').toLowerCase().includes(busq) ||
                (c.peor_componente  || '').toLowerCase().includes(busq))
            const noData = todasComp.length === 0 && porCarreraComp.length === 0
            return (
              <div>
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg,#064e3b,#065f46)' }}>
                    <Microscope size={22} style={{ color: '#6ee7b7' }} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-[17px] font-black text-slate-800 leading-tight">
                      Análisis Detallado — Instrumentos y Competencias
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {carrerasData.length} carreras &middot; {todasComp.length} competencias globales &middot; {periodos.length} períodos
                    </p>
                  </div>
                  {loadingCompDetalle && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-emerald-500 animate-spin" />
                      <span className="text-xs">Cargando más datos…</span>
                    </div>
                  )}
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Filtros</span>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex-1 min-w-[180px]">
                    <Search size={12} className="text-slate-400 flex-shrink-0" />
                    <input className="text-xs bg-transparent outline-none w-full text-slate-700 placeholder-slate-400"
                      placeholder="Buscar carrera o competencia..."
                      value={cdBusqueda} onChange={e => setCdBusqueda(e.target.value)} />
                    {cdBusqueda && <button onClick={() => setCdBusqueda('')} className="text-slate-400 hover:text-slate-600 text-xs">x</button>}
                  </div>
                  {allCarreras.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                      <GraduationCap size={12} className="text-slate-400" />
                      <select className="text-xs font-bold text-slate-600 bg-transparent outline-none cursor-pointer"
                        value={cdFiltroCarrera} onChange={e => setCdFiltroCarrera(e.target.value)}>
                        <option value="__todas__">Todas las carreras</option>
                        {allCarreras.map((c: string) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                  {periodos.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                      <Calendar size={12} className="text-slate-400" />
                      <select className="text-xs font-bold text-slate-600 bg-transparent outline-none cursor-pointer"
                        value={cdFiltroPeriodo} onChange={e => setCdFiltroPeriodo(e.target.value)}>
                        <option value="__todos__">Todos los períodos</option>
                        {periodos.map(p => <option key={p} value={p}>{periodLabel(p)}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                    <TrendingUp size={12} className="text-slate-400" />
                    <select className="text-xs font-bold text-slate-600 bg-transparent outline-none cursor-pointer"
                      value={cdOrden} onChange={e => setCdOrden(e.target.value as any)}>
                      <option value="promedio">Ordenar por puntaje</option>
                      <option value="nombre">Ordenar por nombre</option>
                    </select>
                  </div>
                  <button onClick={() => { setCdBusqueda(''); setCdFiltroPeriodo('__todos__'); setCdFiltroCarrera('__todas__'); setCdOrden('promedio') }}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    Limpiar
                  </button>
                </div>

                {noData ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                    <AlertCircle size={36} className="opacity-40" />
                    <p className="font-bold">No hay datos disponibles</p>
                    <p className="text-xs">Ve primero a Vista General o MECDI para cargar los datos</p>
                  </div>
                ) : (
                  <>
                    {/* ── Todas las Competencias (tabla completa) ── */}
                    {todasComp.length > 0 && (
                      <div className="mb-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">
                          Todas las Competencias &mdash; {todasComp.length} competencias &middot; ranking global
                        </p>
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <span className="text-base">🏆</span>
                            <span className="text-[12px] font-black text-slate-700 uppercase tracking-[0.12em]">Ranking de Competencias MECDI</span>
                            <span className="ml-auto text-[10px] text-slate-400 font-semibold">{todasComp.length} competencias</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-[11px]">
                              <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                  <th className="text-left py-2 px-4 font-black text-slate-500 uppercase tracking-[0.08em] w-8">#</th>
                                  <th className="text-left py-2 px-4 font-black text-slate-500 uppercase tracking-[0.08em]">Área de Competencia</th>
                                  {periodos.map(p => (
                                    <th key={p} className="text-center py-2 px-3 font-black text-slate-500 uppercase tracking-[0.08em] whitespace-nowrap">
                                      {periodLabel(p)}
                                    </th>
                                  ))}
                                  <th className="text-right py-2 px-4 font-black text-slate-500 uppercase tracking-[0.08em] whitespace-nowrap">Promedio</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...todasComp].sort((a: any, b: any) => b.promedio - a.promedio).map((c: any, i: number) => {
                                  const isTop = i < Math.ceil(todasComp.length / 2)
                                  return (
                                    <tr key={i} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                                      <td className="py-2.5 px-4 font-black" style={{ color: isTop ? '#16a34a' : '#dc2626' }}>{i + 1}</td>
                                      <td className="py-2.5 px-4 text-slate-700 font-medium leading-tight max-w-xs">{c.competencia}</td>
                                      {periodos.map(p => {
                                        const v = c[p]
                                        return (
                                          <td key={p} className="py-2.5 px-3 text-center">
                                            {v != null
                                              ? <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black"
                                                  style={{ background: scoreColor(v) + '18', color: scoreColor(v) }}>{v.toFixed(1)}%</span>
                                              : <span className="text-slate-300">—</span>}
                                          </td>
                                        )
                                      })}
                                      <td className="py-2.5 px-4">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(c.promedio, 100)}%`, background: scoreColor(c.promedio) }} />
                                          </div>
                                          <span className="text-[11px] font-black tabular-nums shrink-0" style={{ color: scoreColor(c.promedio) }}>{c.promedio.toFixed(1)}%</span>
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Competencias por Carrera (19 secciones colapsables) ── */}
                    {porCarreraComp.length > 0 && (
                      <div className="mb-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">
                          Competencias por Carrera &mdash; {porCarreraComp.length} carreras
                        </p>
                        <div className="space-y-2">
                          {[...porCarreraComp]
                            .sort((a: any, b: any) => b.promedio - a.promedio)
                            .map((car: any, ci: number) => {
                              const compList: any[] = [...(car.competencias || [])].sort((a: any, b: any) => b.promedio - a.promedio)
                              return (
                                <details key={ci} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
                                  <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-slate-50 transition-colors list-none">
                                    <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: '#dcfce7' }}>
                                      <GraduationCap size={12} style={{ color: '#16a34a' }} />
                                    </div>
                                    <span className="font-black text-[13px] text-slate-800 flex-1">{car.carrera}</span>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                      <span className="text-[10px] text-slate-400 font-semibold">{car.n} evals</span>
                                      <span className="text-[10px] text-slate-400 font-semibold">{compList.length} competencias</span>
                                      <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-black"
                                        style={{ background: scoreBg(car.promedio), color: scoreColor(car.promedio) }}>
                                        {typeof car.promedio === 'number' ? car.promedio.toFixed(1) : car.promedio}%
                                      </span>
                                      <ChevronRight size={14} className="text-slate-300 group-open:rotate-90 transition-transform" />
                                    </div>
                                  </summary>
                                  {compList.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-slate-400 text-xs border-t border-slate-100">
                                      Sin datos de competencias para esta carrera
                                    </div>
                                  ) : (
                                    <div className="border-t border-slate-100 overflow-x-auto">
                                      <table className="w-full text-[11px]">
                                        <thead>
                                          <tr style={{ background: '#f8fafc' }}>
                                            <th className="text-left py-2.5 px-3 font-black text-slate-400 w-8">#</th>
                                            <th className="text-left py-2.5 px-3 font-black text-slate-500">Competencia</th>
                                            {periodos.map(p => (
                                              <th key={p} className="text-center py-2.5 px-2 font-black text-indigo-400 whitespace-nowrap" style={{ fontSize: 10 }}>
                                                {periodLabel(p)}
                                              </th>
                                            ))}
                                            <th className="text-right py-2.5 px-3 font-black text-slate-500">Prom.</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {compList.map((c: any, i: number) => (
                                            <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                                              <td className="py-2 px-3 font-black text-slate-300">{i + 1}</td>
                                              <td className="py-2 px-3 text-slate-700 font-semibold">{c.competencia}</td>
                                              {periodos.map(p => {
                                                const v = c[p]
                                                return (
                                                  <td key={p} className="py-2 px-2 text-center">
                                                    {v != null
                                                      ? <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black"
                                                          style={{ background: scoreBg(v), color: scoreColor(v) }}>{v.toFixed(1)}%</span>
                                                      : <span className="text-slate-200">—</span>}
                                                  </td>
                                                )
                                              })}
                                              <td className="py-2 px-3 text-right">
                                                <span className="inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-black"
                                                  style={{ background: scoreBg(c.promedio), color: scoreColor(c.promedio) }}>
                                                  {c.promedio.toFixed(1)}%
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </details>
                              )
                            })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── Módulo MEIPA: Heteroevaluación y Competencias ── */}
                {compPreguntas && <CompetenciasPreguntas data={compPreguntas} />}
              </div>
            )
}
