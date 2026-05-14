import { supabase, type Memorial } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import QRDisplay from '@/components/QRDisplay'

export const revalidate = 60

function formatFecha(fecha: string | null): string {
  if (!fecha) return ''
  const [y, m, d] = fecha.split('-')
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`
}

function calcularEdad(nac: string | null, fal: string | null): string {
  if (!nac || !fal) return ''
  const n = new Date(nac)
  const f = new Date(fal)
  let edad = f.getFullYear() - n.getFullYear()
  const m = f.getMonth() - n.getMonth()
  if (m < 0 || (m === 0 && f.getDate() < n.getDate())) edad--
  return `${edad} años`
}

export default async function MemorialPage({ params }: { params: { id: string } }) {
  const { data: memorial, error } = await supabase
    .from('memorials')
    .select('*')
    .eq('id', params.id)
    .eq('activo', true)
    .single()

  if (error || !memorial) notFound()

  const edad = calcularEdad(memorial.fecha_nacimiento, memorial.fecha_fallecimiento)
  const memorialUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://recuerdo-digital.vercel.app'}/memorial/${memorial.id}`

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E3A22] to-[#0D1F0F]" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #C8A96A 0%, transparent 50%)' }}
        />

        <div className="relative z-10 max-w-2xl mx-auto px-6 pt-16 pb-12 text-center">
          {/* Foto principal */}
          {memorial.fotos && memorial.fotos.length > 0 ? (
            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-[#C8A96A]/40 shadow-2xl mb-6">
              <Image
                src={memorial.fotos[0]}
                alt={memorial.nombre || 'Memorial'}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-32 h-32 mx-auto rounded-full bg-white/5 border-4 border-[#C8A96A]/30 flex items-center justify-center text-4xl mb-6">
              🕊️
            </div>
          )}

          {/* Nombre */}
          <h1 className="text-3xl md:text-4xl font-serif text-white mb-2">
            {memorial.nombre}
          </h1>

          {/* Fechas */}
          {(memorial.fecha_nacimiento || memorial.fecha_fallecimiento) && (
            <p className="text-[#C8A96A] text-sm mb-1">
              {formatFecha(memorial.fecha_nacimiento)}
              {memorial.fecha_nacimiento && memorial.fecha_fallecimiento && ' — '}
              {formatFecha(memorial.fecha_fallecimiento)}
            </p>
          )}
          {edad && (
            <p className="text-white/30 text-xs">{edad}</p>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">

        {/* Mensaje */}
        {memorial.mensaje && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-[#C8A96A] text-xs uppercase tracking-widest mb-3">✦ Palabras de recuerdo</p>
            <p className="text-white/70 leading-relaxed italic text-lg font-serif">
              &ldquo;{memorial.mensaje}&rdquo;
            </p>
          </div>
        )}

        {/* Galería de fotos */}
        {memorial.fotos && memorial.fotos.length > 1 && (
          <div>
            <p className="text-[#C8A96A] text-xs uppercase tracking-widest mb-4">✦ Galería</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {memorial.fotos.slice(1).map((url: string, i: number) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden">
                  <Image
                    src={url}
                    alt={`Recuerdo ${i + 2}`}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover hover:scale-105 transition duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <p className="text-[#C8A96A] text-xs uppercase tracking-widest mb-4">✦ Código QR del medallón</p>
          <div className="flex justify-center mb-4">
            <QRDisplay url={memorialUrl} />
          </div>
          <p className="text-white/30 text-xs">Escanea para compartir este recuerdo</p>
        </div>

        {/* Footer */}
        <div className="text-center pb-10">
          <p className="text-white/20 text-xs">
            🌿 Florería Angélica — Sector Agua Fría N°15, Linares
          </p>
          <p className="text-white/10 text-xs mt-1">Recuerdo Digital</p>
        </div>
      </div>
    </div>
  )
}
