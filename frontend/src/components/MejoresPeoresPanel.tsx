import React, { useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { CATEGORIA_ICONS, CATEGORIA_COLORS } from '../shared'

export default function MejoresPeoresPanel({ mejoresPeores }: { mejoresPeores: Record<string, any> }) {
  const cats = Object.keys(mejoresPeores || {})
  const [active, setActive] = useState(cats[0] || '')
  if (!cats.length) return null

  const data = mejoresPeores[active] || { mejores: [], peores: [], total: 0 }
  const color = CATEGORIA_COLORS[active] || '#0056b3'
  const Icon  = CATEGORIA_ICONS[active] || GraduationCap

  const nivelColor = (n: string) => ({
    'Excelente': { bg:'#ecfdf5', text:'#059669', border:'#a7f3d0' },
    'Bueno':     { bg:'#eff6ff', text:'#0056b3', border:'#bfdbfe' },
    'Regular':   { bg:'#fef3c7', text:'#d97706', border:'#fde68a' },
    'Deficiente':{ bg:'#fef2f2', text:'#dc2626', border:'#fecaca' },
  }[n] || { bg:'#f8fafc', text:'#64748b', border:'#e2e8f0' })

  const TeacherRow = ({ doc, rank, type }: { doc: any; rank: number; type: 'best'|'worst' }) => {
    const nc = nivelColor(doc.nivel)
    const isBest = type === 'best'
    return (
      <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
        <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
          style={{ background: isBest ? `${color}15` : '#fef2f2', color: isBest ? color : '#dc2626' }}>
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-slate-700 truncate uppercase leading-tight">{doc.nombre}</p>
          <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5">{doc.facultad || '—'}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-black tabular-nums" style={{ color: isBest ? color : '#dc2626' }}>{doc.puntaje}</span>
          <span className="text-[9px] text-slate-400">/100</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border"
            style={{ background: nc.bg, color: nc.text, borderColor: nc.border }}>
            {doc.nivel}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 overflow-hidden mb-6"
      style={{ borderRadius: 6, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', borderTop:`3px solid ${color}` }}>

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color }} />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ranking ·</span>
          <h3 className="text-[13px] font-bold text-slate-700">Mejores y Peores Docentes por Rol</h3>
        </div>
        <span className="text-[9px] font-bold px-2 py-1 rounded border"
          style={{ color, background:`${color}08`, borderColor:`${color}25` }}>
          {data.total} evaluados
        </span>
      </div>

      {/* Category tabs */}
      <div className="flex overflow-x-auto border-b border-slate-100 px-4 gap-1 pt-2">
        {cats.map(cat => {
          const CatIcon = CATEGORIA_ICONS[cat] || GraduationCap
          const catColor = CATEGORIA_COLORS[cat] || '#0056b3'
          const isActive = active === cat
          return (
            <button key={cat} onClick={() => setActive(cat)}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold whitespace-nowrap rounded-t transition-all flex-shrink-0"
              style={{
                color: isActive ? catColor : '#94a3b8',
                background: isActive ? `${catColor}10` : 'transparent',
                borderBottom: isActive ? `2px solid ${catColor}` : '2px solid transparent',
              }}>
              <CatIcon size={11} />
              {cat}
              <span className="ml-1 text-[8px] font-black px-1 py-0.5 rounded"
                style={{ background: isActive ? `${catColor}20` : '#f1f5f9', color: isActive ? catColor : '#94a3b8' }}>
                {(mejoresPeores[cat]?.total || 0)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content: two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

        {/* Mejores */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Top 5 — Mejor Desempeño
            </p>
          </div>
          {data.mejores.length > 0 ? (
            data.mejores.map((doc: any, i: number) => (
              <TeacherRow key={i} doc={doc} rank={i + 1} type="best" />
            ))
          ) : (
            <p className="text-xs text-slate-400 font-medium py-4 text-center">Sin datos</p>
          )}
        </div>

        {/* Peores */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Bottom 5 — Menor Desempeño
            </p>
          </div>
          {data.peores.length > 0 ? (
            data.peores.map((doc: any, i: number) => (
              <TeacherRow key={i} doc={doc} rank={i + 1} type="worst" />
            ))
          ) : (
            <p className="text-xs text-slate-400 font-medium py-4 text-center">Sin datos</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Variables Detalle Panel ───────────────────────────────────────────────────
