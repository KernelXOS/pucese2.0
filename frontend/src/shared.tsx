import React from 'react'
const PlotInner = React.lazy(() => import('./PlotLazy'))
export function Plot(props: any) {
  return (
    <React.Suspense fallback={<div style={{ height: props?.layout?.height || 280 }} />}>
      <PlotInner {...props} />
    </React.Suspense>
  )
}

// ── DeferredMount: monta contenido pesado de forma escalonada ────────────────
// Evita que la UI se congele al renderizar muchos graficos de golpe.
export function DeferredMount({ children, delay = 100, minHeight = 320 }:
  { children: React.ReactNode; delay?: number; minHeight?: number }) {
  const [show, setShow] = React.useState(false)
  React.useEffect(() => {
    const t = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  if (!show) return <div style={{ minHeight }} />
  return <>{children}</>
}
import { FileText, BookOpen, Star, CheckCircle, AlertCircle, XCircle, Microscope, Heart, Link2, Briefcase, GraduationCap, Activity, Cpu } from 'lucide-react'

export const LOGO_URL = 'https://admision.pucese.edu.ec/pluginfile.php/1/theme_moove/logo/1774379971/Logo-puce-azul.png'

export const TABS_360 = [
  { id: 'docencia',       label: 'Docencia',        icon: GraduationCap, color: '#0056b3', desc: 'Het.Est.50 · Par.20 · CEV.10 · Auto.20' },
  { id: 'abp',            label: 'Salud / ABP',      icon: Heart,         color: '#dc2626', desc: 'Het.Est.50 · Par.20 · CEV.10 · Auto.20' },
  { id: 'posgrado',       label: 'Posgrado',         icon: BookOpen,      color: '#8b5cf6', desc: 'Het.Est.60 · Auto.30 · CEV.10' },
  { id: 'tecnologado',    label: 'Tecnologado',      icon: Cpu,           color: '#0891b2', desc: 'Het.Est.50 · Par.20 · CEV.10 · Auto.20' },
  { id: 'vinculacion',    label: 'Vinculación',      icon: Link2,         color: '#059669', desc: 'Het.Est.50 · Auto.20 · Dir.Acad.15 · Dir.Inv.15' },
  { id: 'gestion',        label: 'Gestión',          icon: Briefcase,     color: '#d97706', desc: 'Coevalúa.Dir.50 · Het.Doc.30 · Auto.20' },
  { id: 'investigacion',  label: 'Investigación',    icon: Microscope,    color: '#7c3aed', desc: 'Het.Dir.Inv.50 · Auto.20 · Par.15 · Decano.15' },
]

// Labels and max-points per component (max = peso = max contribution to /100 total)
export const TAB_COMP_LABELS: Record<string, {label: string; max: number}[]> = {
  // Docencia, ABP, Tecnologado: Het.Est(50) + Pares(20) + CEV(10) + Auto(20)
  docencia:       [{label:'Het. Estudiantil',max:50},{label:'Eval. Pares',max:20},{label:'CEV / Entorno Virtual',max:10},{label:'Autoevaluación',max:20}],
  abp:            [{label:'Het. Estudiantil (Med.)',max:50},{label:'Eval. Pares',max:20},{label:'CEV / Entorno Virtual',max:10},{label:'Autoevaluación',max:20}],
  servicios:      [{label:'Het. Estudiantil (Práctica Hosp.)',max:100}],
  tecnologado:    [{label:'Het. Estudiantil',max:50},{label:'Eval. Pares',max:20},{label:'CEV / Entorno Virtual',max:10},{label:'Autoevaluación',max:20}],
  // Posgrado: Het.Est(60) + Auto(30) + CEV(10) — solo 3 componentes
  posgrado:       [{label:'Het. Estudiantil Posgrado',max:60},{label:'Autoevaluación',max:30},{label:'CEV / Coord. Posgrado',max:10}],
  // Vinculación: Het.Est(50) + Auto(20) + Het.Dir.Acad(15) + Het.Dir.Invest.(15)
  vinculacion:    [{label:'Het. Estudiantil',max:50},{label:'Autoevaluación',max:20},{label:'Het. Dir. Académico',max:15},{label:'Het. Dir. Investigación',max:15}],
  // Gestión / Administrativo: Coevalúa.Dir(50) + Het.Docentes(30) + Auto(20)
  gestion:        [{label:'Coevalúa. Directivo Superior',max:50},{label:'Het. Docentes',max:30},{label:'Autoevaluación',max:20}],
  administrativo: [{label:'Coevalúa. Directivo Superior',max:50},{label:'Het. Docentes',max:30},{label:'Autoevaluación',max:20}],
  // Investigación: Het.Dir.Invest(50) + Auto(20) + Par(15) + Decano(15)
  investigacion:  [{label:'Het. Dir. Investigación',max:50},{label:'Autoevaluación',max:20},{label:'Coevaluación Par',max:15},{label:'Het. Decano/Coord.',max:15}],
  // MEIPA: componentes sobre 100 cada uno (escala propia, peso indicado)
  meipa:          [{label:'Het. Estudiantil (40%)',max:100},{label:'Autoevaluación (20%)',max:100},{label:'Coord→Docente (20%)',max:100},{label:'Eval. Pares (20%)',max:100}],
}

export const TAB_COMP_KEYS: Record<string, string[]> = {
  docencia:       ['het_estudiantil','eval_pares','aula_virtual','autoevaluacion'],
  abp:            ['het_estudiantil','eval_pares','aula_virtual','autoevaluacion'],
  servicios:      ['het_estudiantil'],
  tecnologado:    ['het_estudiantil','eval_pares','aula_virtual','autoevaluacion'],
  posgrado:       ['het_estudiantil','autoevaluacion','aula_virtual'],          // sin pares
  vinculacion:    ['comp_hetero_est','comp_auto','comp_hetero_dir','comp_pares'],
  gestion:        ['comp_hetero_dir','comp_hetero_est','comp_auto'],
  administrativo: ['comp_hetero_dir','comp_hetero_est','comp_auto'],
  investigacion:  ['comp_hetero_dir','comp_auto','comp_pares','comp_hetero_est'],
  meipa:          ['comp_hetero_est','comp_auto','comp_hetero_dir','comp_pares'],
}

export const COMP_COLORS = ['#0056b3','#7c3aed','#10b981','#f59e0b','#ef4444']

// ── Splash ────────────────────────────────────────────────────────────────────
export function SplashScreen({ visible, fading }: { visible: boolean; fading: boolean }) {
  if (!visible) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background:'#fff', opacity: fading?0:1, transition:'opacity 0.8s cubic-bezier(0.4,0,0.2,1)', pointerEvents: fading?'none':'all' }}>
      <div className="h-[3px] w-full" style={{ background:'linear-gradient(90deg,#001f4d,#0056b3,#1a78d4)' }} />
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <img
          src={LOGO_URL}
          alt="PUCESE"
          className="object-contain mb-10"
          style={{ height: 110, filter:'drop-shadow(0 4px 16px rgba(0,86,179,0.13))' }}
        />
        <div className="w-56 h-[2px] rounded-full overflow-hidden bg-slate-100">
          <div className="splash-bar h-full rounded-full" style={{ width:0, background:'linear-gradient(90deg,#0056b3,#1a78d4)' }} />
        </div>
        <p className="mt-3 text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase animate-pulse">Cargando…</p>
      </div>
      <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between" style={{ background:'#fafbfc' }}>
        <p className="text-[10px] text-slate-400 font-medium">© 2025 · PUCESE · Dirección de Calidad y Acreditación</p>
        <p className="text-[10px] font-black text-slate-300 tracking-widest uppercase">v4.0</p>
      </div>
    </div>
  )
}

