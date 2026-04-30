import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export type Project = {
  id: string
  user_id: string
  name: string
  description: string | null
  status: 'draft' | 'active' | 'archived'
  nodes: any[]
  connections: any[]
  api_keys: Record<string, string>
  settings: Record<string, any>
  created_at: string
  updated_at: string
}
