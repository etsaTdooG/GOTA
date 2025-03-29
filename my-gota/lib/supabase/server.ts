// Re-export the client version as a workaround for build issues
import { createServerClient } from '@supabase/ssr'
import { CookieOptions } from '@supabase/ssr'

interface Cookie {
  name: string;
  value: string;
  options?: CookieOptions;
}

interface CookieStore {
  getAll?: () => Cookie[];
  set?: (name: string, value: string, options?: CookieOptions) => void;
}

// This creates a basic client that doesn't need cookies
// Used for database access in API routes and non-authenticated pages
export async function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}

// Export a separate function that takes cookieStore explicitly
// This can be used from app directory components
export async function createServerComponentClient(cookieStore: CookieStore) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          return cookieStore?.getAll ? cookieStore.getAll() : []
        },
        setAll: (cookiesToSet: Cookie[]) => {
          try {
            if (cookieStore?.set) {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set!(name, value, options)
              })
            }
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
} 