// Script de diagnóstico para verificar el estado de Paddle y Supabase
require('dotenv').config();

console.log('\n=================================================');
console.log('🔍 DIAGNÓSTICO DE CONFIGURACIÓN');
console.log('=================================================\n');

console.log('📍 SUPABASE CONFIGURATION:');
console.log('----------------------------');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl || '❌ NO CONFIGURADA');
console.log('Anon Key:', supabaseAnon ? `${supabaseAnon.substring(0, 30)}...` : '❌ NO CONFIGURADA');
console.log('Service Key:', supabaseService ? `${supabaseService.substring(0, 30)}...` : '❌ NO CONFIGURADA');

// Extraer el proyecto de cada JWT
if (supabaseAnon) {
  try {
    const anonPayload = JSON.parse(Buffer.from(supabaseAnon.split('.')[1], 'base64').toString());
    console.log('  └─ Anon Key Project:', anonPayload.ref);
  } catch (e) {
    console.log('  └─ No se pudo decodificar Anon Key');
  }
}

if (supabaseService) {
  try {
    const servicePayload = JSON.parse(Buffer.from(supabaseService.split('.')[1], 'base64').toString());
    console.log('  └─ Service Key Project:', servicePayload.ref);
  } catch (e) {
    console.log('  └─ No se pudo decodificar Service Key');
  }
}

if (supabaseUrl) {
  const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (urlMatch) {
    console.log('  └─ URL Project:', urlMatch[1]);
  }
}

console.log('\n💳 PADDLE CONFIGURATION:');
console.log('----------------------------');
const paddleKey = process.env.PADDLE_API_KEY;
const paddleWebhook = process.env.PADDLE_WEBHOOK_SECRET;
const paddleEnv = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT;

console.log('API Key:', paddleKey || '❌ NO CONFIGURADA');
if (paddleKey) {
  if (paddleKey === 'your_paddle_api_key_here' || paddleKey.startsWith('your_')) {
    console.log('  ❌ PLACEHOLDER DETECTADO - No es una key real');
  } else if (paddleKey.length < 20) {
    console.log('  ⚠️  Key muy corta - probablemente inválida');
  } else {
    console.log('  ✅ Key parece válida (longitud:', paddleKey.length, 'caracteres)');
  }
}

console.log('Webhook Secret:', paddleWebhook || '❌ NO CONFIGURADO');
if (paddleWebhook && (paddleWebhook === 'your_paddle_webhook_secret_here' || paddleWebhook.startsWith('your_'))) {
  console.log('  ❌ PLACEHOLDER DETECTADO');
}

console.log('Environment:', paddleEnv || '❌ NO CONFIGURADO');

console.log('\n🎯 PRICE IDs CONFIGURADOS:');
console.log('----------------------------');
console.log('Lectura Esencial LATAM:', process.env.PADDLE_PRICE_ID_LECTURA_ESENCIAL_LATAM || '❌');
console.log('Lectura Esencial INTL:', process.env.PADDLE_PRICE_ID_LECTURA_ESENCIAL_INTL || '❌');
console.log('Consulta Evolutiva LATAM:', process.env.PADDLE_PRICE_ID_CONSULTA_EVOLUTIVA_LATAM || '❌');
console.log('Consulta Evolutiva INTL:', process.env.PADDLE_PRICE_ID_CONSULTA_EVOLUTIVA_INTL || '❌');
console.log('Especial Parejas LATAM:', process.env.PADDLE_PRICE_ID_ESPECIAL_PAREJAS_LATAM || '❌');
console.log('Especial Parejas INTL:', process.env.PADDLE_PRICE_ID_ESPECIAL_PAREJAS_INTL || '❌');

console.log('\n⚠️  PROBLEMAS DETECTADOS:');
console.log('----------------------------');
let hasErrors = false;

if (!paddleKey || paddleKey.includes('your_')) {
  console.log('❌ Paddle API Key no configurada o es un placeholder');
  hasErrors = true;
}

if (supabaseUrl && supabaseAnon) {
  try {
    const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    const anonPayload = JSON.parse(Buffer.from(supabaseAnon.split('.')[1], 'base64').toString());
    if (urlMatch && urlMatch[1] !== anonPayload.ref) {
      console.log('❌ MISMATCH: La URL de Supabase no coincide con el proyecto de Anon Key');
      console.log('   URL project:', urlMatch[1]);
      console.log('   Anon project:', anonPayload.ref);
      hasErrors = true;
    }
  } catch (e) {}
}

if (supabaseUrl && supabaseService) {
  try {
    const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    const servicePayload = JSON.parse(Buffer.from(supabaseService.split('.')[1], 'base64').toString());
    if (urlMatch && urlMatch[1] !== servicePayload.ref) {
      console.log('❌ MISMATCH: La URL de Supabase no coincide con el proyecto de Service Key');
      console.log('   URL project:', urlMatch[1]);
      console.log('   Service project:', servicePayload.ref);
      hasErrors = true;
    }
  } catch (e) {}
}

if (!hasErrors) {
  console.log('✅ No se detectaron problemas críticos (excepto Paddle API Key)');
}

console.log('\n=================================================\n');
