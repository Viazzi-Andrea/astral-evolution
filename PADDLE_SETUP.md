# Configuración de Paddle para Astral Evolution

Este documento explica cómo configurar Paddle como proveedor de pagos para tu aplicación de astrología.

## ¿Por qué Paddle?

Paddle fue elegido porque opera en Uruguay y otros países de América Latina donde Stripe no está disponible. Paddle maneja impuestos, facturación y compliance automáticamente.

## Pasos de Configuración

### 1. Crear una Cuenta en Paddle

1. Ve a [https://paddle.com](https://paddle.com) y crea una cuenta
2. Completa el proceso de verificación de tu negocio
3. Configura tu información fiscal y bancaria

### 2. Obtener las Credenciales de API

1. En el dashboard de Paddle, ve a **Developer Tools** → **Authentication**
2. Crea un nuevo API key con los siguientes permisos:
   - `transaction:read`
   - `transaction:write`
   - `price:read`
   - `product:read`
3. Copia el API key y guárdalo de forma segura

### 3. Configurar Productos y Precios en Paddle

Necesitas crear 3 productos en Paddle, uno para cada servicio:

#### Producto 1: Lectura Esencial
- Nombre: "Lectura Esencial"
- Precio base: $15 USD
- Tipo: One-time payment
- Copia el **Price ID** generado

#### Producto 2: Consulta Evolutiva
- Nombre: "Consulta Evolutiva"
- Precio base: $38 USD
- Tipo: One-time payment
- Copia el **Price ID** generado

#### Producto 3: Especial Parejas
- Nombre: "Especial Parejas"
- Precio base: $55 USD
- Tipo: One-time payment
- Copia el **Price ID** generado

### 4. Configurar Variables de Entorno

Edita tu archivo `.env` y agrega las siguientes variables:

```bash
# Paddle Configuration
PADDLE_API_KEY=tu_api_key_de_paddle
PADDLE_WEBHOOK_SECRET=tu_webhook_secret_de_paddle
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox  # Cambia a 'production' cuando estés listo
```

### 5. Actualizar los Price IDs en la Base de Datos

Ejecuta las siguientes consultas SQL en Supabase para asociar los Price IDs de Paddle con tus productos:

```sql
-- Lectura Esencial
UPDATE products
SET paddle_price_id = 'pri_01xxxxxxxxxxxxxxxxxxxxxx'
WHERE slug = 'lectura-esencial';

-- Consulta Evolutiva
UPDATE products
SET paddle_price_id = 'pri_02xxxxxxxxxxxxxxxxxxxxxx'
WHERE slug = 'consulta-evolutiva';

-- Especial Parejas
UPDATE products
SET paddle_price_id = 'pri_03xxxxxxxxxxxxxxxxxxxxxx'
WHERE slug = 'especial-parejas';
```

Reemplaza los valores `pri_01xxx...` con los Price IDs reales que copiaste de Paddle.

### 6. Configurar el Webhook en Paddle

1. En el dashboard de Paddle, ve a **Developer Tools** → **Notifications**
2. Haz clic en **Create notification destination**
3. Configura el webhook:
   - **URL**: `https://tu-dominio.com/api/webhooks/paddle`
   - **Events to subscribe**: Selecciona `transaction.completed`
   - **Signature key**: Copia el secret generado y úsalo en la variable `PADDLE_WEBHOOK_SECRET`

### 7. Probar en Modo Sandbox

1. Asegúrate de que `NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox` en tu `.env`
2. Reinicia tu servidor de desarrollo
3. Realiza una compra de prueba usando las tarjetas de prueba de Paddle
4. Verifica que el webhook se procese correctamente y que se genere el reporte

### 8. Ir a Producción

Cuando estés listo para producción:

1. Cambia `NEXT_PUBLIC_PADDLE_ENVIRONMENT=production`
2. Asegúrate de usar el API key de producción de Paddle
3. Actualiza la URL del webhook para apuntar a tu dominio de producción
4. Verifica que todos los productos tengan sus Price IDs de producción

## Flujo de Pago Completo

Así es como funciona el flujo de pago con Paddle:

1. El usuario completa el formulario de datos de nacimiento
2. Se crea un registro en la tabla `transactions` con estado `pending`
3. Se crea una sesión de checkout en Paddle
4. El usuario es redirigido al checkout de Paddle
5. El usuario completa el pago
6. Paddle envía un webhook a `/api/webhooks/paddle`
7. El webhook:
   - Verifica la firma del webhook
   - Actualiza el estado de la transacción a `completed`
   - Genera el reporte astrológico con Gemini
   - Crea el PDF
   - Sube el PDF a Supabase Storage
   - Actualiza la transacción con la URL del reporte
8. Se puede enviar el reporte por email (opcional)

## Solución de Problemas

### Error: "No paddle_price_id found"
- Verifica que hayas actualizado los productos en la base de datos con los Price IDs correctos

### El webhook no se ejecuta
- Verifica que la URL del webhook sea accesible públicamente
- Verifica que el `PADDLE_WEBHOOK_SECRET` sea correcto
- Revisa los logs del webhook en el dashboard de Paddle

### Errores de generación de reporte
- Verifica que `GEMINI_API_KEY` esté configurado correctamente
- Revisa los logs del servidor para ver errores específicos de la API de Gemini

## Soporte

Para más información sobre la API de Paddle, consulta:
- [Documentación de Paddle](https://developer.paddle.com/)
- [Guía de Webhooks](https://developer.paddle.com/webhooks/overview)
