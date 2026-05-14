'use client'
import { useState } from 'react'
import { supabase, type Condolencia } from '@/lib/supabase'

function formatFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function CondolenciasSection({
  memorialId,
  initialCondolencias,
}: {
  memorialId: string
  initialCondolencias: Condolencia[]
}) {
  const [condolencias, setCondolencias] = useState(initialCondolencias)
  const [nombre, setNombre] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !mensaje.trim()) return
    setSending(true)
    setError('')

    const { data, error: err } = await supabase
      .from('condolencias')
      .insert({ memorial_id: memorialId, nombre: nombre.trim(), mensaje: mensaje.trim() })
      .select()
      .single()

    if (err) {
      setError('No se pudo enviar el mensaje. Intenta de nuevo.')
    } else if (data) {
      setCondolencias(prev => [data, ...prev])
      setNombre('')
      setMensaje('')
      setSent(true)
      setTimeout(() => setSent(false), 4000)
    }
    setSending(false)
  }

  return (
    <div className="space-y-4">
      {/* Formulario */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <p className="text-[#C8A96A] text-xs uppercase tracking-widest mb-4">✦ Deja un mensaje</p>

        {sent ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-3">🕊️</p>
            <p className="text-white/70 text-sm">Gracias por tus palabras de recuerdo.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Tu nombre"
              required
              maxLength={80}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-[#C8A96A] transition text-sm"
            />
            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              placeholder="Escribe tus palabras de recuerdo..."
              required
              maxLength={500}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-[#C8A96A] transition text-sm resize-none"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-[#C8A96A]/15 hover:bg-[#C8A96A]/25 border border-[#C8A96A]/40 text-[#C8A96A] py-2.5 rounded-xl text-sm transition disabled:opacity-50 font-medium"
            >
              {sending ? 'Enviando...' : 'Enviar mensaje 🕊️'}
            </button>
          </form>
        )}
      </div>

      {/* Lista de condolencias */}
      {condolencias.length > 0 && (
        <div className="space-y-3">
          <p className="text-[#C8A96A] text-xs uppercase tracking-widest">
            ✦ Mensajes de recuerdo · {condolencias.length}
          </p>
          {condolencias.map(c => (
            <div key={c.id} className="bg-white/3 border border-white/8 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🕊️</span>
                <p className="text-white/80 text-sm font-medium flex-1">{c.nombre}</p>
                <p className="text-white/20 text-xs">{formatFecha(c.created_at)}</p>
              </div>
              <p className="text-white/50 text-sm leading-relaxed pl-6">{c.mensaje}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
