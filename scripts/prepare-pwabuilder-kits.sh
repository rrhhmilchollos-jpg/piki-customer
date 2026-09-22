#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="/home/ubuntu/Downloads/Yavoy-PWABuilder-Kits"
PUBLIC_URL="https://mesagodeliv-gdrjgnii.manus.space"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

prepare_kit() {
  local slug="$1" manifest="$2" url="$3" app_id="$4" label="$5"
  local kit="$OUTPUT_DIR/$slug"
  mkdir -p "$kit"
  cp "$PROJECT_DIR/client/public/$manifest" "$kit/manifest.json"
  cp "$PROJECT_DIR/client/public/sw.js" "$kit/sw.js"
  cp "$PROJECT_DIR/client/public/yavoy-$slug-192.png" "$kit/icon-192.png"
  cp "$PROJECT_DIR/client/public/yavoy-$slug-512.png" "$kit/icon-512.png"
  cat > "$kit/README-PWABUILDER.md" <<EOF
# $label — kit para PWABuilder

Este archivo ZIP documenta el manifiesto, iconos y service worker de **$label**. PWABuilder compila desde la URL publicada, no desde un ZIP local.

## URL de compilación

$url

## En PWABuilder

1. Abre https://www.pwabuilder.com/ y pega la URL de compilación.
2. Comprueba que detecta **$label** y los iconos Yavoy.
3. Selecciona **Package for stores → Android**, usa el identificador **$app_id** y descarga el paquete generado.

No combines este kit con los otros dos: cada aplicación debe usar su propio identificador Android y su propia URL.
EOF
  (cd "$OUTPUT_DIR" && zip -qr "Yavoy-${slug^}-PWABuilder.zip" "$slug")
}

prepare_kit "delivery" "manifest.json" "$PUBLIC_URL/" "com.yavoy.delivery" "Yavoy Delivery"
prepare_kit "riders" "manifest-riders.json" "$PUBLIC_URL/riders" "com.yavoy.riders" "Yavoy Riders"
prepare_kit "admin" "manifest-admin.json" "$PUBLIC_URL/admin" "com.yavoy.admin" "Yavoy Admin"

cat > "$OUTPUT_DIR/LEEME-PRIMERO.md" <<EOF
# Kits Yavoy para PWABuilder

Los tres ZIP contienen los manifiestos, iconos y service worker ya preparados. Para compilar, abre PWABuilder y pega la URL indicada en el README de cada ZIP. Publica primero el checkpoint actual; PWABuilder debe leer la web publicada por HTTPS.
EOF
