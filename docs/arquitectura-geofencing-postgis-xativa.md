# Geofencing y búsqueda geoespacial radial — Xàtiva y pedanías

**Estado:** diseño implementable; todavía no es la base de datos de producción.

> La API de operaciones activa usa MongoDB y sus índices `2dsphere`; el MVP local mantiene tablas MySQL/Drizzle. Los dos PostgreSQL detectados en Render no están identificados como recursos PIKI. **No se debe aplicar esta migración a ellos.** Este diseño define una base PostgreSQL/PostGIS dedicada, con migración gradual y sin doble escritura silenciosa.

## Objetivo operativo

1. Decidir si recogida y entrega se encuentran en una zona comercial activa de **Xàtiva** o de una pedanía habilitada.
2. Identificar riders elegibles en un radio medido en **metros**, con ubicación fresca y capacidad disponible.
3. Proporcionar al motor de asignación por lotes candidatos correctos y una reserva transaccional; el algoritmo de puntuación/ruta se ejecuta en el servicio de dispatch, no dentro de SQL.
4. Mantener evidencia de la procedencia y la versión de cada polígono antes de usarlo para precio, disponibilidad o liquidaciones.

## Decisión de datos espaciales

| Entidad | Tipo | Motivo |
|---|---|---|
| Límite de zona/pedanía | `geometry(MultiPolygon, 4326)` | Conserva la geometría administrativa en longitud/latitud y permite `ST_Covers` de bordes. |
| Rider, comercio, cliente, recogida/entrega | `geography(Point, 4326)` | `ST_DWithin` y `ST_Distance` se expresan en metros sobre la Tierra. |
| Búsqueda por radio | `ST_DWithin(geography, geography, metros)` | Usa el índice espacial y descarta candidatos fuera del radio. |
| Ranking cercano | `ORDER BY location <-> pickup` + recálculo | KNN/GiST hace el prefiltrado; se reordena por `ST_Distance` exacta antes de puntuar. |

PostGIS documenta que `ST_DWithin` con `geography` recibe metros y usa una comparación de bounding box indexable. El operador `<->` usa GiST en `ORDER BY`; sobre `geography` usa distancia esférica, de modo que PIKI lo usa para preseleccionar y después obtiene la distancia exacta al puntuar.

## Esquema entregado

La primera capa está en [`001_geofencing_xativa.sql`](../infra/postgis/001_geofencing_xativa.sql) y crea zonas, puntos de comercios/clientes, última posición de rider y pedidos geográficos. Esta entrega añade [`002_dispatch_geofencing_and_batch.sql`](../infra/postgis/002_dispatch_geofencing_and_batch.sql):

- procedencia, checksum, fecha de vigencia y prioridad de cada zona;
- índices GiST y compuestos para radio, frescura y cola de dispatch;
- `dispatch_batches` y `dispatch_offers` como auditoría reproducible de matching;
- bloqueo de órdenes mediante `FOR UPDATE SKIP LOCKED` para que dos workers no evalúen la misma orden;
- aceptación *compare-and-set* de una oferta, que asigna una sola vez y anula las restantes;
- eventos de geofence de rider para entrada/salida/cambio de zona;
- `assign_zone` y `is_serviceable` con `ST_Covers`, inclusivo en el borde municipal;
- `nearest_eligible_riders`, con disponibilidad, frescura, batería, capacidad, zona y radio en metros.

### Aplicación inicial

```bash
psql "$PIKI_POSTGIS_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f infra/postgis/001_geofencing_xativa.sql
psql "$PIKI_POSTGIS_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f infra/postgis/002_dispatch_geofencing_and_batch.sql
```

Antes de cualquier activación, crear un usuario de aplicación sin privilegios DDL, habilitar copias de seguridad/PITR y aplicar las migraciones primero a una base vacía de staging y luego a una copia anonimizada.

## Importación de Xàtiva y pedanías

