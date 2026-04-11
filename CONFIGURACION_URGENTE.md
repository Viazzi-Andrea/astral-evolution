# 🚨 CONFIGURACIÓN URGENTE: Service Role Key Incorrecta

## Problema Detectado

El archivo `.env` tiene una **SUPABASE_SERVICE_ROLE_KEY INCORRECTA**. La clave pertenece a un proyecto diferente de Supabase.

### Detalles del Error:

- **SUPABASE_URL**: `https://ugbqseagcncbrwapmorr.supabase.co` (proyecto: `ugbqseagcncbrwapmorr`)
- **SERVICE_ROLE_KEY actual**: Pertenece al proyecto `yrgtcrkkbwpmmwrtrlio` ❌ **INCORRECTO**
- **SERVICE_ROLE_KEY necesaria**: Debe pertenecer al proyecto `ugbqseagcncbrwapmorr` ✅

### Síntomas:
- Error al crear usuario de prueba en `/test-report`
- "Error al crear usuario de prueba" en la API
- No se pueden generar reportes de prueba

---

## ✅ SOLUCIÓN INMEDIATA

### Paso 1: Obtener la Service Role Key Correcta

Tu proyecto actual es: **ugbqseagcncbrwapmorr**

1. **Ve a tu dashboard de Supabase**:
   https://supabase.com/dashboard/project/ugbqseagcncbrwapmorr/settings/api

2. **Copia la Service Role Key**:
   - Busca la sección "Project API keys"
   - Encuentra la clave llamada **"service_role"** (clave secreta)
   - Haz clic en "Reveal" para mostrarla
   - Copia esa clave completa

3. La clave debe verse así:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnYnFzZWFnY25jYnJ3YXBtb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEwMTE0MiwiZXhwIjoyMDkwNjc3MTQyfQ.XXXXX
   ```
   (El `ref` debe ser `ugbqseagcncbrwapmorr`)

### Paso 2: Actualizar Local (.env)

Abre tu archivo `.env` y reemplaza:

```env
# ANTES (INCORRECTA):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZ3RjcmtrYndwbW13cnRybGlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEwNzgzMiwiZXhwIjoyMDkwNjgzODMyfQ.nmIx5whAtOWvdprVlRjypWZrOMo-lw3dV3WKrpwkrWA

# DESPUÉS (CORRECTA - pega la que copiaste):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnYnFzZWFnY25jYnJ3YXBtb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSI...TU_CLAVE_AQUI
```

### Paso 3: Actualizar en Netlify

⚠️ **MUY IMPORTANTE**: También debes actualizar en Netlify para que funcione en producción.

1. Ve a tu dashboard de Netlify
2. Selecciona tu sitio
3. Ve a **Site settings** → **Environment variables**
4. Busca `SUPABASE_SERVICE_ROLE_KEY`
5. Haz clic en **Edit** (ícono de lápiz)
6. Pega la nueva clave correcta
7. Guarda los cambios
8. Haz un nuevo deploy (o espera el próximo automático)

### Paso 4: Reiniciar el Servidor Local

```bash
# Detén el servidor (Ctrl+C)
# Inicia el servidor nuevamente (se iniciará automáticamente)
```

---

## 🧪 Verificación

Después de actualizar la clave, prueba lo siguiente:

1. Ve a `/test-report` en tu navegador
2. Completa los datos de nacimiento:
   - Nombre: Tu Nombre
   - Fecha: Cualquier fecha
   - Hora: Cualquier hora
   - Ciudad: Tu ciudad
   - País: Tu país
3. Haz clic en **"Generar Reporte de Prueba"**
4. Si ves el mensaje **"Reporte generándose en segundo plano"**, ¡la clave está correcta! ✅
5. Ve a `/admin-test` para ver el progreso del reporte

### Logs Esperados

Si todo está correcto, verás en los logs del servidor:

```
✅ Service Role Key detectada: eyJhbGciOiJIUzI1NiIs...
✅ Report [id] generated successfully
```

---

## 🎯 ¿Por qué es importante?

Sin la service role key correcta:
- ❌ No se pueden crear usuarios de prueba
- ❌ No se pueden generar reportes de prueba
- ❌ La API `/api/test-generate-report` fallará
- ❌ No podrás probar la integración con Gemini
- ❌ El código TEST100 (100% descuento) no funcionará

Con la clave correcta:
- ✅ Podrás usar `/test-report` para generar reportes
- ✅ Podrás verificar la integración con Gemini AI
- ✅ Podrás usar el código TEST100 mientras Paddle está en revisión
- ✅ Todo el flujo de prueba funcionará perfectamente

---

## 🔒 Seguridad

⚠️ **IMPORTANTE**: La Service Role Key es muy poderosa y puede hacer CUALQUIER operación en tu base de datos.

- ❌ NUNCA la compartas públicamente
- ❌ NUNCA la subas a GitHub (ya está en .gitignore)
- ❌ NUNCA la uses en el frontend
- ✅ Solo úsala en el backend (API routes)
- ✅ Mantenla en variables de entorno

---

## 📞 ¿Necesitas Ayuda?

Si después de seguir estos pasos sigues teniendo problemas:

1. Verifica que la URL de Supabase sea: `https://ugbqseagcncbrwapmorr.supabase.co`
2. Verifica que hayas copiado la **service_role** key, NO la anon key
3. Verifica que hayas reiniciado el servidor después de cambiar el .env
4. Chequea los logs del servidor para ver mensajes de error específicos
