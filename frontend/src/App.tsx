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


// ══════════════════════════════════════════════════════════════════════════════
// Login Page
// ══════════════════════════════════════════════════════════════════════════════
import LoginPage from './components/LoginPage'
import AIConsultaPanel from './components/AIConsultaPanel'
import ComparativoPanel from './components/ComparativoPanel'
import MejoresPeoresPanel from './components/MejoresPeoresPanel'
import VariablesDetallePanel from './components/VariablesDetallePanel'
import DesempenoPorVariables from './components/DesempenoPorVariables'
import CompetenciasPreguntas from './components/CompetenciasPreguntas'
import TodosDocentesPanel from './components/TodosDocentesPanel'
import { LOGO_URL, TABS_360, TAB_COMP_LABELS, TAB_COMP_KEYS, COMP_COLORS, VD_360_TABS, PERIODO_TO_ANIO, SplashScreen, NivelBadge, ComponentBar, KPICard, AnalyticsSection, ChartCard, flatBar, displayPeriodo } from './shared'

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
              {compPreguntas && <CompetenciasPreguntas data={compPreguntas} showMecdiTables />}

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
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <span className="text-base">🏆</span>
                            <span className="text-[12px] font-black text-slate-700 uppercase tracking-[0.12em]">Ranking de Competencias MECDI</span>
                            <span className="ml-auto text-[10px] text-slate-400 font-semibold">{todasComp.length} competencias</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-[11px]">
                              <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                  <th className="text-left py-2 px-4 font-black text-slate-500 uppercase tracking-[0.08em] w-8">#</th>
                                  <th className="text-left py-2 px-4 font-black text-slate-500 uppercase tracking-[0.08em]">Área de Competencia</th>
                                  {periodos.map(p => (
                                    <th key={p} className="text-center py-2 px-3 font-black text-slate-500 uppercase tracking-[0.08em] whitespace-nowrap">
                                      {periodLabel(p)}
                                    </th>
                                  ))}
                                  <th className="text-right py-2 px-4 font-black text-slate-500 uppercase tracking-[0.08em] whitespace-nowrap">Promedio</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...todasComp].sort((a: any, b: any) => b.promedio - a.promedio).map((c: any, i: number) => {
                                  const isTop = i < Math.ceil(todasComp.length / 2)
                                  return (
                                    <tr key={i} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                                      <td className="py-2.5 px-4 font-black" style={{ color: isTop ? '#16a34a' : '#dc2626' }}>{i + 1}</td>
                                      <td className="py-2.5 px-4 text-slate-700 font-medium leading-tight max-w-xs">{c.competencia}</td>
                                      {periodos.map(p => {
                                        const v = c[p]
                                        return (
                                          <td key={p} className="py-2.5 px-3 text-center">
                                            {v != null
                                              ? <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black"
                                                  style={{ background: scoreColor(v) + '18', color: scoreColor(v) }}>{v.toFixed(1)}%</span>
                                              : <span className="text-slate-300">—</span>}
                                          </td>
                                        )
                                      })}
                                      <td className="py-2.5 px-4">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(c.promedio, 100)}%`, background: scoreColor(c.promedio) }} />
                                          </div>
                                          <span className="text-[11px] font-black tabular-nums shrink-0" style={{ color: scoreColor(c.promedio) }}>{c.promedio.toFixed(1)}%</span>
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

                {/* ── Módulo MEIPA: Heteroevaluación y Competencias ── */}
                {compPreguntas && <CompetenciasPreguntas data={compPreguntas} />}
              </div>
            )
          })()}

          {/* ══ MÓDULO: Predicción de Tendencias y Alertas ══ */}
          {activeView === 'prediccion' && (() => {
            const preds: any[] = prediccion?.predicciones || []
            const resumen = prediccion?.resumen || {}
            const alertasIA: string = prediccion?.alertas_ia || ''
            const enRiesgo = preds.filter(p => p.clasificacion === 'bajando')
            const enMejora = preds.filter(p => p.clasificacion === 'subiendo')

            const sColor = (v: number) => v >= 85 ? '#16a34a' : v >= 70 ? '#ca8a04' : '#dc2626'
            const sBg    = (v: number) => v >= 85 ? '#f0fdf4' : v >= 70 ? '#fefce8' : '#fef2f2'

            return (
              <div>
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl" style={{ background:'linear-gradient(135deg,#581c87,#7e22ce)' }}>
                    <TrendingUp size={22} style={{ color:'#d8b4fe' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[17px] font-black text-slate-800 leading-tight">Predicción de Tendencias y Alertas</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Proyección al próximo período (I-2026) basada en la evolución histórica · IA + análisis estadístico
                    </p>
                  </div>
                  {loadingPrediccion && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-purple-500 animate-spin" />
                      <span className="text-xs">Calculando proyecciones…</span>
                    </div>
                  )}
                </div>

                {loadingPrediccion ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                    <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-purple-500 animate-spin" />
                    <p className="font-bold text-sm">Analizando tendencias con IA…</p>
                  </div>
                ) : preds.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                    <AlertCircle size={36} className="opacity-40" />
                    <p className="font-bold">No hay suficientes datos para proyectar</p>
                    <p className="text-xs">Se necesitan al menos 2 períodos con datos por carrera</p>
                  </div>
                ) : (
                  <>
                    {/* Resumen */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5" style={{ borderTop:'3px solid #dc2626' }}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-2">En Riesgo</p>
                        <p className="font-black text-red-600" style={{ fontSize:30 }}>{resumen.en_riesgo ?? enRiesgo.length}</p>
                        <p className="text-[10px] text-slate-400 mt-1">carreras en descenso</p>
                      </div>
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5" style={{ borderTop:'3px solid #94a3b8' }}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-2">Estables</p>
                        <p className="font-black text-slate-600" style={{ fontSize:30 }}>{resumen.estables ?? 0}</p>
                        <p className="text-[10px] text-slate-400 mt-1">sin cambio relevante</p>
                      </div>
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5" style={{ borderTop:'3px solid #16a34a' }}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-2">En Mejora</p>
                        <p className="font-black text-green-600" style={{ fontSize:30 }}>{resumen.en_mejora ?? enMejora.length}</p>
                        <p className="text-[10px] text-slate-400 mt-1">carreras subiendo</p>
                      </div>
                    </div>

                    {/* Gráfico: cambio proyectado por carrera */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-500" />
                        <span className="text-[13px] font-black text-slate-700">Cambio Proyectado al Próximo Período</span>
                        <span className="ml-auto text-[10px] text-slate-400">verde = mejora · rojo = caída</span>
                      </div>
                      <div className="p-4">
                        <Plot
                          data={[{
                            type: 'bar' as const, orientation: 'h' as const,
                            x: [...preds].sort((a,b)=>a.cambio_proyectado-b.cambio_proyectado).map(p=>p.cambio_proyectado),
                            y: [...preds].sort((a,b)=>a.cambio_proyectado-b.cambio_proyectado).map(p=>p.carrera),
                            marker: { color: [...preds].sort((a,b)=>a.cambio_proyectado-b.cambio_proyectado).map(p=>p.cambio_proyectado < 0 ? '#dc2626' : '#16a34a'), opacity:0.85 },
                            text: [...preds].sort((a,b)=>a.cambio_proyectado-b.cambio_proyectado).map(p=>`${p.cambio_proyectado>0?'+':''}${p.cambio_proyectado}`),
                            textposition: 'outside' as const, textfont:{ size:10, family:'Inter' },
                            hovertemplate: '<b>%{y}</b><br>Cambio proyectado: %{x:+.1f} pts<extra></extra>',
                          }]}
                          layout={{
                            autosize:true, height: Math.max(300, preds.length*30),
                            paper_bgcolor:'white', plot_bgcolor:'white',
                            font:{ family:'Inter', size:10, color:'#64748b' },
                            margin:{ t:10, b:40, l:200, r:50 },
                            xaxis:{ zeroline:true, zerolinecolor:'#cbd5e1', showgrid:true, gridcolor:'#f0f4f8', ticksuffix:' pts' },
                            yaxis:{ tickfont:{ size:10, color:'#334155' }, showgrid:false },
                          }}
                          config={{ displayModeBar:false, responsive:true }}
                          style={{ width:'100%' }} useResizeHandler
                        />
                      </div>
                    </div>

                    {/* Cards: en riesgo / en mejora */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                      {/* En riesgo */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100" style={{ background:'#fef2f2' }}>
                          <span className="text-base">&#9888;</span>
                          <span className="text-[11px] font-black text-red-700 uppercase tracking-[0.1em]">Carreras en Riesgo</span>
                          <span className="ml-auto text-[10px] text-slate-400">{enRiesgo.length}</span>
                        </div>
                        <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
                          {enRiesgo.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">Ninguna carrera en descenso 🎉</p>}
                          {enRiesgo.map((p, i) => (
                            <div key={i} className="rounded-xl border border-red-100 p-3" style={{ background:'#fffafa' }}>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="font-bold text-slate-800 text-[12px] truncate" title={p.carrera}>{p.carrera}</span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                                  style={{ background: p.riesgo==='alto' ? '#fee2e2' : '#fef3c7', color: p.riesgo==='alto' ? '#b91c1c' : '#b45309' }}>
                                  riesgo {p.riesgo}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] mb-1.5">
                                {p.serie.map((s: any, j: number) => (
                                  <span key={j} className="px-1.5 py-0.5 rounded font-bold tabular-nums"
                                    style={{ background:sBg(s.valor), color:sColor(s.valor) }}>{s.valor}</span>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="text-slate-500">Último <b className="text-slate-700">{p.ultimo_valor}</b></span>
                                <ChevronRight size={12} className="text-slate-300" />
                                <span className="text-red-600 font-black">{p.proyeccion} <span className="font-normal text-slate-400">proy.</span></span>
                                <span className="ml-auto font-black text-red-600">{p.cambio_proyectado} pts</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* En mejora */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100" style={{ background:'#f0fdf4' }}>
                          <span className="text-base">&#128200;</span>
                          <span className="text-[11px] font-black text-emerald-800 uppercase tracking-[0.1em]">Carreras en Mejora</span>
                          <span className="ml-auto text-[10px] text-slate-400">{enMejora.length}</span>
                        </div>
                        <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
                          {enMejora.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">Sin carreras en mejora marcada</p>}
                          {enMejora.map((p, i) => (
                            <div key={i} className="rounded-xl border border-emerald-100 p-3" style={{ background:'#fafffb' }}>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="font-bold text-slate-800 text-[12px] truncate" title={p.carrera}>{p.carrera}</span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0" style={{ background:'#dcfce7', color:'#16a34a' }}>
                                  +{p.cambio_proyectado} pts
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] mb-1.5">
                                {p.serie.map((s: any, j: number) => (
                                  <span key={j} className="px-1.5 py-0.5 rounded font-bold tabular-nums"
                                    style={{ background:sBg(s.valor), color:sColor(s.valor) }}>{s.valor}</span>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="text-slate-500">Último <b className="text-slate-700">{p.ultimo_valor}</b></span>
                                <ChevronRight size={12} className="text-slate-300" />
                                <span className="text-emerald-600 font-black">{p.proyeccion} <span className="font-normal text-slate-400">proy.</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Alertas IA */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2" style={{ background:'linear-gradient(135deg,#faf5ff,#fff)' }}>
                        <BrainCircuit size={16} style={{ color:'#9333ea' }} />
                        <span className="text-[13px] font-black text-slate-700">Análisis y Alertas — Inteligencia Artificial</span>
                        <span className="ml-auto text-[9px] font-bold text-purple-400 uppercase tracking-[0.15em]">Gemini</span>
                      </div>
                      <div className="p-5">
                        {alertasIA === '__IA_BUSY__' ? (
                          <div className="flex flex-col items-center gap-3 py-6 text-center">
                            <AlertCircle size={28} className="text-amber-400" />
                            <p className="text-sm font-bold text-slate-600">El servidor de IA está saturado en este momento</p>
                            <p className="text-xs text-slate-400 max-w-sm">Google reporta alta demanda temporal. Las proyecciones de arriba ya están calculadas; solo falta el texto de la IA.</p>
                            <button onClick={fetchPrediccion} disabled={loadingPrediccion}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-95 disabled:opacity-60"
                              style={{ background:'linear-gradient(135deg,#9333ea,#7e22ce)', boxShadow:'0 4px 14px rgba(147,51,234,0.35)' }}>
                              <RefreshCw size={13} className={loadingPrediccion ? 'animate-spin' : ''} />
                              {loadingPrediccion ? 'Reintentando…' : 'Reintentar análisis IA'}
                            </button>
                          </div>
                        ) : alertasIA === '__IA_ERROR__' || !alertasIA ? (
                          <div className="flex flex-col items-center gap-3 py-6 text-center">
                            <BrainCircuit size={26} className="text-slate-300" />
                            <p className="text-sm font-bold text-slate-500">Análisis IA no disponible</p>
                            <p className="text-xs text-slate-400 max-w-sm">No se pudo generar el texto (verifica la API key de Gemini en el servidor). Las proyecciones de arriba se calculan sin IA.</p>
                            <button onClick={fetchPrediccion} disabled={loadingPrediccion}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 transition-all hover:bg-slate-200 disabled:opacity-60">
                              <RefreshCw size={13} className={loadingPrediccion ? 'animate-spin' : ''} />
                              {loadingPrediccion ? 'Reintentando…' : 'Reintentar'}
                            </button>
                          </div>
                        ) : (
                          <p className="text-[12px] text-slate-700 leading-relaxed whitespace-pre-wrap">{alertasIA}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })()}

          {/* ══ MÓDULO: Caracterización del Cuerpo Docente ══ */}
          {activeView === 'caracterizacion' && (() => {
            const data = caracterizacion
            const porPeriodo: any[]  = data?.por_periodo    || []
            const porGenero: any     = data?.por_genero     || {}
            const porCarrera: any[]  = data?.por_carrera    || []
            const porEdad: any[]     = data?.por_edad       || []
            const porAntig: any[]    = data?.por_antiguedad || []
            const porFacultad: any[] = data?.por_facultad   || []
            const totalEv: number    = data?.total_evaluaciones || 0
            const totalDoc: number   = data?.total_docentes     || 0

            const hombresTotal = porGenero['Hombre'] || 0
            const mujeresTotal = porGenero['Mujer']  || 0
            const genTotal     = hombresTotal + mujeresTotal || 1

            const periLabels = porPeriodo.map((p: any) => p.label || p.periodo)
            const periHom    = porPeriodo.map((p: any) => p.Hombre || 0)
            const periMuj    = porPeriodo.map((p: any) => p.Mujer  || 0)
            const periTot    = porPeriodo.map((p: any) => p.total  || 0)

            const chartPeriodo = {
              data: [
                { type: 'bar', name: 'Hombres', x: periLabels, y: periHom,
                  marker: { color: '#1e40af', opacity: 0.9 },
                  hovertemplate: '<b>Hombres</b><br>%{x}: %{y}<extra></extra>' },
                { type: 'bar', name: 'Mujeres', x: periLabels, y: periMuj,
                  marker: { color: '#9f1239', opacity: 0.9 },
                  hovertemplate: '<b>Mujeres</b><br>%{x}: %{y}<extra></extra>' },
              ],
              layout: {
                autosize: true, paper_bgcolor: 'white', plot_bgcolor: 'white',
                font: { family: 'Inter', size: 9, color: '#64748b' },
                margin: { t: 24, b: 60, l: 44, r: 14 },
                barmode: 'stack',
                xaxis: { tickfont: { family: 'Inter', size: 9, color: '#334155' }, tickangle: -20, showgrid: false, zeroline: false },
                yaxis: { gridcolor: '#f0f4f8', tickfont: { family: 'Inter', size: 9 }, showgrid: true, zeroline: true },
                showlegend: true,
                legend: { font: { family: 'Inter', size: 10 }, orientation: 'h', y: -0.28, bgcolor: 'rgba(0,0,0,0)' },
              },
            }

            const chartGenero = {
              data: [{ type: 'pie', hole: 0.55, labels: ['Hombres', 'Mujeres'],
                values: [hombresTotal, mujeresTotal], marker: { colors: ['#1e40af', '#9f1239'] },
                textfont: { family: 'Inter', size: 10 },
                hovertemplate: '<b>%{label}</b><br>%{value} (%{percent})<extra></extra>' }],
              layout: { autosize: true, paper_bgcolor: 'white', plot_bgcolor: 'white',
                font: { family: 'Inter', size: 9, color: '#64748b' },
                margin: { t: 10, b: 30, l: 10, r: 10 }, showlegend: true,
                legend: { font: { family: 'Inter', size: 10 }, orientation: 'h', y: -0.1, bgcolor: 'rgba(0,0,0,0)' } },
            }

            const chartCarrera = flatBar(
              porCarrera.slice(0, 15).map((c: any) => c.carrera),
              porCarrera.slice(0, 15).map((c: any) => c.total),
              '#1e40af', { showMeta: false, marginB: 110, tickAngle: -38 }
            )
            const chartEdad = flatBar(
              porEdad.map((e: any) => e.rango), porEdad.map((e: any) => e.total),
              ['#1e40af', '#0891b2', '#059669', '#7c3aed'], { showMeta: false }
            )
            const chartAntig = flatBar(
              porAntig.map((a: any) => a.rango), porAntig.map((a: any) => a.total),
              ['#f59e0b', '#d97706', '#b45309', '#92400e'], { showMeta: false }
            )

            return (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg,#78350f,#b45309)' }}>
                    <Users size={22} style={{ color: '#fde68a' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[17px] font-black text-slate-800 leading-tight">Caracterización del Cuerpo Docente</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {sistemaCaract === 'meipa' ? 'Sistema MEIPA 2023-2024' : sistemaCaract === '360' ? 'Sistema MECDI 2024-2025' : 'Todos los sistemas'}
                      {modeloCaract ? ` · Modelo ${modeloCaract.charAt(0).toUpperCase()+modeloCaract.slice(1)}` : ''}
                      {' — volumen de evaluaciones por período, género, carrera, edad y antigüedad'}
                    </p>
                  </div>
                  {loadingCaracterizacion && <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-amber-500 animate-spin" />}
                  <button onClick={() => fetchCaracterizacion()} disabled={loadingCaracterizacion}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-all">
                    <RefreshCw size={11} className={loadingCaracterizacion ? 'animate-spin' : ''} /> Actualizar
                  </button>
                </div>

                {/* ── Filtros Sistema / Modelo ── */}
                {(() => {
                  const SISTEMAS = [
                    { val: '',      label: 'Todos los sistemas' },
                    { val: 'meipa', label: 'MEIPA  2023-2024'   },
                    { val: '360',   label: 'MECDI  2024-2025'   },
                  ]
                  const MODELOS = [
                    { val: '',              label: 'Todos los modelos' },
                    { val: 'docencia',      label: 'Docencia'          },
                    { val: 'posgrado',      label: 'Posgrado'          },
                    { val: 'tecnologado',   label: 'Tecnologado'       },
                    { val: 'vinculacion',   label: 'Vinculación'       },
                    { val: 'gestion',       label: 'Gestión'           },
                    { val: 'investigacion', label: 'Investigación'     },
                    { val: 'abp',           label: 'ABP'               },
                    { val: 'administrativo',label: 'Administrativo'    },
                    { val: 'servicios',     label: 'Servicios'         },
                  ]
                  const selStyle = (active: boolean) => ({
                    appearance: 'none' as const,
                    WebkitAppearance: 'none' as const,
                    padding: '6px 28px 6px 12px',
                    borderRadius: 8,
                    border: active ? '1.5px solid #f59e0b' : '1.5px solid #e2e8f0',
                    background: active ? 'linear-gradient(135deg,#fef3c7,#fde68a)' : '#f8fafc',
                    color: active ? '#92400e' : '#475569',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
                    minWidth: 160,
                  })
                  return (
                    <div className="flex flex-wrap items-center gap-3 mb-5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Filtrar:</span>
                      <div className="relative">
                        <select
                          value={sistemaCaract}
                          style={selStyle(!!sistemaCaract)}
                          onChange={e => {
                            const v = e.target.value
                            setSistemaCaract(v)
                            setCaracterizacion(null)
                            fetchCaracterizacion(v, modeloCaract)
                          }}
                        >
                          {SISTEMAS.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
                        </select>
                      </div>
                      <div className="relative">
                        <select
                          value={modeloCaract}
                          style={selStyle(!!modeloCaract)}
                          onChange={e => {
                            const v = e.target.value
                            setModeloCaract(v)
                            setCaracterizacion(null)
                            fetchCaracterizacion(sistemaCaract, v)
                          }}
                        >
                          {MODELOS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                        </select>
                      </div>
                      {(sistemaCaract || modeloCaract) && (
                        <button
                          onClick={() => {
                            setSistemaCaract('')
                            setModeloCaract('')
                            setCaracterizacion(null)
                            fetchCaracterizacion('', '')
                          }}
                          className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline"
                        >
                          Limpiar filtros
                        </button>
                      )}
                      {(sistemaCaract || modeloCaract) && (
                        <span className="ml-auto text-[9px] text-slate-400 font-semibold">
                          {sistemaCaract === 'meipa' ? '🎓 MEIPA' : sistemaCaract === '360' ? '🔄 MECDI' : ''}
                          {modeloCaract ? `  ·  ${modeloCaract.charAt(0).toUpperCase()+modeloCaract.slice(1)}` : ''}
                        </span>
                      )}
                    </div>
                  )
                })()}

                {!data && !loadingCaracterizacion ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <Users size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">Sin datos disponibles</p>
                    <button onClick={() => fetchCaracterizacion()} className="mt-4 px-4 py-2 rounded-lg text-xs font-bold text-white bg-amber-500 hover:bg-amber-600">Cargar datos</button>
                  </div>
                ) : (
                  <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                      {[
                        { title: 'Total Evaluaciones', value: totalEv.toLocaleString(), label: 'registros', footer: sistemaCaract === 'meipa' ? 'MEIPA 2023-2024' : sistemaCaract === '360' ? 'MECDI 2024-2025' : 'Todos los sistemas', accent: '#f59e0b' },
                        { title: 'Docentes Únicos', value: totalDoc.toLocaleString(), label: 'docentes', footer: 'Identificados', accent: '#1e40af' },
                        { title: 'Docentes Hombres', value: hombresTotal.toLocaleString(), label: `${Math.round(hombresTotal/genTotal*100)}%`, footer: 'Del total', accent: '#1e40af' },
                        { title: 'Docentes Mujeres', value: mujeresTotal.toLocaleString(), label: `${Math.round(mujeresTotal/genTotal*100)}%`, footer: 'Del total', accent: '#9f1239' },
                      ].map(k => <KPICard key={k.title} title={k.title} value={k.value} label={k.label} footer={k.footer} accent={k.accent} icon={null} iconBg={null} />)}
                    </div>

                    {/* Período + Género */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                      <div className="lg:col-span-2">
                        <ChartCard title="Evaluaciones por Período" sub="Evolución Semestral">
                          {periLabels.length > 0 ? (
                            <>
                              <Plot data={chartPeriodo.data} layout={chartPeriodo.layout} config={{ responsive: true, displayModeBar: false }} style={{ width: '100%', height: '240px' }} />
                              <div className="overflow-x-auto mt-3">
                                <table className="w-full text-[10px]">
                                  <thead><tr className="border-b border-slate-100">
                                    <th className="text-left pb-1.5 text-slate-400 font-bold uppercase tracking-wider">Período</th>
                                    <th className="text-right pb-1.5 text-[#1e40af] font-bold uppercase tracking-wider">Hombres</th>
                                    <th className="text-right pb-1.5 text-[#9f1239] font-bold uppercase tracking-wider">Mujeres</th>
                                  </tr></thead>
                                  <tbody>
                                    {porPeriodo.map((p: any, i: number) => (
                                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                                        <td className="py-1.5 font-semibold text-slate-700">{p.label || p.periodo}</td>
                                        <td className="py-1.5 text-right font-semibold" style={{ color: '#1e40af' }}>{(p.Hombre||0).toLocaleString()}</td>
                                        <td className="py-1.5 text-right font-semibold" style={{ color: '#9f1239' }}>{(p.Mujer||0).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          ) : <p className="text-xs text-slate-400 text-center py-10">Sin datos de períodos</p>}
                        </ChartCard>
                      </div>
                      <div>
                        <ChartCard title="Distribución por Género" sub="Global">
                          {(hombresTotal + mujeresTotal) > 0 ? (
                            <>
                              <Plot data={chartGenero.data} layout={chartGenero.layout} config={{ responsive: true, displayModeBar: false }} style={{ width: '100%', height: '180px' }} />
                              <div className="mt-3 space-y-2">
                                {[['Hombres', hombresTotal, '#1e40af'], ['Mujeres', mujeresTotal, '#9f1239']].map(([label, val, color]) => (
                                  <div key={label as string} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color as string }} />
                                    <span className="text-[10px] font-semibold text-slate-600 flex-1">{label}</span>
                                    <span className="text-[11px] font-black" style={{ color: color as string }}>{(val as number).toLocaleString()}</span>
                                    <span className="text-[9px] text-slate-400">{Math.round((val as number)/genTotal*100)}%</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : <p className="text-xs text-slate-400 text-center py-10">Sin datos</p>}
                        </ChartCard>
                      </div>
                    </div>

                    {/* Carrera + Edad + Antigüedad */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                      <div>
                        <ChartCard title="Docentes por Carrera" sub="Top 15">
                          {porCarrera.length > 0 ? (
                            <>
                              <Plot data={chartCarrera.data} layout={chartCarrera.layout} config={{ responsive: true, displayModeBar: false }} style={{ width: '100%', height: '260px' }} />
                              <div className="overflow-y-auto max-h-40 mt-2">
                                {porCarrera.map((c: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2 py-1 border-b border-slate-50">
                                    <span className="text-[9px] text-slate-400 w-4">{i+1}</span>
                                    <span className="text-[10px] font-semibold text-slate-700 flex-1 truncate">{c.carrera}</span>
                                    <span className="text-[10px] font-black text-slate-800">{c.total}</span>
                                    <span className="text-[9px] text-[#1e40af]">H:{c.Hombre||0}</span>
                                    <span className="text-[9px] text-[#9f1239]">M:{c.Mujer||0}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : <p className="text-xs text-slate-400 text-center py-10">Sin datos</p>}
                        </ChartCard>
                      </div>
                      <div>
                        <ChartCard title="Distribución por Edad" sub="Rangos etarios">
                          {porEdad.length > 0 ? (
                            <>
                              <Plot data={chartEdad.data} layout={chartEdad.layout} config={{ responsive: true, displayModeBar: false }} style={{ width: '100%', height: '180px' }} />
                              <div className="mt-3 space-y-1">
                                {porEdad.map((e: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2 py-1 border-b border-slate-50">
                                    <span className="text-[10px] font-semibold text-slate-600 flex-1">{e.rango}</span>
                                    <span className="text-[11px] font-black text-slate-800">{e.total}</span>
                                    <span className="text-[9px] text-[#1e40af]">H:{e.Hombre||0}</span>
                                    <span className="text-[9px] text-[#9f1239]">M:{e.Mujer||0}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : <p className="text-xs text-slate-400 text-center py-10">Sin datos de edad</p>}
                        </ChartCard>
                      </div>
                      <div>
                        <ChartCard title="Distribución por Antigüedad" sub="Años de servicio">
                          {porAntig.length > 0 ? (
                            <>
                              <Plot data={chartAntig.data} layout={chartAntig.layout} config={{ responsive: true, displayModeBar: false }} style={{ width: '100%', height: '180px' }} />
                              <div className="mt-3 space-y-1">
                                {porAntig.map((a: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2 py-1 border-b border-slate-50">
                                    <span className="text-[10px] font-semibold text-slate-600 flex-1">{a.rango}</span>
                                    <span className="text-[11px] font-black text-slate-800">{a.total}</span>
                                    <span className="text-[9px] text-[#1e40af]">H:{a.Hombre||0}</span>
                                    <span className="text-[9px] text-[#9f1239]">M:{a.Mujer||0}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : <p className="text-xs text-slate-400 text-center py-10">Sin datos de antigüedad</p>}
                        </ChartCard>
                      </div>
                    </div>

                    {/* Por facultad */}
                    {porFacultad.length > 0 && (
                      <ChartCard title="Evaluaciones por Unidad Académica / Facultad" sub="Conteo total">
                        <div className="space-y-2">
                          {porFacultad.map((f: any, i: number) => {
                            const pct = Math.round(f.total / (totalEv || 1) * 100)
                            return (
                              <div key={i} className="space-y-0.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-semibold text-slate-700 truncate pr-2">{f.facultad}</span>
                                  <span className="text-[11px] font-black text-slate-800 flex-shrink-0">{f.total} <span className="text-[9px] text-slate-400 font-normal">({pct}%)</span></span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#f59e0b' }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </ChartCard>
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
