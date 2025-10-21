import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  const missing = []
  if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL")
  if (!supabaseServiceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY")

  throw new Error(
    `Missing required Supabase environment variables: ${missing.join(", ")}. ` +
      `Please add them to your .env.local file and restart the dev server.`,
  )
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "public",
  },
})

export default supabase
