import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-4">
      <div className="text-center">
        <p className="text-5xl mb-4">🍂</p>
        <h1 className="text-white text-2xl font-serif mb-2">Memorial no encontrado</h1>
        <p className="text-white/40 text-sm mb-6">
          Este memorial no existe o aún no está disponible.
        </p>
        <Link href="/" className="text-[#C8A96A] text-sm hover:underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
