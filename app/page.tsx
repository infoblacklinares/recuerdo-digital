export default function Home() {
  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <div className="w-20 h-20 mx-auto rounded-full bg-white/5 border border-[#C8A96A]/20 flex items-center justify-center text-4xl mb-8">
          🕊️
        </div>
        <h1 className="text-white font-serif text-3xl mb-3">Recuerdo Digital</h1>
        <p className="text-white/40 text-sm leading-relaxed mb-8">
          Un espacio para honrar la memoria de quienes ya no están.<br />
          Escanea el código QR del medallón para ver el perfil memorial.
        </p>
        <div className="w-12 h-px bg-[#C8A96A]/30 mx-auto mb-8" />
        <p className="text-white/20 text-xs">
          🌿 Florería Angélica · Sector Agua Fría N°15, Linares
        </p>
      </div>
    </div>
  )
}
