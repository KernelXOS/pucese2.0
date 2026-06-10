import React from 'react'
import { BarChart3, Users, TrendingUp, BrainCircuit, RefreshCw, Award, FileText, Search, Download, Loader2, Stethoscope } from 'lucide-react'
import { DeferredMount, Plot, COMP_COLORS, NivelBadge, ComponentBar, KPICard, AnalyticsSection, displayPeriodo } from '../shared'
import TodosDocentesPanel from '../components/TodosDocentesPanel'

export default function DashboardSistema(props: any) {
  const { sistema, activeTab, activeAnio, saludSubTab, kpis, serviciosKpis, ranking, demograficos, tendencias, tendenciasPorPeriodo, analytics, todosDocentes, aiAnalysis, loading, searchTerm, setSearchTerm, sistemaRef, exportingInforme, periodoActivo, pdfLoading, handleDescargarPDF, handleDescargarInforme, getQueryParams, runAnalysisIA, filteredRanking, currentTabCfg, compLabels, compKeys, componentes, distNivel, compValues } = props
  return (
            <>
              {/* No data */}
              {!kpis && !loading && (
                <div className="flex flex-col items-center justify-center py-32 gap-5">
                  <div className="p-5 rounded-3xl" style={{ background:`${currentTabCfg.color}12` }}>
                    <currentTabCfg.icon size={40} style={{ color:currentTabCfg.color, opacity:0.5 }} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-black text-slate-700 mb-1">Sin datos para {currentTabCfg.label}</h3>
                    <p className="text-sm text-slate-400 font-medium">
                      No se encontraron evaluaciones{activeAnio ? ` en ${activeAnio}` : ''}.
                    </p>
                  </div>
                </div>
              )}

              {kpis && (
                <div ref={sistemaRef}>
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 self-stretch rounded-full" style={{ background:currentTabCfg.color }} />
                    <div className="flex-1">
                      <h2 className="text-base font-bold text-slate-800">{currentTabCfg.label}</h2>
                      <p className="text-[11px] text-slate-400">{currentTabCfg.desc}
                        {activeAnio && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{ background:`${currentTabCfg.color}12`, color:currentTabCfg.color }}>
                            {activeAnio}
                          </span>
                        )}
                      </p>
                    </div>
                    {loading && <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-[#1e40af] animate-spin" />}
                  </div>

                  {/* ── Informe General banner ──────────────────────────── */}
                  {(() => {
                    const tc = currentTabCfg
                    const sistemaOpt = sistema === 'meipa' ? 'meipa' : sistema === 'salud' ? '360' : '360'
                    const modeloOpt  = sistema === 'meipa' ? 'docencia' : sistema === 'salud' ? saludSubTab : activeTab
                    const labelInf   = `Informe General — ${tc.label}`
                    return (
                      <div className="flex items-center justify-between gap-4 mb-6 px-5 py-4 rounded-xl border"
                        style={{ background:`linear-gradient(135deg,${tc.color}ee 0%,${tc.color}aa 100%)`, borderColor:`${tc.color}60` }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background:'rgba(255,255,255,0.15)' }}>
                            <FileText size={20} style={{ color:'#fff' }}/>
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-white leading-tight">{labelInf}</p>
                            <p className="text-[10px] mt-0.5" style={{ color:'rgba(255,255,255,0.65)' }}>
                              PDF completo: todos los evaluados, todos los períodos, estadísticas y tendencias
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDescargarInforme(sistemaOpt, modeloOpt)}
                          disabled={exportingInforme}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white flex-shrink-0 transition-all disabled:opacity-60 active:scale-95"
                          style={{ background:'rgba(255,255,255,0.22)', border:'1px solid rgba(255,255,255,0.3)' }}
                        >
                          {exportingInforme ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
                          <span>{exportingInforme ? 'Generando…' : 'Descargar PDF'}</span>
                        </button>
                      </div>
                    )
                  })()}

                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                    <KPICard
                      title="Puntaje Institucional"
                      value={`${kpis?.promedio_general_100 ?? '—'}`}
                      label="/ 100 pts"
                      icon={<BarChart3 size={21} style={{ color:currentTabCfg.color }} />}
                      iconBg={`${currentTabCfg.color}15`}
                      footer={`Escala 0-5: ${kpis?.promedio_general ?? '—'}`}
                      accent={currentTabCfg.color}
                    />
                    <KPICard
                      title="Evaluados"
                      value={kpis?.total_docentes}
                      label="participantes"
                      icon={<Users size={21} className="text-violet-500" />}
                      iconBg="#f5f3ff"
                      footer=""
                      accent="#7c3aed"
                    />
                    <KPICard
                      title="Máximo Desempeño"
                      value={kpis?.mejor_docente?.toUpperCase() || 'N/A'}
                      label={kpis?.mejor_docente_facultad || ''}
                      icon={<Award size={21} className="text-amber-500" />}
                      iconBg="#fffbeb"
                      footer={`Puntaje: ${kpis?.mejor_docente_score ?? 'N/A'}`}
                      badge="TOP"
                      badgeStyle={{ color:'#d97706', background:'#fef3c7', border:'1px solid #fde68a' }}
                      accent="#f59e0b"
                    />
                    <KPICard
                      title="Unidades Académicas"
                      value={kpis?.total_facultades || 0}
                      label="unidades"
                      icon={<TrendingUp size={21} className="text-emerald-500" />}
                      iconBg="#ecfdf5"
                      footer={`${Object.keys(kpis?.promedio_por_facultad || {}).length} programas activos`}
                      accent="#10b981"
                    />
                  </div>

                  {/* Components */}
                  <div className="bg-white border border-slate-200 mb-8" style={{ borderRadius: 6, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:'20px 22px' }}>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Desglose por Componente ·</span>
                        <h3 className="text-[13px] font-bold text-slate-700">
                          Componentes — <span style={{ color:currentTabCfg.color }}>{currentTabCfg.label}</span>
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded border"
                        style={{ color:currentTabCfg.color, background:`${currentTabCfg.color}08`, borderColor:`${currentTabCfg.color}25`, borderRadius: 4 }}>
                        Promedio institucional
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {compLabels.map((cl, i) => (
                        <ComponentBar
                          key={cl.label}
                          label={cl.label}
                          value={compValues[i] || 0}
                          max={cl.max}
                          peso={compLabels[i] ? Math.round((cl.max / compLabels.reduce((s,x) => s+x.max, 0)) * 100) : 0}
                          color={COMP_COLORS[i]}
                        />
                      ))}
                      {/* Servicios Hospitalarios — barra extra solo en Salud/ABP */}
                      {sistema === 'salud' && serviciosKpis?.componentes?.het_estudiantil && (
                        <div className="md:col-span-2 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Stethoscope size={11} className="text-red-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.18em]">Evaluación complementaria · Prácticas Hospitalarias</span>
                          </div>
                          <ComponentBar
                            label="Servicios Hospitalarios (Het. Est.)"
                            value={serviciosKpis.componentes.het_estudiantil.promedio || 0}
                            max={100}
                            peso={100}
                            color="#b91c1c"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Charts row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Pies */}
                    <div className="bg-white border border-slate-200 overflow-hidden" style={{ borderRadius: 6, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
                      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Demografía ·</span>
                        <h3 className="text-[13px] font-bold text-slate-700">Perfil del Cuerpo Docente</h3>
                      </div>
                      <div className="p-6 space-y-5">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Por Nivel de Desempeño</p>
                          <Plot data={[{ values: Object.values(distNivel), labels: Object.keys(distNivel),
                            type:'pie', hole:0.62, marker:{colors:['#059669','#0056b3','#f59e0b','#dc2626','#94a3b8']},
                            textinfo:'percent', textfont:{size:11,family:'Inter'} }]}
                            layout={{ autosize:true, paper_bgcolor:'white', margin:{t:0,b:0,l:0,r:0}, showlegend:true,
                              legend:{orientation:'h',font:{size:10,family:'Inter'},y:-0.12}, height:175 }}
                            config={{ responsive:true, displayModeBar:false }} style={{ width:'100%' }} />
                        </div>
                        <div className="border-t border-slate-100 pt-5">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Por Género</p>
                          <Plot data={[{ values: Object.values(demograficos?.sexo || {}), labels: Object.keys(demograficos?.sexo || {}),
                            type:'pie', hole:0.62, marker:{colors:['#0056b3','#f43f5e','#94a3b8']},
                            textinfo:'percent', textfont:{size:11,family:'Inter'} }]}
                            layout={{ autosize:true, paper_bgcolor:'white', margin:{t:0,b:0,l:0,r:0}, showlegend:true,
                              legend:{orientation:'h',font:{size:10,family:'Inter'},y:-0.12}, height:175 }}
                            config={{ responsive:true, displayModeBar:false }} style={{ width:'100%' }} />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* ── Tendencia por Período ── solo en Vista General */}
                  {!periodoActivo && (tendenciasPorPeriodo.length > 1 || tendencias.length > 1) && (() => {
                    // Priorizar datos por período; fallback a por año
                    const src = tendenciasPorPeriodo.length > 1
                      ? tendenciasPorPeriodo
                      : tendencias.map((t: any) => ({ ...t, periodo: String(t.anio) }))
                    // Ordenar por periodo raw (es alfanumérico comparable)
                    const sorted = [...src].sort((a: any, b: any) => String(a.periodo).localeCompare(String(b.periodo)))
                    const labels = sorted.map((t: any) => displayPeriodo(t.periodo ?? String(t.anio)))
                    const yVals  = sorted.map((t: any) => +t.puntaje_100)
                    const yMin   = Math.max(0, Math.floor(Math.min(...yVals)) - 5)
                    const yMax   = Math.min(100, Math.ceil(Math.max(...yVals))  + 6)
                    const color  = currentTabCfg.color
                    return (
                      <div className="bg-white border border-slate-200 overflow-hidden mb-8" style={{ borderRadius: 6, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Evolución ·</span>
                            <h3 className="text-[13px] font-bold text-slate-700">Tendencia por Período — {currentTabCfg.label}</h3>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-1 rounded border"
                            style={{ color, background:`${color}10`, borderColor:`${color}30`, borderRadius:4 }}>
                            {sorted.length} período{sorted.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="p-5">
                          <Plot
                            data={[{
                              type: 'scatter' as const,
                              mode: 'lines+markers+text' as const,
                              x: labels,
                              y: yVals,
                              line:  { color, width: 3, shape:'spline', smoothing: 0.5 },
                              marker:{ size: 10, color:'white', symbol:'circle', line:{ color, width: 2.5 } },
                              text:  yVals.map((v: number) => v.toFixed(1)),
                              textposition: 'top center' as const,
                              textfont:  { family:'Inter', size: 10, color },
                              hovertemplate: `<b>${currentTabCfg.label}</b> · %{x}<br><b>%{y:.1f}/100</b><extra></extra>`,
                              fill: 'tozeroy' as const,
                              fillcolor: `${color}0d`,
                            }]}
                            layout={{
                              autosize: true, paper_bgcolor:'white', plot_bgcolor:'white',
                              font: { family:'Inter', size:9, color:'#64748b' },
                              margin: { t:28, b:60, l:46, r:16 },
                              xaxis: {
                                type:'category' as const,
                                categoryorder:'array' as const, categoryarray: labels,
                                tickfont:{ family:'Inter', size:11, color:'#1e293b' },
                                showgrid:false, zeroline:false, showline:true, linecolor:'#e2e8f0',
                                tickangle: labels.length > 6 ? -30 : 0,
                              },
                              yaxis: {
                                gridcolor:'#f0f4f8', range:[yMin, yMax],
                                tickfont:{ family:'Inter', size:9, color:'#94a3b8' },
                                showgrid:true, zeroline:false, nticks:6,
                              },
                              showlegend: false,
                              shapes: [{ type:'line', x0:0, x1:1, xref:'paper', y0:90, y1:90,
                                line:{ color:'#10b981', width:1.5, dash:'dot' } }],
                              annotations: [{ x:1, y:90, xref:'paper', yref:'y', text:'Meta 90',
                                showarrow:false, font:{ size:9, color:'#10b981', family:'Inter' },
                                xanchor:'right', yanchor:'bottom', yshift:4 }],
                            }}
                            config={{ responsive:true, displayModeBar:false }}
                            style={{ width:'100%', height:'260px' }}
                          />
                        </div>
                      </div>
                    )
                  })()}
                  {/* ── Ranking por Carrera + Competencias (calculado desde todosDocentes) ── */}
                  {todosDocentes.length > 0 && (() => {
                    const SALUD_CARRERAS = new Set([
                      'Medicina','Laboratorio Clínico','Psicología',
                      'Enfermería','Enfermería – Quinindé','Enfermería – San Lorenzo',
                      'Fisioterapia','TC Enfermería',
                    ])
                    const TODAS_CARRERAS = new Set([
                      'Administración de Empresas','Agroindustria','Contabilidad y Auditoría',
                      'Derecho','Diseño Gráfico','Edu. Básica Semi - Quinindé','Educación Básica',
                      'Enfermería','Enfermería – Quinindé','Enfermería – San Lorenzo',
                      'Fisioterapia','Ing. Recursos Naturales Renova','Laboratorio Clínico',
                      'Medicina','Negocios Internacionales','Pedagogía Idiomas Nac. Ext.',
                      'Psicología','TC Enfermería','Tecnologías de la Información',
                      'TG Desarrollo de Software','TG Gestión Culinaria',
                    ])
                    const CARR_SET = sistema === 'salud' ? SALUD_CARRERAS : TODAS_CARRERAS
                    // todosDocentes usa 'puntaje' (no puntaje_100) y componentes=[{label,pct}]
                    const facBucket: Record<string,{ scores:number[], comps:Record<string,number[]> }> = {}
                    for (const d of todosDocentes) {
                      const fac = d.facultad || ''
                      if (!fac || !CARR_SET.has(fac)) continue
                      if (!facBucket[fac]) facBucket[fac] = { scores:[], comps:{} }
                      if (d.puntaje != null && +d.puntaje > 0) facBucket[fac].scores.push(+d.puntaje)
                      // componentes es array [{label, pct}]
                      for (const comp of (d.componentes || [])) {
                        const lbl: string = comp.label || ''
                        const val: number = +(comp.pct ?? 0)
                        if (!lbl || val <= 0) continue
                        if (!facBucket[fac].comps[lbl]) facBucket[fac].comps[lbl] = []
                        facBucket[fac].comps[lbl].push(val)
                      }
                    }
                    const ranked = Object.entries(facBucket)
                      .map(([fac, b]) => ({
                        fac,
                        avg: b.scores.length ? Math.round(b.scores.reduce((a,v)=>a+v,0)/b.scores.length*10)/10 : 0,
                        n: b.scores.length,
                        comps: b.comps,
                      }))
                      .filter(r => r.avg > 0)
                      .sort((a,b) => b.avg - a.avg)

                    if (!ranked.length) return null

                    const pctColor = (v:number) => v>=90?'#059669':v>=80?'#0056b3':v>=70?'#d97706':'#dc2626'
                    const pctBg    = (v:number) => v>=90?'#ecfdf5':v>=80?'#eff6ff':v>=70?'#fef3c7':'#fef2f2'
                    const pctLabel = (v:number) => v>=90?'Excelente':v>=80?'Bueno':v>=70?'Regular':'Crítico'
                    const TOP_CHART = 25
                    const chartData = ranked.slice(0, TOP_CHART)

                    // Competencias: usar los labels del array componentes
                    const compRows = ranked.map(r => {
                      const avgs: Record<string,number> = {}
                      for (const [lbl, vals] of Object.entries(r.comps)) {
                        if (vals.length) avgs[lbl] = Math.round(vals.reduce((a,v)=>a+v,0)/vals.length*10)/10
                      }
                      if (Object.keys(avgs).length < 2) return null
                      const best  = Object.entries(avgs).reduce((a,b)=>b[1]>a[1]?b:a)
                      const worst = Object.entries(avgs).reduce((a,b)=>b[1]<a[1]?b:a)
                      return { carrera:r.fac, n:r.n, mejor_comp:best[0], mejor_puntaje:best[1], peor_comp:worst[0], peor_puntaje:worst[1] }
                    }).filter(Boolean) as any[]

                    return (
                      <div className="mt-6 flex flex-col gap-5">
                        {/* ── Bar + tabla ranking ── */}
                        <div className="bg-white border border-slate-200 overflow-hidden" style={{ borderRadius:10, boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }}>
                          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:'#eff6ff' }}>
                              <Award size={14} style={{ color:'#0056b3' }}/>
                            </div>
                            <div>
                              <h3 className="text-[13px] font-black text-slate-800 leading-tight">Ranking por Carrera</h3>
                              <p className="text-[9px] text-slate-400 font-medium">Promedio general por programa académico</p>
                            </div>
                            <div className="ml-auto flex items-center gap-2 flex-wrap">
                              {[['#059669','≥90 Excelente'],['#0056b3','≥80 Bueno'],['#d97706','≥70 Regular'],['#dc2626','<70 Crítico']].map(([c,l])=>(
                                <span key={l} className="flex items-center gap-1 text-[9px] font-bold" style={{ color:c }}>
                                  <span style={{ width:7,height:7,borderRadius:2,background:c,display:'inline-block'}}/>
                                  {l}
                                </span>
                              ))}
                              <span className="text-[9px] text-slate-300 font-semibold">{ranked.length} carreras</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                            {/* Bar chart */}
                            <div className="p-4">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">Top {Math.min(TOP_CHART,ranked.length)} por promedio</p>
                              <Plot
                                data={[{
                                  type:'bar', orientation:'h',
                                  x: chartData.map(d=>d.avg),
                                  y: chartData.map(d=>d.fac.length>36?d.fac.slice(0,34)+'…':d.fac),
                                  marker:{ color:chartData.map(d=>pctColor(d.avg)), opacity:0.88, line:{width:0} },
                                  text: chartData.map(d=>`  ${d.avg.toFixed(1)}`),
                                  textposition:'outside',
                                  textfont:{ size:9.5, family:'Inter', color:chartData.map(d=>pctColor(d.avg)) },
                                  hovertemplate:'<b>%{y}</b><br>Promedio: <b>%{x:.1f}/100</b><extra></extra>',
                                  width:0.65,
                                }]}
                                layout={{
                                  autosize:true, paper_bgcolor:'transparent', plot_bgcolor:'transparent',
                                  font:{ family:'Inter', size:9 },
                                  margin:{ t:4, b:20, l:190, r:55 },
                                  xaxis:{ range:[Math.max(50,Math.min(...chartData.map(d=>d.avg))-5),105], gridcolor:'#f1f5f9', zeroline:false, tickfont:{size:8,color:'#94a3b8'} },
                                  yaxis:{ tickfont:{size:9,color:'#334155',family:'Inter'}, autorange:'reversed' },
                                  shapes:[{ type:'line',x0:90,x1:90,y0:0,y1:1,yref:'paper', line:{color:'#10b981',width:1.5,dash:'dot'} }],
                                  showlegend:false, bargap:0.3,
                                }}
                                config={{ responsive:true, displayModeBar:false }}
                                style={{ width:'100%', height:`${Math.max(300,Math.min(TOP_CHART,ranked.length)*26+40)}px` }}
                              />
                            </div>
                            {/* Ranking table */}
                            <div className="p-4">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">Ranking completo</p>
                              <div className="overflow-y-auto" style={{ maxHeight:580 }}>
                                <table className="w-full text-[11px] border-collapse">
                                  <thead className="sticky top-0 z-10">
                                    <tr style={{ background:'#f8fafc' }}>
                                      <th className="text-left py-2 px-2 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] w-7 border-b border-slate-200">#</th>
                                      <th className="text-left py-2 px-2 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200">Carrera</th>
                                      <th className="text-center py-2 px-2 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200 w-14">Prom.</th>
                                      <th className="text-center py-2 px-2 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200 w-16">Nivel</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ranked.map(({ fac, avg, n }, idx) => (
                                      <tr key={fac} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="py-1.5 px-2 text-[9px] font-black tabular-nums text-slate-400">
                                          {idx===0?'🥇':idx===1?'🥈':idx===2?'🥉':<span style={{ color:idx<10?'#0056b3':'#cbd5e1' }}>{idx+1}</span>}
                                        </td>
                                        <td className="py-1.5 px-2">
                                          <div className="flex items-center gap-1.5">
                                            <div style={{ width:50,background:'#f1f5f9',borderRadius:3,height:5,flexShrink:0 }}>
                                              <div style={{ width:`${Math.min(avg,100)}%`,height:5,borderRadius:3,background:pctColor(avg) }}/>
                                            </div>
                                            <span className="font-semibold text-slate-700"
                                              style={{ fontSize:'10px',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'inline-block' }}
                                              title={fac}>{fac}</span>
                                            <span className="text-slate-300 text-[8px]">({n})</span>
                                          </div>
                                        </td>
                                        <td className="py-1.5 px-2 text-center">
                                          <span className="font-black tabular-nums text-[12px]" style={{ color:pctColor(avg) }}>{avg.toFixed(1)}</span>
                                        </td>
                                        <td className="py-1.5 px-2 text-center">
                                          <span className="text-[7.5px] font-black px-1.5 py-0.5 rounded"
                                            style={{ background:pctBg(avg), color:pctColor(avg) }}>{pctLabel(avg)}</span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ── Mejor / Peor Competencia ── */}
                        {compRows.length > 0 && (
                          <div className="bg-white border border-slate-200 overflow-hidden" style={{ borderRadius:10, boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }}>
                            <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center gap-3">
                              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-violet-500 to-blue-500" />
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.18em]">Análisis · Competencias</p>
                                <h3 className="text-[13px] font-black text-slate-800 leading-tight">Mejor y Peor Competencia por Carrera</h3>
                              </div>
                              <span className="ml-auto text-[9px] font-semibold text-slate-300">{compRows.length} carreras</span>
                            </div>
                            <div className="overflow-y-auto" style={{ maxHeight:480 }}>
                              <table className="w-full text-[11px] border-collapse">
                                <thead className="sticky top-0 z-10" style={{ background:'#f8fafc' }}>
                                  <tr>
                                    <th className="text-left py-2 px-3 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200">Carrera</th>
                                    <th className="text-center py-2 px-2 font-black text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200" style={{ color:'#059669' }}>✦ Mejor</th>
                                    <th className="text-center py-2 px-2 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200 w-12">Ptje.</th>
                                    <th className="text-center py-2 px-2 font-black text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200" style={{ color:'#dc2626' }}>▼ Peor</th>
                                    <th className="text-center py-2 px-2 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200 w-12">Ptje.</th>
                                    <th className="text-center py-2 px-2 font-black text-slate-500 text-[8.5px] uppercase tracking-[0.1em] border-b border-slate-200 w-14">Brecha</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {compRows.map((row:any) => {
                                    const brecha = row.mejor_puntaje - row.peor_puntaje
                                    return (
                                      <tr key={row.carrera} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="py-2 px-3">
                                          <span className="font-semibold text-slate-700 text-[10px]"
                                            style={{ maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'inline-block' }}
                                            title={row.carrera}>{row.carrera}</span>
                                          <span className="text-slate-300 text-[8px] ml-1">({row.n})</span>
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                                            style={{ background:'#ecfdf5',color:'#059669',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'inline-block' }}
                                            title={row.mejor_comp}>{row.mejor_comp}</span>
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          <span className="font-black tabular-nums text-[12px]" style={{ color:'#059669' }}>{row.mejor_puntaje.toFixed(1)}</span>
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                                            style={{ background:'#fef2f2',color:'#dc2626',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'inline-block' }}
                                            title={row.peor_comp}>{row.peor_comp}</span>
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          <span className="font-black tabular-nums text-[12px]" style={{ color:'#dc2626' }}>{row.peor_puntaje.toFixed(1)}</span>
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          <span className="text-[10px] font-bold tabular-nums"
                                            style={{ color:brecha>20?'#dc2626':brecha>10?'#d97706':'#64748b' }}>
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
                        )}
                      </div>
                    )
                  })()}


                  {/* Analytics section */}
                  <DeferredMount delay={200}><AnalyticsSection analytics={analytics} color={currentTabCfg.color} /></DeferredMount>

                  {/* Bottom: AI + Table */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* AI Analysis */}
                    <div className="bg-white border border-slate-200 overflow-hidden flex flex-col"
                      style={{ borderRadius: 6, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', borderLeft:'3px solid #4f46e5' }}>
                      <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <BrainCircuit size={14} className="text-indigo-400" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Inteligencia Artificial ·</span>
                          <h3 className="text-[13px] font-bold text-slate-700">Análisis IA</h3>
                        </div>
                        <button onClick={runAnalysisIA}
                          className="text-[10px] font-black px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5"
                          style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow:'0 4px 12px rgba(79,70,229,0.3)' }}>
                          <BrainCircuit size={11}/> Generar
                        </button>
                      </div>
                      <div className="p-7 flex-1">
                        {aiAnalysis ? (
                          <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center gap-3 py-8 text-center">
                            <BrainCircuit size={28} className="text-indigo-200" />
                            <p className="text-xs font-bold text-slate-400">
                              Presiona "Generar" para obtener un análisis estratégico con IA sobre {currentTabCfg.label}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ranking Table */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 overflow-hidden flex flex-col" style={{ borderRadius: 6, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
                      <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ranking ·</span>
                          <h3 className="text-[13px] font-bold text-slate-700">
                            Tabla de {currentTabCfg.label} · {filteredRanking.length} registros
                          </h3>
                        </div>
                        <div className="relative lg:hidden">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                          <input type="text" placeholder="Buscar…"
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056b3] w-40"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                      </div>

                      <div className="overflow-auto max-h-[500px] flex-1">
                        <table className="w-full text-left" style={{ minWidth:'640px' }}>
                          <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-50/95 text-slate-400 uppercase text-[9px] font-black tracking-[0.18em] border-b border-slate-100">
                              <th className="px-3 py-3 w-8 text-center">#</th>
                              <th className="px-4 py-3">Docente</th>
                              <th className="px-3 py-3 hidden md:table-cell">Facultad</th>
                              {compLabels.map((cl,i) => (
                                <th key={i} className="px-2 py-3 text-center" title={`${cl.label} /${cl.max}`}>
                                  {cl.label.split(' ')[0].substring(0,4)}.
                                </th>
                              ))}
                              <th className="px-3 py-3 text-center font-black text-slate-600">Total/100</th>
                              <th className="px-3 py-3 text-center">Nivel</th>
                              <th className="px-3 py-3 text-center">PDF</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRanking.map((doc: any, i) => (
                              <tr key={i} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group">
                                <td className="px-3 py-3 text-center">
                                  <span className="text-[10px] font-black text-slate-300 tabular-nums">{i + 1}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-700 text-xs uppercase leading-tight group-hover:text-[#0056b3] transition-colors truncate max-w-[140px]">{doc.nombre}</div>
                                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">{doc.cedula || doc.anio || doc.periodo}</div>
                                  {doc.fecha_ingreso && (
                                    <div className="text-[9px] text-slate-400 mt-0.5">
                                      Ingreso: {new Date(doc.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-3 hidden md:table-cell">
                                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg truncate block max-w-[110px]">{doc.facultad}</span>
                                </td>
                                {compKeys.map((ck, ci) => (
                                  <td key={ck} className="px-2 py-3 text-center">
                                    <span className="text-[11px] font-bold tabular-nums" style={{ color:COMP_COLORS[ci] }}>
                                      {(doc[ck] || 0).toFixed(1)}
                                    </span>
                                  </td>
                                ))}
                                <td className="px-3 py-3 text-center">
                                  <span className={`inline-flex items-center text-xs font-black px-2.5 py-1 rounded-lg ${
                                    (doc.puntaje_100||0)>=90?'bg-emerald-50 text-emerald-600 border border-emerald-100':
                                    (doc.puntaje_100||0)>=75?'bg-blue-50 text-[#0056b3] border border-blue-100':
                                    (doc.puntaje_100||0)>=60?'bg-amber-50 text-amber-600 border border-amber-100':
                                    'bg-red-50 text-red-600 border border-red-100'}`}>
                                    {(doc.puntaje_100 || 0).toFixed(1)}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <NivelBadge nivel={doc.nivel || ''} />
                                </td>
                                <td className="px-3 py-3 text-center">
                                  {doc.cedula ? (
                                    <button
                                      onClick={() => handleDescargarPDF(doc.cedula)}
                                      disabled={pdfLoading === doc.cedula}
                                      title="Descargar reporte PDF individual"
                                      className="inline-flex items-center justify-center gap-1 text-[9px] font-black px-2 py-1.5 rounded-lg border transition-all"
                                      style={{
                                        background: pdfLoading === doc.cedula ? '#f1f5f9' : '#eff6ff',
                                        borderColor: '#bfdbfe',
                                        color: pdfLoading === doc.cedula ? '#94a3b8' : '#0056b3',
                                        cursor: pdfLoading === doc.cedula ? 'not-allowed' : 'pointer',
                                      }}
                                    >
                                      {pdfLoading === doc.cedula
                                        ? <RefreshCw size={10} className="animate-spin" />
                                        : <Download size={10} />
                                      }
                                    </button>
                                  ) : (
                                    <span className="text-slate-200">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {filteredRanking.length === 0 && (
                          <div className="p-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                            No se encontraron registros.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Todos los Docentes — filtrado por modelo/periodo de esta sección */}
                  {todosDocentes.length > 0 && (() => {
                    const tabLabel = sistema === 'meipa' ? 'MEIPA · Docencia'
                      : sistema === 'salud' ? 'Salud / ABP · MECDI'
                      : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} · MECDI`
                    const { modelo, sistemaParam } = getQueryParams()
                    return (
                      <div className="mt-6">
                        <DeferredMount delay={350}>
                        <TodosDocentesPanel
                          docentes={todosDocentes}
                          context={{ modelo: modelo || '', sistema: sistemaParam || '', label: tabLabel }}
                        />
                        </DeferredMount>
                      </div>
                    )
                  })()}

                </div>
              )}
            </>
  )
}
