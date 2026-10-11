import fs from "node:fs";
import path from "node:path";

export const RESTAURANT_DIRECTORY_PATH = "/restaurantes-a-domicilio-xativa";
const DEFAULT_PUBLIC_CATALOG_URL = "https://api.pikidelivery.com/api/v1/catalog/restaurants";

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value, maximum = 1_000) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maximum)
    : "";
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalise(value) {
  return stringValue(value, 240)
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function safeHttpUrl(value) {
  const candidate = stringValue(value, 2_000);
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function catalogRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload) && Array.isArray(payload.restaurants)) return payload.restaurants;
  if (isRecord(payload) && isRecord(payload.data) && Array.isArray(payload.data.restaurants)) return payload.data.restaurants;
  return [];
}

function mapMenu(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .filter((item) => item.available !== false)
    .map((item) => {
      const name = stringValue(item.name, 160);
      if (!name) return null;
      const price = finiteNumber(item.price);
      return {
        name,
        description: stringValue(item.description, 500),
        price: price !== null && price >= 0 ? price : null,
      };
    })
    .filter(Boolean)
    .slice(0, 12);
}

function mapCoordinates(value) {
  if (!isRecord(value) || !Array.isArray(value.coordinates) || value.coordinates.length < 2) return null;
  const longitude = finiteNumber(value.coordinates[0]);
  const latitude = finiteNumber(value.coordinates[1]);
  if (longitude === null || latitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

function mapIndexableRestaurant(value) {
  if (!isRecord(value)) return null;

  const slug = stringValue(value.slug, 120).toLowerCase();
  const name = stringValue(value.name, 160);
  const locality = stringValue(value.locality, 120);
  const address = stringValue(value.address, 280);
  const isOrderable = value.orderable === true || (value.isActive === true && value.availabilityStatus === "available");

  // Solo se crean URLs de negocio para locales realmente operativos, con ficha
  // pública suficiente para que su página sea útil y no un resultado vacío.
  if (
    !/^[a-z0-9][a-z0-9-]{1,118}$/.test(slug)
    || !name
    || normalise(locality) !== "xativa"
    || !address
    || normalise(address) === normalise(locality)
    || value.isActive !== true
    || value.availabilityStatus !== "available"
    || !isOrderable
  ) {
    return null;
  }

  return {
    slug,
    path: `/restaurantes/${slug}`,
    name,
    locality,
    address,
    cuisine: stringValue(value.cuisine || value.category, 160),
    tagline: stringValue(value.tagline, 500),
    phone: stringValue(value.phone, 40),
    image: safeHttpUrl(value.image),
    coordinates: mapCoordinates(value.location),
    menu: mapMenu(value.menu),
  };
}

function readFixture(root, file) {
  const target = path.isAbsolute(file) ? file : path.join(root, file);
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

export function restaurantPath(slug) {
  return `/restaurantes/${slug}`;
}

export async function loadIndexableRestaurants({ root }) {
  let payload;
  const fixture = process.env.PIKI_SEO_CATALOG_FILE?.trim();

  try {
    if (fixture) {
      payload = readFixture(root, fixture);
    } else {
      const endpoint = process.env.PIKI_SEO_CATALOG_URL?.trim() || DEFAULT_PUBLIC_CATALOG_URL;
      const response = await fetch(endpoint, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`El catálogo público respondió HTTP ${response.status}`);
      payload = await response.json();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "error desconocido";
    if (process.env.PIKI_SEO_ALLOW_CATALOG_FAILURE === "true") {
      console.warn(`No se pudo cargar el catálogo público para SEO: ${message}`);
      return [];
    }
    // Si una ficha ya publicada desapareciera por un fallo temporal del API, una
    // compilación satisfactoria convertiría su URL canónica en 404. Se detiene el
    // build por defecto para preservar las páginas públicas existentes.
    throw new Error(`No se pudo cargar el catálogo público para SEO; se cancela el build para preservar las fichas existentes: ${message}`);
  }

  return catalogRows(payload)
    .map(mapIndexableRestaurant)
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name, "es"));
}
