'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Memorial } from '@/lib/supabase'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'

export default function CrearMemorial() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [memorial, setMemorial] = useState<Memorial | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const [nombre, setNombre] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [fechaFallecimiento, setFechaFallecimiento] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [fotos, setFotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('memorials')
        .select('*')
        .eq('token', token)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else if (data.completado) {
        router.push(`/memorial/${data.id}`)
      } else {
        setMemorial(data)
      }
    }
    load()
  }, [token, router])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    const nuevasFotos: string[] = []

    for (const file of acceptedFiles) {
      const ext = file.name.split('.').pop()
      const fileName = `${token}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from('memorial-fotos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (!error) {
        const { data: urlData } = supabase.storage
          .from('memorial-fotos')
          .getPublicUrl(fileName)
        nuevasFotos.push(urlData.publicUrl)
      }
    }

    setFotos(prev => [...prev, ...nuevasFotos])
    setUploading(false)
  }, [token])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 10,
  })

  async function handleVideoUpload(file: File) {
    setUploadingVideo(true)
    const ext = file.name.split('.').pop()
    const fileName = `${token}/video-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('memorial-fotos')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (!error) {
      const { data } = supabase.storage.from('memorial-fotos').getPublicUrl(fileName)
      setVideoUrl(data.publicUrl)
    } else {
      alert('Error al subir el video: ' + error.message)
    }
    setUploadingVideo(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!memorial) return
    if (!nombre.trim()) return alert('Por favor ingresa el nombre.')

    setSaving(true)
    const { error } = await supabase
      .from('memorials')
      .update({
        nombre: nombre.trim(),
        fecha_nacimiento: fechaNacimiento || null,
        fecha_fallecimiento: fechaFallecimiento || null,
        mensaje: mensaje.trim() || null,
        fotos,
        video_url: videoUrl,
        completado: true,
        activo: true,
      })
      .eq('token', token)

    if (error) {
      alert('Error al guardar: ' + error.message)
      setSaving(false)
    } else {
      setDone(true)
      setTimeout(() => router.push(`/memorial/${memorial.id}`), 2000)
    }
  }

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-4">
      <div className="text-center">
        <p className="text-5xl mb-4">🍂</p>
        <h1 className="text-white text-xl font-serif mb-2">Link no válido</h1>
        <p className="text-white/40 text-sm">Este enlace no existe o ya fue utilizado.</p>
      </div>
    </div>
  )

  if (!memorial) return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="text-white/30 text-sm">Cargando...</div>
    </div>
  )

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-4">
      <div className="text-center">
        <p className="text-5xl mb-4">🌸</p>
        <h1 className="text-white text-2xl font-serif mb-2">¡Listo!</h1>
        <p className="text-white/50 text-sm">Preparando el perfil de recuerdo...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-dark py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🌿</div>
          <h1 className="text-white font-serif text-2xl mb-1">Crear Recuerdo Digital</h1>
          <p className="text-white/40 text-sm">
            Completa los datos de tu ser querido. Este perfil quedará disponible en el medallón.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#C8A96A] transition"
              placeholder="Ej: María Angélica González"
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                value={fechaNacimiento}
                onChange={e => setFechaNacimiento(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C8A96A] transition"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
                Fecha de fallecimiento
              </label>
              <input
                type="date"
                value={fechaFallecimiento}
                onChange={e => setFechaFallecimiento(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C8A96A] transition"
              />
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
              Mensaje o dedicatoria
            </label>
            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#C8A96A] transition resize-none"
              placeholder="Escribe un mensaje especial, un recuerdo o una dedicatoria..."
            />
          </div>

          {/* Fotos */}
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
              Fotos (máximo 10)
            </label>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                isDragActive
                  ? 'border-[#C8A96A] bg-[#C8A96A]/10'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <input {...getInputProps()} />
              <p className="text-3xl mb-2">📸</p>
              {uploading ? (
                <p className="text-white/50 text-sm">Subiendo fotos...</p>
              ) : isDragActive ? (
                <p className="text-[#C8A96A] text-sm">Suelta las fotos aquí</p>
              ) : (
                <>
                  <p className="text-white/50 text-sm">Arrastra fotos o haz clic para seleccionar</p>
                  <p className="text-white/20 text-xs mt-1">JPG, PNG — hasta 10 fotos</p>
                </>
              )}
            </div>

            {fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {fotos.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setFotos(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video */}
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
              Video (opcional · máximo 1)
            </label>

            {videoUrl ? (
              <div className="space-y-2">
                <video src={videoUrl} controls playsInline className="w-full rounded-xl border border-white/10" />
                <button
                  type="button"
                  onClick={() => setVideoUrl(null)}
                  className="text-xs text-red-400/60 hover:text-red-400 transition"
                >
                  ✕ Eliminar video
                </button>
              </div>
            ) : (
              <label className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center ${
                uploadingVideo ? 'border-[#C8A96A]/50 bg-[#C8A96A]/5' : 'border-white/10 hover:border-white/30'
              }`}>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
                  disabled={uploadingVideo}
                />
                <p className="text-3xl mb-2">🎞️</p>
                {uploadingVideo ? (
                  <p className="text-[#C8A96A] text-sm">Subiendo video...</p>
                ) : (
                  <>
                    <p className="text-white/50 text-sm">Haz clic para seleccionar un video</p>
                    <p className="text-white/20 text-xs mt-1">MP4, MOV — máximo 1 video</p>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || uploading || uploadingVideo}
            className="w-full bg-[#C8A96A] hover:bg-[#b8945a] text-[#0D1F0F] font-semibold py-4 rounded-xl transition disabled:opacity-50 text-sm uppercase tracking-wider"
          >
            {saving ? 'Guardando...' : 'Crear Recuerdo Digital →'}
          </button>

          <p className="text-center text-white/20 text-xs">
            Al enviar, el perfil quedará disponible en el medallón QR
          </p>
        </form>
      </div>
    </div>
  )
}
