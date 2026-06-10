import React from 'react'
import { BarChart3, RefreshCw, FileText, GraduationCap, Download, Loader2 } from 'lucide-react'
import { VD_360_TABS } from '../shared'
import AIConsultaPanel from '../components/AIConsultaPanel'
import ComparativoPanel from '../components/ComparativoPanel'
import MejoresPeoresPanel from '../components/MejoresPeoresPanel'
import VariablesDetallePanel from '../components/VariablesDetallePanel'
import DesempenoPorVariables from '../components/DesempenoPorVariables'
import CompetenciasPreguntas from '../components/CompetenciasPreguntas'
import TodosDocentesPanel from '../components/TodosDocentesPanel'

export default function DashboardOverview(props: any) {
  const { activeAnio, ranking, tendencias, comparativo, compPreguntas, desempVars, compPorCarrera, todosDocentes, loading, processing, comparativoRef, exportingInforme, handleDescargarInforme, runETL } = props
  return (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <h2 className="text-base font-bold text-slate-800">Vista Comparativa — MEIPA vs MECDI</h2>
                  <p className="text-[11px] text-slate-400">Análisis cruzado de ambos modelos de evaluación docente</p>
                </div>
                {loading && <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-[#1e40af] animate-spin" />}
              </div>

              {/* ── Banner Informe General Institucional ──────────────────── */}
              <div className="flex items-center justify-between gap-4 mb-6 px-5 py-4 rounded-2xl border relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                style={{ background:'linear-gradient(135deg,#0f172a 0%,#0056b3 100%)', borderColor:'#1e40af', boxShadow:'0 10px 30px -10px rgba(0,86,179,0.5)' }}>
                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background:'radial-gradient(circle at 80% 20%, rgba(147,197,253,0.25) 0%, transparent 50%)' }} />
                <div className="flex items-center gap-3 relative">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm"
                    style={{ background:'rgba(255,255,255,0.12)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.15)' }}>
                    <FileText size={20} style={{ color:'#93c5fd' }}/>
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-white leading-tight">Informe General Institucional</p>
                    <p className="text-[10px] mt-0.5" style={{ color:'rgba(255,255,255,0.55)' }}>
                      PDF completo con todos los evaluados, tendencias, ranking y estadísticas — MEIPA + MECDI
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDescargarInforme(undefined, undefined)}
                  disabled={exportingInforme}
                  className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white flex-shrink-0 transition-all duration-200 disabled:opacity-60 active:scale-95 hover:bg-white/30 hover:scale-[1.03]"
                  style={{ background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.25)', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}
                >
                  {exportingInforme ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
                  <span>{exportingInforme ? 'Generando…' : 'Descargar PDF'}</span>
                </button>
              </div>
              <div ref={comparativoRef}>
                {/* ── Estado vacío: no hay datos en la BD ────────────────── */}
                {!loading && (!comparativo || ((comparativo.meipa?.n ?? 0) === 0 && (comparativo['360']?.n ?? 0) === 0)) && (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                      style={{ background:'rgba(0,86,179,0.07)', border:'1.5px dashed #93c5fd' }}>
                      <BarChart3 size={28} style={{ color:'#3b82f6', opacity:.6 }} />
                    </div>
                    <h3 className="text-base font-bold text-slate-700 mb-1">No hay datos cargados</h3>
                    <p className="text-xs text-slate-400 max-w-xs mb-6">
                      La base de datos está vacía. Haz clic en <strong>Cargar datos</strong> para procesar los archivos de evaluación.
                    </p>
                    <button
                      onClick={runETL}
                      disabled={processing}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                      style={{ background:'linear-gradient(135deg,#0056b3,#1a7fc1)', boxShadow:'0 4px 14px rgba(0,86,179,0.35)' }}
                    >
                      {processing
                        ? <><Loader2 size={14} className="animate-spin" /> Cargando datos…</>
                        : <><RefreshCw size={14} /> Cargar datos</>}
                    </button>
                  </div>
                )}
                <ComparativoPanel comparativo={comparativo} />

              {/* ── Mejor / Peor Competencia por Carrera ───────────────────── */}
              {compPorCarrera.length > 0 && (() => {
                const CARR_SET = new Set([
                  'Administración de Empresas', 'Agroindustria', 'Contabilidad y Auditoría',
                  'Derecho', 'Diseño Gráfico', 'Edu. Básica Semi - Quinindé', 'Educación Básica',
                  'Enfermería', 'Enfermería – Quinindé', 'Enfermería – San Lorenzo',
                  'Fisioterapia', 'Ing. Recursos Naturales Renova', 'Laboratorio Clínico',
                  'Medicina', 'Negocios Internacionales', 'Pedagogía Idiomas Nac. Ext.',
                  'Psicología', 'TC Enfermería', 'Tecnologías de la Información',
                  'TG Desarrollo de Software', 'TG Gestión Culinaria',
                ])
                const filtered = compPorCarrera.filter((d: any) => CARR_SET.has(d.carrera))
                if (!filtered.length) return null
                return (
                  <div className="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden mt-5">
                    <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-1 h-6 rounded-full bg-gradient-to-b from-violet-500 to-blue-500" />
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.18em]">Análisis · Instrumentos</p>
                        <h3 className="text-[13px] font-black text-slate-800 leading-tight">Mejor y Peor Instrumento por Carrera</h3>
                      </div>
                      <span className="ml-auto text-[9px] font-semibold text-slate-300">{filtered.length} carreras</span>
                    </div>
                    <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
                      <table className="w-full text-[11px] border-collapse">
                        <thead className="sticky top-0 z-10" style={{ background: '#f8fafc' }}>
                          <tr>
                            <th className="text-left py-2 px-3 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200">Carrera / Programa</th>
                            <th className="text-center py-2 px-2 font-black text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200" style={{ color:'#059669' }}>✦ Mejor Instrumento</th>
                            <th className="text-center py-2 px-2 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200 w-14">Ptje.</th>
                            <th className="text-center py-2 px-2 font-black text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200" style={{ color:'#dc2626' }}>▼ Peor Instrumento</th>
                            <th className="text-center py-2 px-2 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200 w-14">Ptje.</th>
                            <th className="text-center py-2 px-2 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200 w-14">Brecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((row: any) => {
                            const brecha = row.mejor_puntaje - row.peor_puntaje
                            return (
                              <tr key={row.carrera} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                <td className="py-2 px-3">
                                  <span className="font-semibold text-slate-700 text-[10px] leading-tight"
                                    style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'inline-block' }}
                                    title={row.carrera}>{row.carrera}</span>
                                  <span className="text-slate-300 text-[8px] ml-1">({row.n})</span>
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                                    style={{ background:'#ecfdf5', color:'#059669', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'inline-block' }}
                                    title={row.mejor_comp}>{row.mejor_comp}</span>
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <span className="font-black tabular-nums text-[12px]" style={{ color:'#059669' }}>{row.mejor_puntaje.toFixed(1)}</span>
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                                    style={{ background:'#fef2f2', color:'#dc2626', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'inline-block' }}
                                    title={row.peor_comp}>{row.peor_comp}</span>
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <span className="font-black tabular-nums text-[12px]" style={{ color:'#dc2626' }}>{row.peor_puntaje.toFixed(1)}</span>
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <span className="text-[10px] font-bold tabular-nums"
                                    style={{ color: brecha > 20 ? '#dc2626' : brecha > 10 ? '#d97706' : '#64748b' }}>
                                    {brecha.toFixed(1)}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })()}

              {comparativo?.mejores_peores && Object.keys(comparativo.mejores_peores).length > 0 && (
                <MejoresPeoresPanel mejoresPeores={comparativo.mejores_peores} />
              )}
              {comparativo?.variables_detalle && (() => {
                const vd = comparativo.variables_detalle as Record<string, any[]>
                const has360 = VD_360_TABS.some(t => (vd[t.key] || []).length > 0)
                const hasMeipa = (vd['meipa_docencia'] || []).length > 0
                return (
                  <>
                    {has360 && (
                      <VariablesDetallePanel
                        title="Puntaje por Variable — Modelo MECDI"
                        accentColor="#0056b3"
                        tabs={VD_360_TABS}
                        varData={vd}
                      />
                    )}
                    {hasMeipa && (
                      <VariablesDetallePanel
                        title="Puntaje por Variable — Modelo MEIPA"
                        accentColor="#6d28d9"
                        tabs={[{ key: 'meipa_docencia', label: 'Docencia', icon: GraduationCap, color: '#6d28d9' }]}
                        varData={vd}
                      />
                    )}
                  </>
                )
              })()}
              {/* ── Desempeño por Variables ──────────────────────────────── */}
              {desempVars && <DesempenoPorVariables data={desempVars} />}

              {todosDocentes.length > 0 && (
                <div className="mt-10">
                  <TodosDocentesPanel docentes={todosDocentes} />
                </div>
              )}

              {/* ── Competencias y Preguntas ─────────────────────────────── */}
              {compPreguntas && <CompetenciasPreguntas data={compPreguntas} showMecdiTables />}

              <AIConsultaPanel anio={activeAnio} />
              </div>{/* end comparativoRef */}
            </>
  )
}
