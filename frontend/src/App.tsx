import React, { useState, useEffect, useCallback, useRef } from 'react'
import { api, authStore } from './services/api'
import {
  BarChart3, Users, TrendingUp, BrainCircuit, RefreshCw, Award,
  FileText, Search, BookOpen, Star, CheckCircle, AlertCircle, XCircle,
  Microscope, Heart, Link2, Briefcase, GraduationCap, Calendar,
  Activity, UserCheck, Menu, Bell, LogOut, ChevronDown, ChevronRight,
  LayoutDashboard, Building2, Cpu, Download, FileSpreadsheet, Loader2, Stethoscope,
  Eye, EyeOff, Lock, Mail, Copy,
} from 'lucide-react'


// ══════════════════════════════════════════════════════════════════════════════
// Login Page
// ══════════════════════════════════════════════════════════════════════════════
import LoginPage from './components/LoginPage'
import { Plot, LOGO_URL, TABS_360, TAB_COMP_LABELS, TAB_COMP_KEYS, COMP_COLORS, VD_360_TABS, PERIODO_TO_ANIO, SplashScreen, NivelBadge, ComponentBar, KPICard, AnalyticsSection, ChartCard, flatBar, displayPeriodo } from './shared'

const DashboardOverview = React.lazy(() => import('./views/DashboardOverview'))
const DashboardSistema = React.lazy(() => import('./views/DashboardSistema'))
const AnalisisInstrumentos = React.lazy(() => import('./views/AnalisisInstrumentos'))
const PrediccionView = React.lazy(() => import('./views/PrediccionView'))
const CaracterizacionView = React.lazy(() => import('./views/CaracterizacionView'))

function ViewLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#1a7fc1] animate-spin" />
    </div>
  )
}


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
  const [activeView, setActiveView]             = useState<'dashboard'|'competencias-detalle'|'prediccion'|'caracterizacion'>('dashboard')
  const [compDetalle, setCompDetalle]           = useState<any>(null)
  const [loadingCompDetalle, setLoadingCompDetalle] = useState(false)

  // ── Módulo Caracterización del Cuerpo Docente ─────────────────────────
  const [caracterizacion, setCaracterizacion]           = useState<any>(null)
  const [loadingCaracterizacion, setLoadingCaracterizacion] = useState(false)
  const [sistemaCaract, setSistemaCaract] = useState<string>('')
  const [modeloCaract,  setModeloCaract]  = useState<string>('')
  const fetchCaracterizacion = async (sistOverride?: string, modOverride?: string) => {
    setLoadingCaracterizacion(true)
    try {
      const sis = sistOverride !== undefined ? sistOverride : sistemaCaract
      const mod = modOverride  !== undefined ? modOverride  : modeloCaract
      const res = await api.getCaracterizacion(sis || undefined, undefined, undefined, mod || undefined)
      setCaracterizacion(res.data)
    } catch { setCaracterizacion(null) }
    finally { setLoadingCaracterizacion(false) }
  }
  const goToCaracterizacion = async () => {
    setActiveView('caracterizacion')
    setSistema('overview' as any)
    if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false)
    // Siempre recarga al entrar al módulo para garantizar datos frescos
    setCaracterizacion(null)
    fetchCaracterizacion(sistemaCaract, modeloCaract)
  }

  const [cdFiltroCarrera, setCdFiltroCarrera]   = useState('__todas__')
  const [cdFiltroPeriodo, setCdFiltroPeriodo]   = useState('__todos__')
  const [cdBusqueda, setCdBusqueda]             = useState('')
  const [cdOrden, setCdOrden]                   = useState<'promedio'|'nombre'>('promedio')

  // ── Módulo Predicción y Alertas ─────────────────────────────────────────
  const [prediccion, setPrediccion]             = useState<any>(null)
  const [loadingPrediccion, setLoadingPrediccion] = useState(false)
  const fetchPrediccion = async () => {
    setLoadingPrediccion(true)
    try {
      const res = await api.getPrediccionTendencias(undefined, true)
      setPrediccion(res.data)
    } catch { setPrediccion({ predicciones: [], resumen: {}, alertas_ia: '' }) }
    finally { setLoadingPrediccion(false) }
  }
  const goToPrediccion = async () => {
    setActiveView('prediccion')
    if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false)
    if (prediccion) return
    await fetchPrediccion()
  }

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

            {/* ── Predicción y Alertas ── */}
            <button
              onClick={goToPrediccion}
              className="w-full flex items-center gap-3 text-left transition-all rounded-xl"
              style={{
                padding: sidebarOpen ? '10px 12px' : '10px',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                color: activeView === 'prediccion' ? '#fff' : 'rgba(255,255,255,0.5)',
                background: activeView === 'prediccion' ? 'linear-gradient(135deg,rgba(168,85,247,0.35),rgba(168,85,247,0.15))' : 'transparent',
                borderLeft: activeView === 'prediccion' ? '2px solid #c084fc' : '2px solid transparent',
              }}
            >
              <TrendingUp size={17} style={{ flexShrink:0, color: activeView === 'prediccion' ? '#d8b4fe' : 'inherit' }} />
              {sidebarOpen && <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>Predicción y Alertas</span>}
            </button>

            {/* ── Caracterización Docente ── */}
            <button
              onClick={goToCaracterizacion}
              className="w-full flex items-center gap-3 text-left transition-all rounded-xl"
              style={{
                padding: sidebarOpen ? '10px 12px' : '10px',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                color: activeView === 'caracterizacion' ? '#fff' : 'rgba(255,255,255,0.5)',
                background: activeView === 'caracterizacion' ? 'linear-gradient(135deg,rgba(245,158,11,0.35),rgba(245,158,11,0.15))' : 'transparent',
                borderLeft: activeView === 'caracterizacion' ? '2px solid #fbbf24' : '2px solid transparent',
              }}
            >
              <Users size={17} style={{ flexShrink:0, color: activeView === 'caracterizacion' ? '#fde68a' : 'inherit' }} />
              {sidebarOpen && <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>Caracterización Docente</span>}
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
                  {activeView === 'prediccion'
                    ? 'Predicción de Tendencias y Alertas'
                    : activeView === 'competencias-detalle'
                    ? 'Análisis Detallado de Instrumentos y Competencias'
                    : activeView === 'caracterizacion'
                    ? 'Caracterización del Cuerpo Docente'
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
            <React.Suspense fallback={<ViewLoader />}>
              <DashboardOverview {...{ activeAnio, ranking, tendencias, comparativo, compPreguntas, desempVars, compPorCarrera, todosDocentes, loading, processing, comparativoRef, exportingInforme, handleDescargarInforme, runETL }} />
            </React.Suspense>
          )}

          {/* ── MEIPA or 360 view ──────────────────────────────────────────── */}
          {activeView === 'dashboard' && sistema !== 'overview' && (
            <React.Suspense fallback={<ViewLoader />}>
              <DashboardSistema {...{ sistema, activeTab, activeAnio, saludSubTab, kpis, serviciosKpis, ranking, demograficos, tendencias, tendenciasPorPeriodo, analytics, todosDocentes, aiAnalysis, loading, searchTerm, setSearchTerm, sistemaRef, exportingInforme, periodoActivo, pdfLoading, handleDescargarPDF, handleDescargarInforme, getQueryParams, runAnalysisIA, filteredRanking, currentTabCfg, compLabels, compKeys, componentes, distNivel, compValues }} />
            </React.Suspense>
          )}

          {/* ══ MÓDULO: Análisis Detallado de Instrumentos y Competencias ══ */}
          {activeView === 'competencias-detalle' && (
            <React.Suspense fallback={<ViewLoader />}>
              <AnalisisInstrumentos {...{ ranking, compPreguntas, compPorCarrera, compDetalle, loadingCompDetalle, cdFiltroCarrera, setCdFiltroCarrera, cdFiltroPeriodo, setCdFiltroPeriodo, cdBusqueda, setCdBusqueda, cdOrden, setCdOrden }} />
            </React.Suspense>
          )}

          {/* ══ MÓDULO: Predicción de Tendencias y Alertas ══ */}
          {activeView === 'prediccion' && (
            <React.Suspense fallback={<ViewLoader />}>
              <PrediccionView {...{ tendencias, prediccion, loadingPrediccion, fetchPrediccion }} />
            </React.Suspense>
          )}

          {/* ══ MÓDULO: Caracterización del Cuerpo Docente ══ */}
          {activeView === 'caracterizacion' && (
            <React.Suspense fallback={<ViewLoader />}>
              <CaracterizacionView {...{ caracterizacion, loadingCaracterizacion, sistemaCaract, setSistemaCaract, modeloCaract, setModeloCaract, fetchCaracterizacion }} />
            </React.Suspense>
          )}

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
