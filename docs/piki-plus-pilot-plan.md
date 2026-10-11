# PIKI Plus — piloto local de Xàtiva

## Alcance aprobado

Implementar un **piloto no comercial y sin cobro** de PIKI Plus en la aplicación de clientes. El usuario puede solicitar acceso prioritario desde su cuenta; la solicitud queda trazada como ticket de soporte y no modifica pagos, tarifas, descuentos ni derechos automáticos de un pedido.

El piloto comunica solo beneficios operativos que pueden habilitarse tras revisión manual:

- acceso prioritario al programa de prueba local;
- comunicación anticipada de comercios y campañas de la zona;
- atención prioritaria del equipo de Soporte PIKI cuando el programa esté activo.

No se mostrarán precios, pruebas de pago, ahorro garantizado, envío gratuito ni ventajas que la API no calcula todavía. Una futura membresía de pago requerirá decidir precio, condiciones, fiscalidad, política de cancelación y la integración de cobro correspondiente.

## Soporte operativo

El mismo punto de contacto se mostrará de forma visible y accionable en Cliente, Partner, Rider, Fleet y Administración:

- **Nombre:** Soporte PIKI
- **Teléfono:** `960 500 685`
- **Acción:** enlace `tel:+34960500685`
- **Contexto Partner:** incidencias de preparación y reparto.

## Diseño

El módulo Plus usa la identidad PIKI existente: amarillo cálido para la propuesta de valor, negro para la acción principal y tarjetas blancas para explicar condiciones sin crear sensación de suscripción ya contratada. La interfaz evita el patrón de una promesa vaga de «próximamente»: presenta una acción concreta y el alcance actual del piloto.

## Estructura

- `client/src/components/PikiPlusPilot.tsx`: tarjeta del piloto y solicitud autenticada mediante el soporte existente.
- `client/src/pages/Home.tsx`: acceso desde navegación y una sección visible en inicio.
- Cinco superficies PIKI: enlaces accesibles al teléfono de soporte, sin datos duplicados de incidencias.
