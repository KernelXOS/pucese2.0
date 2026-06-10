import React, { useState } from 'react'
import Plot from 'react-plotly.js'
import { BarChart3, Award } from 'lucide-react'
import { ChartCard, normPeriodo, displayPeriodo } from '../shared'

export default function ComparativoPanel({ comparativo }: { comparativo: any }) {
  const [crossPeriodo, setCrossPeriodo] = useState<string>('__todos__')
  if (!comparativo) return null

  const meipa      = comparativo.meipa || { promedio: null, n: 0 }
  const tres60     = comparativo['360'] || { promedio: null, n: 0 }
  const porModelo: Record<string, any> = comparativo.por_modelo_360 || {}
  const tendMeipa: any[]  = comparativo.tendencia_meipa || []
  const tend360:   any[]  = comparativo.tendencia_360   || []
  const tendPeriodosMeipa: any[] = comparativo.tendencia_periodos_meipa || []
  const tendPeriodos360:   any[] = comparativo.tendencia_periodos_360   || []
  const porModeloPeriodo: Record<string, any[]> = comparativo.por_modelo_por_periodo || {}
  const generoPorPeriodo: any[]  = comparativo.genero_por_periodo       || []
  const edadPorPeriodo:   any[]  = comparativo.edad_por_periodo         || []
  const antiguedadPorPeriodo: any[] = comparativo.antiguedad_por_periodo || []
  const facultadPorPeriodo: any[]   = comparativo.facultad_por_periodo   || []
  const porFacultad: any[] = comparativo.por_facultad   || []
  const porGenero: Record<string, number> = comparativo.por_genero || {}
  const porEdad: Record<string, number|null> = comparativo.por_edad || {}
  const porAnt: Record<string, number|null>  = comparativo.por_antiguedad || {}
  const generoEdad: Record<string, Record<string, number|null>> = comparativo.genero_edad || {}
  const generoAnt: Record<string, Record<string, number|null>>  = comparativo.genero_antiguedad || {}
  const generoEdadPorPeriodo: any[]       = comparativo.genero_edad_por_periodo       || []
  const generoAntiguedadPorPeriodo: any[] = comparativo.genero_antiguedad_por_periodo || []

  const AGE_BRACKETS  = ['< 30 años', '31-45 años', '46-60 años', '61+ años']
  const ANTIG_BRACKETS = ['0-3 años', '4-10 años', '11-20 años', '20+ años']

  const filterNull = (obj: Record<string, number|null>) => ({
    keys: Object.keys(obj).filter(k => obj[k] != null),
    vals: Object.values(obj).filter(v => v != null) as number[],
  })

  const { keys: gKeys, vals: gVals } = filterNull(porGenero as any)
  const { keys: eKeys, vals: eVals } = filterNull(porEdad)
  const { keys: aKeys, vals: aVals } = filterNull(porAnt)

  const GENDER_COLORS: Record<string, string> = { 'Mujer': '#f43f5e', 'Hombre': '#0056b3' }
  const gColors = gKeys.map(k => GENDER_COLORS[k] || '#94a3b8')

  // Best / worst label helpers
  const bestKey = (obj: Record<string, number|null>) => {
    const filtered = Object.entries(obj).filter(([, v]) => v != null) as [string, number][]
    if (!filtered.length) return null
    return filtered.reduce((a, b) => a[1] > b[1] ? a : b)[0]
  }
  const bestGenero  = bestKey(porGenero as any)
  const bestEdad    = bestKey(porEdad)
  const bestAnt     = bestKey(porAnt)

  return (
    <div className="space-y-6 mb-8">

      {/* ── Row 1: MEIPA vs 360 summary cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="group bg-white border border-slate-200 col-span-1 rounded-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
          style={{ borderTop:'3px solid #6366f1', boxShadow:'0 1px 3px rgba(0,0,0,0.06), 0 8px 24px -12px rgba(99,102,241,0.18)', padding:'18px 20px' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 32px -8px rgba(99,102,241,0.35), 0 4px 12px rgba(0,0,0,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px -12px rgba(99,102,241,0.18)')}>
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background:'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">MEIPA · 2023–2024</p>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="font-black text-slate-900 transition-transform duration-300 group-hover:scale-105 origin-left inline-block" style={{ fontSize:28, letterSpacing:'-0.02em' }}>{meipa.promedio ?? '—'}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
        </div>

        <div className="group bg-white border border-slate-200 col-span-1 rounded-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
          style={{ borderTop:'3px solid #1e40af', boxShadow:'0 1px 3px rgba(0,0,0,0.06), 0 8px 24px -12px rgba(30,64,175,0.18)', padding:'18px 20px' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 32px -8px rgba(30,64,175,0.35), 0 4px 12px rgba(0,0,0,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px -12px rgba(30,64,175,0.18)')}>
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background:'radial-gradient(circle, rgba(30,64,175,0.12) 0%, transparent 70%)' }} />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">MECDI · 2024–2025</p>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="font-black text-[#1e40af] transition-transform duration-300 group-hover:scale-105 origin-left inline-block" style={{ fontSize:28, letterSpacing:'-0.02em' }}>{tres60.promedio ?? '—'}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
        </div>

        {/* Best gender insight */}
        <div className="group bg-white border border-slate-200 col-span-1 rounded-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
          style={{ borderTop:`3px solid ${bestGenero ? GENDER_COLORS[bestGenero] : '#94a3b8'}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06), 0 8px 24px -12px rgba(0,0,0,0.12)', padding:'18px 20px' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 32px -8px rgba(244,63,94,0.28), 0 4px 12px rgba(0,0,0,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px -12px rgba(0,0,0,0.12)')}>
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background:`radial-gradient(circle, ${bestGenero ? GENDER_COLORS[bestGenero] : '#94a3b8'}22 0%, transparent 70%)` }} />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Mejor Género · Promedio global</p>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="font-black transition-transform duration-300 group-hover:scale-105 origin-left inline-block" style={{ fontSize:24, letterSpacing:'-0.01em', color: bestGenero ? GENDER_COLORS[bestGenero] : '#94a3b8' }}>
              {bestGenero ?? '—'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            {bestGenero && porGenero[bestGenero] != null ? `${porGenero[bestGenero]}/100 pts` : 'Sin datos'}
          </p>
        </div>

        {/* Best seniority insight */}
        <div className="group bg-white border border-slate-200 col-span-1 rounded-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
          style={{ borderTop:'3px solid #15803d', boxShadow:'0 1px 3px rgba(0,0,0,0.06), 0 8px 24px -12px rgba(21,128,61,0.18)', padding:'18px 20px' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 32px -8px rgba(21,128,61,0.32), 0 4px 12px rgba(0,0,0,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px -12px rgba(21,128,61,0.18)')}>
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background:'radial-gradient(circle, rgba(21,128,61,0.12) 0%, transparent 70%)' }} />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Mejor Antigüedad · Rango más alto</p>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="font-black text-[#15803d] transition-transform duration-300 group-hover:scale-105 origin-left inline-block" style={{ fontSize:18, letterSpacing:'-0.01em', lineHeight:1.2 }}>{bestAnt ?? '—'}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            {bestAnt && porAnt[bestAnt] != null ? `${porAnt[bestAnt]}/100 pts` : 'Sin datos'}
          </p>
        </div>
      </div>

      {/* ── Row 2: Evolución MEIPA + Evolución 360/MECDI por período ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Gráfico de línea exclusivo MEIPA ──────────────────────────────── */}
        {(() => {
          const srcM = tendPeriodosMeipa.length > 0
            ? tendPeriodosMeipa
            : tendMeipa.map((t: any) => ({ ...t, periodo: String(t.anio) }))
          const bucketM: Record<string, { sum: number; cnt: number; raw: string }> = {}
          srcM.forEach((t: any) => {
            const lbl = normPeriodo(t.periodo ?? String(t.anio))
            const raw = String(t.periodo ?? t.anio)
            if (!bucketM[lbl]) bucketM[lbl] = { sum: 0, cnt: 0, raw }
            bucketM[lbl].sum += +(t.promedio ?? 0)
            bucketM[lbl].cnt += 1
          })
          const MEIPA_PERIODS = new Set(['I-2023', 'II-2023', 'I-2024'])
          const sorted = Object.entries(bucketM)
            .filter(([lbl]) => MEIPA_PERIODS.has(lbl))
            .sort(([, a], [, b]) => a.raw.localeCompare(b.raw))
          const xLbls = sorted.map(([lbl]) => lbl)
          const xDisplay = xLbls.map(displayPeriodo)
          const yVals = sorted.map(([, v]) => +(v.sum / v.cnt).toFixed(2))

          if (xLbls.length === 0) return (
            <ChartCard title="Evolución MEIPA" sub="Puntaje promedio por período">
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Sin datos</div>
            </ChartCard>
          )

          const allV = yVals.filter((v): v is number => v !== null)
          const yMin = allV.length ? Math.max(0, Math.floor(Math.min(...allV)) - 6) : 60
          const yMax = allV.length ? Math.min(105, Math.ceil(Math.max(...allV)) + 6) : 105

          return (
            <ChartCard title="Evolución MEIPA" sub="Puntaje promedio por período">
              <Plot
                data={[{
                  type: 'scatter' as const,
                  mode: 'lines+markers+text' as const,
                  name: 'MEIPA',
                  x: xDisplay,
                  y: yVals,
                  connectgaps: false,
                  line: { color: '#6d28d9', width: 3, shape: 'spline' as const, smoothing: 0.4 },
                  marker: { size: 13, color: 'white', symbol: 'circle', line: { color: '#6d28d9', width: 2.5 } },
                  text: yVals.map(v => v != null ? String(v.toFixed(1)) : ''),
                  textposition: 'top center' as const,
                  textfont: { family: 'Inter', size: 11, color: '#6d28d9' },
                  hovertemplate: '<b>MEIPA</b> · %{x}<br><b>%{y:.1f}</b> / 100<extra></extra>',
                  fill: 'tozeroy' as const,
                  fillcolor: 'rgba(109,40,217,0.06)',
                }]}
                layout={{
                  autosize: true, paper_bgcolor: 'white', plot_bgcolor: 'white',
                  font: { family: 'Inter', size: 9, color: '#64748b' },
                  margin: { t: 36, b: 52, l: 48, r: 22 },
                  xaxis: {
                    type: 'category' as const,
                    categoryorder: 'array' as const,
                    categoryarray: xDisplay,
                    tickfont: { family: 'Inter', size: 12, color: '#1e293b' },
                    showgrid: false, zeroline: false, showline: true, linecolor: '#e2e8f0',
                  },
                  yaxis: {
                    range: [yMin, yMax],
                    gridcolor: '#f1f5f9', gridwidth: 1,
                    tickfont: { family: 'Inter', size: 9, color: '#94a3b8' },
                    showgrid: true, zeroline: false, nticks: 6,
                  },
                  showlegend: false,
                  shapes: [{ type: 'line' as const, x0: 0, x1: 1, xref: 'paper', y0: 90, y1: 90, line: { color: '#10b981', width: 1.5, dash: 'dot' } }],
                  annotations: [{ x: 1, y: 90, xref: 'paper', yref: 'y', text: 'Meta 90', showarrow: false, font: { size: 9, color: '#10b981', family: 'Inter' }, xanchor: 'right', yanchor: 'bottom', yshift: 5 }],
                }}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '300px' }}
              />
            </ChartCard>
          )
        })()}

        {/* ── Gráfico de líneas exclusivo 360 / MECDI (una línea por modelo) ── */}
        {(() => {
          const MODELOS = ['docencia', 'abp', 'posgrado', 'tecnologado', 'vinculacion', 'gestion', 'investigacion']
          const MODELO_LABELS: Record<string, string> = {
            docencia: 'Docencia', abp: 'Salud/ABP', posgrado: 'Posgrado',
            tecnologado: 'Tecnologado', vinculacion: 'Vinculación',
            gestion: 'Gestión', investigacion: 'Investigación',
          }
          const MC = ['#0f5ca8', '#b91c1c', '#047857', '#b45309', '#6d28d9', '#0e7490', '#7c2d12']
          const is360Period = (lbl: string) =>
            /^(I|II)-\d{4}$/.test(lbl) &&
            lbl !== 'I-2023' && lbl !== 'II-2023' && lbl !== 'I-2024'

          const allPeriods360 = Array.from(new Set(
            MODELOS.flatMap(m => (porModeloPeriodo[m] || []).map((d: any) => normPeriodo(d.periodo)))
          ))
            .filter(is360Period)
            .sort((a, b) => {
              const yr = (s: string) => s.replace(/\D/g, '').slice(0, 4)
              const su = (s: string) => s.split('-')[0]
              return yr(a) !== yr(b) ? yr(a).localeCompare(yr(b)) : su(a).localeCompare(su(b))
            })

          if (allPeriods360.length === 0) return (
            <ChartCard title="Evolución MECDI" sub="Puntaje promedio por modelo y período">
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Sin datos</div>
            </ChartCard>
          )

          const allPeriods360Display = allPeriods360.map(displayPeriodo)

          const traces = MODELOS.map((m, i) => {
            const data = porModeloPeriodo[m] || []
            const bucket: Record<string, { sum: number; cnt: number }> = {}
            data.forEach((d: any) => {
              const lbl = normPeriodo(d.periodo)
              if (!is360Period(lbl)) return
              if (!bucket[lbl]) bucket[lbl] = { sum: 0, cnt: 0 }
              bucket[lbl].sum += +(d.promedio ?? 0)
              bucket[lbl].cnt += 1
            })
            const yVals = allPeriods360.map(lbl =>
              bucket[lbl] ? +(bucket[lbl].sum / bucket[lbl].cnt).toFixed(2) : null
            )
            if (yVals.every(v => v === null)) return null
            return {
              type: 'scatter' as const,
              mode: 'lines+markers' as const,
              name: MODELO_LABELS[m],
              x: allPeriods360Display,
              y: yVals,
              connectgaps: false,
              line: { color: MC[i], width: 2.5, shape: 'spline' as const, smoothing: 0.4 },
              marker: { size: 10, color: 'white', symbol: 'circle', line: { color: MC[i], width: 2 } },
              hovertemplate: `<b>${MODELO_LABELS[m]}</b> · %{x}<br><b>%{y:.1f}</b> / 100<extra></extra>`,
            }
          }).filter(Boolean)

          const allVals = (traces as any[]).flatMap((t: any) =>
            (t.y as (number | null)[]).filter((v): v is number => v !== null)
          )
          const yMin = allVals.length ? Math.max(0, Math.floor(Math.min(...allVals)) - 6) : 60
          const yMax = allVals.length ? Math.min(105, Math.ceil(Math.max(...allVals)) + 6) : 105
          const manyPeriods = allPeriods360.length > 4

          return (
            <ChartCard title="Evolución MECDI" sub="Puntaje promedio por modelo y período">
              <Plot
                data={traces as any}
                layout={{
                  autosize: true, paper_bgcolor: 'white', plot_bgcolor: 'white',
                  font: { family: 'Inter', size: 9, color: '#64748b' },
                  margin: { t: 36, b: manyPeriods ? 100 : 75, l: 48, r: 22 },
                  xaxis: {
                    type: 'category' as const,
                    categoryorder: 'array' as const,
                    categoryarray: allPeriods360Display,
                    tickangle: manyPeriods ? -30 : 0,
                    tickfont: { family: 'Inter', size: manyPeriods ? 9 : 12, color: '#1e293b' },
                    showgrid: false, zeroline: false, showline: true, linecolor: '#e2e8f0',
                  },
                  yaxis: {
                    range: [yMin, yMax],
                    gridcolor: '#f1f5f9', gridwidth: 1,
                    tickfont: { family: 'Inter', size: 9, color: '#94a3b8' },
                    showgrid: true, zeroline: false, nticks: 6,
                  },
                  showlegend: true,
                  legend: {
                    orientation: 'h' as const,
                    x: 0.5, xanchor: 'center' as const,
                    y: manyPeriods ? -0.38 : -0.3,
                    font: { size: 9, family: 'Inter', color: '#475569' },
                    bgcolor: 'rgba(0,0,0,0)',
                    traceorder: 'normal' as const,
                  },
                  shapes: [{ type: 'line' as const, x0: 0, x1: 1, xref: 'paper', y0: 90, y1: 90, line: { color: '#10b981', width: 1.5, dash: 'dot' } }],
                  annotations: [{ x: 1, y: 90, xref: 'paper', yref: 'y', text: 'Meta 90', showarrow: false, font: { size: 9, color: '#10b981', family: 'Inter' }, xanchor: 'right', yanchor: 'bottom', yshift: 5 }],
                }}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: manyPeriods ? '370px' : '300px' }}
              />
            </ChartCard>
          )
        })()}
      </div>

      {/* ── Row 3: Estadísticas ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5">

        {comparativo?.estadisticas && (() => {
          const est = comparativo.estadisticas as any
          const StatRow = ({ label, value, sub }: { label:string; value:any; sub?:string }) => (
            <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <span className="text-[11px] text-slate-500 font-medium">{label}</span>
              <div className="text-right">
                <span className="text-[13px] font-black text-slate-800 tabular-nums">{value}</span>
                {sub && <span className="ml-1 text-[9px] text-slate-400">{sub}</span>}
              </div>
            </div>
          )
          const SysCard = ({ title, color, d }: { title:string; color:string; d:any }) => !d ? null : (
            <div className="border border-slate-100 rounded-lg p-4" style={{ borderTop:`3px solid ${color}` }}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color }}>{title}</p>
              <StatRow label="Media" value={d.media} sub="/ 100" />
              <StatRow label="Mediana" value={d.mediana} sub="/ 100" />
              <StatRow label="Moda (rango)" value={d.moda_rango} sub={`· ${d.moda_freq} docs`} />
              <StatRow label="Varianza" value={d.varianza} />
              <StatRow label="Desv. Estándar" value={d.desv_std} />
              <StatRow label="Mínimo" value={d.min} sub="/ 100" />
              <StatRow label="Máximo" value={d.max} sub="/ 100" />
              <StatRow label="N evaluados" value={d.n} />
            </div>
          )
          return (
            <div className="bg-white border border-slate-200 overflow-hidden"
              style={{ borderRadius:6, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="px-5 py-3.5 border-b border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Estadísticas ·</span>
                <span className="ml-1 text-[13px] font-bold text-slate-700">Media, Moda y Varianza</span>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SysCard title="MEIPA" color="#6d28d9" d={est.meipa} />
                <SysCard title="MECDI" color="#0f5ca8" d={est['360']} />
              </div>
            </div>
          )
        })()}
      </div>

      {/* ── Row 3: Facultades por período ────────────────────────────────── */}
      {facultadPorPeriodo.length > 0 && (() => {
        // ── Normalizar período a etiqueta legible ──
        const normPeriodo = (p: string): string => {
          const s = String(p).trim()
          const y = s.slice(0, 4)
          const suf = parseInt(s.slice(4) || '0')
          if (suf === 0 || suf === 1)   return `I-${y}`
          if (suf === 2)                 return `II-${y}`
          if (suf >= 10 && suf <= 20)   return `TEC-I-${y}`
          if (suf >= 21 && suf <= 30)   return `TEC-II-${y}`
          // suf=56 (202456,202556) y suf=66 (202466,202566) = evaluaciones MECDI G·II
          if (suf === 56 || suf === 66)  return `II-${y}`
          // suf=61 (202361,202461) = MEIPA I semestre
          if (suf === 61) return `I-${y}`
          // Posgrado real: sufijos 70-79 (202371,202376,202471,202476,202477,202571,202572,202576)
          if (suf >= 70 && suf <= 73)   return `Posg-I-${y}`
          if (suf >= 74 && suf <= 79)   return `Posg-II-${y}`
          return `II-${y}`
        }

        // pivot con períodos normalizados (agrupar por label = promedio weighted)
        const labelAcc: Record<string, Record<string, number[]>> = {}
        for (const row of facultadPorPeriodo) {
          const lbl = normPeriodo(row.periodo)
          if (!labelAcc[lbl]) labelAcc[lbl] = {}
          if (!labelAcc[lbl][row.facultad]) labelAcc[lbl][row.facultad] = []
          labelAcc[lbl][row.facultad].push(row.promedio)
        }
        // Ordered unique labels — internos en formato norm, display usa displayPeriodo
        const labelOrder = ['I-2023','TEC-I-2023','Posg-I-2023','II-2023','Posg-II-2023','I-2024','TEC-I-2024','Posg-I-2024','II-2024','Posg-II-2024','I-2025','TEC-I-2025','Posg-I-2025','Posg-II-2025','II-2025']
        const periodLabels = labelOrder.filter(l => labelAcc[l])

        const facMap: Record<string, Record<string, number>> = {}
        for (const lbl of periodLabels) {
          for (const [fac, vals] of Object.entries(labelAcc[lbl])) {
            if (!facMap[fac]) facMap[fac] = {}
            facMap[fac][lbl] = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10
          }
        }

        // Ranking: avg across all periods
        const facultades = Object.keys(facMap)
        const avgByFac = facultades.map(f => ({
          fac: f,
          avg: Math.round(Object.values(facMap[f]).reduce((a,b)=>a+b,0)/Object.values(facMap[f]).length*10)/10,
          n: Object.values(facMap[f]).length,
          last: facMap[f][periodLabels[periodLabels.length-1]] ?? null,
          first: facMap[f][periodLabels[0]] ?? null,
        })).sort((a,b) => b.avg - a.avg)

        const pctColor = (v: number) => v >= 90 ? '#059669' : v >= 80 ? '#0056b3' : v >= 70 ? '#d97706' : '#dc2626'
        const pctBg    = (v: number) => v >= 90 ? '#ecfdf5' : v >= 80 ? '#eff6ff' : v >= 70 ? '#fef3c7' : '#fef2f2'
        const pctLabel = (v: number) => v >= 90 ? 'Excelente' : v >= 80 ? 'Bueno' : v >= 70 ? 'Regular' : 'Crítico'

        // Carreras oficiales PUCESE — solo estas aparecen en el ranking
        const CARRERAS_OFICIALES = new Set([
          'Administración de Empresas', 'Agroindustria', 'Contabilidad y Auditoría',
          'Derecho', 'Diseño Gráfico', 'Edu. Básica Semi - Quinindé', 'Educación Básica',
          'Enfermería', 'Enfermería – Quinindé', 'Enfermería – San Lorenzo',
          'Fisioterapia', 'Ing. Recursos Naturales Renova', 'Laboratorio Clínico',
          'Medicina', 'Negocios Internacionales', 'Pedagogía Idiomas Nac. Ext.',
          'Psicología', 'TC Enfermería', 'Tecnologías de la Información',
          'TG Desarrollo de Software', 'TG Gestión Culinaria',
        ])
        const rankedCarreras = avgByFac.filter(d => d.fac && CARRERAS_OFICIALES.has(d.fac))

        // Vista controlada: top 25 para la gráfica, tabla completa paginada
        const TOP_CHART = 25
        const chartData = rankedCarreras.slice(0, TOP_CHART)

        const barTrace = [{
          type: 'bar' as const,
          orientation: 'h' as const,
          x: chartData.map(d => d.avg),
          y: chartData.map(d => {
            const name = d.fac.length > 36 ? d.fac.slice(0,34)+'…' : d.fac
            return name
          }),
          marker: {
            color: chartData.map(d => pctColor(d.avg)),
            opacity: 0.88,
            line: { width: 0 },
          },
          text: chartData.map(d => `  ${d.avg.toFixed(1)}`),
          textposition: 'outside' as const,
          textfont: { size: 9.5, family: 'Inter', color: chartData.map(d => pctColor(d.avg)) },
          hovertemplate: '<b>%{y}</b><br>Promedio: <b>%{x:.1f} / 100</b><extra></extra>',
          width: 0.65,
        }]

        return (
          <>
          <div className="bg-white border border-slate-200 overflow-hidden mb-5" style={{ borderRadius:10, boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:'#eff6ff' }}>
                  <Award size={14} style={{ color:'#0056b3' }}/>
                </div>
                <div>
                  <h3 className="text-[13px] font-black text-slate-800 leading-tight">Ranking por Carrera</h3>
                  <p className="text-[9px] text-slate-400 font-medium">Promedio general por programa académico</p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2 flex-wrap">
                {[['#059669','≥90 Excelente'],['#0056b3','≥80 Bueno'],['#d97706','≥70 Regular'],['#dc2626','<70 Crítico']].map(([c,l])=>(
                  <span key={l} className="flex items-center gap-1 text-[9px] font-bold" style={{ color: c }}>
                    <span style={{ width:8,height:8,borderRadius:2,background:c,display:'inline-block'}}/>
                    {l}
                  </span>
                ))}
                <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full ml-2">
                  {rankedCarreras.length} carreras · {periodLabels.length} períodos
                </span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* ── Gráfica top 25 ── */}
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">
                  Top {Math.min(TOP_CHART, rankedCarreras.length)} carreras por promedio
                </p>
                <Plot data={barTrace} layout={{
                  autosize: true,
                  paper_bgcolor: 'transparent',
                  plot_bgcolor:  'transparent',
                  font: { family:'Inter', size:9 },
                  margin: { t:4, b:20, l:190, r:55 },
                  xaxis: {
                    range: [Math.max(50, Math.min(...chartData.map(d=>d.avg)) - 5), 105],
                    gridcolor:'#f1f5f9', zeroline:false,
                    tickfont:{ size:8, color:'#94a3b8' },
                    showgrid: true,
                  },
                  yaxis: {
                    tickfont:{ size:9, color:'#334155', family:'Inter' },
                    autorange: 'reversed' as const,
                  },
                  shapes:[{
                    type:'line', x0:90, x1:90, y0:0, y1:1, yref:'paper',
                    line:{ color:'#10b981', width:1.5, dash:'dot' },
                  }],
                  annotations:[{
                    x:90.5, xref:'x', y:1, yref:'paper', text:'Meta 90',
                    showarrow:false, xanchor:'left', yanchor:'top',
                    font:{size:7.5,color:'#10b981',family:'Inter'},
                  }],
                  showlegend: false,
                  bargap: 0.3,
                }}
                config={{responsive:true, displayModeBar:false}}
                style={{width:'100%', height:`${Math.max(300, Math.min(TOP_CHART, rankedCarreras.length)*26+40)}px`}} />
              </div>

              {/* ── Tabla ranking completo ── */}
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">
                  Ranking completo — todas las carreras
                </p>
                <div className="overflow-y-auto" style={{ maxHeight: 640 }}>
                  <table className="w-full text-[11px] border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr style={{ background:'#f8fafc' }}>
                        <th className="text-left py-2 px-2 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] w-7 border-b border-slate-200">#</th>
                        <th className="text-left py-2 px-2 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200">Carrera / Programa</th>
                        <th className="text-center py-2 px-2 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200 w-14">Prom.</th>
                        <th className="text-center py-2 px-2 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200 w-12">Nivel</th>
                        <th className="text-center py-2 px-2 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200 w-12">Tend.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedCarreras.map(({ fac, avg, first, last }, idx) => {
                        const trend = (last !== null && first !== null) ? last - first : null
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null
                        return (
                          <tr key={fac} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-1.5 px-2 text-[9px] font-black tabular-nums text-slate-400">
                              {medal ?? <span style={{ color: idx < 10 ? '#0056b3' : '#cbd5e1' }}>{idx+1}</span>}
                            </td>
                            <td className="py-1.5 px-2">
                              <div className="flex items-center gap-1.5">
                                {/* mini barra de progreso */}
                                <div style={{ width:50, background:'#f1f5f9', borderRadius:3, height:5, flexShrink:0 }}>
                                  <div style={{ width:`${Math.min(avg,100)}%`, height:5, borderRadius:3, background:pctColor(avg) }}/>
                                </div>
                                <span className="font-semibold text-slate-700 leading-tight"
                                  style={{ fontSize:'10px', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'inline-block' }}
                                  title={fac}>
                                  {fac}
                                </span>
                              </div>
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <span className="font-black tabular-nums text-[12px]" style={{ color:pctColor(avg) }}>
                                {avg.toFixed(1)}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <span className="text-[7.5px] font-black px-1.5 py-0.5 rounded"
                                style={{ background:pctBg(avg), color:pctColor(avg) }}>
                                {pctLabel(avg)}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-center text-[9px] font-bold tabular-nums">
                              {trend !== null
                                ? <span style={{ color: trend >= 0 ? '#059669' : '#dc2626' }}>{trend >= 0 ? '▲' : '▼'}{Math.abs(trend).toFixed(1)}</span>
                                : <span className="text-slate-300">—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tablas pivot: Grado / Tecnologado / Posgrado ── */}
          {periodLabels.length > 0 && (() => {
            // ── Clasificación de carreras por nivel académico ──────────────────
            const TECH_SET = new Set(['TC Enfermería','TG Gestión Culinaria','TG Desarrollo de Software','Tecnologado'])
            const POSG_SET = new Set(['Posgrado'])

            // Períodos por categoría
            const periodGrado = periodLabels.filter(l => !l.startsWith('TEC-') && !l.startsWith('Posg-'))
            const periodPosg  = periodLabels.filter(l => l.startsWith('Posg-'))

            // ── Tecnologado: fusionar I-YYYY y TEC-I-YYYY en un solo key TEC-I-YYYY ──
            // Esto evita columnas duplicadas cuando la misma carrera tiene datos en
            // períodos grado (I-2023) y en períodos tec (TEC-I-2023) que muestran el mismo label.
            const toTecKey = (lbl: string): string => {
              if (lbl.startsWith('TEC-') || lbl.startsWith('Posg-')) return lbl
              const m = lbl.match(/^(I|II)-(\d{4})$/)
              if (m) return `TEC-${m[1]}-${m[2]}`
              return lbl
            }
            // Construir tecFacMap (promedio de todas las fuentes que caen en el mismo TEC key)
            const tecBuckets: Record<string, Record<string, number[]>> = {}
            for (const lbl of periodLabels) {
              if (lbl.startsWith('Posg-')) continue
              const tLbl = toTecKey(lbl)
              for (const fac of [...TECH_SET]) {
                const val = facMap[fac]?.[lbl]
                if (val === undefined) continue
                if (!tecBuckets[tLbl]) tecBuckets[tLbl] = {}
                if (!tecBuckets[tLbl][fac]) tecBuckets[tLbl][fac] = []
                tecBuckets[tLbl][fac].push(val)
              }
            }
            const tecFacMap: Record<string, Record<string, number>> = {}
            for (const [tLbl, facVals] of Object.entries(tecBuckets)) {
              for (const [fac, vals] of Object.entries(facVals)) {
                if (!tecFacMap[fac]) tecFacMap[fac] = {}
                tecFacMap[fac][tLbl] = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10
              }
            }
            // Orden canónico de períodos tec (sin duplicados)
            const TEC_LABEL_ORDER = ['TEC-I-2023','TEC-II-2023','TEC-I-2024','TEC-II-2024','TEC-I-2025','TEC-II-2025']
            const periodTec = TEC_LABEL_ORDER.filter(l =>
              Object.values(tecFacMap).some(m => m[l] !== undefined)
            )

            // Promedio de una carrera sólo en los períodos de su bloque
            const avgP = (fac: string, ps: string[], srcMap: Record<string, Record<string, number>> = facMap) => {
              const v = ps.map(l => srcMap[fac]?.[l]).filter((x): x is number => x !== undefined)
              return v.length ? Math.round(v.reduce((a,b)=>a+b,0)/v.length*10)/10 : 0
            }

            // Grado: carreras oficiales que NO son del set tecnologado
            const carrerasGrado = avgByFac
              .filter(d => CARRERAS_OFICIALES.has(d.fac) && !TECH_SET.has(d.fac) && !POSG_SET.has(d.fac) && periodGrado.some(p => facMap[d.fac]?.[p] !== undefined))
              .map(d => ({ fac: d.fac, avg: avgP(d.fac, periodGrado) }))
              .sort((a,b) => b.avg - a.avg)

            // Tecnologado: carreras tech con datos en al menos un período tec fusionado
            const carrerasTec = [...TECH_SET]
              .filter(fac => tecFacMap[fac] && periodTec.some(p => tecFacMap[fac]?.[p] !== undefined))
              .map(fac => ({ fac, avg: avgP(fac, periodTec, tecFacMap) }))
              .sort((a,b) => b.avg - a.avg)

            const carrerasPosg = avgByFac
              .filter(d => POSG_SET.has(d.fac) && periodPosg.length > 0 && periodPosg.some(p => facMap[d.fac]?.[p] !== undefined))
              .map(d => ({ fac: d.fac, avg: avgP(d.fac, periodPosg) }))
              .sort((a,b) => b.avg - a.avg)

            // Render helper: tabla pivot genérica
            // overrideFacMap: usa un facMap alternativo (p.ej. tecFacMap para tecnologado)
            const renderPivot = (
              title: string, sub: string,
              accentColor: string, iconBg: string,
              periods: string[],
              carreras: { fac: string; avg: number }[],
              displayFn: (lbl: string) => string = displayPeriodo,
              overrideFacMap?: Record<string, Record<string, number>>
            ) => {
              const srcMap = overrideFacMap ?? facMap
              if (!carreras.length || !periods.length) return null
              return (
                <div key={title} className="bg-white border border-slate-200 overflow-hidden mt-5"
                  style={{ borderRadius:10, boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }}>
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
                      <BarChart3 size={14} style={{ color: accentColor }}/>
                    </div>
                    <div>
                      <h3 className="text-[13px] font-black text-slate-800 leading-tight">{title}</h3>
                      <p className="text-[9px] text-slate-400 font-medium">{sub}</p>
                    </div>
                    <span className="ml-auto text-[9px] font-semibold text-slate-400">
                      {carreras.length} carrera{carreras.length !== 1 ? 's' : ''} · {periods.length} período{periods.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] border-collapse" style={{ minWidth: 600 }}>
                      <thead className="sticky top-0 z-10" style={{ background:'#f8fafc' }}>
                        <tr>
                          <th className="text-left py-2.5 px-4 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200 w-44">Carrera / Programa</th>
                          <th className="text-center py-2.5 px-2 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200 w-16">Prom.</th>
                          {periods.map(lbl => (
                            <th key={lbl} className="text-center py-2.5 px-2 font-black text-[8.5px] uppercase tracking-[0.08em] border-b border-slate-200 w-20"
                              style={{ color: accentColor }}>
                              {displayFn(lbl)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {carreras.map(({ fac, avg }, idx) => (
                          <tr key={fac} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8.5px] font-black tabular-nums text-slate-300 w-4">{idx+1}</span>
                                <span className="font-semibold text-slate-700 text-[10px] leading-tight"
                                  style={{ maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'inline-block' }}
                                  title={fac}>{fac}</span>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className="font-black tabular-nums text-[12px]" style={{ color:pctColor(avg) }}>{avg.toFixed(1)}</span>
                            </td>
                            {periods.map(lbl => {
                              const val = srcMap[fac]?.[lbl] ?? null
                              return (
                                <td key={lbl} className="py-2 px-2 text-center">
                                  {val !== null
                                    ? <span className="font-bold tabular-nums text-[11px] px-2 py-0.5 rounded"
                                        style={{ background: pctBg(val), color: pctColor(val) }}>
                                        {val.toFixed(1)}
                                      </span>
                                    : <span className="text-slate-200 text-[9px]">—</span>}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            }

            return (
              <>
                {renderPivot(
                  'Análisis Temporal — Grado',
                  'Carreras de pregrado · Promedio por período académico',
                  '#059669', '#f0fdf4',
                  periodGrado, carrerasGrado,
                  displayPeriodo
                )}
                {renderPivot(
                  'Análisis Temporal — Tecnologado',
                  'Programas de tecnología superior · Promedio por período académico',
                  '#7c3aed', '#f5f3ff',
                  periodTec, carrerasTec,
                  (lbl) => lbl.replace('TEC-', 'T·'),  // TEC-I-2023 → T·I-2023
                  tecFacMap
                )}
                {renderPivot(
                  'Análisis Temporal — Posgrado',
                  'Programas de maestría y especialización · Promedio por período académico',
                  '#0891b2', '#ecfeff',
                  periodPosg, carrerasPosg,
                  displayPeriodo
                )}
              </>
            )
          })()}
          </>
        )
      })()}

      {/* ── Row 4: Género | Edad | Antigüedad por período ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {generoPorPeriodo.length > 0 && (() => {
          // 6 períodos académicos principales: 3 MEIPA + 3 360 (sin TEC-I ni Posg-)
          const PERIODOS_PRINCIPALES = ['I-2023','II-2023','I-2024','II-2024','I-2025','II-2025']
          // Agrupa por normPeriodo y promedia
          const bucket: Record<string,{raw:string,[k:string]:any}> = {}
          generoPorPeriodo.forEach((d:any) => {
            const lbl = normPeriodo(String(d.periodo))
            if (lbl.startsWith('Posg-')) return          // excluir posgrado
            const raw = String(d.periodo)
            if (!bucket[lbl]) bucket[lbl] = {raw, Mujer:[], Hombre:[]}
            if (d['Mujer']  != null) bucket[lbl]['Mujer'].push(+d['Mujer'])
            if (d['Hombre'] != null) bucket[lbl]['Hombre'].push(+d['Hombre'])
          })
          const sorted = PERIODOS_PRINCIPALES
            .filter(lbl => bucket[lbl])
            .map(lbl => [lbl, bucket[lbl]] as [string, typeof bucket[string]])
          const periodos = sorted.map(([lbl]) => displayPeriodo(lbl))
          const avg = (arr:number[]) => arr.length ? +(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : null
          const generos = ['Mujer','Hombre']
          const traces = generos.map(g => {
            const yVals = sorted.map(([,v]) => avg(v[g]))
            return {
              type:'bar' as const, name:g,
              x: periodos, y: yVals,
              marker:{ color: GENDER_COLORS[g]||'#94a3b8', opacity:0.88 },
              text: yVals.map(v => v != null ? String(v) : ''),
              textposition:'outside' as const,
              textfont:{ family:'Inter', size:9 },
              hovertemplate:`<b>${g}</b> · %{x}<br>%{y:.1f}/100<extra></extra>`,
            }
          })
          const allV = sorted.flatMap(([,v]) => [...v['Mujer'], ...v['Hombre']])
          const yMin = allV.length ? Math.max(0, Math.floor(Math.min(...allV)) - 5) : 70
          return (
            <ChartCard title="Desempeño por Género" sub="Por período — máx. 6 períodos principales">
              <div className="flex justify-center gap-6 mb-2">
                {gKeys.map(k=>(
                  <div key={k} className="text-center">
                    <div className="text-xl font-black" style={{color:GENDER_COLORS[k]||'#94a3b8'}}>{porGenero[k]}</div>
                    <div className="text-[9px] font-bold text-slate-500">{k}</div>
                    {bestGenero===k&&<span className="text-[7px] font-black px-1 py-0.5 rounded" style={{background:`${GENDER_COLORS[k]}20`,color:GENDER_COLORS[k]}}>MEJOR</span>}
                  </div>
                ))}
              </div>
              <Plot data={traces} layout={{
                autosize:true, paper_bgcolor:'white', plot_bgcolor:'white',
                barmode:'group' as const,
                font:{ family:'Inter', size:9 },
                margin:{ t:10, b:50, l:40, r:10 },
                xaxis:{ type:'category' as const, categoryorder:'array' as const, categoryarray:periodos, tickfont:{ size:10, color:'#1e293b' }, showgrid:false, zeroline:false },
                yaxis:{ gridcolor:'#f0f4f8', range:[yMin, 105], tickfont:{ size:8, color:'#94a3b8' }, showgrid:true, zeroline:false },
                legend:{ orientation:'h' as const, y:-0.2, font:{ size:9 } },
                showlegend:true,
                shapes:[{ type:'line', x0:0, x1:1, xref:'paper', y0:90, y1:90, line:{ color:'#10b981', width:1, dash:'dot' } }],
              }} config={{responsive:true,displayModeBar:false}} style={{width:'100%',height:'250px'}} />
            </ChartCard>
          )
        })()}

        {/* Edad por período */}
        {edadPorPeriodo.length > 0 && (() => {
          const PERIODOS_PRINCIPALES = ['I-2023','II-2023','I-2024','II-2024','I-2025','II-2025']
          const EDAD_COLORS = ['#0f5ca8','#b45309','#047857','#6d28d9']
          const bucket: Record<string,{raw:string, vals:Record<string,number[]>}> = {}
          edadPorPeriodo.forEach((d:any) => {
            const lbl = normPeriodo(String(d.periodo))
            if (lbl.startsWith('Posg-')) return
            const raw = String(d.periodo)
            if (!bucket[lbl]) { bucket[lbl] = {raw, vals:{}}; AGE_BRACKETS.forEach(b => bucket[lbl].vals[b] = []) }
            AGE_BRACKETS.forEach(b => { if (d[b] != null) bucket[lbl].vals[b].push(+d[b]) })
          })
          const sorted = PERIODOS_PRINCIPALES
            .filter(lbl => bucket[lbl])
            .map(lbl => [lbl, bucket[lbl]] as [string, typeof bucket[string]])
          const periodos = sorted.map(([lbl]) => displayPeriodo(lbl))
          const avg = (arr:number[]) => arr.length ? +(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : null
          const traces = AGE_BRACKETS.map((b, i) => {
            const yVals = sorted.map(([,v]) => avg(v.vals[b]))
            return {
              type:'bar' as const, name:b,
              x:periodos, y:yVals,
              marker:{ color:EDAD_COLORS[i], opacity:0.85 },
              text: yVals.map(v => v != null ? String(v) : ''),
              textposition:'outside' as const,
              textfont:{ family:'Inter', size:8 },
              hovertemplate:`<b>${b}</b> · %{x}<br>%{y:.1f}/100<extra></extra>`,
            }
          })
          const allV = sorted.flatMap(([,v]) => AGE_BRACKETS.flatMap(b => v.vals[b]))
          const yMin = allV.length ? Math.max(0, Math.floor(Math.min(...allV)) - 5) : 70
          return (
            <ChartCard title="Desempeño por Rango de Edad" sub="Por período — máx. 6 períodos principales">
              {bestEdad&&<p className="text-[8px] font-black mb-1 px-1" style={{color:'#b45309'}}>Mejor: <span className="text-slate-700">{bestEdad}</span> · {porEdad[bestEdad]}/100</p>}
              <Plot data={traces} layout={{
                autosize:true, paper_bgcolor:'white', plot_bgcolor:'white',
                barmode:'group' as const,
                font:{ family:'Inter', size:9 },
                margin:{ t:10, b:55, l:40, r:10 },
                xaxis:{ type:'category' as const, categoryorder:'array' as const, categoryarray:periodos, tickfont:{ size:10, color:'#1e293b' }, showgrid:false, zeroline:false },
                yaxis:{ gridcolor:'#f0f4f8', range:[yMin, 105], tickfont:{ size:8, color:'#94a3b8' }, showgrid:true, zeroline:false },
                legend:{ orientation:'h' as const, y:-0.26, font:{ size:7 } },
                showlegend:true,
                shapes:[{ type:'line', x0:0, x1:1, xref:'paper', y0:90, y1:90, line:{ color:'#10b981', width:1, dash:'dot' } }],
              }} config={{responsive:true,displayModeBar:false}} style={{width:'100%',height:'260px'}} />
            </ChartCard>
          )
        })()}

        {/* Antigüedad por período */}
        {antiguedadPorPeriodo.length > 0 && (() => {
          const PERIODOS_PRINCIPALES = ['I-2023','II-2023','I-2024','II-2024','I-2025','II-2025']
          const ANT_COLORS = ['#0e7490','#b91c1c','#7c3aed','#047857']
          const bucket: Record<string,{raw:string, vals:Record<string,number[]>}> = {}
          antiguedadPorPeriodo.forEach((d:any) => {
            const lbl = normPeriodo(String(d.periodo))
            if (lbl.startsWith('Posg-')) return
            const raw = String(d.periodo)
            if (!bucket[lbl]) { bucket[lbl] = {raw, vals:{}}; ANTIG_BRACKETS.forEach(b => bucket[lbl].vals[b] = []) }
            ANTIG_BRACKETS.forEach(b => { if (d[b] != null) bucket[lbl].vals[b].push(+d[b]) })
          })
          const sorted = PERIODOS_PRINCIPALES
            .filter(lbl => bucket[lbl])
            .map(lbl => [lbl, bucket[lbl]] as [string, typeof bucket[string]])
          const periodos = sorted.map(([lbl]) => displayPeriodo(lbl))
          const avg = (arr:number[]) => arr.length ? +(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : null
          const traces = ANTIG_BRACKETS.map((b, i) => {
            const yVals = sorted.map(([,v]) => avg(v.vals[b]))
            return {
              type:'bar' as const, name:b,
              x:periodos, y:yVals,
              marker:{ color:ANT_COLORS[i], opacity:0.85 },
              text: yVals.map(v => v != null ? String(v) : ''),
              textposition:'outside' as const,
              textfont:{ family:'Inter', size:8 },
              hovertemplate:`<b>${b}</b> · %{x}<br>%{y:.1f}/100<extra></extra>`,
            }
          })
          const allV = sorted.flatMap(([,v]) => ANTIG_BRACKETS.flatMap(b => v.vals[b]))
          const yMin = allV.length ? Math.max(0, Math.floor(Math.min(...allV)) - 5) : 70
          return (
            <ChartCard title="Desempeño por Antigüedad" sub="Por período — máx. 6 períodos principales">
              {bestAnt&&<p className="text-[8px] font-black mb-1 px-1" style={{color:'#047857'}}>Mejor: <span className="text-slate-700">{bestAnt}</span> · {porAnt[bestAnt]}/100</p>}
              <Plot data={traces} layout={{
                autosize:true, paper_bgcolor:'white', plot_bgcolor:'white',
                barmode:'group' as const,
                font:{ family:'Inter', size:9 },
                margin:{ t:10, b:55, l:40, r:10 },
                xaxis:{ type:'category' as const, categoryorder:'array' as const, categoryarray:periodos, tickfont:{ size:10, color:'#1e293b' }, showgrid:false, zeroline:false },
                yaxis:{ gridcolor:'#f0f4f8', range:[yMin, 105], tickfont:{ size:8, color:'#94a3b8' }, showgrid:true, zeroline:false },
                legend:{ orientation:'h' as const, y:-0.26, font:{ size:7 } },
                showlegend:true,
                shapes:[{ type:'line', x0:0, x1:1, xref:'paper', y0:90, y1:90, line:{ color:'#10b981', width:1, dash:'dot' } }],
              }} config={{responsive:true,displayModeBar:false}} style={{width:'100%',height:'260px'}} />
            </ChartCard>
          )
        })()}
      </div>

      {/* ── Row 5: Género × Edad/Antigüedad — selector de período ─────────── */}
      {(generoEdadPorPeriodo.length > 0 || generoAntiguedadPorPeriodo.length > 0) && (() => {
        // Solo los 6 períodos principales (3 MEIPA + 3 360), sin TEC-I ni Posg-
        const PERIODOS_PRINCIPALES = ['I-2023','II-2023','I-2024','II-2024','I-2025','II-2025']
        // Calcular qué períodos normalizados tienen datos reales
        const conDatos = new Set<string>()
        for (const row of [...generoEdadPorPeriodo, ...generoAntiguedadPorPeriodo]) {
          conDatos.add(normPeriodo(String(row.periodo)))
        }
        const periodosUnicos = PERIODOS_PRINCIPALES.filter(p => conDatos.has(p))

        // helper: pivot rows filtrados → { Mujer: { bracket: val }, Hombre: { bracket: val } }
        // Compara por normPeriodo para agrupar todos los códigos crudos del mismo período
        function pivotCross(rows: any[], brackets: string[], periodo: string) {
          const acc: Record<string, Record<string, number[]>> = { Mujer: {}, Hombre: {} }
          for (const r of rows) {
            if (periodo !== '__todos__' && normPeriodo(String(r.periodo)) !== periodo) continue
            if (!acc[r.genero]) acc[r.genero] = {}
            if (!acc[r.genero][r.bracket]) acc[r.genero][r.bracket] = []
            if (r.promedio != null) acc[r.genero][r.bracket].push(r.promedio)
          }
          const out: Record<string, Record<string, number|null>> = {}
          for (const g of ['Mujer','Hombre']) {
            out[g] = {}
            for (const b of brackets) {
              const vs = acc[g]?.[b] || []
              out[g][b] = vs.length ? Math.round((vs.reduce((a,v)=>a+v,0)/vs.length)*10)/10 : null
            }
          }
          return out
        }

        function crossTraces(pivot: Record<string, Record<string, number|null>>, brackets: string[]) {
          return ['Mujer','Hombre'].map(g => ({
            type: 'bar' as const,
            name: g,
            x: brackets,
            y: brackets.map(b => pivot[g]?.[b] ?? null),
            marker: { color: GENDER_COLORS[g] || '#94a3b8', opacity: 0.88 },
            text: brackets.map(b => pivot[g]?.[b] != null ? (+pivot[g][b]!).toFixed(1) : ''),
            textposition: 'outside' as const,
            textfont: { family:'Inter', size:8 },
            hovertemplate: `<b>${g}</b><br>%{x}<br>%{y:.1f}/100<extra></extra>`,
          }))
        }

        const pivotEdad  = pivotCross(generoEdadPorPeriodo,       AGE_BRACKETS,   crossPeriodo)
        const pivotAntig = pivotCross(generoAntiguedadPorPeriodo, ANTIG_BRACKETS, crossPeriodo)
        const allVE = Object.values(pivotEdad).flatMap(g=>Object.values(g)).filter((v):v is number=>v!=null)
        const allVA = Object.values(pivotAntig).flatMap(g=>Object.values(g)).filter((v):v is number=>v!=null)
        const yMinE = allVE.length ? Math.max(0, Math.floor(Math.min(...allVE))-5) : 60
        const yMinA = allVA.length ? Math.max(0, Math.floor(Math.min(...allVA))-5) : 60

        const tabStyle = (p: string) =>
          `px-3 py-1 rounded-full text-[8px] font-bold border transition-all cursor-pointer ${
            crossPeriodo === p
              ? 'bg-slate-700 text-white border-slate-700'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
          }`

        return (
          <div>
            {/* Selector de período compartido */}
            <div className="flex flex-wrap items-center gap-2 mb-3 px-1">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mr-1">Período</span>
              <button className={tabStyle('__todos__')} onClick={()=>setCrossPeriodo('__todos__')}>Todos</button>
              {periodosUnicos.map(p=>(
                <button key={p} className={tabStyle(p)} onClick={()=>setCrossPeriodo(p)}>{p}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ChartCard title="Mujer vs Hombre — Por Rango de Edad" sub={`Análisis cruzado · ${crossPeriodo==='__todos__'?'Todos los períodos':crossPeriodo}`}>
                <Plot data={crossTraces(pivotEdad, AGE_BRACKETS)} layout={{
                  autosize:true, paper_bgcolor:'white', plot_bgcolor:'white',
                  barmode:'group' as const,
                  font:{ family:'Inter', size:9 },
                  margin:{ t:10, b:55, l:42, r:10 },
                  xaxis:{ type:'category' as const, tickfont:{ size:9, color:'#1e293b' }, showgrid:false, zeroline:false },
                  yaxis:{ gridcolor:'#f0f4f8', range:[yMinE, 104], tickfont:{ size:8, color:'#94a3b8' }, showgrid:true, zeroline:false },
                  legend:{ orientation:'h' as const, y:-0.22, font:{ size:9 } },
                  showlegend:true,
                  shapes:[{ type:'line', x0:0, x1:1, xref:'paper', y0:90, y1:90, line:{ color:'#10b981', width:1, dash:'dot' } }],
                }} config={{responsive:true,displayModeBar:false}} style={{width:'100%',height:'270px'}} />
              </ChartCard>
              <ChartCard title="Mujer vs Hombre — Por Antigüedad" sub={`Análisis cruzado · ${crossPeriodo==='__todos__'?'Todos los períodos':crossPeriodo}`}>
                <Plot data={crossTraces(pivotAntig, ANTIG_BRACKETS)} layout={{
                  autosize:true, paper_bgcolor:'white', plot_bgcolor:'white',
                  barmode:'group' as const,
                  font:{ family:'Inter', size:9 },
                  margin:{ t:10, b:55, l:42, r:10 },
                  xaxis:{ type:'category' as const, tickfont:{ size:9, color:'#1e293b' }, showgrid:false, zeroline:false },
                  yaxis:{ gridcolor:'#f0f4f8', range:[yMinA, 104], tickfont:{ size:8, color:'#94a3b8' }, showgrid:true, zeroline:false },
                  legend:{ orientation:'h' as const, y:-0.22, font:{ size:9 } },
                  showlegend:true,
                  shapes:[{ type:'line', x0:0, x1:1, xref:'paper', y0:90, y1:90, line:{ color:'#10b981', width:1, dash:'dot' } }],
                }} config={{responsive:true,displayModeBar:false}} style={{width:'100%',height:'270px'}} />
              </ChartCard>
            </div>
          </div>
        )
      })()}

    </div>
  )
}

// ── Mejores y Peores panel ────────────────────────────────────────────────────
