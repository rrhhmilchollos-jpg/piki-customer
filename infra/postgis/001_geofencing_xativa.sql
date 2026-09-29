-- PIKI Delivery · PostgreSQL/PostGIS geofencing baseline
-- This is an additive target schema. The current MVP remains on MySQL until an
-- explicit migration/cutover is scheduled.
BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS delivery;

DO $$ BEGIN
  CREATE TYPE delivery.zone_status AS ENUM ('active', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE delivery.zone_kind AS ENUM ('urban', 'pedania', 'station', 'restricted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE delivery.rider_availability AS ENUM ('offline', 'available', 'busy');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS delivery.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  municipality text NOT NULL DEFAULT 'Xàtiva',
  kind delivery.zone_kind NOT NULL,
  status delivery.zone_status NOT NULL DEFAULT 'active',
  base_fee_cents integer NOT NULL DEFAULT 299 CHECK (base_fee_cents >= 0),
  per_km_cents integer NOT NULL DEFAULT 40 CHECK (per_km_cents >= 0),
  rider_base_payout_cents integer NOT NULL DEFAULT 350 CHECK (rider_base_payout_cents >= 0),
  max_delivery_km numeric(6,2) NOT NULL DEFAULT 8.00 CHECK (max_delivery_km > 0),
  service_area geometry(MultiPolygon, 4326) NOT NULL,
  source text NOT NULL DEFAULT 'pending_official_boundary_import',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (municipality, name)
);

CREATE INDEX IF NOT EXISTS delivery_zones_service_area_gist
  ON delivery.delivery_zones USING GIST (service_area);
CREATE INDEX IF NOT EXISTS delivery_zones_active_kind_idx
  ON delivery.delivery_zones (status, kind);

CREATE TABLE IF NOT EXISTS delivery.partner_locations (
  partner_id text PRIMARY KEY,
  display_name text NOT NULL,
  address text NOT NULL,
  location geography(Point, 4326) NOT NULL,
  zone_id uuid REFERENCES delivery.delivery_zones(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partner_locations_location_gist
  ON delivery.partner_locations USING GIST (location);

CREATE TABLE IF NOT EXISTS delivery.customer_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text,
  address text NOT NULL,
  location geography(Point, 4326) NOT NULL,
  zone_id uuid REFERENCES delivery.delivery_zones(id),
  is_validated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_locations_location_gist
  ON delivery.customer_locations USING GIST (location);

CREATE TABLE IF NOT EXISTS delivery.rider_locations (
  rider_id text PRIMARY KEY,
  vehicle text NOT NULL CHECK (vehicle IN ('bike', 'moto', 'car')),
  availability delivery.rider_availability NOT NULL DEFAULT 'offline',
  capacity_units integer NOT NULL DEFAULT 1 CHECK (capacity_units > 0),
  active_load_units integer NOT NULL DEFAULT 0 CHECK (active_load_units >= 0),
  battery_percent integer CHECK (battery_percent BETWEEN 0 AND 100),
  location geography(Point, 4326) NOT NULL,
  zone_id uuid REFERENCES delivery.delivery_zones(id),
  location_fresh_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rider_locations_location_gist
  ON delivery.rider_locations USING GIST (location);
CREATE INDEX IF NOT EXISTS rider_locations_dispatch_idx
  ON delivery.rider_locations (availability, zone_id, location_fresh_at);

CREATE TABLE IF NOT EXISTS delivery.orders_geo (
  order_id text PRIMARY KEY,
  partner_id text NOT NULL REFERENCES delivery.partner_locations(partner_id),
  customer_location_id uuid NOT NULL REFERENCES delivery.customer_locations(id),
  pickup_location geography(Point, 4326) NOT NULL,
  dropoff_location geography(Point, 4326) NOT NULL,
  zone_id uuid REFERENCES delivery.delivery_zones(id),
  item_units integer NOT NULL DEFAULT 1 CHECK (item_units > 0),
  required_vehicle text CHECK (required_vehicle IN ('bike', 'moto', 'car')),
  status text NOT NULL DEFAULT 'ready',
  ready_at timestamptz,
  promised_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_geo_pickup_gist ON delivery.orders_geo USING GIST (pickup_location);
CREATE INDEX IF NOT EXISTS orders_geo_dropoff_gist ON delivery.orders_geo USING GIST (dropoff_location);
CREATE INDEX IF NOT EXISTS orders_geo_dispatch_idx ON delivery.orders_geo (status, zone_id, ready_at, promised_at);

CREATE OR REPLACE FUNCTION delivery.assign_zone(point geography)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT z.id
  FROM delivery.delivery_zones z
  WHERE z.status = 'active'
    AND ST_Covers(z.service_area, point::geometry)
  ORDER BY ST_Area(z.service_area::geography) ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION delivery.is_serviceable(point geography)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM delivery.delivery_zones z
    WHERE z.status = 'active'
      AND ST_Covers(z.service_area, point::geometry)
  );
$$;

CREATE OR REPLACE FUNCTION delivery.delivery_quote_cents(
  origin geography,
  destination geography
)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT LEAST(999, GREATEST(z.base_fee_cents,
        z.base_fee_cents + CEIL((ST_Distance(origin, destination) / 1000.0) * z.per_km_cents)::integer))
      FROM delivery.delivery_zones z
      WHERE z.status = 'active'
        AND ST_Covers(z.service_area, destination::geometry)
        AND ST_Distance(origin, destination) / 1000.0 <= z.max_delivery_km
      ORDER BY ST_Area(z.service_area::geography) ASC
      LIMIT 1
    ), -1
  );
$$;

CREATE OR REPLACE FUNCTION delivery.nearest_available_riders(
  pickup geography,
  requested_units integer DEFAULT 1,
  radius_meters integer DEFAULT 5000,
  max_results integer DEFAULT 20
)
RETURNS TABLE (
  rider_id text,
  distance_meters double precision,
  eta_minutes integer
)
LANGUAGE sql
STABLE
AS $$
  SELECT r.rider_id,
    ST_Distance(r.location, pickup) AS distance_meters,
    GREATEST(1, CEIL(ST_Distance(r.location, pickup) / 350.0)::integer) AS eta_minutes
  FROM delivery.rider_locations r
  WHERE r.availability = 'available'
    AND r.active_load_units + requested_units <= r.capacity_units
    AND r.location_fresh_at >= now() - interval '90 seconds'
    AND (r.battery_percent IS NULL OR r.battery_percent >= 12)
    AND ST_DWithin(r.location, pickup, radius_meters)
  ORDER BY r.location <-> pickup
  LIMIT max_results;
$$;

-- Seed is intentionally not included: official municipal/service-area GeoJSON
-- must be imported before production. Do not use guessed polygons for billing.
COMMIT;
