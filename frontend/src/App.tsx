import React, { useState, useEffect, useCallback, useRef } from 'react'
import Plot from 'react-plotly.js'
import { api, authStore } from './services/api'
import {
  BarChart3, Users, TrendingUp, BrainCircuit, RefreshCw, Award,
  FileText, Search, BookOpen, Star, CheckCircle, AlertCircle, XCircle,
  Microscope, Heart, Link2, Briefcase, GraduationCap, Calendar,
  Activity, UserCheck, Menu, Bell, LogOut, ChevronDown, ChevronRight,
  LayoutDashboard, Building2, Cpu, Download, FileSpreadsheet, Loader2, Stethoscope,
  Eye, EyeOff, Lock, Mail, Copy,
} from 'lucide-react'

const LOGO_URL = 'https://jorgebanet.com/puce/wp-content/uploads/2025/11/cropped-Logo_PUCESD.png'

// ══════════════════════════════════════════════════════════════════════════════
// Login Page
// ══════════════════════════════════════════════════════════════════════════════
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Ingresa tu correo y contraseña.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.login(email.trim(), password)
      authStore.setToken(res.data.access_token)
      authStore.setUser(email.trim())
      onLogin()
    } catch (err: any) {
      const msg = err?.response?.data?.detail
      setError(msg || 'Correo o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  const BG_IMAGE = '/campus.jpg'

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ fontFamily: 'inherit' }}>

      {/* ── Animaciones del login (scoped) ─────────────────────────────── */}
      <style>{`
        @keyframes loginFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loginKenBurns { from { transform: scale(1); } to { transform: scale(1.08); } }
        .login-fade-1 { animation: loginFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .login-fade-2 { animation: loginFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.12s both; }
        .login-fade-3 { animation: loginFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.24s both; }
        .login-kenburns { animation: loginKenBurns 22s ease-out both; }
      `}</style>

      {/* ── FULL SCREEN background photo ───────────────────────────────── */}
      <img
        src={BG_IMAGE}
        alt="Campus PUCESE"
        className="absolute inset-0 w-full h-full object-cover login-kenburns"
        style={{ objectPosition: 'center 20%' }}
      />
      {/* Dark overlay over entire screen */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(150deg, rgba(0,20,60,0.68) 0%, rgba(0,30,80,0.50) 50%, rgba(0,10,30,0.82) 100%)' }} />

      {/* ── LEFT: branding content (over the photo) ─────────────────────── */}
      <div className="hidden lg:flex flex-1 relative">

        {/* Bottom-left branding */}
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white"
          style={{ background: 'linear-gradient(to top, rgba(0,10,30,0.85) 0%, transparent 100%)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
              <img src={LOGO_URL} alt="PUCESE" style={{ height: 40, width: 40, objectFit: 'contain', display: 'block' }} />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em' }}>PUCE · Esmeraldas</p>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: '#7ec8f0', textTransform: 'uppercase', marginTop: 2 }}>Dirección de Calidad y Acreditación</p>
            </div>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.1, marginBottom: 10, letterSpacing: '-0.03em' }}>
            Sistema de Evaluación<br />Docente SIGA
          </h1>
          <p style={{ fontSize: 14, opacity: 0.7, maxWidth: 360, lineHeight: 1.6 }}>
            Plataforma institucional de análisis y seguimiento del desempeño académico basada en inteligencia artificial.
          </p>

          {/* Stat pills */}
          <div className="flex gap-3 mt-6">
            {[['MEIPA', 'Evaluación interna'],['MECDI','Heteroevaluación'],['SIGA','Gestión académica']].map(([tag, desc]) => (
              <div key={tag}
                className="transition-all duration-300 hover:-translate-y-1 cursor-default"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '6px 14px', backdropFilter: 'blur(8px)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(126,200,240,0.18)'; e.currentTarget.style.borderColor = 'rgba(126,200,240,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#7ec8f0' }}>{tag}</p>
                <p style={{ fontSize: 10, opacity: 0.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top-left watermark */}
        <div className="absolute top-8 left-8">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
            Evaluación Docente IA · v4.0
          </p>
        </div>
      </div>

      {/* ── RIGHT: login panel ──────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[460px] lg:flex-none px-8 py-12 relative overflow-hidden"
        style={{ background: 'transparent' }}>

        {/* Subtle glow top-right */}
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(77,166,232,0.08), transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 pointer-events-none"
          style={{ background: 'radial-gradient(circle at bottom left, rgba(99,102,241,0.07), transparent 70%)' }} />

        <div className="relative w-full max-w-sm">

          {/* Mobile-only logo (hidden on lg) */}
          <div className="flex flex-col items-center mb-8 lg:mb-0">
            <div className="lg:hidden flex flex-col items-center mb-6">
              <div className="rounded-2xl p-3 mb-3" style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                <img src={LOGO_URL} alt="PUCESE" className="object-contain" style={{ height: 48, width: 48 }} />
              </div>
              <p className="font-black text-white" style={{ fontSize: 18, letterSpacing: '-0.02em' }}>PUCE · Esmeraldas</p>
              <p style={{ color: '#4da6e8', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 2 }}>Evaluación Docente</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 login-fade-1">
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Acceso al sistema</p>
            <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.02em' }}>Bienvenido<br />de vuelta</h2>
          </div>

          {/* Card */}
          <div className="rounded-2xl overflow-hidden login-fade-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', boxShadow: '0 24px 56px rgba(0,0,0,0.5)' }}>

            {/* Top accent */}
            <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #0056b3, #4da6e8, #6366f1)' }} />

            <div className="p-7">
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div>
                  <label className="block mb-1.5" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                    Correo institucional
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.28)' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      placeholder="usuario@pucese.edu.ec"
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#fff', fontSize: 13 }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#4da6e8'; e.currentTarget.style.background = 'rgba(77,166,232,0.08)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block mb-1.5" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.28)' }} />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-3 rounded-xl outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#fff', fontSize: 13 }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#4da6e8'; e.currentTarget.style.background = 'rgba(77,166,232,0.08)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity"
                      style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {showPwd ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold"
                    style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.22)', color: '#fca5a5' }}>
                    <AlertCircle size={13} className="flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-60 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: loading ? 'rgba(77,166,232,0.35)' : 'linear-gradient(135deg, #0056b3 0%, #1a7fc1 100%)',
                    boxShadow: loading ? 'none' : '0 6px 20px rgba(0,86,179,0.45)',
                    letterSpacing: '0.03em',
                    marginTop: 4,
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Ingresando…
                    </span>
                  ) : 'Ingresar al sistema'}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center mt-6" style={{ color: 'rgba(255,255,255,0.18)', fontSize: 10 }}>
            © 2025 PUCESE · Dirección de Calidad y Acreditación
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Model tabs (for 360) ──────────────────────────────────────────────────────
const TABS_360 = [
  { id: 'docencia',       label: 'Docencia',        icon: GraduationCap, color: '#0056b3', desc: 'Het.Est.50 · Par.20 · CEV.10 · Auto.20' },
  { id: 'abp',            label: 'Salud / ABP',      icon: Heart,         color: '#dc2626', desc: 'Het.Est.50 · Par.20 · CEV.10 · Auto.20' },
  { id: 'posgrado',       label: 'Posgrado',         icon: BookOpen,      color: '#8b5cf6', desc: 'Het.Est.60 · Auto.30 · CEV.10' },
  { id: 'tecnologado',    label: 'Tecnologado',      icon: Cpu,           color: '#0891b2', desc: 'Het.Est.50 · Par.20 · CEV.10 · Auto.20' },
  { id: 'vinculacion',    label: 'Vinculación',      icon: Link2,         color: '#059669', desc: 'Het.Est.50 · Auto.20 · Dir.Acad.15 · Dir.Inv.15' },
  { id: 'gestion',        label: 'Gestión',          icon: Briefcase,     color: '#d97706', desc: 'Coevalúa.Dir.50 · Het.Doc.30 · Auto.20' },
  { id: 'investigacion',  label: 'Investigación',    icon: Microscope,    color: '#7c3aed', desc: 'Het.Dir.Inv.50 · Auto.20 · Par.15 · Decano.15' },
]

