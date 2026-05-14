'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function VisitaTracker({ memorialId }: { memorialId: string }) {
  useEffect(() => {
    supabase.rpc('incrementar_visitas', { memorial_id: memorialId }).then(() => {})
  }, [memorialId])
  return null
}
