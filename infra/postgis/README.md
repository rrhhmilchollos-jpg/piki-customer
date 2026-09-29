# PIKI Delivery · PWA partner y geofencing PostGIS

## Estado actual

La PWA existente en `/partners` se mantiene sobre el backend actual MySQL/tRPC. La migración `001_geofencing_xativa.sql` es un **esquema objetivo PostgreSQL/PostGIS aislado**: se puede aplicar en una base PostgreSQL nueva sin cambiar todavía el MVP en producción.

No se ha tocado Stripe.

## Flujo exacto de la PWA ligera para comercios

1. **Entrada**
   - El partner abre `/partners` desde móvil, TPV Android antiguo o navegador.
   - Inicia sesión con rol `partner` o `admin`.
   - El panel conserva una UI compacta y no exige una tablet dedicada.

2. **Activación de sonido**
   - El primer día o tras una restricción del navegador, el empleado pulsa `Activar sonido`.
   - Esto desbloquea `AudioContext`, requisito habitual de iOS/Android para reproducir audio.
   - El botón cambia a `Sonido activado` para que el estado sea visible.

3. **Recepción**
   - La PWA consulta `partner.orders` cada 5 segundos.
   - El backend solo devuelve pedidos de establecimientos pertenecientes a la cuenta partner.
   - Se excluyen pedidos entregados o cancelados.
   - Un pedido nuevo en estado `placed` aparece en la bandeja operativa.

4. **Alerta sonora**
   - Cada pedido nuevo se marca con `BellRing` y `aria-live`.
   - Si el sonido está activado, se reproduce una secuencia de tonos y se repite cada 1,8 segundos.
   - La alerta continúa hasta que el empleado pulsa `Aceptar` o `Silenciar`.
   - Si el navegador bloquea audio, la alerta visual sigue funcionando y basta con pulsar `Activar sonido`.

5. **Aceptación**
   - El empleado pulsa `Aceptar`.
   - El backend valida que el pedido pertenece al local y que sigue en `placed`/`accepted`.
   - Cambia el estado a `accepted`.
   - La PWA detiene la alarma y actualiza la bandeja.
   - El tiempo de preparación usa el `prepMinutes` configurado en el local como valor por defecto.

6. **Preparación y listo**
   - Cocina prepara el pedido.
   - Al terminar, pulsa `Marcar listo`.
   - El backend solo permite `accepted → ready`.
   - El dispatcher puede tomar el pedido `ready` para asignación al rider.

7. **Pausa inmediata de producto**
   - En `Productos y disponibilidad`, cada plato tiene un botón `Pausar producto`.
   - La acción ejecuta `partner.updateMenuItem` con `available = 0`.
   - El producto deja de ofrecerse a nuevos clientes sin borrar historial, precio ni imagen.
   - El mismo botón se convierte en `Reactivar producto`.
   - La operación es reversible y requiere solo un toque; el estado queda visible como `Agotado`.

8. **Pausa del local**
   - El botón superior del establecimiento cambia `active ↔ paused`.
   - Sirve para saturación de cocina, cierre temporal o falta de riders.
   - Es distinto de pausar un plato: uno bloquea el local completo y el otro solo un producto.

## Endpoints añadidos

- `partner.orders` — snapshot de pedidos activos del partner; recomendado como fallback inicial de polling.
- `partner.updateOrder` — acepta o marca listo un pedido, con validación de pertenencia y de transición.
- `partner.updateMenuItem` — ya existente; ahora se presenta como pausa/reactivación explícita en la UI.

## Geofencing Xàtiva/PostGIS

La migración crea:

- `delivery.delivery_zones` con `MultiPolygon(4326)` e índice GiST;
- `partner_locations` y `customer_locations` como `geography(Point, 4326)`;
- `rider_locations` con frescura GPS, batería, capacidad y vehículo;
- `orders_geo` con pickup/dropoff geográfico;
- `assign_zone(point)`;
- `is_serviceable(point)`;
- `delivery_quote_cents(origin, destination)` con límites;
- `nearest_available_riders(pickup, ...)` usando `ST_DWithin` y KNN `<->`.

### Aplicación

```bash
psql "$DATABASE_URL_POSTGIS" \
  -v ON_ERROR_STOP=1 \
  -f infra/postgis/001_geofencing_xativa.sql
```

Después debe importarse el límite oficial de Xàtiva, Xàtiva-Estació y las pedanías con GeoJSON municipal o fuente geográfica verificada. La migración no incluye polígonos inventados: no se deben usar geometrías aproximadas para facturación o restricciones de servicio.

## Siguiente integración

1. Escribir un importador de GeoJSON oficial que haga `ST_Multi(ST_Force2D(ST_SetSRID(ST_GeomFromGeoJSON(...), 4326)))`.
2. Sincronizar `partnerStores` y `riderLocations` del MVP con las tablas geográficas.
3. Sustituir `restaurantPosition()` y Haversine por `assign_zone`, `delivery_quote_cents` y `nearest_available_riders`.
4. Mover el polling de pedidos a eventos SSE/WebSocket cuando el flujo partner esté estable.
5. Mantener MySQL como fuente actual hasta completar shadow reads, reconciliación y cutover controlado.