// Labels and max-points per component (max = peso = max contribution to /100 total)
const TAB_COMP_LABELS: Record<string, {label: string; max: number}[]> = {
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

const TAB_COMP_KEYS: Record<string, string[]> = {
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

const COMP_COLORS = ['#0056b3','#7c3aed','#10b981','#f59e0b','#ef4444']

// ── Splash ────────────────────────────────────────────────────────────────────
function SplashScreen({ visible, fading }: { visible: boolean; fading: boolean }) {
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

function NivelBadge({ nivel }: { nivel: string }) {
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

function ComponentBar({ label, value, max, peso, color }: { label:string; value:number; max:number; peso:number; color:string }) {
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

function KPICard({ title, value, label, icon, iconBg, footer, badge, badgeStyle, accent }: any) {
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
function AnalyticsSection({ analytics, color }: { analytics: any; color: string }) {
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
const CARD_SHADOW = { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
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
const IC = {
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

function perfColor(v: number): string {
  return v >= 90 ? IC.success : v >= 75 ? IC.blue : v >= 60 ? IC.warning : IC.danger
}

// ── Power BI–style flat bar chart helpers ──────────────────────────────────────

function flatBar(
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
function flatBarGrouped(
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
const excel3DBar     = flatBar
const excel3DGrouped = (gl:string[], s:any[], o?:any) => flatBarGrouped(gl, s, o)

/** Premium 2-D trend line — clean spline with tight y-range, no fill-to-zero */
function trendLine2D(
  traces: { x:any[]; y:number[]; color:string; name:string; dash?:string }[],
  opts: { minY?:number; maxY?:number } = {}
): { data:any[]; layout:any } {
  const allY = traces.flatMap(t=>t.y)
  const minY = opts.minY ?? Math.max(0, Math.floor(Math.min(...allY)) - 3)
  const maxY = opts.maxY ?? Math.ceil(Math.max(...allY)) + 5
  return {
    data: traces.map(t => ({
      type:'scatter', mode:'lines+markers+text',
      x:t.x, y:t.y, name:t.name,
      line:{color:t.color, width:3, shape:'spline', smoothing:0.7, dash:t.dash??'solid'},
      marker:{size:8, color:'white', symbol:'circle', line:{color:t.color, width:2.5}},
      text:t.y.map(v=>v.toFixed(1)),
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
function barLayout(opts: { tickAngle?: number; marginB?: number; maxY?: number } = {}): any {
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
const PREGUNTAS_GENERAL = [
  '¿Cuál fue el mejor docente en general?',
  '¿Qué modelo fue más efectivo, MEIPA o MECDI?',
  '¿Cuál fue la mejor unidad académica y por qué?',
  '¿Los docentes más antiguos son mejores evaluados?',
  '¿Qué género tuvo mejor desempeño y por qué?',
  '¿Cómo influye la edad en el desempeño docente?',
]
const PREGUNTAS_CARRERAS = [
  '¿Qué carrera tuvo el puntaje más bajo y por qué?',
  '¿Cuál es el componente más débil en Enfermería?',
  '¿Por qué Educación Básica tiene esos resultados?',
  '¿Qué carreras mejoraron más entre 2023 y 2025?',
  '¿Cuáles son las 3 carreras que más necesitan apoyo?',
  '¿Qué diferencia hay entre Medicina y Derecho?',
]
const PREGUNTAS_DOCENTES = [
  '¿Qué docentes necesitan un plan de mejora urgente?',
  '¿Quiénes mejoraron más entre años?',
  '¿Cuáles son los docentes con mejor hetero-evaluación?',
  '¿Las mujeres jóvenes rinden mejor que las mayores?',
  '¿Qué docentes cumplen todos los parámetros?',
  '¿Quién tuvo la mayor mejora entre períodos?',
]

/** Renderiza markdown básico en JSX sin dependencias externas */
function MarkdownView({ text }: { text: string }) {
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

function renderInline(text: string): React.ReactNode {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-bold text-slate-900">{p.slice(2,-2)}</strong>
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="bg-slate-100 text-indigo-700 px-1 rounded text-[10px] font-mono">{p.slice(1,-1)}</code>
    return p
  })
}

function AIConsultaPanel({ anio }: { anio?: number }) {
  const [pregunta, setPregunta]         = useState('')
  const [respuesta, setRespuesta]       = useState('')
  const [loading, setLoading]           = useState(false)
  const [loadingInforme, setLoadingInforme] = useState(false)
  const [preguntaActiva, setPreguntaActiva] = useState<string | null>(null)
  const [tabPreg, setTabPreg]           = useState<'general'|'carreras'|'docentes'>('general')
  const [modoInforme, setModoInforme]   = useState(false)
  const [informe, setInforme]           = useState('')

  const TABS_MAP = { general: PREGUNTAS_GENERAL, carreras: PREGUNTAS_CARRERAS, docentes: PREGUNTAS_DOCENTES }
  const TABS_LABEL = { general: 'General', carreras: 'Por Carrera', docentes: 'Por Docente' }

  const preguntar = async (q: string) => {
    if (!q.trim() || loading) return
    setLoading(true)
    setModoInforme(false)
    setRespuesta('')
    setPreguntaActiva(q)
    setPregunta('')
    try {
      const res = await api.consultaIA(q, anio)
      setRespuesta(res.data.respuesta)
    } catch {
      setRespuesta('⚠️ Error al conectar con la IA. Verifica que la API Key de Gemini esté configurada.')
    } finally {
      setLoading(false)
    }
  }

  const generarInforme = async () => {
    if (loadingInforme) return
    setLoadingInforme(true)
    setModoInforme(true)
    setRespuesta('')
    setInforme('')
    try {
      const res = await api.informeIA()
      setInforme(res.data.informe)
    } catch {
      setInforme('⚠️ Error al generar el informe. Verifica que la API Key de Gemini esté configurada.')
    } finally {
      setLoadingInforme(false)
    }
  }

  const copiarTexto = (txt: string) => {
    navigator.clipboard.writeText(txt).catch(() => {})
  }

  const contenidoActual = modoInforme ? informe : respuesta
  const isWorking = modoInforme ? loadingInforme : loading

  return (
    <div className="bg-white border border-slate-200 overflow-hidden mb-6"
      style={{ borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderLeft: '3px solid #4f46e5' }}>

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BrainCircuit size={14} className="text-indigo-400" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Inteligencia Artificial ·</span>
          <h3 className="text-[13px] font-bold text-slate-700">Análisis IA sobre Evaluación Docente</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generarInforme}
            disabled={loadingInforme || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg,#059669,#0891b2)', boxShadow: '0 2px 8px rgba(5,150,105,0.25)' }}
          >
            {loadingInforme
              ? <><div className="w-2.5 h-2.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Generando…</>
              : <><FileText size={10} /> Generar Informe IA</>
            }
          </button>
          <span className="text-[9px] font-bold px-2 py-1 rounded text-indigo-500 border border-indigo-100 bg-indigo-50">
            Gemini
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Tabs de categorías */}
        <div>
          <div className="flex gap-1 mb-3">
            {(Object.keys(TABS_MAP) as Array<keyof typeof TABS_MAP>).map(t => (
              <button key={t} onClick={() => setTabPreg(t)}
                className="text-[9px] font-bold px-3 py-1 rounded-full border transition-all"
                style={{
                  background: tabPreg === t ? '#eef2ff' : '#f8fafc',
                  borderColor: tabPreg === t ? '#4f46e5' : '#e2e8f0',
                  color: tabPreg === t ? '#4f46e5' : '#94a3b8',
                }}>
                {TABS_LABEL[t]}
              </button>
            ))}
            <span className="ml-auto text-[9px] text-slate-400 font-medium self-center">Haz clic para consultar</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TABS_MAP[tabPreg].map(q => (
              <button key={q} onClick={() => preguntar(q)} disabled={loading || loadingInforme}
                className="text-[10px] font-semibold px-3 py-1.5 rounded-full border transition-all disabled:opacity-50 text-left"
                style={{
                  borderColor: preguntaActiva === q && respuesta && !modoInforme ? '#4f46e5' : '#e2e8f0',
                  background:  preguntaActiva === q && respuesta && !modoInforme ? '#eef2ff' : '#f8fafc',
                  color:       preguntaActiva === q && respuesta && !modoInforme ? '#4f46e5' : '#64748b',
                }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input libre */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Escribe cualquier pregunta sobre los datos… (Enter para enviar)"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 transition-all"
              value={pregunta}
              onChange={e => setPregunta(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && preguntar(pregunta)}
              disabled={loading || loadingInforme}
            />
          </div>
          <button
            onClick={() => preguntar(pregunta)}
            disabled={loading || loadingInforme || !pregunta.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 12px rgba(79,70,229,0.25)' }}
          >
            {loading
              ? <><div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Analizando…</>
              : <><BrainCircuit size={12} /> Consultar</>
            }
          </button>
        </div>

        {/* Área de respuesta */}
        {(isWorking || contenidoActual) && (
          <div className="rounded-xl border overflow-hidden"
            style={{ borderColor: modoInforme ? '#a7f3d0' : '#c7d2fe', background: modoInforme ? '#f0fdf4' : '#eef2ff20' }}>
            {/* Sub-header de respuesta */}
            <div className="px-4 py-2 border-b flex items-center justify-between"
              style={{ borderColor: modoInforme ? '#a7f3d0' : '#c7d2fe', background: modoInforme ? '#d1fae5' : '#eef2ff' }}>
              <div className="flex items-center gap-2">
                {isWorking
                  ? <div className="w-3 h-3 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
                  : <BrainCircuit size={12} className={modoInforme ? 'text-emerald-600' : 'text-indigo-500'} />}
                <span className="text-[9px] font-black uppercase tracking-widest"
                  style={{ color: modoInforme ? '#059669' : '#4f46e5' }}>
                  {isWorking
                    ? (modoInforme ? 'Generando informe completo…' : 'Analizando datos reales…')
                    : (modoInforme ? 'Informe Ejecutivo IA' : `Respuesta a: "${preguntaActiva}"`)
                  }
                </span>
              </div>
              {!isWorking && contenidoActual && (
                <button onClick={() => copiarTexto(contenidoActual)}
                  className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded border transition-all hover:bg-white"
                  style={{ borderColor: modoInforme ? '#6ee7b7' : '#c7d2fe', color: modoInforme ? '#059669' : '#4f46e5' }}>
                  <Copy size={9} /> Copiar
                </button>
              )}
            </div>
            {/* Contenido */}
            <div className="p-5 max-h-[600px] overflow-y-auto">
              {isWorking
                ? <div className="flex items-center gap-3 text-slate-400 py-4">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin flex-shrink-0" />
                    <span className="text-xs font-semibold animate-pulse">
                      {modoInforme
                        ? 'Analizando todos los datos: ranking, tendencias, carreras, demografía… Esto puede tardar ~15s'
                        : 'Consultando datos reales de evaluación docente…'}
                    </span>
                  </div>
                : <MarkdownView text={contenidoActual} />
              }
            </div>
          </div>
        )}

        {!isWorking && !contenidoActual && (
          <div className="flex items-start gap-3 py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
            <BrainCircuit size={18} className="text-indigo-200 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-slate-600 mb-1">¿Qué puedo analizar?</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Selecciona una pregunta frecuente, escribe la tuya, o haz clic en <strong>Generar Informe IA</strong> para obtener
                un análisis ejecutivo completo con ranking, tendencias, carreras con problemas y recomendaciones estratégicas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Comparativo panel ─────────────────────────────────────────────────────────
function ComparativoPanel({ comparativo }: { comparativo: any }) {
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
const CATEGORIA_ICONS: Record<string, any> = {
  'Pregrado':      GraduationCap,
  'Docencia':      GraduationCap,
  'Salud / ABP':   Heart,
  'Vinculación':   Link2,
  'Investigación': Microscope,
  'Gestión':       Briefcase,
}
const CATEGORIA_COLORS: Record<string, string> = {
  'Pregrado':      '#0056b3',
  'Docencia':      '#0056b3',
  'Salud / ABP':   '#dc2626',
  'Vinculación':   '#059669',
  'Investigación': '#7c3aed',
  'Gestión':       '#d97706',
}

function MejoresPeoresPanel({ mejoresPeores }: { mejoresPeores: Record<string, any> }) {
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
const VD_360_TABS = [
  { key: '360_docencia',     label: 'Docencia',       icon: GraduationCap, color: '#0056b3' },
  { key: '360_abp',          label: 'Salud / ABP',    icon: Heart,         color: '#dc2626' },
  { key: '360_tecnologado',  label: 'Tecnologado',    icon: Cpu,           color: '#0891b2' },
  { key: '360_posgrado',     label: 'Posgrado',       icon: BookOpen,      color: '#8b5cf6' },
  { key: '360_vinculacion',  label: 'Vinculación',    icon: Link2,         color: '#059669' },
  { key: '360_investigacion',label: 'Investigación',  icon: Microscope,    color: '#7c3aed' },
  { key: '360_gestion',      label: 'Gestión',        icon: Briefcase,     color: '#d97706' },
]

function VariablesDetallePanel({
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
const MODELO_COLOR: Record<string, string> = {
  docencia:'#0056b3', abp:'#dc2626', vinculacion:'#059669',
  investigacion:'#7c3aed', gestion:'#d97706', tecnologado:'#0891b2',
  posgrado:'#8b5cf6', administrativo:'#0f766e',
}
const SISTEMA_COLOR: Record<string, string> = { meipa:'#6d28d9', '360':'#0f5ca8' }

// ── DesempenoPorVariables ─────────────────────────────────────────────────────
function DesempenoPorVariables({ data }: { data: any }) {
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
function CompetenciasPreguntas({ data }: { data: any }) {
  const periodos: string[] = data.periodos || []
  const periodLabel = (p: string) =>
    p === '202501' ? 'I-2025' : p === '202502' ? 'II-2025' : p === '202402' ? 'II-2024' : p === '202401' ? 'I-2024' : p

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

      {/* ── Competencias ───────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">Competencias evaluadas</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TableSection
            title="Mejores competencias"
            icon="🏆"
            rows={data.competencias_top || []}
            nameKey="competencia"
            accent="#16a34a"
          />
          <TableSection
            title="Competencias a mejorar"
            icon="⚠️"
            rows={data.competencias_peor || []}
            nameKey="competencia"
            accent="#dc2626"
            flip
          />
        </div>
      </div>

      {/* ── Preguntas ──────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">Preguntas individuales</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TableSection
            title="Preguntas mejor puntuadas"
            icon="⭐"
            rows={data.preguntas_top || []}
            nameKey="pregunta"
            accent="#16a34a"
          />
          <TableSection
            title="Preguntas críticas"
            icon="📉"
            rows={data.preguntas_peor || []}
            nameKey="pregunta"
            accent="#dc2626"
            flip
          />
        </div>
      </div>
    </div>
  )
}

function TodosDocentesPanel({ docentes, context }: { docentes: any[]; context?: { modelo: string; sistema: string; label: string } }) {
  const [search, setSearch]           = useState('')
  const [filterSis, setFilterSis]     = useState('todos')
  const [filterMod, setFilterMod]     = useState('todos')
  const [filterFun, setFilterFun]     = useState('todos')
  const [filterTC,  setFilterTC]      = useState('todos')
  const [sortBy, setSortBy]           = useState<'puntaje'|'nombre'>('puntaje')
  const [expanded, setExpanded]       = useState<string | null>(null)
  const [page, setPage]               = useState(1)
  const [competencias, setCompetencias] = useState<Record<string, any>>({})
  const [loadingComp, setLoadingComp]   = useState<string | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null)
  const PAGE = 40

  const handleExpand = useCallback(async (rowKey: string, cedula: string) => {
    if (expanded === rowKey) { setExpanded(null); return }
    setExpanded(rowKey)
    if (cedula && !competencias[cedula]) {
      setLoadingComp(cedula)
      try {
        const res = await api.getCompetenciasDocente(cedula)
        setCompetencias(prev => ({ ...prev, [cedula]: res.data }))
      } catch { /* sin datos */ }
      finally { setLoadingComp(null) }
    }
  }, [expanded, competencias])

  const downloadDocente = async (cedula: string, nombre: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (downloadingPdf) return
    setDownloadingPdf(cedula)
    try {
      const _rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '')
      const _baseUrl = _rawUrl.endsWith('/evaluacion') ? _rawUrl.slice(0, -'/evaluacion'.length) : _rawUrl
      const res = await fetch(`${_baseUrl}/docentes/${cedula}/reporte.pdf`)
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `Reporte_${nombre.split(' ').slice(0,2).join('_')}_${cedula}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch(e) {
      console.error('Error descargando PDF:', e)
      alert('No se pudo generar el reporte PDF.')
    }
    setDownloadingPdf(null)
  }

  // ── Report helpers ───────────────────────────────────────────────────────
  const generateCSV = () => {
    const title = context ? `Docentes — ${context.label}` : 'Todos los Docentes'
    const headers = ['#','Nombre','Cédula','Facultad','Sistema','Modelo','Puntaje','Nivel']
    const rows = filtered.map((d:any,i:number) => [
      i+1, d.nombre||'', d.cedula||'', d.facultad||'',
      (d.sistema||'').toUpperCase(), d.modelo||'',
      (+d.puntaje).toFixed(1), d.nivel||'',
    ])
    const csv = [`"${title}"`, headers.map(h=>`"${h}"`).join(','),
      ...rows.map((r:any[]) => r.map(v=>`"${v}"`).join(','))
    ].join('\n')
    const blob = new Blob(['﻿'+csv], { type:'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `reporte-docentes-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const generatePDF = async () => {
    const count = filtered.length
    if (count > 500) {
      alert(`El filtro actual incluye ${count} docentes. Por favor filtra a menos de 500 para generar el PDF.`)
      return
    }
    if (count > 100) {
      const ok = window.confirm(`Se generará un reporte con ${count} páginas (una por docente). Esto puede tardar un momento. ¿Continuar?`)
      if (!ok) return
    }

    setGeneratingPDF(true)
    try {
      const cedulas = filtered.map((d: any) => d.cedula).filter(Boolean)

      const _rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '')
      const _baseUrl = _rawUrl.endsWith('/evaluacion') ? _rawUrl.slice(0, -'/evaluacion'.length) : _rawUrl
      const res = await fetch(`${_baseUrl}/docentes/reporte-bulk.pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedulas }),
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `Error ${res.status}`)
      }

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `Reportes_Docentes_${new Date().toISOString().slice(0,10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch(e) {
      console.error('Error generando PDF:', e)
      alert('Error al generar el PDF. Intente de nuevo.')
    }
    setGeneratingPDF(false)
  }

  const modelos   = Array.from(new Set(docentes.map(d => d.modelo))).sort()
  const funciones = Array.from(new Set(docentes.map(d => d.funcion_docente).filter(Boolean))).sort()

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return docentes
      .filter(d => {
        if (!context && filterSis !== 'todos' && d.sistema !== filterSis) return false
        if (!context && filterMod !== 'todos' && d.modelo !== filterMod) return false
        if (filterFun !== 'todos' && (d.funcion_docente || '').toLowerCase() !== filterFun.toLowerCase()) return false
        if (filterTC !== 'todos') {
          const ts = (d.tiempo_servicio || '').toLowerCase()
          if (filterTC === 'tc' && !ts.includes('completo')) return false
          if (filterTC === 'tp' && !ts.includes('parcial'))  return false
        }
        if (q && !d.nombre?.toLowerCase().includes(q) && !d.cedula?.includes(q) && !d.facultad?.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => sortBy === 'puntaje' ? b.puntaje - a.puntaje : a.nombre.localeCompare(b.nombre))
  }, [docentes, search, filterSis, filterMod, filterFun, filterTC, sortBy, context])

  const total   = filtered.length
  const visible = filtered.slice(0, page * PAGE)
  const hasMore = visible.length < total

  const nivelStyle = (n: string) => ({
    'Excelente':  { bg:'#ecfdf5', c:'#059669', bd:'#a7f3d0' },
    'Bueno':      { bg:'#eff6ff', c:'#0056b3', bd:'#bfdbfe' },
    'Regular':    { bg:'#fef3c7', c:'#d97706', bd:'#fde68a' },
    'Deficiente': { bg:'#fef2f2', c:'#dc2626', bd:'#fecaca' },
  }[n] || { bg:'#f8fafc', c:'#64748b', bd:'#e2e8f0' })

  const pctColor = (p: number) => p >= 90 ? '#059669' : p >= 75 ? '#0056b3' : p >= 60 ? '#d97706' : '#dc2626'

  return (
    <div className="bg-white border border-slate-200 overflow-hidden mb-6"
      style={{ borderRadius:6, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', borderTop:'3px solid #334155' }}>

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Users size={14} className="text-slate-500 flex-shrink-0" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Directorio ·</span>
          <h3 className="text-[13px] font-bold text-slate-700">
            {context ? `Docentes — ${context.label}` : 'Todos los Docentes — Desglose por Variables'}
          </h3>
        </div>
        <span className="text-[9px] font-bold px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-500">
          {total} de {docentes.length} docentes
        </span>
        {/* Report buttons */}
        <button
          onClick={generateCSV}
          title="Descargar Excel/CSV con los datos filtrados"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all"
          style={{ background:'#f0fdf4', color:'#059669', borderColor:'#bbf7d0' }}
        >
          <FileSpreadsheet size={12} />
          Excel
        </button>
        <button
          onClick={generatePDF}
          disabled={generatingPDF}
          title="Generar reporte PDF individual por cada docente (1 página por profesor)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all"
          style={{ background:'#eff6ff', color:'#0056b3', borderColor:'#bfdbfe', opacity: generatingPDF ? 0.7 : 1 }}
        >
          {generatingPDF ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          {generatingPDF ? 'Generando…' : 'PDF + Gráficas'}
        </button>
      </div>

      {/* Filters */}
      <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap gap-2 items-center bg-slate-50/60">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" placeholder="Buscar por nombre, cédula o facultad…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white outline-none focus:border-slate-400"
          />
        </div>
        {/* Sistema — solo en vista general */}
        {!context && (
          <select value={filterSis} onChange={e => { setFilterSis(e.target.value); setPage(1) }}
            className="text-[11px] font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none text-slate-600">
            <option value="todos">Todos los modelos</option>
            <option value="360">MECDI</option>
            <option value="meipa">MEIPA</option>
          </select>
        )}
        {/* Modelo — solo en vista general */}
        {!context && (
          <select value={filterMod} onChange={e => { setFilterMod(e.target.value); setPage(1) }}
            className="text-[11px] font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none text-slate-600">
            <option value="todos">Todos los modelos</option>
            {modelos.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
          </select>
        )}
        {/* TC/TP */}
        <select value={filterTC} onChange={e => { setFilterTC(e.target.value); setPage(1) }}
          className="text-[11px] font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none text-slate-600">
          <option value="todos">TC y TP</option>
          <option value="tc">Tiempo Completo</option>
          <option value="tp">Tiempo Parcial</option>
        </select>
        {/* Función */}
        {funciones.length > 0 && (
          <select value={filterFun} onChange={e => { setFilterFun(e.target.value); setPage(1) }}
            className="text-[11px] font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none text-slate-600">
            <option value="todos">Todas las funciones</option>
            {funciones.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        )}
        {/* Sort */}
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="text-[11px] font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none text-slate-600">
          <option value="puntaje">Ordenar: Mayor puntaje</option>
          <option value="nombre">Ordenar: Nombre A–Z</option>
        </select>
      </div>

      {/* Table header — ocultar Sistema/Modelo en vista de modelo específico */}
      {context ? (
        <div className="hidden lg:grid px-5 py-2 border-b border-slate-100 bg-slate-50/40 text-[9px] font-black uppercase tracking-widest text-slate-400"
          style={{ gridTemplateColumns:'2.5rem 1fr 5rem 6rem 1fr' }}>
          <span>#</span><span>Docente</span>
          <span className="text-right">Puntaje</span><span className="text-center">Nivel</span>
          <span>Variables</span>
        </div>
      ) : (
        <div className="hidden lg:grid px-5 py-2 border-b border-slate-100 bg-slate-50/40 text-[9px] font-black uppercase tracking-widest text-slate-400"
          style={{ gridTemplateColumns:'2.5rem 1fr 7rem 8rem 5rem 6rem 1fr' }}>
          <span>#</span><span>Docente</span><span>Modelo</span><span>Tipo</span>
          <span className="text-right">Puntaje</span><span className="text-center">Nivel</span>
          <span>Variables</span>
        </div>
      )}

      {/* Rows */}
      <div className="divide-y divide-slate-50">
        {visible.map((d: any, i: number) => {
          const rowKey = `${d.cedula}-${d.sistema}-${d.modelo}`
          const isExp  = expanded === rowKey
          const ns     = nivelStyle(d.nivel)
          const modC   = MODELO_COLOR[d.modelo] || '#64748b'
          const sisC   = SISTEMA_COLOR[d.sistema] || '#64748b'
          const best   = d.componentes?.[0]
          const worst  = d.componentes?.[d.componentes.length - 1]

          return (
            <div key={rowKey}>
              <button
                onClick={() => handleExpand(rowKey, d.cedula)}
                className="w-full text-left hover:bg-slate-50/80 transition-colors"
              >
                {/* Desktop grid */}
                <div className="hidden lg:grid px-5 py-3 items-center gap-2"
                  style={{ gridTemplateColumns: context ? '2.5rem 1fr 5rem 6rem 1fr' : '2.5rem 1fr 7rem 8rem 5rem 6rem 1fr' }}>
                  <span className="text-[11px] font-black text-slate-400 tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-slate-800 truncate uppercase">{d.nombre}</p>
                      <p className="text-[9px] text-slate-400 truncate">{d.cedula} {d.facultad ? `· ${d.facultad}` : ''}</p>
                      {d.fecha_ingreso && (
                        <p className="text-[8px] text-slate-400 mt-0.5">
                          Ingreso: {new Date(d.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-EC', { day:'2-digit', month:'short', year:'numeric' })}
                        </p>
                      )}
                      {d.n_evaluadores ? (
                        <p className="text-[8px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span>👥</span><span>{d.n_evaluadores} estudiantes evaluaron</span>
                        </p>
                      ) : null}
                    </div>
                    <button
                      onClick={(e) => downloadDocente(d.cedula, d.nombre, e)}
                      disabled={downloadingPdf === d.cedula}
                      title="Descargar reporte PDF individual"
                      className="flex-shrink-0 p-1 rounded hover:bg-blue-50 transition-colors group"
                    >
                      {downloadingPdf === d.cedula
                        ? <Loader2 size={13} className="animate-spin text-blue-400" />
                        : <FileText size={13} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                      }
                    </button>
                  </div>
                  {/* Sistema y Modelo solo en vista general */}
                  {!context && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                      style={{ background:`${sisC}15`, color:sisC }}>
                      {d.sistema === 'meipa' ? 'MEIPA' : 'MECDI'}
                    </span>
                  )}
                  {!context && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded border"
                      style={{ background:`${modC}10`, color:modC, borderColor:`${modC}30` }}>
                      {d.modelo.charAt(0).toUpperCase()+d.modelo.slice(1)}
                    </span>
                  )}
                  <span className="text-[14px] font-black tabular-nums text-right"
                    style={{ color: pctColor(d.puntaje) }}>{d.puntaje}</span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-center border"
                    style={{ background:ns.bg, color:ns.c, borderColor:ns.bd }}>{d.nivel}</span>
                  {/* Mini component bars */}
                  <div className="space-y-0.5 min-w-0">
                    {(d.componentes || []).slice(0, 3).map((c: any, ci: number) => (
                      <div key={ci} className="flex items-center gap-1.5">
                        <span className="text-[8px] text-slate-400 w-28 truncate flex-shrink-0">{c.label}</span>
                        <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width:`${c.pct}%`, background:pctColor(c.pct) }} />
                        </div>
                        <span className="text-[8px] font-black tabular-nums w-8 text-right flex-shrink-0"
                          style={{ color:pctColor(c.pct) }}>{c.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile card */}
                <div className="lg:hidden px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-bold text-slate-800 truncate uppercase flex-1">{d.nombre}</p>
                        <button
                          onClick={(e) => downloadDocente(d.cedula, d.nombre, e)}
                          disabled={downloadingPdf === d.cedula}
                          title="Descargar reporte PDF"
                          className="flex-shrink-0 p-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          {downloadingPdf === d.cedula
                            ? <Loader2 size={12} className="animate-spin text-blue-400" />
                            : <FileText size={12} className="text-slate-300 hover:text-blue-500 transition-colors" />
                          }
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400 truncate">{d.cedula}</p>
                      <div className="flex gap-1 mt-1">
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                          style={{ background:`${sisC}15`, color:sisC }}>{d.sistema === 'meipa' ? 'MEIPA' : 'MECDI'}</span>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border"
                          style={{ background:`${modC}10`, color:modC, borderColor:`${modC}30` }}>
                          {d.modelo.charAt(0).toUpperCase()+d.modelo.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[16px] font-black tabular-nums" style={{ color:pctColor(d.puntaje) }}>{d.puntaje}</p>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded border"
                        style={{ background:ns.bg, color:ns.c, borderColor:ns.bd }}>{d.nivel}</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              {isExp && (
                <div className="px-5 pb-5 bg-slate-50/60 border-t border-slate-100">
                  <div className="flex items-center justify-between pt-3 mb-2 flex-wrap gap-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Componentes del Modelo — {d.modelo.charAt(0).toUpperCase()+d.modelo.slice(1)} · {d.sistema === 'meipa' ? 'MEIPA' : 'MECDI'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {d.tiempo_servicio && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background:'#f0fdf4', color:'#059669', border:'1px solid #bbf7d0' }}>
                          ⏱️ {d.tiempo_servicio}
                        </span>
                      )}
                      {d.funcion_docente && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background:'#faf5ff', color:'#7c3aed', border:'1px solid #e9d5ff' }}>
                          🎓 {d.funcion_docente}
                        </span>
                      )}
                      {d.n_evaluadores ? (
                        <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background:'#eff6ff', color:'#0056b3', border:'1px solid #bfdbfe' }}>
                          <span>👥</span>
                          <span>{d.n_evaluadores} estudiantes evaluaron</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {(d.componentes || []).map((c: any, ci: number) => {
                      const col = pctColor(c.pct)
                      const isBest  = ci === 0
                      const isWorst = ci === (d.componentes.length - 1)
                      return (
                        <div key={ci}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-700">{c.label}</span>
                              {isBest  && <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">✦ Mejor</span>}
                              {isWorst && d.componentes.length > 1 && <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-red-50 text-red-500 border border-red-200">↓ Menor</span>}
                            </div>
                            <span className="text-[12px] font-black tabular-nums" style={{ color:col }}>{c.pct}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width:`${c.pct}%`, background:col }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {loadingComp === d.cedula ? (
                    <div className="flex items-center gap-2 py-3 text-slate-400">
                      <RefreshCw size={11} className="animate-spin" />
                      <span className="text-[10px]">Cargando competencias…</span>
                    </div>
                  ) : (() => {
                    const comp = competencias[d.cedula]
                    if (!comp) return null
                    const all360   = comp['360']   || []
                    const allMeipa = comp['meipa'] || []
                    const grupos360: Record<string, any[]> = {}
                    for (const c of all360) {
                      const gk = `${c.periodo} · ${c.instrumento}`
                      if (!grupos360[gk]) grupos360[gk] = []
                      grupos360[gk].push(c)
                    }
                    const gruposMeipa: Record<string, any[]> = {}
                    for (const c of allMeipa) {
                      if (!gruposMeipa[c.periodo]) gruposMeipa[c.periodo] = []
                      gruposMeipa[c.periodo].push(c)
                    }
                    const hasAny = all360.length > 0 || allMeipa.length > 0
                    if (!hasAny) return (
                      <p className="text-[9px] text-slate-400 italic">Sin datos de competencias por pregunta disponibles.</p>
                    )
                    return (
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 border-t border-slate-200 pt-3">
                          Competencias por Pregunta
                        </p>
                        {Object.entries(grupos360).map(([gk, items]) => {
                          const sorted = [...items].sort((a, b) => b.pct - a.pct)
                          return (
                            <div key={gk} className="mb-4">
                              <p className="text-[9px] font-black text-[#0056b3] mb-1.5 uppercase tracking-wider">{gk}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                                {sorted.map((c: any, ci: number) => (
                                  <div key={ci} className="flex items-center gap-2">
                                    <span className="text-[9px] text-slate-600 flex-1 min-w-0 truncate">{c.competencia}</span>
                                    <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                      <div className="h-full rounded-full" style={{ width:`${c.pct}%`, background:pctColor(c.pct) }} />
                                    </div>
                                    <span className="text-[9px] font-black w-8 text-right flex-shrink-0" style={{ color:pctColor(c.pct) }}>{c.pct}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                        {Object.entries(gruposMeipa).map(([periodo, items]) => {
                          const sorted = [...items].sort((a, b) => b.pct - a.pct)
                          return (
                            <div key={periodo} className="mb-4">
                              <p className="text-[9px] font-black text-[#6d28d9] mb-1.5 uppercase tracking-wider">MEIPA · {periodo}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                                {sorted.map((c: any, ci: number) => (
                                  <div key={ci} className="flex items-center gap-2">
                                    <span className="text-[9px] text-slate-600 flex-1 min-w-0 truncate">{c.competencia}</span>
                                    <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                      <div className="h-full rounded-full" style={{ width:`${c.pct}%`, background:pctColor(c.pct) }} />
                                    </div>
                                    <span className="text-[9px] font-black w-8 text-right flex-shrink-0" style={{ color:pctColor(c.pct) }}>{c.pct}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )
        })}

        {total === 0 && (
          <p className="text-sm text-slate-400 text-center py-10">No se encontraron docentes con los filtros actuales.</p>
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/40">
          <span className="text-[11px] text-slate-400">Mostrando {visible.length} de {total}</span>
          <button onClick={() => setPage(p => p + 1)}
            className="text-[11px] font-bold text-[#0056b3] hover:underline">
            Cargar {Math.min(PAGE, total - visible.length)} más →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Sidebar item ──────────────────────────────────────────────────────────────
function SidebarItem({ icon, label, active, collapsed, onClick, accentColor, badge }: {
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

const PERIODO_TO_ANIO: Record<string, number> = {
  '202301': 2023, '202302': 2023,
  '202401': 2024, '202402': 2024, '202456': 2024, '202466': 2024,
  '202501': 2025, '202502': 2025, '202556': 2025, '202566': 2025,
}

/** Convierte código de período crudo en etiqueta legible (202571 → Posg-I-2025) */
function normPeriodo(p: string | number): string {
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
  // Posgrado real: sufijos 70-79 (202371,202376,202471,202476,202477,202571,202572,202576)
  if (suf >= 70 && suf <= 73)  return `Posg-I-${y}`
  if (suf >= 74 && suf <= 79)  return `Posg-II-${y}`
  return `II-${y}`
}

/** Versión para mostrar al usuario: añade prefijo G / T / P según tipo.
 *  Acepta tanto códigos crudos ('202301') como labels normalizados ('I-2023'). */
function displayPeriodo(p: string | number): string {
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
export default function App() {
  // ── Auth guard ─────────────────────────────────────────────────────────────
  const [isAuth, setIsAuth] = useState(authStore.isAuthenticated())

  if (!isAuth) {
    return <LoginPage onLogin={() => setIsAuth(true)} />
  }

  return <AppDashboard onLogout={() => { authStore.clearToken(); setIsAuth(false) }} />
}

function AppDashboard({ onLogout }: { onLogout: () => void }) {
  // Sistema selector: 'overview' | 'meipa' | '360' | 'salud'
  const [sistema, setSistema]         = useState<'overview'|'meipa'|'360'|'salud'>('overview')
  const [activeTab, setActiveTab]     = useState('docencia')  // for 360 sub-model
  const [activeAnio, setActiveAnio]   = useState<number | undefined>(undefined)
  const [saludSubTab, setSaludSubTab] = useState<'abp'|'servicios'>('abp')

  const [kpis, setKpis]               = useState<any>(null)
  const [serviciosKpis, setServiciosKpis] = useState<any>(null)
  const [ranking, setRanking]         = useState<any[]>([])
  const [demograficos, setDemograficos] = useState<any>(null)
  const [tendencias, setTendencias]               = useState<any[]>([])
  const [tendenciasPorPeriodo, setTendPorPeriodo] = useState<any[]>([])
  const [analytics, setAnalytics]     = useState<any>(null)
  const [comparativo, setComparativo]       = useState<any>(null)
  const [compPreguntas, setCompPreguntas]   = useState<any>(null)
  const [desempVars, setDesempVars]         = useState<any>(null)
  const [compPorCarrera, setCompPorCarrera] = useState<any[]>([])
  const [todosDocentes, setTodosDocentes]   = useState<any[]>([])
  const [aiAnalysis, setAiAnalysis]         = useState('')
  const [loading, setLoading]               = useState(true)
  const [processing, setProcessing]   = useState(false)
  const [searchTerm, setSearchTerm]   = useState('')
  const [splashVisible, setSplashVisible] = useState(true)
  const comparativoRef   = useRef<HTMLDivElement>(null)
  const sistemaRef       = useRef<HTMLDivElement>(null)
  const [exportingComp, setExportingComp]   = useState(false)
  const [exportingVista, setExportingVista] = useState(false)
  const [exportingInforme, setExportingInforme] = useState(false)

  // ── Períodos v2 ────────────────────────────────────────────────────────────
  const [periodos, setPeriodos]           = useState<any[]>([])
  const [periodoActivo, setPeriodoActivo] = useState<string>('')  // '202502' etc.
  const [pdfLoading, setPdfLoading]       = useState<string | null>(null) // cedula en descarga
  const [splashFading, setSplashFading]   = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setSplashFading(true), 1600)
    const t2 = setTimeout(() => setSplashVisible(false), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Cargar períodos al montar (solo para saber cuáles tienen datos, no auto-navegar)
  useEffect(() => {
    api.getPeriodos().then(res => {
      setPeriodos(res.data)
    }).catch(() => {})
  }, [])

  const handleDescargarPDF = async (cedula: string) => {
    if (pdfLoading) return
    setPdfLoading(cedula)
    try {
      await api.descargarReportePDF(cedula, periodoActivo || undefined)
    } catch (e) {
      alert('Error al generar el PDF. Intenta de nuevo.')
    } finally {
      setPdfLoading(null)
    }
  }

  const handleDescargarInforme = async (sistemaOpt?: string, modeloOpt?: string) => {
    if (exportingInforme) return
    setExportingInforme(true)
    try {
      await api.descargarInformeGeneral({
        sistema: sistemaOpt,
        modelo:  modeloOpt,
        periodo: periodoActivo || undefined,
      })
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || 'Error desconocido'
      alert(`Error al generar el informe general:\n${detail}`)
    } finally {
      setExportingInforme(false)
    }
  }

  // Determine query params from state
  // periodoActivo tiene prioridad sobre activeAnio (filtro exacto de período)
  const getQueryParams = useCallback(() => {
    const periodoParam = periodoActivo || undefined
    const anioParam   = periodoParam ? undefined : activeAnio  // si hay período, no pasar anio
    if (sistema === 'overview') return { modelo: undefined,   anio: anioParam, sistemaParam: undefined,  periodoParam }
    if (sistema === 'meipa')    return { modelo: 'docencia',  anio: anioParam, sistemaParam: 'meipa',    periodoParam }
    if (sistema === 'salud')    return { modelo: saludSubTab, anio: anioParam, sistemaParam: '360',      periodoParam }
    return { modelo: activeTab, anio: anioParam, sistemaParam: '360', periodoParam }
  }, [sistema, activeTab, activeAnio, saludSubTab, periodoActivo])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setKpis(null); setRanking([]); setDemograficos(null)
    setTendencias([]); setTendPorPeriodo([]); setAnalytics(null); setComparativo(null); setTodosDocentes([])
    setServiciosKpis(null); setCompPorCarrera([])
    try {
      const { modelo, anio, sistemaParam, periodoParam } = getQueryParams()

      if (sistema === 'overview') {
        // Each call is individually resilient — one failure won't blank the whole dashboard
        const [compRes, todosRes, cpRes, dvRes, cpcRes] = await Promise.all([
          api.getComparativo(anio).catch(e => { console.error('[fetch] comparativo:', e); return { data: null } }),
          api.getTodosDocentes(anio, undefined, undefined, periodoParam).catch(e => { console.error('[fetch] todos-docentes:', e); return { data: [] } }),
          api.getCompetenciasPreguntas().catch(() => null),
          api.getDesempenoPorVariables(anio).catch(() => null),
          api.getCompetenciasPorCarrera(anio).catch(() => null),
        ])
        if (compRes?.data) setComparativo(compRes.data)
        setTodosDocentes(Array.isArray(todosRes?.data) ? todosRes.data : [])
        if (cpRes) setCompPreguntas(cpRes.data)
        if (dvRes) setDesempVars(dvRes.data)
        if (cpcRes) setCompPorCarrera(Array.isArray(cpcRes.data) ? cpcRes.data : [])
      } else {
        const noop = (label: string) => (e: any) => { console.error(`[fetch] ${label}:`, e); return null }
        const fetchList: Promise<any>[] = [
          api.getKPIs(modelo, anio, sistemaParam, periodoParam).catch(noop('kpis')),
          api.getRanking(1000, modelo, anio, sistemaParam, periodoParam).catch(noop('ranking')),
          api.getDemograficos(modelo, anio, sistemaParam, periodoParam).catch(noop('demograficos')),
          api.getTendencias(modelo, sistemaParam).catch(noop('tendencias')),  // tendencias: siempre todos los períodos
          api.getAnalytics(sistemaParam, modelo, anio, periodoParam).catch(noop('analytics')),
          api.getTodosDocentes(anio, modelo, sistemaParam, periodoParam).catch(noop('todos')),
        ]
        if (sistema === 'salud' && modelo === 'abp') {
          fetchList.push(api.getKPIs('servicios', anio, '360', periodoParam).catch(() => null))
        }
        const [kpiRes, rankRes, demoRes, tendRes, analyticsRes, todosRes, svcRes] = await Promise.all(fetchList)
        if (kpiRes)      setKpis(kpiRes.data)
        if (rankRes)     setRanking(rankRes.data)
        if (demoRes)     setDemograficos(demoRes.data)
        if (tendRes) {
          const d = tendRes.data
          if (Array.isArray(d)) {
            setTendencias(d)
            setTendPorPeriodo([])
          } else {
            setTendencias(d.por_anio || [])
            setTendPorPeriodo(d.por_periodo || [])
          }
        }
        if (analyticsRes) setAnalytics(analyticsRes.data)
        setTodosDocentes(Array.isArray(todosRes?.data) ? todosRes.data : [])
        if (svcRes) setServiciosKpis(svcRes.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [sistema, getQueryParams])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSistemaChange = (s: 'overview'|'meipa'|'360'|'salud') => {
    setSistema(s)
    setSearchTerm('')
    setAiAnalysis('')
    if (s === '360') setActiveTab('docencia')
    setActiveView('dashboard')  // volver al dashboard principal al cambiar sistema
    if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSearchTerm('')
    setAiAnalysis('')
    if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false)
  }

  const runETL = async () => {
    setProcessing(true)
    try {
      // 1) Kick off the ETL in background (returns immediately, ~30-60s to complete)
      await api.processETL()
      // 2) Poll every 5s until ETL finishes or 90s timeout
      for (let i = 0; i < 18; i++) {
        await new Promise(r => setTimeout(r, 5000))
        const st = await api.getETLStatus().catch(() => null)
        if (st?.data?.running === false) break   // ETL done
      }
      // 3) Full data refresh
      await fetchData()
    } catch (err) {
      console.error('[runETL]', err)
      // Still try a refresh even if trigger failed
      await fetchData().catch(() => {})
    } finally {
      setProcessing(false)
    }
  }

  const runAnalysisIA = async () => {
    try {
      setAiAnalysis('Generando análisis estratégico…')
      const { modelo, anio, sistemaParam } = getQueryParams()
      const res = await api.getAIAnalysis(modelo, anio, sistemaParam)
      setAiAnalysis(res.data.analysis)
    } catch { setAiAnalysis('Error generando análisis.') }
  }

  const filteredRanking = ranking.filter((doc: any) =>
    (doc.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.facultad || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Which tab config to use for displays
  const currentTabCfg = sistema === 'meipa'
    ? { id:'meipa', label:'MEIPA — Docencia', icon:UserCheck, color:'#6366f1', desc:'Het.40 · Auto.20 · Coord.20 · Par.20' }
    : sistema === 'salud' && saludSubTab === 'servicios'
      ? { id:'servicios', label:'Salud — Servicios Hospitalarios', icon:Heart, color:'#b91c1c', desc:'Het. Estudiantil (Práctica Hosp.) · 100%' }
      : sistema === 'salud'
        ? { id:'abp', label:'Salud — Docencia (ABP)', icon:Heart, color:'#dc2626', desc:'Het.Est.50 · Par.20 · CEV.10 · Auto.20' }
        : (TABS_360.find(t => t.id === activeTab) || TABS_360[0])

  const _tabKey = sistema === 'meipa' ? 'meipa' : sistema === 'salud' ? saludSubTab : activeTab
  const compLabels = TAB_COMP_LABELS[_tabKey] || TAB_COMP_LABELS['docencia']
  const compKeys   = TAB_COMP_KEYS[_tabKey]   || TAB_COMP_KEYS['docencia']
  const componentes= kpis?.componentes || {}
  const distNivel  = kpis?.distribucion_nivel || {}
  const aniosDisp  = kpis?.anios_disponibles ?? comparativo?.anios_disponibles ?? [2023, 2024, 2025]

  const compValues = compKeys.map(k => {
    const c = componentes[k]
    return c ? c.promedio : 0
  })

  // (exportComparativoPDF is now exportComparativoPDF2, defined after exportPanelToPDF)

  // ── Generic panel → PDF capture ─────────────────────────────────────────
  const exportPanelToPDF = async (
    el: HTMLElement,
    titulo: string,
    setExporting: (v: boolean) => void,
    filename: string,
  ) => {
    setExporting(true)
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f5f7fa',
        width: el.scrollWidth,
        height: el.scrollHeight,
        windowWidth: el.scrollWidth,
      })
      const pageW = 210; const pageH = 297; const margin = 10
      const contentW = pageW - margin * 2
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      // Header
      pdf.setFillColor(0, 86, 179); pdf.rect(0, 0, pageW, 13, 'F')
      pdf.setTextColor(255,255,255); pdf.setFont('helvetica','bold'); pdf.setFontSize(9.5)
      pdf.text(`PUCESE — ${titulo}`, margin, 9)
      pdf.setFont('helvetica','normal'); pdf.setFontSize(7)
      pdf.text(new Date().toLocaleDateString('es-EC',{year:'numeric',month:'long',day:'numeric'}), pageW-margin, 9, {align:'right'})

      // Slice across pages
      const imgW = canvas.width; const imgH = canvas.height
      const ratio = contentW / (imgW / 2)
      const totalMm = (imgH / 2) * ratio
      const firstH = pageH - 13 - margin - 8
      const otherH = pageH - margin * 2 - 6
      let yDone = 0; let pg = 0

      while (yDone < totalMm) {
        const sliceH = pg === 0 ? firstH : otherH
        const yTop   = pg === 0 ? 13 + margin : margin
        const srcY   = Math.round((yDone / totalMm) * imgH)
        const srcH   = Math.min(Math.round((sliceH / totalMm) * imgH), imgH - srcY)
        if (srcH <= 0) break
        const sl = document.createElement('canvas')
        sl.width = imgW; sl.height = srcH
        sl.getContext('2d')!.drawImage(canvas, 0, srcY, imgW, srcH, 0, 0, imgW, srcH)
        const slHmm = (srcH / 2) * ratio
        pdf.addImage(sl.toDataURL('image/jpeg', 0.92), 'JPEG', margin, yTop, contentW, slHmm)
        pdf.setFont('helvetica','normal'); pdf.setFontSize(6); pdf.setTextColor(180,180,180)
        pdf.text('PUCESE · Dirección de Calidad y Acreditación · Documento Confidencial', margin, pageH-5)
        pdf.text(`Pág. ${pg+1}`, pageW-margin, pageH-5, {align:'right'})
        yDone += sliceH
        if (yDone < totalMm) { pdf.addPage(); pg++ }
      }
      pdf.save(filename)
    } catch(err) {
      console.error('Error exportando PDF:', err)
      alert('Error al generar el PDF. Intente de nuevo.')
    }
    setExporting(false)
  }

  const exportComparativoPDF2 = () =>
    comparativoRef.current && exportPanelToPDF(
      comparativoRef.current,
      'Vista Comparativa MEIPA vs MECDI',
      setExportingComp,
      `Vista_Comparativa_PUCESE_${new Date().toISOString().slice(0,10)}.pdf`,
    )

  const exportVistaPDF = () =>
    sistemaRef.current && exportPanelToPDF(
      sistemaRef.current,
      currentTabCfg?.label ? `${currentTabCfg.label} — Sistema de Evaluación Docente` : 'Vista de Evaluación',
      setExportingVista,
      `Vista_${(currentTabCfg?.label||'evaluacion').replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`,
    )

  const [sidebarOpen, setSidebarOpen]     = useState(true)
  const [isMobile, setIsMobile]           = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  const [expandedMEIPA, setExpandedMEIPA] = useState(true)
  const [expanded360, setExpanded360]     = useState(true)
  const [expandedSalud, setExpandedSalud] = useState(true)

  // ── Responsive: detecta móvil y ajusta el sidebar ───────────────────────
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(prev => {
        if (mobile !== prev) {
          // al pasar a móvil cerrar drawer; al pasar a desktop abrir sidebar
          setSidebarOpen(!mobile)
        }
        return mobile
      })
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── Módulo Análisis de Instrumentos ─────────────────────────────────────
  const [activeView, setActiveView]             = useState<'dashboard'|'competencias-detalle'>('dashboard')
  const [compDetalle, setCompDetalle]           = useState<any>(null)
  const [loadingCompDetalle, setLoadingCompDetalle] = useState(false)
  const [cdFiltroCarrera, setCdFiltroCarrera]   = useState('__todas__')
  const [cdFiltroPeriodo, setCdFiltroPeriodo]   = useState('__todos__')
  const [cdBusqueda, setCdBusqueda]             = useState('')
  const [cdOrden, setCdOrden]                   = useState<'promedio'|'nombre'>('promedio')

  const goToCompDetalle = async () => {
    setActiveView('competencias-detalle')
    if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false)
    if (compDetalle) return
    setLoadingCompDetalle(true)
    try {
      const res = await api.getCompetenciasPreguntas()
      setCompDetalle(res.data)
    } catch { setCompDetalle({}) }
    finally { setLoadingCompDetalle(false) }
  }

  const SIDEBAR_W = sidebarOpen ? 268 : 68

  if (loading && !kpis && !comparativo) {
    return (
      <>
        <SplashScreen visible={splashVisible} fading={splashFading} />
        <div className="flex items-center justify-center min-h-screen" style={{ background:'#f5f7fa' }}>
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-[#1a7fc1] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen size={18} style={{ color:'#1a7fc1' }} />
              </div>
            </div>
            <p className="text-slate-600 font-bold text-sm">Cargando datos…</p>
          </div>
        </div>
      </>
    )
  }

  const SIDEBAR_BG  = '#0f1e38'
  const SIDEBAR_ACT = 'rgba(26,127,193,0.28)'
  const TOPBAR_H    = 60

  return (
    <>
      <SplashScreen visible={splashVisible} fading={splashFading} />
      <div className="flex h-screen overflow-hidden font-sans" style={{ background:'#f5f7fa' }}>

        {/* ── Backdrop (solo móvil cuando el drawer está abierto) ──────────── */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 transition-opacity duration-300"
            style={{ background:'rgba(15,30,56,0.55)', backdropFilter:'blur(2px)' }}
          />
        )}

        {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
        <aside
          className="flex-shrink-0 flex flex-col h-full transition-all duration-300"
          style={{
            width: isMobile ? 268 : SIDEBAR_W,
            background: 'linear-gradient(180deg, #0f1e38 0%, #122444 60%, #0d1c34 100%)',
            borderRight:'1px solid rgba(255,255,255,0.06)',
            position: isMobile ? 'fixed' : 'relative',
            top: 0, left: 0,
            zIndex: isMobile ? 50 : 30,
            transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
            boxShadow: isMobile && sidebarOpen ? '0 0 40px rgba(0,0,0,0.5)' : 'none',
          }}
        >
          {/* Logo */}
          <div
            className="flex items-center gap-3 px-4 border-b"
            style={{ borderColor:'rgba(255,255,255,0.07)', minHeight: 72, background:'rgba(0,0,0,0.18)' }}
          >
            <div className="flex-shrink-0 rounded-xl p-1.5" style={{ background:'rgba(255,255,255,0.96)' }}>
              <img src={LOGO_URL} alt="PUCE" className="object-contain" style={{ height: sidebarOpen ? 40 : 28, width: sidebarOpen ? 40 : 28 }} />
            </div>
            {sidebarOpen && (
              <div className="leading-tight min-w-0">
                <p className="text-white font-black tracking-tight truncate" style={{ fontSize: 15, letterSpacing: '-0.01em' }}>PUCE</p>
                <p className="font-black uppercase truncate" style={{ color:'#4da6e8', fontSize: 10, letterSpacing: '0.18em' }}>Esmeraldas</p>
                <p className="truncate" style={{ color:'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 600, marginTop: 1 }}>Evaluación Docente</p>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-3 px-2.5" style={{ display:'flex', flexDirection:'column', gap: 2 }}>

            {/* ── Vista General ── */}
            <button
              onClick={() => { handleSistemaChange('overview'); setPeriodoActivo(''); setActiveAnio(undefined) }}
              className="w-full flex items-center gap-3 text-left transition-all rounded-xl"
              style={{
                padding: sidebarOpen ? '10px 12px' : '10px',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                color: sistema === 'overview' ? '#fff' : 'rgba(255,255,255,0.5)',
                background: sistema === 'overview' ? 'linear-gradient(135deg,rgba(26,127,193,0.35),rgba(26,127,193,0.15))' : 'transparent',
                borderLeft: sistema === 'overview' ? '2px solid #4da6e8' : '2px solid transparent',
              }}
            >
              <LayoutDashboard size={17} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>Vista General</span>}
            </button>

            {/* ── Análisis de Instrumentos ── */}
            <button
              onClick={goToCompDetalle}
              className="w-full flex items-center gap-3 text-left transition-all rounded-xl"
              style={{
                padding: sidebarOpen ? '10px 12px' : '10px',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                color: activeView === 'competencias-detalle' ? '#fff' : 'rgba(255,255,255,0.5)',
                background: activeView === 'competencias-detalle' ? 'linear-gradient(135deg,rgba(16,185,129,0.35),rgba(16,185,129,0.15))' : 'transparent',
                borderLeft: activeView === 'competencias-detalle' ? '2px solid #34d399' : '2px solid transparent',
              }}
            >
              <Microscope size={17} style={{ flexShrink:0, color: activeView === 'competencias-detalle' ? '#6ee7b7' : 'inherit' }} />
              {sidebarOpen && <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>Análisis Instrumentos</span>}
            </button>

            {sidebarOpen && <div style={{ height: 1, background:'rgba(255,255,255,0.06)', margin:'6px 4px' }} />}

            {/* ── MEIPA ── */}
            <button
              onClick={() => { setExpandedMEIPA(v => !v); if (sistema !== 'meipa') { handleSistemaChange('meipa'); setPeriodoActivo(''); setActiveAnio(undefined) } }}
              className="w-full flex items-center gap-3 text-left transition-all rounded-xl"
              style={{
                padding: sidebarOpen ? '10px 12px' : '10px',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                color: sistema === 'meipa' ? '#fff' : 'rgba(255,255,255,0.55)',
                background: sistema === 'meipa' ? 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(99,102,241,0.12))' : 'transparent',
                borderLeft: sistema === 'meipa' ? '2px solid #818cf8' : '2px solid transparent',
              }}
            >
              <UserCheck size={17} style={{ flexShrink:0, color: sistema === 'meipa' ? '#a5b4fc' : 'inherit' }} />
              {sidebarOpen && <>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize:13, fontWeight:700, letterSpacing:'-0.01em' }}>MEIPA</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', fontWeight:600, letterSpacing:'0.1em' }}>2023 – 2024</div>
                </div>
                <span style={{ color:'rgba(255,255,255,0.3)' }}>
                  {expandedMEIPA ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
                </span>
              </>}
            </button>

            {/* MEIPA sub-items */}
            {sidebarOpen && expandedMEIPA && (
              <div style={{ marginLeft:12, paddingLeft:10, borderLeft:'1px solid rgba(99,102,241,0.25)', display:'flex', flexDirection:'column', gap:1 }}>
                {/* Vista General MEIPA */}
                <button
                  onClick={() => { handleSistemaChange('meipa'); setPeriodoActivo(''); setActiveAnio(undefined) }}
                  className="w-full flex items-center gap-2 text-left rounded-lg transition-all"
                  style={{
                    padding:'6px 10px',
                    color: sistema === 'meipa' && !periodoActivo ? '#c7d2fe' : 'rgba(255,255,255,0.4)',
                    background: sistema === 'meipa' && !periodoActivo ? 'rgba(99,102,241,0.15)' : 'transparent',
                    fontSize: 11.5, fontWeight: sistema === 'meipa' && !periodoActivo ? 600 : 400,
                  }}
                >
                  <LayoutDashboard size={11} style={{ flexShrink:0, opacity:0.7 }}/>
                  <span>Vista General</span>
                </button>
                {/* Period items MEIPA */}
                {[
                  { codigo:'202301', label:'I Período 2023' },
                  { codigo:'202302', label:'II Período 2023' },
                  { codigo:'202401', label:'I Período 2024' },
                ].map(p => {
                  const apiP  = periodos.find((x: any) => x.codigo === p.codigo)
                  const loaded = apiP ? apiP.cargado : false
                  const active = sistema === 'meipa' && periodoActivo === p.codigo
                  return (
                    <button key={p.codigo}
                      onClick={() => { if (!loaded) return; handleSistemaChange('meipa'); setPeriodoActivo(p.codigo); setActiveAnio(PERIODO_TO_ANIO[p.codigo]) }}
                      className="w-full flex items-center gap-2 text-left rounded-lg transition-all"
                      style={{
                        padding:'6px 10px',
                        color: active ? '#e0e7ff' : loaded ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)',
                        background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
                        fontSize: 11.5, fontWeight: active ? 600 : 400,
                        cursor: loaded ? 'pointer' : 'default',
                      }}
                    >
                      <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: active ? '#818cf8' : loaded ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)' }} />
                      <span className="flex-1 truncate">{p.label}</span>
                      {!loaded && <span style={{ fontSize:9, color:'rgba(255,255,255,0.18)', fontStyle:'italic' }}>sin datos</span>}
                    </button>
                  )
                })}
              </div>
            )}

            {sidebarOpen && <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'6px 4px' }} />}

            {/* ── 360 / MECDI ── */}
            <button
              onClick={() => { setExpanded360(v => !v); if (sistema !== '360') { handleSistemaChange('360'); setActiveTab('docencia'); setPeriodoActivo(''); setActiveAnio(undefined) } }}
              className="w-full flex items-center gap-3 text-left transition-all rounded-xl"
              style={{
                padding: sidebarOpen ? '10px 12px' : '10px',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                color: sistema === '360' ? '#fff' : 'rgba(255,255,255,0.55)',
                background: sistema === '360' ? 'linear-gradient(135deg,rgba(6,182,212,0.28),rgba(6,182,212,0.1))' : 'transparent',
                borderLeft: sistema === '360' ? '2px solid #22d3ee' : '2px solid transparent',
              }}
            >
              <BarChart3 size={17} style={{ flexShrink:0, color: sistema === '360' ? '#67e8f9' : 'inherit' }} />
              {sidebarOpen && <>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize:13, fontWeight:700, letterSpacing:'-0.01em' }}>MECDI</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', fontWeight:600, letterSpacing:'0.1em' }}>2024 – 2025</div>
                </div>
                <span style={{ color:'rgba(255,255,255,0.3)' }}>
                  {expanded360 ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
                </span>
              </>}
            </button>

            {/* 360 sub-items */}
            {sidebarOpen && expanded360 && (
              <div style={{ marginLeft:12, paddingLeft:10, borderLeft:'1px solid rgba(6,182,212,0.2)', display:'flex', flexDirection:'column', gap:1 }}>
                {/* Vista General 360 */}
                <button
                  onClick={() => { handleSistemaChange('360'); setActiveTab('docencia'); setPeriodoActivo(''); setActiveAnio(undefined) }}
                  className="w-full flex items-center gap-2 text-left rounded-lg transition-all"
                  style={{
                    padding:'6px 10px',
                    color: sistema === '360' && !periodoActivo ? '#a5f3fc' : 'rgba(255,255,255,0.4)',
                    background: sistema === '360' && !periodoActivo ? 'rgba(6,182,212,0.12)' : 'transparent',
                    fontSize: 11.5, fontWeight: sistema === '360' && !periodoActivo ? 600 : 400,
                  }}
                >
                  <LayoutDashboard size={11} style={{ flexShrink:0, opacity:0.7 }}/>
                  <span>Vista General</span>
                </button>
                {/* Period items 360 */}
                {[
                  { codigo:'202402', label:'II Período 2024' },
                  { codigo:'202501', label:'I Período 2025' },
                  { codigo:'202502', label:'II Período 2025' },
                ].map(p => {
                  const apiP  = periodos.find((x: any) => x.codigo === p.codigo)
                  const loaded = apiP ? apiP.cargado : false
                  const active = sistema === '360' && periodoActivo === p.codigo
                  return (
                    <button key={p.codigo}
                      onClick={() => { if (!loaded) return; handleSistemaChange('360'); setActiveTab('docencia'); setPeriodoActivo(p.codigo); setActiveAnio(PERIODO_TO_ANIO[p.codigo]) }}
                      className="w-full flex items-center gap-2 text-left rounded-lg transition-all"
                      style={{
                        padding:'6px 10px',
                        color: active ? '#cffafe' : loaded ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)',
                        background: active ? 'rgba(6,182,212,0.18)' : 'transparent',
                        fontSize: 11.5, fontWeight: active ? 600 : 400,
                        cursor: loaded ? 'pointer' : 'default',
                      }}
                    >
                      <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: active ? '#22d3ee' : loaded ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)' }} />
                      <span className="flex-1 truncate">{p.label}</span>
                      {!loaded && <span style={{ fontSize:9, color:'rgba(255,255,255,0.18)', fontStyle:'italic' }}>sin datos</span>}
                    </button>
                  )
                })}
                {/* Model tabs (no ABP) */}
                <div style={{ marginTop:4, paddingTop:4, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                  {TABS_360.filter(t => t.id !== 'abp').map(tab => {
                    const Icon = tab.icon
                    const active = sistema === '360' && activeTab === tab.id
                    return (
                      <button key={tab.id}
                        onClick={() => { handleSistemaChange('360'); handleTabChange(tab.id) }}
                        className="w-full flex items-center gap-2.5 text-left rounded-lg transition-all"
                        style={{
                          padding:'5px 10px',
                          color: active ? '#fff' : 'rgba(255,255,255,0.38)',
                          background: active ? `${tab.color}22` : 'transparent',
                          fontSize: 11.5, fontWeight: active ? 600 : 400,
                          marginBottom: 1,
                        }}
                      >
                        <Icon size={11} style={{ color: active ? tab.color : 'rgba(255,255,255,0.25)', flexShrink:0 }} />
                        <span className="flex-1 truncate">{tab.label}</span>
                        {active && <span style={{ width:4, height:4, borderRadius:'50%', background:tab.color, flexShrink:0 }} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {sidebarOpen && <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'6px 4px' }} />}

            {/* ── Salud ── */}
            <button
              onClick={() => { setExpandedSalud(v => !v); if (sistema !== 'salud') { handleSistemaChange('salud'); setPeriodoActivo(''); setActiveAnio(undefined) } }}
              className="w-full flex items-center gap-3 text-left transition-all rounded-xl"
              style={{
                padding: sidebarOpen ? '10px 12px' : '10px',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                color: sistema === 'salud' ? '#fff' : 'rgba(255,255,255,0.55)',
                background: sistema === 'salud' ? 'linear-gradient(135deg,rgba(220,38,38,0.28),rgba(220,38,38,0.1))' : 'transparent',
                borderLeft: sistema === 'salud' ? '2px solid #f87171' : '2px solid transparent',
              }}
            >
              <Heart size={17} style={{ flexShrink:0, color: sistema === 'salud' ? '#fca5a5' : 'inherit' }} />
              {sidebarOpen && <>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize:13, fontWeight:700, letterSpacing:'-0.01em' }}>Salud</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', fontWeight:600, letterSpacing:'0.1em' }}>ABP / Medicina</div>
                </div>
                <span style={{ color:'rgba(255,255,255,0.3)' }}>
                  {expandedSalud ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
                </span>
              </>}
            </button>

            {/* Salud sub-items */}
            {sidebarOpen && expandedSalud && (
              <div style={{ marginLeft:12, paddingLeft:10, borderLeft:'1px solid rgba(220,38,38,0.2)', display:'flex', flexDirection:'column', gap:1 }}>
                <button
                  onClick={() => { handleSistemaChange('salud'); setPeriodoActivo(''); setActiveAnio(undefined) }}
                  className="w-full flex items-center gap-2 text-left rounded-lg transition-all"
                  style={{
                    padding:'6px 10px',
                    color: sistema === 'salud' && !periodoActivo ? '#fecaca' : 'rgba(255,255,255,0.4)',
                    background: sistema === 'salud' && !periodoActivo ? 'rgba(220,38,38,0.12)' : 'transparent',
                    fontSize: 11.5, fontWeight: sistema === 'salud' && !periodoActivo ? 600 : 400,
                  }}
                >
                  <LayoutDashboard size={11} style={{ flexShrink:0, opacity:0.7 }}/>
                  <span>Vista General</span>
                </button>
                {[
                  { codigo:'202402', label:'II Período 2024' },
                  { codigo:'202501', label:'I Período 2025' },
                  { codigo:'202502', label:'II Período 2025' },
                ].map(p => {
                  const apiP  = periodos.find((x: any) => x.codigo === p.codigo)
                  const loaded = apiP ? apiP.cargado : false
                  const active = sistema === 'salud' && periodoActivo === p.codigo
                  return (
                    <button key={p.codigo}
                      onClick={() => { if (!loaded) return; handleSistemaChange('salud'); setPeriodoActivo(p.codigo); setActiveAnio(PERIODO_TO_ANIO[p.codigo]) }}
                      className="w-full flex items-center gap-2 text-left rounded-lg transition-all"
                      style={{
                        padding:'6px 10px',
                        color: active ? '#fee2e2' : loaded ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)',
                        background: active ? 'rgba(220,38,38,0.18)' : 'transparent',
                        fontSize: 11.5, fontWeight: active ? 600 : 400,
                        cursor: loaded ? 'pointer' : 'default',
                      }}
                    >
                      <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: active ? '#f87171' : loaded ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)' }} />
                      <span className="flex-1 truncate">{p.label}</span>
                      {!loaded && <span style={{ fontSize:9, color:'rgba(255,255,255,0.18)', fontStyle:'italic' }}>sin datos</span>}
                    </button>
                  )
                })}
                {/* Sub-modelos Salud */}
                <div style={{ marginTop:4, paddingTop:4, borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', gap:1 }}>
                  <button
                    onClick={() => { handleSistemaChange('salud'); setSaludSubTab('abp') }}
                    className="w-full flex items-center gap-2.5 text-left rounded-lg transition-all"
                    style={{
                      padding:'5px 10px',
                      color: sistema === 'salud' && saludSubTab === 'abp' ? '#fff' : 'rgba(255,255,255,0.38)',
                      background: sistema === 'salud' && saludSubTab === 'abp' ? 'rgba(220,38,38,0.2)' : 'transparent',
                      fontSize: 11.5, fontWeight: sistema === 'salud' && saludSubTab === 'abp' ? 600 : 400,
                    }}
                  >
                    <GraduationCap size={11} style={{ color: sistema === 'salud' && saludSubTab === 'abp' ? '#fca5a5' : 'rgba(255,255,255,0.25)', flexShrink:0 }} />
                    <span>Docencia (ABP)</span>
                    {sistema === 'salud' && saludSubTab === 'abp' && <span style={{ width:4, height:4, borderRadius:'50%', background:'#f87171', flexShrink:0, marginLeft:'auto' }} />}
                  </button>
                </div>
              </div>
            )}

          </nav>

          {/* Bottom: toggle collapse */}
          <div className="px-3 py-3" style={{ borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="w-full flex items-center gap-3 rounded-lg transition-all"
              style={{ padding:'9px 10px', color:'rgba(255,255,255,0.38)', background:'transparent' }}
            >
              <Menu size={16} className="flex-shrink-0" />
              {sidebarOpen && <span style={{ fontSize: 12, fontWeight: 600 }}>Colapsar</span>}
            </button>
          </div>
        </aside>

        {/* ── MAIN AREA ─────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Topbar */}
          <header
            className="flex-shrink-0 flex items-center justify-between px-3 sm:px-6 bg-white z-20"
            style={{ height: TOPBAR_H, borderBottom:'1px solid #e8edf2', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Hamburguesa — solo móvil */}
              <button
                onClick={() => setSidebarOpen(v => !v)}
                className="md:hidden flex-shrink-0 p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                title="Menú"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <span className="text-slate-800 font-black block truncate max-w-[150px] sm:max-w-none" style={{ fontSize: 14 }}>
                  {activeView === 'competencias-detalle'
                    ? 'Análisis Detallado de Instrumentos y Competencias'
                    : sistema === 'overview' ? 'Vista General'
                    : sistema === 'meipa' ? 'MEIPA — Evaluación Docente'
                    : sistema === 'salud' ? 'Salud — Docencia ABP'
                    : `MECDI — ${currentTabCfg.label}`}
                </span>
              </div>
              {loading && <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-[#1a7fc1] animate-spin flex-shrink-0" />}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {/* Selector de Período (v2) */}
              {periodos.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                  <FileText size={12} className="text-slate-400" />
                  <select
                    className="text-xs font-bold text-slate-600 bg-transparent outline-none cursor-pointer"
                    value={periodoActivo}
                    onChange={e => setPeriodoActivo(e.target.value)}
                  >
                    <option value="">Todos los períodos</option>
                    {periodos.map((p: any) => (
                      <option key={p.codigo} value={p.codigo} disabled={!p.cargado}>
                        {p.label} {p.cargado ? '' : '(sin datos)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Year (legacy) */}
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                <Calendar size={12} className="text-slate-400" />
                <select
                  className="text-xs font-bold text-slate-600 bg-transparent outline-none cursor-pointer"
                  value={activeAnio ?? ''}
                  onChange={e => setActiveAnio(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">Todos los años</option>
                  {aniosDisp.map((a: number) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text" placeholder="Buscar docente o facultad…"
                  className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#1a7fc1] w-52 transition-all"
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Update */}
              <button onClick={runETL} disabled={processing}
                className="flex items-center gap-2 px-2.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-60 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
                style={{ background:'linear-gradient(135deg,#1a7fc1,#0d5a8c)', boxShadow:'0 2px 8px rgba(26,127,193,0.3)' }}>
                <RefreshCw size={12} className={processing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{processing ? 'Actualizando…' : 'Actualizar'}</span>
              </button>

              {/* Topbar icons */}
              <div className="flex items-center gap-1.5 sm:gap-2 sm:pl-2 sm:border-l border-slate-200">
                <button className="hidden sm:block p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors relative">
                  <Bell size={16} />
                </button>

                {/* ── Informe General PDF (topbar) ── */}
                <button
                  onClick={() => handleDescargarInforme(
                    sistema === 'overview' ? undefined : sistema === 'meipa' ? 'meipa' : '360',
                    sistema === 'overview' ? undefined : sistema === 'meipa' ? 'docencia' : sistema === 'salud' ? saludSubTab : activeTab
                  )}
                  disabled={exportingInforme}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all duration-200 disabled:opacity-60 hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
                  style={{ background:'linear-gradient(135deg,#0056b3,#1a7fc1)', boxShadow:'0 2px 8px rgba(0,86,179,0.3)' }}
                  title="Descargar Informe General PDF"
                >
                  {exportingInforme ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                  <span className="hidden sm:inline">{exportingInforme ? 'Generando…' : 'Informe PDF'}</span>
                </button>

                <button
                  onClick={sistema === 'overview' ? exportComparativoPDF2 : exportVistaPDF}
                  disabled={sistema === 'overview' ? exportingComp : exportingVista}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all duration-200 disabled:opacity-60 hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
                  style={{ background:'linear-gradient(135deg,#059669,#047857)', boxShadow:'0 2px 8px rgba(5,150,105,0.3)' }}
                >
                  {(sistema === 'overview' ? exportingComp : exportingVista)
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Download size={13} />}
                  <span className="hidden sm:inline">
                    {(sistema === 'overview' ? exportingComp : exportingVista) ? 'Exportando…' : 'Exportar'}
                  </span>
                </button>
                {/* User badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background:'#f1f5f9', border:'1px solid #e2e8f0' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                    style={{ background:'linear-gradient(135deg,#0056b3,#1a7fc1)' }}>
                    A
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 max-w-[120px] truncate">
                    {authStore.getUser()}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
                  style={{ background:'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow:'0 2px 8px rgba(229,62,62,0.3)' }}
                  title="Cerrar sesión">
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            </div>
          </header>

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-6" style={{ background:'#f5f7fa' }}>

          {/* ── OVERVIEW / COMPARATIVO ─────────────────────────────────────── */}
          {activeView === 'dashboard' && sistema === 'overview' && (
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
              {compPreguntas && <CompetenciasPreguntas data={compPreguntas} />}

              <AIConsultaPanel anio={activeAnio} />
              </div>{/* end comparativoRef */}
            </>
          )}

          {/* ── MEIPA or 360 view ──────────────────────────────────────────── */}
          {activeView === 'dashboard' && sistema !== 'overview' && (
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
                  <AnalyticsSection analytics={analytics} color={currentTabCfg.color} />

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
                        <TodosDocentesPanel
                          docentes={todosDocentes}
                          context={{ modelo: modelo || '', sistema: sistemaParam || '', label: tabLabel }}
                        />
                      </div>
                    )
                  })()}

                </div>
              )}
            </>
          )}

          {/* ══ MÓDULO: Análisis Detallado de Instrumentos y Competencias ══ */}
          {activeView === 'competencias-detalle' && (() => {
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
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="overflow-x-auto">
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
                                {[...todasComp].sort((a: any, b: any) => b.promedio - a.promedio).map((c: any, i: number) => {
                                  const isTop    = i < Math.ceil(todasComp.length / 2)
                                  const rowBg    = i % 2 === 0 ? 'transparent' : '#fafafa'
                                  return (
                                    <tr key={i} style={{ background: rowBg }} className="border-t border-slate-50 hover:bg-indigo-50/20 transition-colors">
                                      <td className="py-2 px-3 font-black" style={{ color: isTop ? '#16a34a' : '#dc2626' }}>{i + 1}</td>
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
                                        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-black"
                                          style={{ background: scoreBg(c.promedio), color: scoreColor(c.promedio) }}>
                                          {c.promedio.toFixed(1)}%
                                        </span>
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
              </div>
            )
          })()}

          <div className="mt-12 pt-8 border-t border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={LOGO_URL} alt="PUCESE" className="h-7 object-contain opacity-50" />
              <div className="h-4 w-px bg-slate-200" />
              <p className="text-[11px] text-slate-400 font-medium">© 2025 · Pontificia Universidad Católica del Ecuador · Sede Esmeraldas</p>
            </div>
            <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">SIGA · Calidad Docente v4.0</p>
          </div>
        </main>
        </div>{/* end MAIN AREA */}
      </div>{/* end outer flex */}
    </>
  )
}
