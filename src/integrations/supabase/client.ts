import { createClient } from "@supabase/supabase-js";

// Publishable (anon) values — safe to expose in client code.
// RLS policies on your Supabase project are what actually protect data.
const SUPABASE_URL = "https://udneyhtigimwiumqkbbn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkbmV5aHRpZ2ltd2l1bXFrYmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNTQ0NjAsImV4cCI6MjEwMDczMDQ2MH0.v5Hr8uJjpO3_2i0BgZWpR9yQfIWFNRi4-beDFjMGGjM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "logilink-auth",
  },
});
