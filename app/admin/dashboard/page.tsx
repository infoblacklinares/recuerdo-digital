'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase, type Memorial, type Condolencia } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QRCodeCanvas } from 'qrcode.react'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://recuerdo-digital.vercel.app'

function MemorialQR({ id, nombre }: { id: string; nombre: string | null }) {
  const printRef = useRef<HTMLDivElement>(null)
  const url = `${BASE_URL}/memorial/${id}`

  function download() {
    // Usa el canvas de alta resolución (oculto) para el PNG
    const canvas = printRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qr-medallon-${nombre || id}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <p className="text-white/30 text-xs text-center mb-3">QR — escanear lleva al perfil memorial</p>

      {/* QR visible en pantalla */}
      <div className="flex justify-center mb-3">
        <div className="bg-white p-4 rounded-2xl inline-block shadow-xl">
          <QRCodeCanvas value={url} size={220} bgColor="#ffffff" fgColor="#000000" level="M" />
        </div>
      </div>

      {/* Canvas oculto de alta res para descarga (800×800) */}
      <div ref={printRef} className="hidden">
        <QRCodeCanvas value={url} size={800} bgColor="#ffffff" fgColor="#000000" level="M" />
      </div>

      <button onClick={download}
        className="w-full text-sm bg-[#C8A96A]/15 hover:bg-[#C8A96A]/25 border border-[#C8A96A]/30 text-[#C8A96A] py-2.5 rounded-xl transition font-medium">
        ⬇ Descargar para imprimir (alta resolución)
      </button>
      <p className="text-white/15 text-xs text-center mt-2 break-all">{url}</p>
    </div>
  )
}

