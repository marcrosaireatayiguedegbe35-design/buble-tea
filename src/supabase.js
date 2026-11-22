import { createClient } from "@supabase/supabase-js";

// Clé PUBLIQUE uniquement (sb_publishable_...). Jamais la clé secrète ici.
export const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
