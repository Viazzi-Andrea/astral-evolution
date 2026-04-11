import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Logs de diagnóstico
console.log('🔍 Supabase Client Initialization:');
console.log('URL detectada:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NO ENCONTRADA');
console.log('Anon Key detectada:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NO ENCONTRADA');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Variables de Supabase no encontradas en el entorno');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
