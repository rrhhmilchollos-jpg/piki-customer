# PIKI Partners para SUNMI V2 WiFi

## Producto que se entrega al partner

El partner recibe un SUNMI V2 WiFi con la PWA de PIKI Partners instalada en modo independiente. La pantalla inicial es `/partners`; no se presenta el marketplace de clientes ni las vistas de riders. La cuenta del establecimiento queda vinculada a ese dispositivo mediante el login del partner.

El SUNMI V2 PRO consultado oficialmente dispone de pantalla capacitiva de 5,99 pulgadas, WiFi dual-band, Android/SUNMI OS, batería y una impresora térmica integrada de 58 mm. Por eso la interfaz usa botones grandes, contraste alto, pocos pasos y actualización periódica de pedidos.

## Flujo de puesta en marcha

1. Conectar el SUNMI a la WiFi del establecimiento y cargarlo.
2. Abrir Chrome o el navegador incluido y entrar en `https://pikidelivery.com/partners`.
3. Iniciar sesión con la cuenta del partner.
4. Pulsar `Instalar` en la tarjeta `Instala PIKI Partners`.
5. Si el navegador no muestra el diálogo, usar menú `⋮ → Instalar aplicación` o `Añadir a pantalla de inicio`.
6. Abrir el icono PIKI Partners desde la pantalla del SUNMI.
7. Pulsar `Activar sonido` una vez.
8. Crear o seleccionar el establecimiento, confirmar horario y tiempo de preparación.
9. Probar un pedido de prueba antes de entregar el equipo.

## Operativa diaria

La bandeja de cocina consulta pedidos cada cinco segundos. Cada pedido nuevo entra con alerta visual y, después de activar el audio, con una señal sonora repetida hasta aceptar o silenciar. Al aceptar se almacena el tiempo de preparación; al terminar se pulsa `Marcar listo` para que el pedido pase a la siguiente fase logística.

La carta se administra desde la misma pantalla. `Pausar producto` retira temporalmente un plato de la oferta sin borrarlo. `Reactivar producto` vuelve a publicarlo. El botón de estado del establecimiento permite pausar el local completo cuando la cocina está saturada o cerrada.

La cabecera muestra `WiFi conectado` o `Sin conexión`, junto con la hora de la última sincronización. Si se corta la red, la pantalla no se vacía: deja visible la última bandeja y reintenta al recuperar conexión. No se deben aceptar pedidos nuevos sin conexión si no se ha confirmado la actualización con el servidor.

## Impresión SUNMI

La PWA queda preparada para el flujo digital de pedidos. La impresión directa en la impresora térmica integrada no se declara como resuelta únicamente con navegador: requiere probar el SDK oficial SUNMI o un wrapper Android/bridge nativo en el modelo exacto entregado. Esta separación evita vender una capacidad que no está garantizada por una PWA estándar.

La integración nativa recomendada es una segunda fase: wrapper Android mínimo, canal JavaScript seguro (`printTicket`), cola local de impresión, reintentos e identificación del dispositivo. Mientras tanto, el pedido se visualiza en pantalla y puede utilizar la impresión del navegador si el dispositivo la expone.

## Checklist antes de entregar

| Control | Criterio |
|---|---|
| WiFi | El dispositivo navega y el endpoint de pedidos responde |
| Login | La cuenta solo ve sus propios locales |
| Audio | `Activar sonido` produce un tono audible |
| Pedido | Un pedido de prueba aparece en menos de 10 segundos |
| Aceptación | La alarma se detiene y el estado pasa a `accepted` |
| Preparación | `Marcar listo` cambia el pedido a `ready` |
| Pausa | Un producto pausado deja de ofrecerse y puede reactivarse |
| Offline | Al cortar WiFi se muestra `Sin conexión` y no desaparece la bandeja |
| Instalación | El icono PIKI Partners abre `/partners` en modo standalone |
| Batería | Se entrega cargado y con cargador/base |

## Fuentes

- SUNMI V2 PRO: https://www.sunmi.com/en/v2-pro/
- Manifest de la PWA: `client/public/manifest-partners.json`
- Migración y guía operativa anterior: `infra/postgis/README.md`
