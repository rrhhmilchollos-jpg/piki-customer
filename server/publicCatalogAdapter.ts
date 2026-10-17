import {
  catalogAvailabilityStatuses,
  catalogOnboardingStatuses,
  type CatalogAvailabilityStatus,
  type CatalogOnboardingStatus,
} from "../shared/catalogAvailability";
import type {
  MenuItem,
  MenuModifierGroup,
  MenuModifierOption,
  Restaurant,
} from "./catalog";

const DEFAULT_PUBLIC_CATALOG_URL =
  "https://api.pikidelivery.com/api/v1/catalog/restaurants";
const CACHE_TTL_MS = 15_000;

type UnknownRecord = Record<string, unknown>;
type CachedCatalogue = { expiresAt: number; restaurants: Restaurant[] };

let cachedCatalogue: CachedCatalogue | null = null;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, maximum = 10_000): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim().slice(0, maximum)
    : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function enumValue<T extends readonly string[]>(
  value: unknown,
  allowed: T
): T[number] | undefined {
  return typeof value === "string" &&
    (allowed as readonly string[]).includes(value)
    ? (value as T[number])
    : undefined;
}

function mapModifierOption(
  value: unknown,
  fallback?: { id: string; price: number }
): MenuModifierOption | null {
  // Formato antiguo del panel: la opción llega como texto y hereda el precio del grupo.
  if (typeof value === "string") {
    const name = stringValue(value, 160);
    return name && fallback ? { id: fallback.id, name, price: fallback.price } : null;
  }
  if (!isRecord(value)) return null;
  // Una opción pausada en el panel no se ofrece al cliente.
  if (booleanValue(value.available) === false) return null;
  const id = stringValue(value.id, 80) ?? fallback?.id;
  const name = stringValue(value.name, 160);
  const price = numberValue(value.price) ?? fallback?.price;
  if (!id || !name || price === undefined || price < 0) return null;
  return {
    id,
    name,
    price,
    ...(stringValue(value.description, 1_000)
      ? { description: stringValue(value.description, 1_000) }
      : {}),
  };
}

function mapModifierGroup(value: unknown): MenuModifierGroup | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id, 80);
  const name = stringValue(value.name, 160);
  if (!id || !name) return null;
  const groupPrice = numberValue(value.price);
  const fallbackPrice = groupPrice !== undefined && groupPrice >= 0 ? groupPrice : 0;
  // `optionItems` (opciones con precio propio) tiene prioridad sobre `options`.
  const optionRows =
    Array.isArray(value.optionItems) && value.optionItems.length
      ? value.optionItems
      : Array.isArray(value.options)
        ? value.options
        : [];
  const options = optionRows
    .map((row, index) =>
      mapModifierOption(row, { id: `${id}-opt-${index + 1}`, price: fallbackPrice })
    )
    .filter((option): option is MenuModifierOption => option !== null);
  if (!options.length) return null;
  const suppliedMinimum = numberValue(value.minSelections);
  const defaultMinimum = booleanValue(value.required) ? 1 : 0;
  const minSelections = Math.min(
    Number.isInteger(suppliedMinimum) && suppliedMinimum! >= 0
      ? suppliedMinimum!
      : defaultMinimum,
    options.length
  );
  const suppliedMaximum = numberValue(value.maxSelections);
  const maxSelections =
    Number.isInteger(suppliedMaximum) && suppliedMaximum! >= minSelections
      ? Math.min(suppliedMaximum!, options.length)
      : options.length;
  return {
    id,
    name,
    ...(stringValue(value.description, 1_000)
      ? { description: stringValue(value.description, 1_000) }
      : {}),
    ...(minSelections > 0 ? { minSelections } : {}),
    maxSelections,
    options,
  };
}

function mapMenuItem(value: unknown): MenuItem | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id, 80);
  const name = stringValue(value.name, 160);
  const price = numberValue(value.price);
  if (!id || !name || price === undefined || price < 0) return null;
  const modifierRows = Array.isArray(value.modifierGroups)
    ? value.modifierGroups
    : Array.isArray(value.modifiers)
      ? value.modifiers
      : Array.isArray(value.optionGroups)
        ? value.optionGroups
        : [];
  const modifierGroups = modifierRows
    .map(mapModifierGroup)
    .filter((group): group is MenuModifierGroup => group !== null);
  const category = stringValue(value.category, 160);
  const image =
    stringValue(value.image, 2_000) ??
    stringValue(value.imageUrl, 2_000) ??
    stringValue(value.photoUrl, 2_000);
  const allergens = Array.isArray(value.allergens)
    ? value.allergens
        .map(allergen => stringValue(allergen, 100))
        .filter((allergen): allergen is string => Boolean(allergen))
    : undefined;
  return {
    id,
    name,
    description: stringValue(value.description, 1_000) ?? "",
    price,
    ...(category ? { category } : {}),
    ...(image ? { image } : {}),
    ...(allergens?.length ? { allergens } : {}),
    ...(booleanValue(value.vegetarian) !== undefined
      ? { vegetarian: booleanValue(value.vegetarian) }
      : {}),
    ...(booleanValue(value.popular) !== undefined
      ? { popular: booleanValue(value.popular) }
      : {}),
    ...(modifierGroups.length ? { modifierGroups } : {}),
  };
}