export function NivelBadge({ nivel }: { nivel: string }) {
  const map: Record<string,{color:string;bg:string;border:string;icon:any}> = {
    'Excelente':  { color:'#059669', bg:'#ecfdf5', border:'#a7f3d0', icon:Star },
    'Bueno':      { color:'#0056b3', bg:'#eff6ff', border:'#bfdbfe', icon:CheckCircle },
    'Regular':    { color:'#d97706', bg:'#fef3c7', border:'#fde68a', icon:AlertCircle },
    'Deficiente': { color:'#dc2626', bg:'#fef2f2', border:'#fecaca', icon:XCircle },
  }
  const s = map[nivel] || { color:'#64748b', bg:'#f8fafc', border:'#e2e8f0', icon:FileText }
  const Icon = s.icon
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg border" style={{ color:s.color, background:s.bg, borderColor:s.border }}>
      <Icon size={10}/>{nivel || 'Sin datos'}
    </span>
  )
}

export function ComponentBar({ label, value, max, peso, color }: { label:string; value:number; max:number; peso:number; color:string }) {
  const pct = max > 0 ? Math.min((value/max)*100,100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-black text-slate-600">{label}</span>
          <span className="ml-2 text-[9px] font-semibold text-slate-400">(peso {peso}%)</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-black" style={{ color }}>{value.toFixed(1)}</span>
          <span className="text-[9px] text-slate-400">/{max}</span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width:`${pct}%`, background:color }} />
      </div>
    </div>
  )
}

