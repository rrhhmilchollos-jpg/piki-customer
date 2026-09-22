# PWABuilder workflow verified

Source: https://www.pwabuilder.com/

PWABuilder accepts a public HTTPS PWA URL from the home page, analyzes the manifest and service worker, then exposes `Package For Stores`. The store package dialog includes `Google Play` with `Generate Package`, and a separate `Download Test Package` option is available on the report card for local testing. The Yavoy public site exposes three manifests:

- Delivery: https://mesagodeliv-gdrjgnii.manus.space/ → `/manifest.json`, title Yavoy Delivery, start URL `/`, scope `/`
- Riders: https://mesagodeliv-gdrjgnii.manus.space/riders → `/manifest-riders.json`, title Yavoy Riders, start URL `/riders`, scope `/riders`
- Admin: https://mesagodeliv-gdrjgnii.manus.space/admin → `/manifest-admin.json`, title Yavoy Admin, start URL `/admin`, scope `/admin`

For Google Play, use `Package For Stores` → `Google Play` → `Generate Package` for each URL separately, then download the generated Android package and upload the AAB to Google Play Console. For direct Android testing, use `Download Test Package` or install the PWA directly from Chrome with the visible `Instalar` banner.
