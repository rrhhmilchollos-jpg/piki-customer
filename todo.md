# Manduca — seguimiento de producto

## Entregado en esta iteración

- [x] Checkout de Stripe en sandbox con importes calculados en servidor.
- [x] Endpoint de webhook firmado (`/api/stripe/webhook`) e idempotencia de eventos.
- [x] Persistencia de estados de pago, sesiones Stripe, perfiles de rider y auditoría mínima.
- [x] App instalable independiente Manduca Riders en la ruta `/riders`.
- [x] Flujo operativo conectado: pedido pagado → partner marca listo → rider acepta → recogida → entrega.
- [x] Interfaz de Riders con disponibilidad, ofertas, pedidos activos, mapa y refresco de datos.
- [x] Build de producción, chequeo TypeScript y seis pruebas unitarias correctas.
- [x] Apertura de Stripe Checkout validada en sandbox, sin capturar ningún pago real.

## Prerrequisitos externos de la salida live

| Área | Acción del titular de Manduca | Estado |
|---|---|---|
| Stripe live | Completar KYC, entidad legal, NIF/VAT, cuenta bancaria y cambio a claves live. | Requiere acceso de propietario. |
| Webhook live | Registrar `https://<dominio-produccion>/api/stripe/webhook` en Stripe Workbench y proporcionar el secreto live `whsec_...`. | Requiere acceso de propietario. |
| Bizum | Solicitar y habilitar la capacidad Bizum en Stripe tras completar requisitos españoles. | Requiere verificación de Stripe. |
| Facturación | Elegir proveedor/asesoría para facturación certificada y encaje Veri*Factu antes de emitir facturas automáticas. | Decisión fiscal y contractual. |
| Tiempo real | Elegir hosting persistente para WebSockets/SSE o mantener la actualización periódica actual. | Requiere decisión de coste. |
| Seguridad rider | Aportar política operativa para identidad, documentación, PIN/QR de entrega, SOS y zonas. | Decisión de negocio. |

## Limitación de publicación

El checkpoint `8bcbcd58` contiene la versión validada. El dominio público disponible conserva una publicación anterior porque en esta sesión no hay una herramienta de publicación WebDev expuesta; hay que publicar este checkpoint desde la interfaz WebDev del proyecto o habilitar el mecanismo de publicación correspondiente.

