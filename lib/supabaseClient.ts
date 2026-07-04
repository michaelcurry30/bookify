import { createClient } from "@supabase/supabase-js";

// Shared browser-side Supabase client (matches the one used in app/login/page.tsx).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
