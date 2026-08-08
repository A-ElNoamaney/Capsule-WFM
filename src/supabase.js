import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://xugrixologlduhnixxik.supabase.co"
const supabaseKey = "sb_publishable_4eLhWvZq7pLLuYOgj1dI6A_EMxjAxr9"

export const supabase = createClient(supabaseUrl, supabaseKey)