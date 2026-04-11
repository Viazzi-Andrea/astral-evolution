# Configuración Actualizada - Proyecto Supabase Correcto

## Proyecto Supabase Activo

**Proyecto ID**: `yrgtcrkkbwpmmwrtrlio`
**URL**: `https://yrgtcrkkbwpmmwrtrlio.supabase.co`

## Variables de Entorno Actualizadas

El archivo `.env` ha sido actualizado con las credenciales correctas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yrgtcrkkbwpmmwrtrlio.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZ3RjcmtrYndwbW13cnRybGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMDc4MzIsImV4cCI6MjA5MDY4MzgzMn0.B2I3hWqDNRYIq7_eUzaB2r_FShFn1k_eGwSSXG4hFGw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZ3RjcmtrYndwbW13cnRybGlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEwNzgzMiwiZXhwIjoyMDkwNjgzODMyfQ.nmIx5whAtOWvdprVlRjypWZrOMo-lw3dV3WKrpwkrWA
```

## Actualizaciones Necesarias en Netlify

Para que el deploy en producción funcione correctamente, debes actualizar las siguientes variables de entorno en Netlify:

1. Ve a tu dashboard de Netlify: https://app.netlify.com
2. Selecciona tu sitio
3. Ve a **Site settings** → **Environment variables**
4. Actualiza las siguientes variables:

| Variable | Nuevo Valor |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://yrgtcrkkbwpmmwrtrlio.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZ3RjcmtrYndwbW13cnRybGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMDc4MzIsImV4cCI6MjA5MDY4MzgzMn0.B2I3hWqDNRYIq7_eUzaB2r_FShFn1k_eGwSSXG4hFGw` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZ3RjcmtrYndwbW13cnRybGlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEwNzgzMiwiZXhwIjoyMDkwNjgzODMyfQ.nmIx5whAtOWvdprVlRjypWZrOMo-lw3dV3WKrpwkrWA` |

5. Guarda los cambios
6. Haz un nuevo deploy (o espera el próximo automático)

## Estado del Proyecto

### Base de Datos

El proyecto **yrgtcrkkbwpmmwrtrlio** necesita tener las siguientes tablas y migraciones aplicadas:

- `users` - Usuarios de la plataforma
- `products` - Productos astrológicos (Lectura Esencial, Consulta Evolutiva, Especial Parejas)
- `birth_data` - Datos de nacimiento de los usuarios
- `transactions` - Transacciones de Paddle
- `reports` - Reportes astrológicos generados
- `discount_codes` - Códigos de descuento (incluido TEST100)

### Migraciones Pendientes

Si la base de datos **yrgtcrkkbwpmmwrtrlio** está vacía o no tiene las tablas necesarias, necesitarás aplicar las siguientes migraciones (en orden):

1. `20260402044910_create_astrological_platform_schema.sql` - Esquema inicial
2. `20260402063018_add_paddle_support.sql` - Soporte para Paddle
3. `20260402080328_add_future_product_types.sql` - Tipos de productos futuros
4. `20260402081550_add_regional_paddle_prices.sql` - Precios regionales
5. `20260402083048_fix_rls_policies_for_anonymous_checkout.sql` - Políticas RLS para checkout anónimo
6. `20260402090944_fix_products_anon_access.sql` - Acceso anónimo a productos
7. `20260402103249_create_birth_profiles.sql` - Perfiles de nacimiento
8. `20260402233833_add_discount_codes.sql` - Códigos de descuento
9. `20260402234858_add_service_role_policies_for_reports.sql` - Políticas de service role para reportes

## Verificación del Sistema

### 1. Verificar Conexión a Supabase

Puedes verificar que la conexión funciona correctamente revisando los logs del build:

```
✅ URL detectada: https://yrgtcrkkbwpmmwrtrlio.s...
✅ Service Role Key detectada: eyJhbGciOiJIUzI1NiIs...
```

### 2. Probar la Página de Prueba

Una vez que la base de datos esté configurada:

1. Ve a `/test-report`
2. Completa los datos de nacimiento
3. Haz clic en "Generar Reporte de Prueba"
4. Verifica que se crea el reporte sin errores

### 3. Verificar en el Admin Panel

1. Ve a `/admin-test`
2. Deberías ver los reportes generados
3. Verifica que el estado cambie de "generating" a "completed"

## Próximos Pasos

1. **Aplicar migraciones** en el proyecto yrgtcrkkbwpmmwrtrlio
2. **Insertar productos** en la tabla `products`
3. **Insertar código de descuento TEST100** en la tabla `discount_codes`
4. **Actualizar variables en Netlify** según la tabla anterior
5. **Hacer un deploy** y probar en producción
6. **Probar el flujo completo** de checkout y generación de reportes

## Información de Contacto del Proyecto

- **Dashboard de Supabase**: https://supabase.com/dashboard/project/yrgtcrkkbwpmmwrtrlio
- **URL de la API**: https://yrgtcrkkbwpmmwrtrlio.supabase.co
- **Panel de Base de Datos**: https://supabase.com/dashboard/project/yrgtcrkkbwpmmwrtrlio/editor

## Notas de Seguridad

- La `SUPABASE_SERVICE_ROLE_KEY` es muy poderosa y puede hacer CUALQUIER operación en tu base de datos
- NUNCA la compartas públicamente ni la subas a GitHub
- Solo úsala en el backend (API routes)
- Las políticas RLS están configuradas para proteger los datos de los usuarios
