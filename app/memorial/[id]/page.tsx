import { supabase, type Condolencia } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import CondolenciasSection from '@/components/CondolenciasSection'

export const revalidate = 60

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://recuerdo-digital.vercel.app'

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

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data: memorial } = await supabase
    .from('memorials')
    .select('nombre, mensaje, fotos')
    .eq('id', params.id)
    .eq('activo', true)
    .single()

  if (!memorial) return { title: 'Recuerdo Digital' }

  const titulo = `${memorial.nombre} — Recuerdo Digital`
  const descripcion = memorial.mensaje
    ? `"${memorial.mensaje.slice(0, 120)}${memorial.mensaje.length > 120 ? '...' : ''}"`
    : `Perfil memorial de ${memorial.nombre} · Florería Angélica`
  const imagen = memorial.fotos?.[0] ?? null

  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      url: `${BASE_URL}/memorial/${params.id}`,
      siteName: 'Recuerdo Digital — Florería Angélica',
      ...(imagen ? { images: [{ url: imagen, width: 800, height: 800, alt: memorial.nombre }] } : {}),
      type: 'profile',
      locale: 'es_CL',
    },
    twitter: {
      card: imagen ? 'summary_large_image' : 'summary',
      title: titulo,
      description: descripcion,
      ...(imagen ? { images: [imagen] } : {}),
    },
  }
}

export default async function MemorialPage({ params }: { params: { id: string } }) {
  const [{ data: memorial }, { data: condolencias }] = await Promise.all([
    supabase.from('memorials').select('*').eq('id', params.id).eq('activo', true).single(),
    supabase.from('condolencias').select('*').eq('memorial_id', params.id).order('created_at', { ascending: false }).limit(50),
  ])

  if (!memorial) notFound()

  const edad = calcularEdad(memorial.fecha_nacimiento, memorial.fecha_fallecimiento)
  const memorialUrl = `${BASE_URL}/memorial/${memorial.id}`
  const whatsappText = encodeURIComponent(`Te comparto el recuerdo de ${memorial.nombre}: ${memorialUrl}`)

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E3A22] to-[#0D1F0F]" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #C8A96A 0%, transparent 50%)' }}
        />

        <div className="relative z-10 max-w-2xl mx-auto px-6 pt-20 pb-16 text-center">
          {/* Foto principal */}
          {memorial.fotos && memorial.fotos.length > 0 ? (
            <div className="w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-[#C8A96A]/50 shadow-2xl mb-8">
              <Image
                src={memorial.fotos[0]}
                alt={memorial.nombre || 'Memorial'}
                width={192}
                height={192}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-48 h-48 mx-auto rounded-full bg-white/5 border-4 border-[#C8A96A]/30 flex items-center justify-center text-6xl mb-8">
              🕊️
            </div>
          )}

          {/* Nombre */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white mb-3 break-words px-2">
            {memorial.nombre}
          </h1>

          {/* Fechas */}
          {(memorial.fecha_nacimiento || memorial.fecha_fallecimiento) && (
            <p className="text-[#C8A96A] text-sm sm:text-base mb-1 px-2">
              {formatFecha(memorial.fecha_nacimiento)}
              {memorial.fecha_nacimiento && memorial.fecha_fallecimiento && (
                <span className="block sm:inline"> — </span>
              )}
              {formatFecha(memorial.fecha_fallecimiento)}
            </p>
          )}
          {edad && (
            <p className="text-white/40 text-sm mb-6">{edad}</p>
          )}

          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/30 text-white text-sm px-6 py-2.5 rounded-full transition mt-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Compartir por WhatsApp
          </a>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">

        {/* Mensaje */}
        {memorial.mensaje && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-[#C8A96A] text-xs uppercase tracking-widest mb-3">✦ Palabras de recuerdo</p>
            <p className="text-white/70 leading-relaxed italic text-xl font-serif">
              &ldquo;{memorial.mensaje}&rdquo;
            </p>
          </div>
        )}

        {/* Video */}
        {memorial.video_url && (
          <div>
            <p className="text-[#C8A96A] text-xs uppercase tracking-widest mb-4">✦ Video</p>
            <video
              src={memorial.video_url}
              controls
              playsInline
              className="w-full rounded-2xl border border-white/10"
            />
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

        {/* Condolencias */}
        <CondolenciasSection
          memorialId={memorial.id}
          initialCondolencias={(condolencias as Condolencia[]) ?? []}
        />

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
