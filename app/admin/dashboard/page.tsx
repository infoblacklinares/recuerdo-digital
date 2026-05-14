'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase, type Memorial } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QRCodeCanvas } from 'qrcode.react'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://recuerdo-digital.vercel.app'

function MemorialQR({ id, nombre }: { id: string; nombre: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const url = `${BASE_URL}/memorial/${id}`

  function download() {
    const canvas = containerRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qr-medallon-${nombre || id}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <p className="text-white/30 text-xs text-center mb-3">
        Código QR del medallón — escanear lleva al perfil memorial
      </p>
      <div ref={containerRef} className="flex justify-center mb-3">
        <div className="bg-white p-4 rounded-2xl inline-block shadow-xl">
          <QRCodeCanvas
            value={url}
            size={200}
            bgColor="#ffffff"
            fgColor="#0D1F0F"
            level="H"
          />
        </div>
      </div>
      <button
        onClick={download}
        className="w-full text-sm bg-[#C8A96A]/15 hover:bg-[#C8A96A]/25 border border-[#C8A96A]/30 text-[#C8A96A] py-2.5 rounded-xl transition font-medium"
      >
        ⬇ Descargar para imprimir
      </button>
      <p className="text-white/15 text-xs text-center mt-2 break-all">{url}</p>
    </div>
  )
}

export default function Dashboard() {
  const [memorials, setMemorials] = useState<Memorial[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [expandedQR, setExpandedQR] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchMemorials()
  }, [])

  async function fetchMemorials() {
    const { data, error } = await supabase
      .from('memorials')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setMemorials(data || [])
    }
    setLoading(false)
  }

  async function crearNuevoMedallón() {
    setCreating(true)
    const { data, error } = await supabase
      .from('memorials')
      .insert({})
      .select()
      .single()

    if (error) {
      alert('Error al crear memorial: ' + error.message)
    } else {
      setMemorials(prev => [data, ...prev])
    }
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
    if (expandedQR === id) setExpandedQR(null)
  }

  function copiarLink(token: string) {
    const url = `${window.location.origin}/crear/${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🌿</span>
          <div>
            <h1 className="text-white font-serif text-base leading-tight">Recuerdo Digital</h1>
            <p className="text-white/30 text-xs uppercase tracking-widest">Panel Admin</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-white/40 hover:text-white text-sm transition">
          Salir
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total', value: memorials.length },
            { label: 'Completados', value: memorials.filter(m => m.completado).length },
            { label: 'Activos', value: memorials.filter(m => m.activo).length },
          ].map(stat => (
            <div key={stat.label} className="bg-glass rounded-2xl p-4 text-center">
              <p className="text-2xl font-serif text-[#C8A96A]">{stat.value}</p>
              <p className="text-white/40 text-xs uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Botón crear */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-serif text-lg">Medallones</h2>
          <button
            onClick={crearNuevoMedallón}
            disabled={creating}
            className="bg-[#C8A96A] hover:bg-[#b8945a] text-[#0D1F0F] font-semibold px-4 py-2 rounded-xl text-sm transition disabled:opacity-50"
          >
            {creating ? 'Creando...' : '+ Nuevo'}
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-20 text-white/30">Cargando...</div>
        ) : memorials.length === 0 ? (
          <div className="text-center py-20 bg-glass rounded-2xl">
            <p className="text-4xl mb-4">🌸</p>
            <p className="text-white/40">No hay medallones aún.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {memorials.map(m => (
              <div key={m.id} className="bg-glass rounded-2xl p-4">
                {/* Fila 1: estado + info */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${m.activo ? 'bg-green-400' : m.completado ? 'bg-[#C8A96A]' : 'bg-white/20'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm leading-snug">
                      {m.nombre || <span className="text-white/30 italic">Sin nombre aún</span>}
                    </p>
                    <p className="text-white/30 text-xs mt-0.5">
                      {m.completado ? '✓ Completado' : 'Pendiente'} · {new Date(m.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  {/* Eliminar - siempre visible */}
                  <button
                    onClick={() => eliminar(m.id)}
                    className="text-red-400/40 hover:text-red-400 transition p-1 flex-shrink-0"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </div>

                {/* Fila 2: acciones */}
                <div className="flex flex-wrap gap-2">
                  {/* Ver QR */}
                  <button
                    onClick={() => setExpandedQR(expandedQR === m.id ? null : m.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                      expandedQR === m.id
                        ? 'bg-[#C8A96A]/20 border-[#C8A96A]/40 text-[#C8A96A]'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    📱 QR
                  </button>

                  {/* Copiar link familia */}
                  <button
                    onClick={() => copiarLink(m.token)}
                    className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-white/60 hover:text-white transition"
                  >
                    {copied === m.token ? '✓ Copiado' : '🔗 Link familia'}
                  </button>

                  {/* Ver memorial */}
                  {m.completado && (
                    <Link
                      href={`/memorial/${m.id}`}
                      target="_blank"
                      className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-white/60 hover:text-white transition"
                    >
                      👁 Ver
                    </Link>
                  )}

                  {/* Toggle activo */}
                  <button
                    onClick={() => toggleActivo(m.id, m.activo)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                      m.activo
                        ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                    }`}
                  >
                    {m.activo ? '● Activo' : 'Activar'}
                  </button>
                </div>

                {/* QR expandido */}
                {expandedQR === m.id && (
                  <MemorialQR id={m.id} nombre={m.nombre} />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
