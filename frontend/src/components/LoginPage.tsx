import React, { useState } from 'react'
import { api, authStore } from '../services/api'
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { LOGO_URL } from '../shared'

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
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
