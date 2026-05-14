-- Tabla principal de memoriales
CREATE TABLE memorials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  nombre TEXT,
  fecha_nacimiento DATE,
  fecha_fallecimiento DATE,
  mensaje TEXT,
  fotos TEXT[] DEFAULT '{}',
  activo BOOLEAN DEFAULT false,
  completado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE memorials ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer memoriales activos (para la página pública)
CREATE POLICY "Ver memoriales activos" ON memorials
  FOR SELECT USING (activo = true);

-- Cualquiera puede actualizar un memorial por token (para que la familia llene el formulario)
CREATE POLICY "Familia puede completar su memorial" ON memorials
  FOR UPDATE USING (true);

-- Storage bucket para fotos
INSERT INTO storage.buckets (id, name, public) VALUES ('memorial-fotos', 'memorial-fotos', true);

-- Política de storage: cualquiera puede subir fotos
CREATE POLICY "Subir fotos memorial" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'memorial-fotos');

-- Política de storage: fotos son públicas
CREATE POLICY "Ver fotos memorial" ON storage.objects
  FOR SELECT USING (bucket_id = 'memorial-fotos');
