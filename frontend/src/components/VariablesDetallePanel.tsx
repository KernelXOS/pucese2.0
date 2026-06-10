import React, { useState } from 'react'

export default function VariablesDetallePanel({
  title, accentColor, tabs, varData,
}: {
  title: string; accentColor: string;
  tabs: { key: string; label: string; icon: any; color: string }[];
  varData: Record<string, any[]>;
}) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key || '')
  const [activeComp, setActiveComp] = useState<number>(0)
  const rows: any[] = varData[activeTab] || []
  const tabCfg = tabs.find(t => t.key === activeTab) || tabs[0]
  const color = tabCfg?.color || accentColor
  const comp = rows[activeComp] || null

  const onChange = (key: string) => { setActiveTab(key); setActiveComp(0) }

  const TeacherMini = ({ doc, rank, type }: { doc: any; rank: number; type: 'best' | 'worst' }) => {
    const isBest = type === 'best'
    return (
      <div className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
        <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black"
          style={{ background: isBest ? `${color}15` : '#fef2f2', color: isBest ? color : '#dc2626' }}>
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-700 truncate uppercase">{doc.nombre}</p>
          <p className="text-[9px] text-slate-400">{doc.cedula}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-[11px] font-black tabular-nums" style={{ color: isBest ? color : '#dc2626' }}>
            {doc.comp_pct}%
          </p>
          <p className="text-[8px] text-slate-400">tot: {doc.puntaje}/100</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 overflow-hidden mb-6"
      style={{ borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderTop: `3px solid ${accentColor}` }}>

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Variables ·</span>
        <span className="ml-1 text-[13px] font-bold text-slate-700">{title}</span>
      </div>

      {/* Model tabs */}
      {tabs.length > 1 && (
        <div className="flex overflow-x-auto border-b border-slate-100 px-4 gap-1 pt-2">
          {tabs.map(t => {
            const TIcon = t.icon
            const isA = activeTab === t.key
            const hasData = (varData[t.key] || []).length > 0
            if (!hasData) return null
            return (
              <button key={t.key} onClick={() => onChange(t.key)}
                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold whitespace-nowrap rounded-t flex-shrink-0 transition-all"
                style={{
                  color: isA ? t.color : '#94a3b8',
                  background: isA ? `${t.color}10` : 'transparent',
                  borderBottom: isA ? `2px solid ${t.color}` : '2px solid transparent',
                }}>
                <TIcon size={11} />{t.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Body: component list + teacher detail */}
      {rows.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-8">Sin datos para este modelo</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

          {/* Left: component ranking */}
          <div className="p-5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Componentes — Promedio General
            </p>
            <div className="space-y-2">
              {rows.map((r: any, i: number) => (
                <button key={r.key} onClick={() => setActiveComp(i)}
                  className="w-full text-left group"
                  style={{ outline: 'none' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 truncate pr-2"
                      style={{ color: activeComp === i ? color : undefined }}>
                      {r.label}
                    </span>
                    <span className="text-[10px] font-black tabular-nums flex-shrink-0"
                      style={{ color: activeComp === i ? color : '#64748b' }}>
                      {r.avg_pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${r.avg_pct}%`,
                        background: activeComp === i
                          ? color
                          : r.avg_pct >= 90 ? '#059669' : r.avg_pct >= 75 ? '#0056b3' : r.avg_pct >= 60 ? '#d97706' : '#dc2626',
                      }} />
                  </div>
                  <p className="text-[8px] text-slate-400 mt-0.5">{r.n} registros</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right: top/bottom for selected component */}
          {comp && (
            <div className="p-5">
              <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color }}>
                {comp.label}
              </p>
              <p className="text-[8px] text-slate-400 mb-4">
                Promedio: <strong>{comp.avg_pct}%</strong> · {comp.n} evaluaciones
              </p>

              {comp.top5?.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mayor Puntaje</p>
                  </div>
                  {comp.top5.map((doc: any, i: number) => (
                    <TeacherMini key={i} doc={doc} rank={i + 1} type="best" />
                  ))}
                </>
              )}

              {comp.bot5?.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-4 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Menor Puntaje</p>
                  </div>
                  {comp.bot5.map((doc: any, i: number) => (
                    <TeacherMini key={i} doc={doc} rank={i + 1} type="worst" />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Todos los Docentes Panel ──────────────────────────────────────────────────