function ClienteEditor({ memorial, onSave }: { memorial: Memorial; onSave: (id: string, nombre: string, tel: string) => void }) {
  const [nombre, setNombre] = useState(memorial.cliente_nombre || '')
  const [tel, setTel] = useState(memorial.cliente_telefono || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  async function save() {
    setSaving(true)
    await supabase.from('memorials').update({ cliente_nombre: nombre.trim() || null, cliente_telefono: tel.trim() || null }).eq('id', memorial.id)
    onSave(memorial.id, nombre.trim(), tel.trim())
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }
  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <p className="text-white/30 text-xs mb-3">Datos del cliente (uso interno)</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del cliente"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-[#C8A96A] transition" />
        <input type="tel" value={tel} onChange={e => setTel(e.target.value)} placeholder="+56 9 xxxx xxxx"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-[#C8A96A] transition" />
        <button onClick={save} disabled={saving}
          className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white px-4 py-2 rounded-lg transition disabled:opacity-50 flex-shrink-0">
          {saved ? '✓ Guardado' : saving ? '...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

function CondolenciasAdmin({ memorialId, count }: { memorialId: string; count: number }) {
  const [conds, setConds] = useState<Condolencia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('condolencias').select('*').eq('memorial_id', memorialId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setConds(data); setLoading(false) })
  }, [memorialId])

  async function eliminar(id: string) {
    await supabase.from('condolencias').delete().eq('id', id)
    setConds(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <p className="text-white/30 text-xs mb-3">Mensajes de condolencia ({count})</p>
      {loading ? <p className="text-white/20 text-xs">Cargando...</p>
        : conds.length === 0 ? <p className="text-white/20 text-xs">Sin mensajes aún.</p>
        : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {conds.map(c => (
              <div key={c.id} className="flex items-start gap-2 bg-white/3 border border-white/8 rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white/70 text-xs font-medium">{c.nombre}</p>
                  <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{c.mensaje}</p>
                </div>
                <button onClick={() => eliminar(c.id)}
                  className="text-red-400/40 hover:text-red-400 transition text-xs flex-shrink-0 px-1 py-0.5">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

export default function Dashboard() {
  const [memorials, setMemorials] = useState<Memorial[]>([])
  const [condolenciaCounts, setCondolenciaCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [expandedQR, setExpandedQR] = useState<string | null>(null)
  const [expandedCliente, setExpandedCliente] = useState<string | null>(null)
  const [expandedConds, setExpandedConds] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [{ data: mems }, { data: conds }] = await Promise.all([
      supabase.from('memorials').select('*').order('created_at', { ascending: false }),
      supabase.from('condolencias').select('memorial_id'),
    ])
    if (mems) setMemorials(mems)
    if (conds) {
      const counts: Record<string, number> = {}
      conds.forEach(c => { counts[c.memorial_id] = (counts[c.memorial_id] || 0) + 1 })
      setCondolenciaCounts(counts)
    }
    setLoading(false)
  }

  async function crearNuevoMedallón() {
    setCreating(true)
    const { data, error } = await supabase.from('memorials').insert({}).select().single()
    if (error) alert('Error: ' + error.message)
    else setMemorials(prev => [data, ...prev])
    setCreating(false)
  }

  async function toggleActivo(id: string, activo: boolean) {
    await supabase.from('memorials').update({ activo: !activo }).eq('id', id)
    setMemorials(prev => prev.map(m => m.id === id ? { ...m, activo: !activo } : m))
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este memorial?')) return
    await supabase.from('memorials').delete().eq('id', id)
    setMemorials(prev => prev.filter(m => m.id !== id))
    setExpandedQR(null); setExpandedCliente(null); setExpandedConds(null)
  }

  function copiarLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/crear/${token}`)
    setCopied(token); setTimeout(() => setCopied(null), 2000)
  }

  function toggle(state: string | null, set: (v: string | null) => void, id: string) {
    set(state === id ? null : id)
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  const totalVisitas = memorials.reduce((sum, m) => sum + (m.visitas || 0), 0)

  return (
    <div className="min-h-screen bg-dark">
      <header className="border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🌿</span>
          <div>
            <h1 className="text-white font-serif text-base leading-tight">Recuerdo Digital</h1>
            <p className="text-white/30 text-xs uppercase tracking-widest">Panel Admin</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-white/40 hover:text-white text-sm transition">Salir</button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total', value: memorials.length },
            { label: 'Completados', value: memorials.filter(m => m.completado).length },
            { label: 'Activos', value: memorials.filter(m => m.activo).length },
            { label: 'Visitas totales', value: totalVisitas },
          ].map(stat => (
            <div key={stat.label} className="bg-glass rounded-2xl p-4 text-center">
              <p className="text-2xl font-serif text-[#C8A96A]">{stat.value}</p>
              <p className="text-white/40 text-xs uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-serif text-lg">Medallones</h2>
          <button onClick={crearNuevoMedallón} disabled={creating}
            className="bg-[#C8A96A] hover:bg-[#b8945a] text-[#0D1F0F] font-semibold px-4 py-2 rounded-xl text-sm transition disabled:opacity-50">
            {creating ? 'Creando...' : '+ Nuevo'}
          </button>
        </div>

        {loading ? <div className="text-center py-20 text-white/30">Cargando...</div>
          : memorials.length === 0 ? (
            <div className="text-center py-20 bg-glass rounded-2xl">
              <p className="text-4xl mb-4">🌸</p>
              <p className="text-white/40">No hay medallones aún.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {memorials.map(m => (
                <div key={m.id} className="bg-glass rounded-2xl p-4">
                  {/* Fila info */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${m.activo ? 'bg-green-400' : m.completado ? 'bg-[#C8A96A]' : 'bg-white/20'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-medium text-sm">
                          {m.nombre || <span className="text-white/30 italic">Sin nombre aún</span>}
                        </p>
                        {condolenciaCounts[m.id] > 0 && (
                          <span className="text-xs bg-[#C8A96A]/15 border border-[#C8A96A]/30 text-[#C8A96A] px-2 py-0.5 rounded-full">
                            🕊️ {condolenciaCounts[m.id]}
                          </span>
                        )}
                        {(m.visitas || 0) > 0 && (
                          <span className="text-xs text-white/25">
                            👁 {m.visitas} visitas
                          </span>
                        )}
                      </div>
                      <p className="text-white/30 text-xs mt-0.5">
                        {m.completado ? '✓ Completado' : 'Pendiente'} · {new Date(m.created_at).toLocaleDateString('es-CL')}
                      </p>
                      {m.cliente_nombre && (
                        <p className="text-white/35 text-xs mt-1">
                          👤 {m.cliente_nombre}{m.cliente_telefono ? ` · ${m.cliente_telefono}` : ''}
                        </p>
                      )}
                    </div>
                    <button onClick={() => eliminar(m.id)} className="text-red-400/40 hover:text-red-400 transition p-1 flex-shrink-0">✕</button>
                  </div>

                  {/* Fila acciones */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => toggle(expandedQR, setExpandedQR, m.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition ${expandedQR === m.id ? 'bg-[#C8A96A]/20 border-[#C8A96A]/40 text-[#C8A96A]' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white'}`}>
                      📱 QR
                    </button>
                    <button onClick={() => copiarLink(m.token)}
                      className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-white/60 hover:text-white transition">
                      {copied === m.token ? '✓ Copiado' : '🔗 Link familia'}
                    </button>
                    {m.completado && (
                      <Link href={`/memorial/${m.id}`} target="_blank"
                        className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-white/60 hover:text-white transition">
                        👁 Ver
                      </Link>
                    )}
                    <button onClick={() => toggleActivo(m.id, m.activo)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition ${m.activo ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}>
                      {m.activo ? '● Activo' : 'Activar'}
                    </button>
                    <button onClick={() => toggle(expandedCliente, setExpandedCliente, m.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition ${expandedCliente === m.id ? 'bg-white/15 border-white/30 text-white' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/40 hover:text-white'}`}>
                      👤 Cliente
                    </button>
                    {condolenciaCounts[m.id] > 0 && (
                      <button onClick={() => toggle(expandedConds, setExpandedConds, m.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition ${expandedConds === m.id ? 'bg-[#C8A96A]/20 border-[#C8A96A]/40 text-[#C8A96A]' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white'}`}>
                        🕊️ Mensajes
                      </button>
                    )}
                  </div>

                  {expandedQR === m.id && <MemorialQR id={m.id} nombre={m.nombre} />}
                  {expandedCliente === m.id && (
                    <ClienteEditor memorial={m} onSave={(id, n, t) =>
                      setMemorials(prev => prev.map(x => x.id === id ? { ...x, cliente_nombre: n || null, cliente_telefono: t || null } : x))
                    } />
                  )}
                  {expandedConds === m.id && (
                    <CondolenciasAdmin memorialId={m.id} count={condolenciaCounts[m.id] || 0} />
                  )}
                </div>
              ))}
            </div>
          )}
      </main>
    </div>
  )
}
