# Configuración Requerida - Claves API Faltantes

## Error Actual: "Invalid API key"

El sistema no puede procesar pagos porque faltan las claves API reales en el archivo `.env`.

---

## 1. Supabase Service Role Key (CRÍTICO)

### ¿Dónde obtenerla?

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Click en **Settings** (⚙️) en el menú izquierdo
3. Click en **API**
4. En la sección **Project API keys**, busca **service_role key**
5. Click en **Reveal** para ver la clave completa
6. Copia la clave que empieza con `eyJ...`

### ¿Dónde agregarla?

Edita el archivo `.env` en la raíz del proyecto y reemplaza esta línea:

```
SUPABASE_SERVICE_ROLE_KEY=placeholder_key
```

Por:

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...tu_clave_completa_aquí
```

⚠️ **IMPORTANTE**: Esta clave es PRIVADA y tiene permisos de administrador. Nunca la compartas ni la subas a GitHub.

---

## 2. Paddle API Key (CRÍTICO)

### ¿Dónde obtenerla?

1. Inicia sesión en [Paddle Dashboard](https://vendors.paddle.com/)
2. Ve a **Developer Tools** → **Authentication**
3. Click en **Create API Key**
4. Dale un nombre descriptivo (ej: "Producción Astrológica")
5. Copia la clave generada (empieza con algo como `live_` o `test_`)

### ¿Dónde agregarla?

Edita el archivo `.env` y reemplaza:

```
PADDLE_API_KEY=your_paddle_api_key_here
```

Por:

```
PADDLE_API_KEY=test_xxxxxxxxxxxxx
```

### Paddle Webhook Secret (OPCIONAL por ahora)

Para que los webhooks funcionen (confirmación automática de pagos), también necesitas:

1. En Paddle Dashboard → **Developer Tools** → **Notifications**
2. Agrega tu URL de webhook: `https://tu-dominio.com/api/webhooks/paddle`
3. Copia el **Webhook Secret**
4. Agrégalo al `.env`:

```
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxxxxxxxxxxxx
```

---

## 3. Reiniciar el Servidor

Después de actualizar el `.env`:

```bash
# Detén el servidor si está corriendo (Ctrl+C)
# Luego reinicia:
npm run dev
```

Las variables de entorno solo se leen al iniciar el servidor, por eso es necesario reiniciar.

---

## Verificación

Una vez configuradas las claves correctas, el flujo de pago debería funcionar:

1. ✅ Usuario rellena el formulario
2. ✅ Se crea/busca el usuario en la base de datos
3. ✅ Se guardan los datos de nacimiento
4. ✅ Se crea la transacción
5. ✅ **Se genera la URL de pago de Paddle** ← aquí falla actualmente
6. ✅ Se redirige al checkout de Paddle

---

## Soporte Adicional

Si después de configurar las claves sigues teniendo problemas:

1. Verifica que las claves no tengan espacios al inicio o final
2. Asegúrate de estar usando el ambiente correcto (sandbox vs production) en Paddle
3. Revisa los logs del servidor para ver el error exacto de Paddle
4. Verifica que los Price IDs en el `.env` correspondan a productos reales en tu cuenta de Paddle

---

## Estado Actual del `.env`

```
✅ NEXT_PUBLIC_SUPABASE_URL - Configurada
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY - Configurada
❌ SUPABASE_SERVICE_ROLE_KEY - Necesita clave real
✅ NEXT_PUBLIC_APP_URL - Configurada
✅ GEMINI_API_KEY - Configurada
❌ PADDLE_API_KEY - Necesita clave real
❌ PADDLE_WEBHOOK_SECRET - Necesita clave real (opcional)
✅ NEXT_PUBLIC_PADDLE_ENVIRONMENT - Configurada (sandbox)
✅ PADDLE_PRICE_ID_* - Configurados
```
