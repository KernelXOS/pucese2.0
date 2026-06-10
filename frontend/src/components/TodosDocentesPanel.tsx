import React, { useState, useCallback, useMemo } from 'react'
import { api } from '../services/api'
import { Users, RefreshCw, FileText, Search, Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { MODELO_COLOR, SISTEMA_COLOR } from '../shared'

export default function TodosDocentesPanel({ docentes, context }: { docentes: any[]; context?: { modelo: string; sistema: string; label: string } }) {
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
