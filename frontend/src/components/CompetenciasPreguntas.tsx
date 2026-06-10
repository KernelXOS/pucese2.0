import React from 'react'
import { GraduationCap } from 'lucide-react'

export default function CompetenciasPreguntas({ data, showMecdiTables = false }: { data: any; showMecdiTables?: boolean }) {
  const periodos: string[] = data.periodos || []
  const meipaPeriodos: string[] = data.meipa_periodos || []
  const meipaComps: any[]       = data.meipa_componentes || []

  // MEIPA Hetero (nuevo archivo consolidado) — MEIPA solo hasta I-2024
  const _mhPeriodosRaw: string[] = data.meipa_hetero_periodos || []
  // Excluir II-2024 y cualquier período posterior (MEIPA terminó en I-2024)
  const mhPeriodos: string[] = _mhPeriodosRaw.filter((p: string) => {
    const lbl = p.replace(/\s*[Pp]eríodo\s*/g, ' ').trim()
    if (/2025|2026/.test(lbl)) return false
    if (/^II.*(2024)/.test(lbl)) return false
    return true
  })
  // Recalcular promedio solo con los períodos válidos
  const mhPromedioFiltrado = (row: any): number => {
    const vals = mhPeriodos.map(p => row[p]).filter((v: any) => v != null) as number[]
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  }
  const mhTop: any[]         = data.meipa_hetero_top        || []
  const mhPeor: any[]        = data.meipa_hetero_peor       || []
  const mhTodas: any[]       = data.meipa_hetero_todas      || [...mhTop, ...mhPeor].sort((a:any,b:any)=>b.promedio-a.promedio)
  const mhCarreras: any[]    = data.meipa_hetero_por_carrera || []

  const periodLabel = (p: string) => {
    const m: Record<string,string> = {
      '202301':'I-2023','202302':'II-2023','202401':'I-2024',
      '202402':'II-2024','202501':'I-2025','202502':'II-2025',
    }
    return m[p] || p
  }

  const scoreColor = (v: number) =>
    v >= 85 ? '#16a34a' : v >= 70 ? '#ca8a04' : '#dc2626'

  const ScoreBar = ({ value, max = 100 }: { value: number; max?: number }) => (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(value / max * 100, 100)}%`, background: scoreColor(value) }} />
      </div>
      <span className="text-[11px] font-black tabular-nums shrink-0" style={{ color: scoreColor(value) }}>{value.toFixed(1)}%</span>
    </div>
  )

  interface TableRow { [key: string]: any }

  const TableSection = ({
    title, icon, rows, nameKey, accent, flip = false,
  }: { title: string; icon: string; rows: TableRow[]; nameKey: string; accent: string; flip?: boolean }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* header */}
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <span className="text-base">{icon}</span>
        <span className="text-[12px] font-black text-slate-700 uppercase tracking-[0.12em]">{title}</span>
        <span className="ml-auto text-[10px] text-slate-400 font-semibold">{rows.length} ítems</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th className="text-left py-2 px-4 font-black text-slate-500 uppercase tracking-[0.08em] w-8">#</th>
              <th className="text-left py-2 px-4 font-black text-slate-500 uppercase tracking-[0.08em]">Descripción</th>
              {periodos.map(p => (
                <th key={p} className="text-center py-2 px-3 font-black text-slate-500 uppercase tracking-[0.08em] whitespace-nowrap">{periodLabel(p)}</th>
              ))}
              <th className="text-right py-2 px-4 font-black text-slate-500 uppercase tracking-[0.08em] whitespace-nowrap">Promedio</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const name = String(row[nameKey] || '')
              const display = name.length > 72 ? name.slice(0, 72) + '…' : name
              return (
                <tr key={i} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-black" style={{ color: flip ? '#dc2626' : '#16a34a' }}>
                    {flip ? rows.length - i : i + 1}
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 font-medium leading-tight max-w-xs">
                    <span title={name}>{display}</span>
                  </td>
                  {periodos.map(p => {
                    const v = row[p]
                    return (
                      <td key={p} className="py-2.5 px-3 text-center">
                        {v != null
                          ? <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: scoreColor(v) + '18', color: scoreColor(v) }}>{v.toFixed(1)}%</span>
                          : <span className="text-slate-300">—</span>
                        }
                      </td>
                    )
                  })}
                  <td className="py-2.5 px-4">
                    <ScoreBar value={row.promedio} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="mt-8 space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-indigo-50">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-800">Análisis de Competencias y Preguntas</h3>
          <p className="text-[11px] text-slate-400">Ranking por período — basado en evaluaciones detalladas</p>
        </div>
      </div>

      {/* ── Competencias top/worst + Preguntas (solo en dashboard principal) ── */}
      {showMecdiTables && (
        <>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">Competencias evaluadas</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TableSection title="Mejores competencias" icon="🏆" rows={data.competencias_top || []} nameKey="competencia" accent="#16a34a" />
              <TableSection title="Competencias a mejorar" icon="⚠️" rows={data.competencias_peor || []} nameKey="competencia" accent="#dc2626" flip />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">Preguntas individuales</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TableSection title="Preguntas mejor puntuadas" icon="⭐" rows={data.preguntas_top || []} nameKey="pregunta" accent="#16a34a" />
              <TableSection title="Preguntas críticas" icon="📉" rows={data.preguntas_peor || []} nameKey="pregunta" accent="#dc2626" flip />
            </div>
          </div>
        </>
      )}

      {/* ── MEIPA componentes desde BD ─────────────────────────────────────── */}
      {meipaComps.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em]">Componentes MEIPA</span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#eff6ff', color: '#1e40af' }}>2023 – 2024</span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <span className="text-base">📋</span>
              <span className="text-[12px] font-black text-slate-700 uppercase tracking-[0.12em]">Promedio por componente MEIPA</span>
              <span className="ml-auto text-[10px] text-slate-400 font-semibold">{meipaComps.length} componentes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th className="text-left py-2 px-4 font-black text-slate-500 uppercase tracking-[0.08em] w-8">#</th>
                    <th className="text-left py-2 px-4 font-black text-slate-500 uppercase tracking-[0.08em]">Componente</th>
                    <th className="text-center py-2 px-3 font-black text-slate-400 uppercase tracking-[0.08em] whitespace-nowrap">Peso</th>
                    {meipaPeriodos.map(p => (
                      <th key={p} className="text-center py-2 px-3 font-black text-slate-500 uppercase tracking-[0.08em] whitespace-nowrap">{periodLabel(p)}</th>
                    ))}
                    <th className="text-right py-2 px-4 font-black text-slate-500 uppercase tracking-[0.08em] whitespace-nowrap">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {meipaComps.map((comp: any, i: number) => {
                    const scoreColor = (v: number) => v >= 85 ? '#16a34a' : v >= 70 ? '#ca8a04' : '#dc2626'
                    return (
                      <tr key={i} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 font-black text-[#1e40af]">{i + 1}</td>
                        <td className="py-2.5 px-4 text-slate-700 font-semibold">{comp.competencia}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[9px] font-bold text-slate-400">{comp.peso}%</span>
                        </td>
                        {meipaPeriodos.map(p => {
                          const v = comp[p]
                          return (
                            <td key={p} className="py-2.5 px-3 text-center">
                              {v != null
                                ? <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: scoreColor(v) + '18', color: scoreColor(v) }}>{v.toFixed(1)}%</span>
                                : <span className="text-slate-300">—</span>
                              }
                            </td>
                          )
                        })}
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.min((comp.promedio ?? 0), 100)}%`, background: scoreColor(comp.promedio ?? 0) }} />
                            </div>
                            <span className="text-[11px] font-black tabular-nums shrink-0" style={{ color: scoreColor(comp.promedio ?? 0) }}>{(comp.promedio ?? 0).toFixed(1)}%</span>
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

      {/* ══ MEIPA — Heteroevaluación Estudiantil (archivo consolidado 2023-2024) ══ */}
      {mhTop.length > 0 && (
        <div className="mt-2">
          {/* Divisor con título de sección */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-slate-200" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '1px solid #bfdbfe' }}>
              <span className="text-[10px] font-black text-blue-700 uppercase tracking-[0.15em]">MEIPA · Heteroevaluación Estudiantil</span>
              <span className="text-[9px] text-blue-500 font-semibold">2023 – 2024</span>
            </div>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Tabla única de todas las competencias MEIPA ordenadas de mejor a peor */}
          <div className="mb-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">Competencias evaluadas · MEIPA</p>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <span className="text-base">🏆</span>
                <span className="text-[12px] font-black text-slate-700 uppercase tracking-[0.12em]">Ranking de Competencias MEIPA</span>
                <span className="ml-auto text-[10px] text-slate-400 font-semibold">{mhTodas.length} competencias</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th className="text-left py-2 px-4 font-black text-slate-500 uppercase tracking-[0.08em] w-8">#</th>
                      <th className="text-left py-2 px-4 font-black text-slate-500 uppercase tracking-[0.08em]">Área de Competencia</th>
                      {mhPeriodos.map(p => (
                        <th key={p} className="text-center py-2 px-3 font-black text-slate-500 uppercase tracking-[0.08em] whitespace-nowrap">{p.replace(' Período','')}</th>
                      ))}
                      <th className="text-right py-2 px-4 font-black text-slate-500 uppercase tracking-[0.08em] whitespace-nowrap">Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...mhTodas].sort((a:any,b:any)=>mhPromedioFiltrado(b)-mhPromedioFiltrado(a)).map((row: any, i: number) => {
                      const prom = mhPromedioFiltrado(row)
                      const isTop = i < Math.ceil(mhTodas.length / 2)
                      return (
                        <tr key={i} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-4 font-black" style={{ color: isTop ? '#16a34a' : '#dc2626' }}>{i + 1}</td>
                          <td className="py-2.5 px-4 text-slate-700 font-medium leading-tight max-w-xs">
                            <span title={row.competencia}>{row.competencia}</span>
                          </td>
                          {mhPeriodos.map(p => {
                            const v = row[p]
                            return (
                              <td key={p} className="py-2.5 px-3 text-center">
                                {v != null
                                  ? <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: scoreColor(v)+'18', color: scoreColor(v) }}>{v.toFixed(1)}%</span>
                                  : <span className="text-slate-300">—</span>}
                              </td>
                            )
                          })}
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(prom,100)}%`, background: scoreColor(prom) }} />
                              </div>
                              <span className="text-[11px] font-black tabular-nums shrink-0" style={{ color: scoreColor(prom) }}>{prom.toFixed(1)}%</span>
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

          {/* Por carrera */}
          {mhCarreras.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">Por carrera · MEIPA Heteroevaluación</p>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <GraduationCap size={14} className="text-blue-500" />
                  <span className="text-[12px] font-black text-slate-700 uppercase tracking-[0.12em]">Competencias por carrera</span>
                  <span className="ml-auto text-[10px] text-slate-400">{mhCarreras.length} carreras</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {mhCarreras.map((car: any, ci: number) => (
                    <details key={ci} className="group">
                      <summary className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-slate-50 list-none">
                        <GraduationCap size={12} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] font-black text-slate-700 flex-1">{car.carrera}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">{car.n} eval.</span>
                        <span className="text-[11px] font-black px-2 py-0.5 rounded" style={{ background: scoreColor(car.promedio)+'18', color: scoreColor(car.promedio) }}>{car.promedio.toFixed(1)}%</span>
                        <span className="text-[9px] text-slate-300 group-open:rotate-90 transition-transform">▶</span>
                      </summary>
                      <div className="px-5 pb-4 overflow-x-auto">
                        <table className="w-full text-[10px] mt-2">
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              <th className="text-left py-1.5 px-3 font-black text-slate-400 uppercase">Competencia</th>
                              {mhPeriodos.map(p => <th key={p} className="text-center py-1.5 px-2 font-black text-slate-400 uppercase whitespace-nowrap">{p.replace(' Período','')}</th>)}
                              <th className="text-right py-1.5 px-3 font-black text-slate-400 uppercase">Prom.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(car.competencias || []).map((comp: any, j: number) => (
                              <tr key={j} className="border-t border-slate-50">
                                <td className="py-1.5 px-3 text-slate-600 font-medium max-w-[200px]">
                                  <span className="block truncate" title={comp.competencia}>{comp.competencia}</span>
                                </td>
                                {mhPeriodos.map(p => {
                                  const v = comp[p]
                                  return (
                                    <td key={p} className="py-1.5 px-2 text-center">
                                      {v != null
                                        ? <span className="font-black" style={{ color: scoreColor(v) }}>{v.toFixed(1)}%</span>
                                        : <span className="text-slate-300">—</span>}
                                    </td>
                                  )
                                })}
                                <td className="py-1.5 px-3 text-right font-black" style={{ color: scoreColor(comp.promedio) }}>{comp.promedio.toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