La API actual guarda un MultiPolygon de origen OpenStreetMap/Nominatim, obtenido el **26-09-2026** y simplificado; el propio código indica que debe reemplazarse por un extracto municipal oficial antes de ampliar o fijar tarifas. No se inventan polígonos ni límites de pedanías en la migración.

### Procedimiento controlado

1. **Fuente:** obtener GeoJSON/Shape oficial del Ayuntamiento, Generalitat/IDEV o fuente administrativa aprobada; conservar URL, licencia, fecha y hash SHA-256.
2. **QA topológico:** rechazar geometría vacía, distinta de `MultiPolygon`, no válida, con SRID diferente de 4326, auto-intersecciones o solape no autorizado entre zonas.
3. **Versionar, no editar:** dar de alta una zona `urban` para Xàtiva y una `pedania` por cada área aprobada; mantener la anterior con `effective_until` hasta el instante de corte.
4. **Activar después de prueba:** ejecutar puntos de borde, centros de pedanía, comercios y direcciones conocidas contra `assign_zone`; revisar con Operaciones y Finanzas antes de `status='active'`.
5. **Auditar cambios:** usar `delivery.replace_zone_geometry(...)`, que registra referencia, fecha de captura y checksum junto a la geometría.

Ejemplo de creación de una zona aún no habilitada:

```sql
INSERT INTO delivery.delivery_zones
  (name, municipality, kind, status, base_fee_cents, per_km_cents,
   rider_base_payout_cents, max_delivery_km, service_area, source)
VALUES
  ('Xàtiva centro', 'Xàtiva', 'urban', 'paused', 299, 40, 350, 8,
   ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(:approved_geojson), 4326)),
   'official_source_pending_qa');
```

## Algoritmo exacto

### 1. Validación de entrega

Al confirmar dirección se normalizan lon/lat y se crea un `geography(Point,4326)`. PIKI calcula primero la zona:

```sql
SELECT delivery.assign_zone(
  ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
) AS zone_id;
```

- Sin `zone_id`: no se ofrece entrega y no se cobra una tarifa.
- Con zona `paused`: se indica indisponibilidad, no se busca rider.
- Con zona `active`: la cotización aplica políticas de la zona, pero la distancia de ruta definitiva procede de un proveedor de ruteo; no se factura únicamente con distancia en línea recta.

### 2. Presencia de rider y geofence

Cada ping autenticado valida precisión, marca de tiempo y orden `sequence`. Se descartan muestras con antigüedad superior a 90 segundos, salto de velocidad imposible o precisión deficiente. La última posición se actualiza con control de versión; el histórico se escribe en una tabla particionada/retencionada fuera del camino caliente.

Después del update:

1. `old_zone := rider.zone_id`;
2. `new_zone := delivery.assign_zone(new_point)`;
3. si cambia, se registra `entered`, `exited`, `zone_changed` o `out_of_service_area`;
4. se actualiza `zone_id` y `last_geofence_at`;
5. **no** se desconecta a un rider por una sola muestra: se exige histéresis temporal (por ejemplo, dos pings consecutivos o 30 s fuera).

### 3. Radio y candidatos

Para una orden lista, el motor pide hasta 20 riders con radio inicial de 1.500 m, expandiendo 1.500 → 3.000 → 5.000 m hasta el máximo de zona. La consulta descarta antes de puntuar a riders fuera de zona, no disponibles, sin capacidad, con GPS viejo o batería insuficiente:

```sql
SELECT *
FROM delivery.nearest_eligible_riders(
  'piki', :pickup_geog, :zone_id, :units, 3000, 90, 20
);
```

El motor de rutas evalúa los 10–20 supervivientes con duraciones de carretera reales. La función `ST_Distance` es una *cota geodésica*, nunca un sustituto de duración/tiempo de calle.

### 4. Matching por lotes y bundling

