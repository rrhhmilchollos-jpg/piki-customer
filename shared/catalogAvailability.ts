export const catalogAvailabilityStatuses = [
  "available",
  "coming_soon",
  "unavailable",
] as const;

export type CatalogAvailabilityStatus =
  (typeof catalogAvailabilityStatuses)[number];

export const catalogOnboardingStatuses = [
  "pending_review",
  "approved",
  "rejected",
] as const;

export type CatalogOnboardingStatus =
  (typeof catalogOnboardingStatuses)[number];

/**
 * Public availability fields supplied by the canonical catalogue API.
 * Fields are optional only to keep legacy catalogue records working during
 * the migration; new API records should always include all three fields.
 */
export type CatalogAvailability = {
  availabilityStatus?: CatalogAvailabilityStatus;
  isActive?: boolean;
  onboardingStatus?: CatalogOnboardingStatus;
};

/** A coming-soon record is intentionally visible but must never be actionable. */
export function isRestaurantComingSoon(restaurant: CatalogAvailability): boolean {
  return restaurant.availabilityStatus === "coming_soon";
}

/**
 * A restaurant can receive menu, cart, quote, and checkout actions only when
 * every lifecycle signal allows it. Unknown legacy records remain orderable
 * until the public catalogue migration is complete.
 */
export function isRestaurantOrderable(restaurant: CatalogAvailability): boolean {
  return (
    restaurant.availabilityStatus !== "coming_soon" &&
    restaurant.availabilityStatus !== "unavailable" &&
    restaurant.isActive !== false &&
    restaurant.onboardingStatus !== "pending_review" &&
    restaurant.onboardingStatus !== "rejected"
  );
}