export function KPICard({ title, value, label, icon, iconBg, footer, badge, badgeStyle, accent }: any) {
  return (
    <div className="bg-white border border-slate-200 relative overflow-hidden transition-shadow hover:shadow-md"
      style={{ borderRadius: 6, borderTop: `3px solid ${accent}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:'20px 22px' }}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em] leading-tight">{title}</p>
        {badge && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={badgeStyle}>{badge}</span>
        )}
      </div>
      <div className="flex items-baseline gap-2 flex-wrap mb-1">
        <span className="font-black text-slate-900 leading-none" style={{ fontSize: 26, letterSpacing: '-0.02em' }}>{value}</span>
        {label && <span className="text-[11px] text-slate-400 font-medium">{label}</span>}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-[10px] text-slate-400">{footer}</p>
      </div>
    </div>
  )
}

// ── Analytics section ─────────────────────────────────────────────────────────
export function AnalyticsSection({ analytics, color }: { analytics: any; color: string }) {
  if (!analytics) return null

  const genero    = analytics.por_genero     || {}
  const edad      = analytics.por_edad       || {}
  const antiguedad= analytics.por_antiguedad || {}
  const funcion   = analytics.por_funcion    || {}

  const mk3D = (keys:string[], vals:number[], colors:string|string[]) =>
    excel3DBar(keys, vals, colors)

  const filterNulls = (obj: Record<string, number|null>) => ({
    keys: Object.keys(obj).filter(k => obj[k] !== null),
    vals: Object.values(obj).filter(v => v !== null) as number[],
  })

  const { keys: gKeys, vals: gVals } = filterNulls(genero)
  const { keys: eKeys, vals: eVals } = filterNulls(edad)
  const { keys: aKeys, vals: aVals } = filterNulls(antiguedad)
  const { keys: fKeys, vals: fVals } = filterNulls(funcion)

  return (
    <div className="bg-white border border-slate-200 overflow-hidden mb-8" style={{ borderRadius: 6, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
        <Activity size={14} style={{ color, opacity: 0.8 }} />
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Análisis Comparativo ·</span>
        <h3 className="text-[13px] font-bold text-slate-700">Desempeño por Variables Demográficas</h3>
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Por género */}
        {gKeys.length > 0 && (() => { const c = mk3D(gKeys,gVals,['#0f5ca8','#be185d','#64748b']); return (
          <div className="border border-slate-100 overflow-hidden" style={{ borderRadius: 4 }}>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 pt-3">Por Género</p>
            <Plot data={c.data} layout={c.layout} config={{responsive:true,displayModeBar:false}} style={{width:'100%',height:'220px'}} />
          </div>
        )})()}

        {/* Por edad */}
        {eKeys.length > 0 && (() => { const c = mk3D(eKeys,eVals,color); return (
          <div className="border border-slate-100 overflow-hidden" style={{ borderRadius: 4 }}>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 pt-3">Por Edad</p>
            <Plot data={c.data} layout={c.layout} config={{responsive:true,displayModeBar:false}} style={{width:'100%',height:'220px'}} />
          </div>
        )})()}

        {/* Por antigüedad */}
        {aKeys.length > 0 && (() => { const c = mk3D(aKeys,aVals,'#047857'); return (
          <div className="border border-slate-100 overflow-hidden" style={{ borderRadius: 4 }}>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 pt-3">Por Antigüedad</p>
            <Plot data={c.data} layout={c.layout} config={{responsive:true,displayModeBar:false}} style={{width:'100%',height:'220px'}} />
          </div>
        )})()}

        {/* Por función */}
        {fKeys.length > 0 && (() => { const c = mk3D(fKeys,fVals,'#92400e'); return (
          <div className="border border-slate-100 overflow-hidden" style={{ borderRadius: 4 }}>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 pt-3">Por Función</p>
            <Plot data={c.data} layout={c.layout} config={{responsive:true,displayModeBar:false}} style={{width:'100%',height:'220px'}} />
          </div>
        )})()}

        {(gKeys.length + eKeys.length + aKeys.length + fKeys.length) === 0 && (
          <div className="col-span-4 py-12 text-center text-slate-400 text-xs font-bold">
            No hay datos de analytics disponibles para este filtro.
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared chart helpers ───────────────────────────────────────────────────────
export const CARD_SHADOW = { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }

export function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
      style={{ boxShadow:'0 1px 3px rgba(0,0,0,0.05), 0 10px 28px -16px rgba(15,23,42,0.25)' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 14px 36px -14px rgba(15,23,42,0.28), 0 4px 12px rgba(0,0,0,0.06)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05), 0 10px 28px -16px rgba(15,23,42,0.25)')}>
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2" style={{ background:'linear-gradient(180deg,#fafbfc 0%,#ffffff 100%)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex-shrink-0" />
        {sub && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{sub} ·</span>}
        <h3 className="text-[13px] font-bold text-slate-700">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ── Institutional color system ─────────────────────────────────────────────────
export const IC = {
  primary:  '#1e3a5f',   // deep institutional navy (sidebar, titles)
  blue:     '#1e40af',   // institutional blue (charts, primary actions)
  blueAlt:  '#2563eb',   // slightly lighter blue
  steel:    '#64748b',   // neutral steel gray
  success:  '#15803d',   // performance ≥ 90
  warning:  '#b45309',   // performance ≥ 60
  danger:   '#b91c1c',   // performance < 60
  neutral:  '#94a3b8',   // neutral / inactive
  border:   '#e2e8f0',
  bg:       '#f5f7fa',
  female:   '#9f1239',
  male:     '#1e40af',
}

export function perfColor(v: number): string {
  return v >= 90 ? IC.success : v >= 75 ? IC.blue : v >= 60 ? IC.warning : IC.danger
}

// ── Power BI–style flat bar chart helpers ──────────────────────────────────────

export function flatBar(
  labels: string[],
  values: number[],
  colors: string | string[],
  opts: { maxY?: number; tickAngle?: number; marginB?: number; showMeta?: boolean } = {}
): { data: any[]; layout: any } {
  const maxY = opts.maxY ?? 105
  const c = Array.isArray(colors) ? colors : labels.map(()=>colors as string)
  const mB = opts.marginB ?? (labels.some(l=>l.length>10) ? 105 : labels.some(l=>l.length>6) ? 75 : 50)

  const shapes: any[] = opts.showMeta !== false && values.some(v=>v>0) ? [{
    type:'line', x0:-0.5, x1:labels.length-0.5, y0:90, y1:90,
    line:{ color:'#15803d', width:1.2, dash:'dot' },
  }] : []
  const annotations: any[] = opts.showMeta !== false && values.some(v=>v>0) ? [{
    x:0, y:90, xref:'paper', yref:'y',
    text:'Meta 90', showarrow:false,
    font:{ size:8.5, color:'#15803d', family:'Inter', weight:600 },
    xanchor:'left', yanchor:'bottom', yshift:3,
  }] : []

  return {
    data: [{
      type:'bar', x:labels, y:values,
      marker:{ color:c, line:{ width:0 }, opacity:0.9 },
      text: values.map(v=>`${v.toFixed(1)}`),
      textposition:'outside',
      textfont:{ family:'Inter', size:8.5, color:'#475569' },
      hovertemplate:'<b>%{x}</b><br>%{y:.2f} / 100<extra></extra>',
      showlegend:false,
    }],
    layout:{
      autosize:true, paper_bgcolor:'white', plot_bgcolor:'white',
      font:{ family:'Inter', size:9, color:'#64748b' },
      margin:{ t:22, b:mB, l:44, r:14 },
      xaxis:{
        tickfont:{ family:'Inter', size:9, color:'#334155' },
        tickangle: opts.tickAngle ?? (labels.length>6?-32:0),
        showgrid:false, zeroline:false, showline:false,
        tickcolor:'#e2e8f0',
      },
      yaxis:{
        gridcolor:'#f0f4f8', range:[0,maxY+10],
        tickfont:{ family:'Inter', size:9, color:'#94a3b8' },
        showgrid:true, zeroline:true, zerolinecolor:'#e2e8f0',
        nticks:6, gridwidth:1,
      },
      bargap:0.40, shapes, annotations, showlegend:false,
    },
  }
}

/** Power BI–style grouped bar chart */
export function flatBarGrouped(
  groupLabels: string[],
  series: { name:string; values:(number|null)[]; color:string }[],
  opts: { maxY?:number } = {}
): { data:any[]; layout:any } {
  const maxY = opts.maxY ?? 105
  return {
    data: series.map(ser=>({
      type:'bar', name:ser.name,
      x:groupLabels,
      y:groupLabels.map((_,i)=>ser.values[i]??0),
      marker:{ color:ser.color, line:{ width:0 }, opacity:0.9 },
      hovertemplate:`<b>${ser.name}</b><br>%{x}: %{y:.2f}/100<extra></extra>`,
    })),
    layout:{
      autosize:true, paper_bgcolor:'white', plot_bgcolor:'white',
      font:{ family:'Inter', size:9, color:'#64748b' },
      margin:{ t:22, b:70, l:44, r:14 },
      xaxis:{ tickfont:{ family:'Inter',size:9,color:'#334155' }, tickangle:-20, showgrid:false, zeroline:false, showline:false },
      yaxis:{ gridcolor:'#f0f4f8', range:[0,maxY+10], tickfont:{ family:'Inter',size:9,color:'#94a3b8' }, showgrid:true, zeroline:true, zerolinecolor:'#e2e8f0', nticks:6, gridwidth:1 },
      barmode:'group', bargap:0.30, bargroupgap:0.06,
      showlegend:true,
      legend:{ font:{ family:'Inter',size:10,color:'#334155' }, orientation:'h', y:-0.22, bgcolor:'rgba(0,0,0,0)', borderwidth:0 },
    },
  }
}

// Aliases for backward compat (renamed from excel3D*)
export const excel3DBar     = flatBar
export const excel3DGrouped = (gl:string[], s:any[], o?:any) => flatBarGrouped(gl, s, o)

/** Premium 2-D trend line — clean spline with tight y-range, no fill-to-zero */
export function trendLine2D(
  traces: { x:any[]; y:(number|null)[]; color:string; name:string; dash?:string }[],
  opts: { minY?:number; maxY?:number } = {}
): { data:any[]; layout:any } {
  const allY = traces.flatMap(t=>t.y).filter((v): v is number => v != null)
  const minY = opts.minY ?? Math.max(0, Math.floor(Math.min(...allY)) - 3)
  const maxY = opts.maxY ?? Math.ceil(Math.max(...allY)) + 5
  return {
    data: traces.map(t => ({
      type:'scatter', mode:'lines+markers+text',
      x:t.x, y:t.y, name:t.name,
      line:{color:t.color, width:3, shape:'spline', smoothing:0.7, dash:t.dash??'solid'},
      marker:{size:8, color:'white', symbol:'circle', line:{color:t.color, width:2.5}},
      text:t.y.map(v => v != null ? v.toFixed(1) : ''),
      textposition:'top center',
      textfont:{family:'Inter',size:9,color:t.color},
      hovertemplate:`<b>${t.name}</b><br>%{x}: %{y:.2f}/100<extra></extra>`,
    })),
    layout:{
      autosize:true, paper_bgcolor:'white', plot_bgcolor:'white',
      font:{family:'Inter',size:9,color:'#64748b'},
      margin:{t:24,b:50,l:44,r:10},
      xaxis:{gridcolor:'#f0f4f8',dtick:1,tickformat:'d',
        tickfont:{family:'Inter',size:11,color:'#1e293b'},
        showgrid:false,zeroline:false,showline:true,linecolor:'#e2e8f0'},
      yaxis:{gridcolor:'#f0f4f8',range:[minY,maxY],
        tickfont:{family:'Inter',size:9,color:'#94a3b8'},showgrid:true,zeroline:false,nticks:6,gridwidth:1},
      showlegend: traces.length>1,
      legend:{font:{family:'Inter',size:10,color:'#334155'},orientation:'h',y:-0.22,
        bgcolor:'rgba(0,0,0,0)',borderwidth:0},
      shapes:[{type:'line',x0:traces[0].x[0],x1:traces[0].x[traces[0].x.length-1],
        y0:90,y1:90,line:{color:'#10b981',width:1.5,dash:'dot'}}],
    },
  }
}

// Legacy (pie/donut charts only)
export function barLayout(opts: { tickAngle?: number; marginB?: number; maxY?: number } = {}): any {
  return {
    autosize:true, paper_bgcolor:'white', plot_bgcolor:'white',
    font:{color:'#94a3b8',family:'Inter',size:9},
    margin:{t:8,b:opts.marginB??60,l:42,r:8},
    xaxis:{gridcolor:'#f8fafc',tickangle:opts.tickAngle??-30},
    yaxis:{gridcolor:'#f1f5f9',range:[0,opts.maxY??105]},
    bargap:0.38,
  }
}

// ── AI Q&A Panel ──────────────────────────────────────────────────────────────
export const PREGUNTAS_GENERAL = [
  '¿Cuál fue el mejor docente en general?',
  '¿Qué modelo fue más efectivo, MEIPA o MECDI?',
  '¿Cuál fue la mejor unidad académica y por qué?',
  '¿Los docentes más antiguos son mejores evaluados?',
  '¿Qué género tuvo mejor desempeño y por qué?',
  '¿Cómo influye la edad en el desempeño docente?',
]
export const PREGUNTAS_CARRERAS = [
  '¿Qué carrera tuvo el puntaje más bajo y por qué?',
  '¿Cuál es el componente más débil en Enfermería?',
  '¿Por qué Educación Básica tiene esos resultados?',
  '¿Qué carreras mejoraron más entre 2023 y 2025?',
  '¿Cuáles son las 3 carreras que más necesitan apoyo?',
  '¿Qué diferencia hay entre Medicina y Derecho?',
]
export const PREGUNTAS_DOCENTES = [
  '¿Qué docentes necesitan un plan de mejora urgente?',
  '¿Quiénes mejoraron más entre años?',
  '¿Cuáles son los docentes con mejor hetero-evaluación?',
  '¿Las mujeres jóvenes rinden mejor que las mayores?',
  '¿Qué docentes cumplen todos los parámetros?',
  '¿Quién tuvo la mayor mejora entre períodos?',
]

/** Renderiza markdown básico en JSX sin dependencias externas */
export function MarkdownView({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    // H2
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-[12px] font-black text-slate-800 mt-4 mb-1 border-b border-slate-100 pb-1">{line.slice(3)}</h2>)
    }
    // H3
    else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-[11px] font-bold text-indigo-700 mt-3 mb-1">{line.slice(4)}</h3>)
    }
    // H1
    else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-[13px] font-black text-slate-900 mt-4 mb-2">{line.slice(2)}</h1>)
    }
    // Horizontal rule
    else if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={i} className="border-slate-200 my-3" />)
    }
    // List item
    else if (line.match(/^[\-\*]\s/)) {
      elements.push(
        <div key={i} className="flex gap-1.5 ml-3 mb-0.5">
          <span className="text-indigo-400 font-bold text-[10px] mt-0.5 flex-shrink-0">•</span>
          <span className="text-[11px] text-slate-700 leading-relaxed">{renderInline(line.replace(/^[\-\*]\s/, ''))}</span>
        </div>
      )
    }
    // Numbered list
    else if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\.\s/)![1]
      elements.push(
        <div key={i} className="flex gap-2 ml-3 mb-0.5">
          <span className="text-indigo-500 font-bold text-[10px] w-4 flex-shrink-0">{num}.</span>
          <span className="text-[11px] text-slate-700 leading-relaxed">{renderInline(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      )
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
    }
    // Normal paragraph
    else {
      elements.push(<p key={i} className="text-[11px] text-slate-700 leading-relaxed mb-1">{renderInline(line)}</p>)
    }
    i++
  }
  return <div className="space-y-0">{elements}</div>
}

export function renderInline(text: string): React.ReactNode {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-bold text-slate-900">{p.slice(2,-2)}</strong>
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="bg-slate-100 text-indigo-700 px-1 rounded text-[10px] font-mono">{p.slice(1,-1)}</code>
    return p
  })
}

export const CATEGORIA_ICONS: Record<string, any> = {
  'Pregrado':      GraduationCap,
  'Docencia':      GraduationCap,
  'Salud / ABP':   Heart,
  'Vinculación':   Link2,
  'Investigación': Microscope,
  'Gestión':       Briefcase,
}
export const CATEGORIA_COLORS: Record<string, string> = {
  'Pregrado':      '#0056b3',
  'Docencia':      '#0056b3',
  'Salud / ABP':   '#dc2626',
  'Vinculación':   '#059669',
  'Investigación': '#7c3aed',
  'Gestión':       '#d97706',
}

export const VD_360_TABS = [
  { key: '360_docencia',     label: 'Docencia',       icon: GraduationCap, color: '#0056b3' },
  { key: '360_abp',          label: 'Salud / ABP',    icon: Heart,         color: '#dc2626' },
  { key: '360_tecnologado',  label: 'Tecnologado',    icon: Cpu,           color: '#0891b2' },
  { key: '360_posgrado',     label: 'Posgrado',       icon: BookOpen,      color: '#8b5cf6' },
  { key: '360_vinculacion',  label: 'Vinculación',    icon: Link2,         color: '#059669' },
  { key: '360_investigacion',label: 'Investigación',  icon: Microscope,    color: '#7c3aed' },
  { key: '360_gestion',      label: 'Gestión',        icon: Briefcase,     color: '#d97706' },
]

export const MODELO_COLOR: Record<string, string> = {
  docencia:'#0056b3', abp:'#dc2626', vinculacion:'#059669',
  investigacion:'#7c3aed', gestion:'#d97706', tecnologado:'#0891b2',
  posgrado:'#8b5cf6', administrativo:'#0f766e',
}
export const SISTEMA_COLOR: Record<string, string> = { meipa:'#6d28d9', '360':'#0f5ca8' }

// ── DesempenoPorVariables ─────────────────────────────────────────────────────
export function SidebarItem({ icon, label, active, collapsed, onClick, accentColor, badge }: {
  icon: React.ReactNode; label: string; active: boolean; collapsed: boolean;
  onClick: () => void; accentColor: string; badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 text-left transition-all relative"
      style={{
        padding: collapsed ? '9px 10px' : '9px 10px 9px 14px',
        color: active ? '#fff' : 'rgba(255,255,255,0.58)',
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        borderRadius: 4,
        borderLeft: active ? '2px solid rgba(77,166,232,0.9)' : '2px solid transparent',
      }}
    >
      <span className="flex-shrink-0" style={{ opacity: active ? 1 : 0.65 }}>{icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate" style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{label}</span>
          {badge && (
            <span style={{ fontSize: 9, fontWeight: 700, padding:'2px 5px', borderRadius: 3, background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', letterSpacing:'0.04em' }}>
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  )
}

export const PERIODO_TO_ANIO: Record<string, number> = {
  '202301': 2023, '202302': 2023,
  '202401': 2024, '202402': 2024, '202456': 2024, '202466': 2024,
  '202501': 2025, '202502': 2025, '202556': 2025, '202566': 2025,
}

/** Convierte código de período crudo en etiqueta legible (202571 → Posg-I-2025) */
export function normPeriodo(p: string | number): string {
  const s = String(p).trim()
  if (s.length < 4) return s
  // Handle DB format 'YYYY-[I|II]' → '[I|II]-YYYY'
  if (/^\d{4}-(I|II)$/.test(s)) {
    const [year, sem] = s.split('-')
    return `${sem}-${year}`
  }
  const y = s.slice(0, 4)
  const sufRaw = s.slice(4)
  if (!sufRaw) return `I-${y}`
  const suf = parseInt(sufRaw, 10)
  if (isNaN(suf) || suf === 0 || suf === 1) return `I-${y}`
  if (suf === 2)                return `II-${y}`
  if (suf >= 10 && suf <= 20)  return `TEC-I-${y}`
  if (suf >= 21 && suf <= 30)  return `TEC-II-${y}`
  // suf=56 (202456,202556) y suf=66 (202466,202566) = evaluaciones MECDI G·II
  if (suf === 56 || suf === 66) return `II-${y}`
  // suf=61 (202361,202461) = MEIPA I semestre
  if (suf === 61) return `I-${y}`
  // Posgrado real: sufijos 70-79 (202371,202376,202471,202476,202477,202571,202572,202576)
  if (suf >= 70 && suf <= 73)  return `Posg-I-${y}`
  if (suf >= 74 && suf <= 79)  return `Posg-II-${y}`
  return `II-${y}`
}

/** Versión para mostrar al usuario: añade prefijo G / T / P según tipo.
 *  Acepta tanto códigos crudos ('202301') como labels normalizados ('I-2023'). */
export function displayPeriodo(p: string | number): string {
  const s = String(p).trim()
  // Si ya está normalizado (empieza con letras o tiene formato I/II-YYYY)
  if (s.startsWith('TEC-'))  return s.replace('TEC-', 'T·')
  if (s.startsWith('Posg-')) return s.replace('Posg-', 'P·')
  if (/^(I|II)-\d{4}$/.test(s)) return `P·${s}`
  // Código crudo → normalizar primero
  const norm = normPeriodo(s)
  if (norm.startsWith('TEC-'))  return norm.replace('TEC-', 'T·')
  if (norm.startsWith('Posg-')) return norm.replace('Posg-', 'Posg·')
  if (/^(I|II)-\d{4}$/.test(norm)) return `P·${norm}`
  return norm
}

// ══════════════════════════════════════════════════════════════════════════════
// Main App
// ══════════════════════════════════════════════════════════════════════════════
