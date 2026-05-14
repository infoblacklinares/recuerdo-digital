import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Memorial = {
  id: string
  token: string
  nombre: string | null
  fecha_nacimiento: string | null
  fecha_fallecimiento: string | null
  mensaje: string | null
  fotos: string[]
  video_url: string | null
  cliente_nombre: string | null
  cliente_telefono: string | null
  visitas: number
  activo: boolean
  completado: boolean
  created_at: string
}

export type Condolencia = {
  id: string
  memorial_id: string
  nombre: string
  mensaje: string
  created_at: string
}
