# PIKI Customer

Aplicación web/PWA para clientes de PIKI Delivery. La experiencia sigue la referencia visual proporcionada: amarillo PIKI, negro carbón, navegación móvil, categorías, restaurantes, cesta, dirección, checkout y seguimiento.

## Estado funcional

La interfaz ya incluye catálogo, búsqueda, categorías, detalle de restaurante, cesta de un solo comercio, dirección de entrega, autenticación, seguimiento de pedido y una salida a Stripe desde el backend existente del proyecto. El backend central de PIKI ya dispone del contrato equivalente para migrar progresivamente el checkout.

## Migración al API central

La migración recomendada es activar el flujo central únicamente en staging después de configurar `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` de prueba en la API de Render. El cliente debe seguir este orden:

1. Crear el pedido en `POST https://api.pikidelivery.com/api/v1/orders`.
2. Solicitar la sesión en `POST https://api.pikidelivery.com/api/v1/payments/checkout`.
3. Redirigir al cliente a la URL de Stripe.
4. Consultar el pedido después del retorno.
5. Mostrar `paid` solo cuando el webhook verificado haya actualizado el pedido.

Hasta completar la prueba de aceptación, el flujo anterior no debe sustituirse en producción. No se almacenan claves secretas en el frontend.

## Desarrollo

```bash
pnpm install
pnpm dev
```

## Validación

```bash
pnpm check
pnpm build
```

El aviso de chunks grandes de Vite es de optimización y no impide la compilación. Para producción conviene dividir por rutas las pantallas de cuenta, seguimiento y checkout.

## Publicación

La aplicación está preparada para Vercel y para instalación como PWA en Android. El dominio público previsto es `app.pikidelivery.com`. Las previews deben permanecer protegidas; únicamente el dominio público de producción debe añadirse a las excepciones de Deployment Protection.