/**
 * Maps only API-provided display values. No cover image, cuisine, ETA, price,
 * or rating fallback is fabricated when a record has not supplied one.
 */
export function mapPublicCatalogueRestaurant(
  value: unknown
): Restaurant | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id ?? value._id, 80);
  const name = stringValue(value.name, 160);
  if (!id || !name) return null;

  const fee =
    numberValue(value.fee) ??
    (typeof value.deliveryFeeCents === "number"
      ? value.deliveryFeeCents / 100
      : undefined);
  const menuRows = Array.isArray(value.menu) ? value.menu : [];
  const menu = menuRows
    .map(mapMenuItem)
    .filter((item): item is MenuItem => item !== null);
  const availabilityStatus = enumValue(
    value.availabilityStatus,
    catalogAvailabilityStatuses
  ) as CatalogAvailabilityStatus | undefined;
  const onboardingStatus = enumValue(
    value.onboardingStatus,
    catalogOnboardingStatuses
  ) as CatalogOnboardingStatus | undefined;

  return {
    id,
    name,
    menu,
    ...(stringValue(value.cuisine, 160)
      ? { cuisine: stringValue(value.cuisine, 160) }
      : {}),
    ...(stringValue(value.category, 120)
      ? { category: stringValue(value.category, 120) }
      : {}),
    ...(stringValue(value.tagline, 500)
      ? { tagline: stringValue(value.tagline, 500) }
      : {}),
    ...(stringValue(value.eta, 80) ? { eta: stringValue(value.eta, 80) } : {}),
    ...(fee !== undefined && fee >= 0 ? { fee } : {}),
    ...(numberValue(value.rating) !== undefined &&
    numberValue(value.rating)! >= 0
      ? { rating: numberValue(value.rating) }
      : {}),
    ...(Number.isInteger(numberValue(value.reviews)) &&
    numberValue(value.reviews)! >= 0
      ? { reviews: numberValue(value.reviews) }
      : {}),
    ...(booleanValue(value.promoted) !== undefined
      ? { promoted: booleanValue(value.promoted) }
      : {}),
    ...(stringValue(value.image, 2_000)
      ? { image: stringValue(value.image, 2_000) }
      : {}),
    ...(stringValue(value.accent, 32)
      ? { accent: stringValue(value.accent, 32) }
      : {}),
    ...(availabilityStatus ? { availabilityStatus } : {}),
    ...(booleanValue(value.isActive) !== undefined
      ? { isActive: booleanValue(value.isActive) }
      : {}),
    ...(onboardingStatus ? { onboardingStatus } : {}),
  };
}

/** Accepts the documented { restaurants: [...] } envelope and a direct array. */
export function mapPublicCataloguePayload(
  payload: unknown
): Restaurant[] | null {
  const rows = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.restaurants)
      ? payload.restaurants
      : isRecord(payload) &&
          isRecord(payload.data) &&
          Array.isArray(payload.data.restaurants)
        ? payload.data.restaurants
        : null;
  if (!rows) return null;
  return rows
    .map(mapPublicCatalogueRestaurant)
    .filter((restaurant): restaurant is Restaurant => restaurant !== null);
}

export async function fetchPublicCatalogue(): Promise<Restaurant[] | null> {
  if (cachedCatalogue && cachedCatalogue.expiresAt > Date.now()) {
    return cachedCatalogue.restaurants;
  }

  const endpoint =
    process.env.PIKI_PUBLIC_CATALOG_URL?.trim() || DEFAULT_PUBLIC_CATALOG_URL;
  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return null;
    const mapped = mapPublicCataloguePayload(await response.json());
    if (mapped === null) return null;
    cachedCatalogue = {
      restaurants: mapped,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    return mapped;
  } catch {
    return null;
  }
}

/** Test-only cache reset; it is deliberately not exported from application routes. */
export function clearPublicCatalogueCacheForTests() {
  cachedCatalogue = null;
}
