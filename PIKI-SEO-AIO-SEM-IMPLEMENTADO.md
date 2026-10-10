# PIKI Delivery — implementación SEO Local, GEO, AIO/LLMO y SEM

Fecha: 2026-10-10

## Implementado

- **SEO local:** títulos, H1, meta descriptions, canonical, hreflang, Open Graph y enlaces internos para Xàtiva.
- **Landings geográficas:**
  - `/comida-a-domicilio-xativa`
  - `/restaurantes-a-domicilio-xativa`
  - `/hazte-partner-xativa`
  - `/trabajo-rider-xativa`
  - `/cobertura`
  - `/comida-a-domicilio-canals`
  - `/comida-a-domicilio-alberic`
- **Datos estructurados:** Organization, WebSite, WebPage, Service, BreadcrumbList y FAQPage cuando existe una sección FAQ. El servicio declara Xàtiva, Canals y Alberic como áreas informativas, además de un GeoCircle centrado en Xàtiva con radio de referencia de 30 km.
- **Renderizado dual:** las landings públicas se generan como HTML indexable en build y mantienen sus rutas interactivas React.
- **AIO / LLMO:** `llms.txt` y `llms-full.txt` se regeneran con las páginas oficiales, descripción de servicio, límites de disponibilidad y enlaces canónicos. El contenido evita afirmar cobertura, precios o alianzas no verificadas.
- **FAQs:** visibles en las landings de servicio y acompañadas de JSON-LD FAQPage.
- **Descubrimiento:** `robots.txt`, `sitemap.xml`, `news-sitemap.xml` y RSS del blog se generan en build.
- **Noticias:** existe un blog corporativo con autoría, fechas, política editorial, RSS y una publicación elegible para news-sitemap. Esto **no garantiza** inclusión en Google News; Google decide rastreo, indexación y elegibilidad.
- **SEM:** las páginas de cliente, partner y rider tienen CTAs diferenciadas y URLs independientes para poder medir campañas por intención.
- **Rendimiento:** se conserva la carga diferida de rutas operativas y la generación estática de las páginas de captación.

## Verificaciones realizadas

- `pnpm check` — correcto.
- `pnpm test:seo-static` — correcto.
- `pnpm build` — correcto.
- `git diff --check` — correcto.
- Sitemap comprobado con Xàtiva, Canals, Alberic, blog y páginas de transparencia.
- Las nuevas landings contienen FAQPage, GeoCircle y contenido HTML visible sin depender de JavaScript.

## Límites y siguiente medición

- Canals y Alberic aparecen como **zonas objetivo/informativas**; la disponibilidad real se sigue comprobando por dirección dentro del servicio.
- Para medir campañas SEM hay que conectar las conversiones reales de Analytics/Ads en el entorno de producción y definir los IDs de cuenta; no se han inventado IDs.
- Para Search Console, se puede solicitar una nueva indexación y revisar impresiones/clics después de que Google vuelva a rastrear las URLs. La publicación del sitemap no implica indexación inmediata.
