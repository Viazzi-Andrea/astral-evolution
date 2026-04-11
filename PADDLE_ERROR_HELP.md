# Error de Paddle: Invalid API Key

## Problema
El error "Invalid API key" indica que Paddle no está aceptando la API key configurada.

## Posibles Causas

### 1. API Key Incorrecta o Expirada
- La API key en el `.env` puede estar incorrecta
- La key puede haber sido regenerada en el dashboard de Paddle
- La key puede ser de sandbox cuando debería ser de producción (o viceversa)

### 2. Formato Incorrecto
- La API key debe empezar con `pdl_live_` para producción
- No debe tener espacios antes o después
- No debe tener comillas adicionales

### 3. Permisos Insuficientes
- La API key necesita permisos para crear transacciones
- Verifica en Paddle Dashboard > Developer Tools > Authentication

## Solución

### Paso 1: Verificar la API Key en Paddle
1. Ve a https://vendors.paddle.com/ e inicia sesión
2. Navega a **Developer Tools > Authentication**
3. Verifica que la API key exista y esté activa
4. Si es necesario, genera una nueva API key

### Paso 2: Actualizar el `.env`
```bash
PADDLE_API_KEY=pdl_live_apikey_XXXXXXXXXXXXXXXXXXXXXXXX
```

### Paso 3: Verificar el Entorno
- Si estás usando el entorno sandbox, la API key debe empezar con `pdl_test_`
- Si estás en producción, debe empezar con `pdl_live_`
- El `NEXT_PUBLIC_PADDLE_ENVIRONMENT` debe coincidir (sandbox o production)

### Paso 4: Verificar Price IDs
- Los Price IDs deben corresponder al mismo entorno que la API key
- Un Price ID de sandbox no funcionará con una API key de producción

## API Key Actual en .env
```
PADDLE_API_KEY=pdl_live_apikey_01kn6qx1310s1k53mcw5sfm2gk_ynpmhPAFpcZJXBE41FMC3q_AAk
NEXT_PUBLIC_PADDLE_ENVIRONMENT=production
```

## Recomendaciones
1. Intenta crear una nueva API key en Paddle Dashboard
2. Asegúrate de que los Price IDs sean válidos y del entorno correcto
3. Verifica que tu cuenta de Paddle esté en buen estado (sin problemas de pago)
4. Contacta al soporte de Paddle si el problema persiste

## Para Depurar
Puedes verificar la respuesta completa del error en la consola del navegador al intentar hacer checkout.
