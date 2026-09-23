#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="/home/ubuntu/Downloads/PIKI-PWABuilder-Kits"
PUBLIC_URL="https://pikidelivery.com"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

prepare_kit() {
  local slug="$1" manifest="$2" url="$3" app_id="$4" label="$5"
  local kit="$OUTPUT_DIR/$slug"
  mkdir -p "$kit"
  cp "$PROJECT_DIR/client/public/$manifest" "$kit/manifest.json"
  cp "$PROJECT_DIR/client/public/sw.js" "$kit/sw.js"
  cp "$PROJECT_DIR/client/public/piki-$slug-192.png" "$kit/icon-192.png"
  cp "$PROJECT_DIR/client/public/piki-$slug-512.png" "$kit/icon-512.png"
  cat > "$kit/README-PWABUILDER.md" <<EOF
# $label — kit para PWABuilder

Este archivo ZIP documenta el manifiesto, los iconos PIKI y el service worker. PWABuilder compila desde la URL publicada, no desde un ZIP local.

## URL de compilación

$url

## En PWABuilder

1. Abre https://www.pwabuilder.com/ y pega la URL HTTPS de compilación.
2. Comprueba que detecta **$label** y el icono PIKI con las tres líneas sobre la K.
3. Selecciona **Package for stores → Android**, usa el identificador **$app_id** y descarga el paquete generado.

No combines este kit con los otros: cada aplicación usa su propio identificador Android y manifiesto.
EOF
  (cd "$OUTPUT_DIR" && zip -qr "PIKI-${slug^}-PWABuilder.zip" "$slug")
}

prepare_kit "delivery" "manifest.json" "$PUBLIC_URL/" "com.piki.delivery" "PIKI Delivery"
prepare_kit "riders" "manifest-riders.json" "$PUBLIC_URL/riders" "com.piki.riders" "PIKI Riders"
prepare_kit "admin" "manifest-admin.json" "$PUBLIC_URL/admin" "com.piki.admin" "PIKI Admin"

cat > "$OUTPUT_DIR/LEEME-PRIMERO.md" <<EOF
# Kits PIKI para PWABuilder

Los tres ZIP contienen los manifiestos, iconos PIKI y service worker preparados. Cada aplicación debe compilarse por separado desde su URL HTTPS.
EOF
