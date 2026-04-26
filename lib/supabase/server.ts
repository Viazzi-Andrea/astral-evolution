import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'placeholder_key') {
  throw new Error('Missing or invalid Supabase server environment variables');
}

export const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function createClient() {
  return supabaseAdmin;
}
