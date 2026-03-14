// lib/supabaseClient.js
// Initializes the Supabase client using environment variables.
// Both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️  Supabase env vars missing. Copy .env.example → .env and fill in your credentials.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
