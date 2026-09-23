# PWABuilder workflow verificado para PIKI

PWABuilder acepta una URL PWA pública HTTPS, analiza el manifiesto y el service worker y permite generar paquetes para Google Play.

## Aplicaciones PIKI

- Delivery: `/manifest.json`, título **PIKI Delivery**, URL inicial `/`.
- Riders: `/manifest-riders.json`, título **PIKI Riders**, URL inicial `/riders`.
- Admin: `/manifest-admin.json`, título **PIKI Admin**, URL inicial `/admin`.

Cada manifiesto usa iconos PIKI con el símbolo de las tres líneas sobre la K y un identificador Android independiente. No se deben mezclar los kits entre aplicaciones.

## Publicación

1. Abre PWABuilder y pega la URL HTTPS publicada.
2. Comprueba el nombre PIKI y los iconos correspondientes.
3. Selecciona `Package for stores` → `Google Play` → `Generate package`.
4. Descarga el paquete Android y súbelo a Google Play Console.
