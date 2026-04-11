import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Logs de diagnóstico para el servidor
console.log('🔍 Supabase Admin Client Initialization:');
console.log('URL detectada:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NO ENCONTRADA');
console.log('Service Role Key detectada:', supabaseServiceKey ?
  (supabaseServiceKey === 'placeholder_key' ? '❌ PLACEHOLDER' : `${supabaseServiceKey.substring(0, 20)}...`)
  : 'NO ENCONTRADA');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Variables de Supabase no encontradas en el entorno del servidor');
  throw new Error('Missing Supabase server environment variables');
}

if (supabaseServiceKey === 'placeholder_key') {
  console.error('❌ ERROR: Service Role Key está en PLACEHOLDER - No funcional');
  throw new Error('Invalid Supabase Service Role Key (placeholder detected)');
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