Cada 20–45 segundos por zona, un worker crea un `dispatch_batch` y llama `lock_orders_for_dispatch_batch`. Para cada orden prepara aristas **rider→orden** y **rider→bundle** solo si se cumplen:

- recogidas compatibles y ventana de preparación coincidente;
- inserción de la segunda parada con desvío máximo (por ejemplo, 7 min/1,2 km);
- promesa de entrega, capacidad del vehículo y carga activa respetadas;
- límite de dos pedidos por rider en el piloto;
- no hay efectivo, temperatura, tipo de producto o SLA incompatible según la política vigente.

Puntuación inicial explicable:

```text
score = 0,40 × pickup_ETA_normalizado
      + 0,25 × desvío_bundle_normalizado
      + 0,15 × riesgo_de_incumplir_promesa
      + 0,10 × carga_actual
      + 0,10 × penalización_de_equidad
```

Se resuelve un matching bipartito de coste mínimo; cualquier bundle se compara contra asignaciones individuales y solo gana si reduce coste total sin degradar la promesa. `dispatch_offers.score_breakdown` guarda los componentes para soporte y auditoría. El rider acepta con `accept_dispatch_offer`, una compare-and-set que anula ofertas rivales y evita doble claim.

## Integración sin cortar el MVP

| Fase | Cambio | Condición de salida |
|---|---|---|
| 0 — Datos | Base PostGIS PIKI separada, import oficial y pruebas de límites | Cobertura validada por Operaciones; sin tráfico productivo. |
| 1 — Shadow | Replicar ubicaciones/pedidos desde API central con outbox y `event_id` idempotente | Diferencia de zonas <0,5 % frente a la lógica actual y sin pérdida de eventos. |
| 2 — Read shadow | Mostrar zona/candidatos PostGIS en Admin sin efectuar asignación | Operaciones confirma rutas/radios durante dos semanas. |
| 3 — Dispatch | PostGIS elige candidatos; API central sigue siendo la fuente de estado de pedido | Reintentos, métricas, alertas y rollback ejercitados. |
| 4 — Batches | Activar lotes primero en una zona/pedanía y con dos pedidos máximo | SLA y tasa de rechazo no empeoran frente al control. |

## API y controles

- `/v1/coverage/check`: devuelve zona, versión de geometría y explicación sin exponer el polígono completo al cliente.
- `/v1/riders/location`: token de rider, validación de secuencia/precisión/edad, máximo 1 ping/5 s foreground y política separada para background.
- `/v1/dispatch/candidates`: solo operaciones; devuelve IDs/puntuación, no coordenadas exactas innecesarias.
- `/v1/dispatch/offers/:id/accept`: idempotency key + `accept_dispatch_offer`; responde 409 si la oferta caducó o fue ganada.
- RLS/tenant: las tablas llevan `tenant_id`; el rol de aplicación fija el tenant en transacción y no acepta este campo desde el navegador.
- Retención: ubicación granular 30 días (ajustable con DPO), agregada para métricas; eliminar/anonimizar después.

## Métricas de salida

- cobertura aceptada/rechazada por zona y motivo;
- frescura p50/p95 de GPS y ratio de pings descartados;
- tamaño de radio, candidatos y tiempo de matching;
- ETA a recogida, retraso de promesa, tasa de rechazo/expiración;
- ahorro de kilómetros y minutos por bundles frente a órdenes individuales;
- reasignaciones, doble-claim (debe ser 0) y discrepancias entre fuentes.

## Fuentes técnicas

- [PostGIS ST_DWithin](https://postgis.net/docs/ST_DWithin.html): distancia de `geography` en metros y uso de índices.
- [PostGIS KNN `<->`](https://postgis.net/docs/geometry_distance_knn.html): vecino más cercano asistido por GiST y distancia esférica para `geography`.
- Fuente local actual: `piki-api/src/coverage/xativaPolicy.ts` y `xativaBoundary.ts`; requiere sustitución por geometría administrativa aprobada para facturación.
