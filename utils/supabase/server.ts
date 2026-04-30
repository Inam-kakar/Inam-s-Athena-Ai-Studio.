import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // In Next.js 15, cookies() must be awaited
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        // Explicitly type the cookiesToSet parameter
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The setAll method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}