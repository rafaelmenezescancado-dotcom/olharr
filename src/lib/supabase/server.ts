'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (e) {
            // setAll pode falhar em Server Components (read-only cookies).
            // Isso é esperado e seguro — só loga em dev para debug.
            if (process.env.NODE_ENV !== 'production') {
              console.warn('[Supabase] Cookie setAll falhou (esperado em Server Components):', e instanceof Error ? e.message : e)
            }
          }
        },
      },
    }
  )
}
