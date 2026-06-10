import React from 'react'
import { BarChart3, Users, Award } from 'lucide-react'

export default function DesempenoPorVariables({ data }: { data: any }) {
  const pctColor = (v: number) => v >= 90 ? '#059669' : v >= 80 ? '#0056b3' : v >= 70 ? '#d97706' : '#dc2626'

  const MiniTable = ({ title, icon, rows }: { title: string; icon: string; rows: { categoria: string; promedio: number; n: number }[] }) => {
    if (!rows || rows.length === 0) return null
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100 bg-slate-50/60">
          <span className="text-base">{icon}</span>
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.1em]">{title}</span>
        </div>
        <div className="divide-y divide-slate-50">
          {rows.map((r, i) => (
            <div key={i} className="px-4 py-2.5 flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 w-5 tabular-nums">{i + 1}</span>
              <span className="flex-1 text-[11px] text-slate-700 font-medium truncate">{r.categoria}</span>
              <span className="text-[9px] text-slate-400 tabular-nums shrink-0">{r.n} doc.</span>
              <div className="w-20 flex items-center gap-1.5 shrink-0">
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(r.promedio, 100)}%`, background: pctColor(r.promedio) }} />
                </div>
                <span className="text-[10px] font-black tabular-nums w-9 text-right" style={{ color: pctColor(r.promedio) }}>{r.promedio}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const HeroCard = ({ label, sub, docente, accent }: { label: string; sub: string; docente: any; accent: string }) => {
    if (!docente) return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-center min-h-[100px]">
        <p className="text-[10px] text-slate-400 italic">Sin datos disponibles</p>
      </div>
    )
    return (
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: `${accent}30`, borderTopWidth: 3, borderTopColor: accent }}>
        <div className="px-5 py-3 flex items-start gap-3">
          <div className="p-2 rounded-xl shrink-0" style={{ background: `${accent}12` }}>
            <Award size={18} style={{ color: accent }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] mb-0.5" style={{ color: accent }}>{label}</p>
            <p className="text-[11px] font-black text-slate-800 truncate uppercase leading-tight">{docente.nombre}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{sub} · {docente.facultad || 'Sin facultad'}</p>
            {docente.n_evaluadores && (
              <p className="text-[9px] text-slate-400 mt-0.5">
                <span className="font-bold text-slate-600">{docente.n_evaluadores}</span> evaluadores prom.
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: pctColor(docente.puntaje) }}>{docente.puntaje}</p>
            <p className="text-[8px] text-slate-400 font-semibold">/ 100</p>
          </div>
        </div>
      </div>
    )
  }

  // TC vs TP comparison bar
  const tcVsTp = data.tc_vs_tp
  const topEvaluados: any[] = data.top_evaluados || []

  return (
    <div className="mt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-50">
          <BarChart3 size={18} className="text-emerald-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-slate-800">Desempeño por Variables</h3>
          <p className="text-[11px] text-slate-400">Análisis por tipo de contrato, género, antigüedad y formación académica</p>
        </div>
        {data.n_evaluadores_promedio && (
          <div className="text-right shrink-0 bg-blue-50 px-3 py-2 rounded-xl">
            <p className="text-[18px] font-black text-blue-700 tabular-nums leading-none">{data.n_evaluadores_promedio}</p>
            <p className="text-[9px] text-blue-400 font-semibold uppercase tracking-wide">Eval. promedio / docente</p>
          </div>
        )}
      </div>

      {/* TC vs TP comparison */}
      {tcVsTp && (tcVsTp.tc?.promedio || tcVsTp.tp?.promedio) && (
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">Comparativa Tiempo Completo vs Tiempo Parcial</p>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="grid grid-cols-2 gap-6">
              {[
                { key: 'tc', color: '#059669', bg: '#f0fdf4', label: 'Tiempo Completo', short: 'TC' },
                { key: 'tp', color: '#0056b3', bg: '#eff6ff', label: 'Tiempo Parcial / Medio', short: 'TP' },
              ].map(({ key, color, bg, label, short }) => {
                const d = tcVsTp[key]
                if (!d?.promedio) return null
                return (
                  <div key={key} className="text-center">
                    <div className="inline-flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">{short}</span>
                    </div>
                    <div className="text-[32px] font-black tabular-nums leading-none mb-1" style={{ color }}>{d.promedio}</div>
                    <div className="text-[9px] text-slate-400 mb-2">/ 100 · {d.n} docentes</div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${d.promedio}%`, background: color }} />
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1">{label}</div>
                  </div>
                )
              })}
            </div>
            {tcVsTp.tc?.promedio && tcVsTp.tp?.promedio && (
              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                {tcVsTp.tc.promedio > tcVsTp.tp.promedio ? (
                  <p className="text-[11px] text-slate-600">
                    Los docentes de <span className="font-black text-emerald-600">Tiempo Completo</span> superan en{' '}
                    <span className="font-black">{(tcVsTp.tc.promedio - tcVsTp.tp.promedio).toFixed(1)} pts</span> a los de Tiempo Parcial
                  </p>
                ) : tcVsTp.tp.promedio > tcVsTp.tc.promedio ? (
                  <p className="text-[11px] text-slate-600">
                    Los docentes de <span className="font-black text-blue-600">Tiempo Parcial</span> superan en{' '}
                    <span className="font-black">{(tcVsTp.tp.promedio - tcVsTp.tc.promedio).toFixed(1)} pts</span> a los de Tiempo Completo
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-600 font-bold">Rendimiento equivalente entre TC y TP</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero cards: mejor TC / TP */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">Mejor docente por tipo de contrato</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <HeroCard label="Mejor Docente — Tiempo Completo" sub="TC" docente={data.mejor_tc} accent="#059669" />
          <HeroCard label="Mejor Docente — Tiempo Parcial"  sub="TP" docente={data.mejor_tp} accent="#0056b3" />
        </div>
      </div>

      {/* Mini tables: 4 variables (sin función) */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">Promedio por otras variables</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MiniTable title="Género"             icon="👥" rows={data.sexo || []} />
          <MiniTable title="Nivel de estudio"   icon="📚" rows={data.nivel_estudio || []} />
          <MiniTable title="Antigüedad"         icon="📅" rows={data.antiguedad || []} />
        </div>
      </div>

      {/* Top evaluados table */}
      {topEvaluados.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">
            Docentes con mayor cantidad de estudiantes evaluadores
          </p>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th className="text-left py-2.5 px-4 font-black text-slate-500 uppercase tracking-[0.08em] w-8">#</th>
                  <th className="text-left py-2.5 px-4 font-black text-slate-500 uppercase tracking-[0.08em]">Docente</th>
                  <th className="text-left py-2.5 px-4 font-black text-slate-500 uppercase tracking-[0.08em] hidden sm:table-cell">Facultad</th>
                  <th className="text-center py-2.5 px-4 font-black text-slate-500 uppercase tracking-[0.08em]">Evaluadores</th>
                  <th className="text-center py-2.5 px-4 font-black text-slate-500 uppercase tracking-[0.08em]">Tipo</th>
                  <th className="text-right py-2.5 px-4 font-black text-slate-500 uppercase tracking-[0.08em]">Puntaje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topEvaluados.map((d: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-black text-slate-400 tabular-nums">{i + 1}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800 uppercase">{d.nombre}</td>
                    <td className="py-2.5 px-4 text-slate-500 hidden sm:table-cell">{d.facultad || '—'}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-black px-2 py-0.5 rounded-full text-[10px]">
                        <Users size={9} /> {d.n_evaluadores}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{
                        background: d.ts?.toLowerCase().includes('completo') ? '#f0fdf4' : '#eff6ff',
                        color: d.ts?.toLowerCase().includes('completo') ? '#059669' : '#0056b3',
                      }}>
                        {d.ts?.toLowerCase().includes('completo') ? 'TC' : d.ts?.toLowerCase().includes('parcial') ? 'TP' : d.ts?.toLowerCase().includes('medio') ? 'MT' : '—'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-black tabular-nums" style={{ color: pctColor(d.puntaje) }}>{d.puntaje}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── CompetenciasPreguntas ──────────────────────────────────────────────────────
