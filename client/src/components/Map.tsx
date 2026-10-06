import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngExpression, LatLngTuple } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

type MapPoint = { lat: number; lng: number; label?: string; kind?: "rider" | "pickup" | "dropoff" | "restaurant"; vehicle?: string };

export interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapReady?: (map: L.Map) => void;
  points?: MapPoint[];
  route?: Array<{ lat: number; lng: number }>;
  interactive?: boolean;
}

const palette: Record<NonNullable<MapPoint["kind"]>, string> = {
  rider: "#143b2b",
  pickup: "#FFD72E",
  dropoff: "#171715",
  restaurant: "#b86a36",
};

function MapReady({ onMapReady, center }: { onMapReady?: (map: L.Map) => void; center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => { onMapReady?.(map); }, [map, onMapReady]);
  useEffect(() => { map.setView([center.lat, center.lng], map.getZoom(), { animate: true }); }, [center.lat, center.lng, map]);
  return null;
}

function markerIcon(color: string, label: string) {
  return L.divIcon({
    className: "piki-map-pin",
    html: `<span style="display:grid;place-items:center;width:32px;height:32px;border-radius:12px;background:${color};color:#fff;border:3px solid #fff;box-shadow:0 5px 14px rgba(20,59,43,.28);font:700 12px/1 sans-serif">${label}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function vehicleGlyph(vehicle?: string) {
  if (vehicle === "car") return "🚗";
  if (["motorcycle", "scooter", "moto"].includes(vehicle || "")) return "🏍️";
  if (vehicle === "electric_scooter") return "🛴";
  return "🚲";
}

function riderMarkerIcon(vehicle?: string) {
  return L.divIcon({ className: "piki-map-pin", html: `<span style="display:grid;place-items:center;width:42px;height:42px;border-radius:15px;background:#143b2b;color:#fff;border:3px solid #FFD72E;box-shadow:0 6px 18px rgba(20,59,43,.4);font:22px/1 sans-serif">${vehicleGlyph(vehicle)}</span>`, iconSize: [42, 42], iconAnchor: [21, 21] });
}

export function MapView({ className, initialCenter = { lat: 38.9908, lng: -0.5185 }, initialZoom = 14, onMapReady, points = [], route = [], interactive = true }: MapViewProps) {
  const center = useMemo<LatLngExpression>(() => [initialCenter.lat, initialCenter.lng], [initialCenter.lat, initialCenter.lng]);
  const path = route.map((point) => [point.lat, point.lng] as LatLngTuple);
  return <MapContainer center={center} zoom={initialZoom} scrollWheelZoom={interactive} dragging={interactive} zoomControl={interactive} attributionControl className={cn("h-[500px] w-full bg-[#e8f0e6]", className)}>
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <MapReady onMapReady={onMapReady} center={initialCenter} />
    {path.length > 1 && <Polyline positions={path} pathOptions={{ color: "#171715", weight: 5, opacity: 0.85, lineCap: "round", lineJoin: "round" }} />}
    {points.map((point, index) => { const color = palette[point.kind || "restaurant"]; const text = point.kind === "rider" ? "R" : point.kind === "pickup" ? "P" : point.kind === "dropoff" ? "D" : String(index + 1); return <Marker key={`${point.label || "point"}-${index}`} position={[point.lat, point.lng]} icon={point.kind === "rider" ? riderMarkerIcon(point.vehicle) : markerIcon(color, text)}><Tooltip direction="top" offset={[0, -12]} opacity={1}>{point.label || "Punto de ruta"}</Tooltip></Marker>; })}
  </MapContainer>;
}

export function StaticRouteMap({ className, initialCenter = { lat: 38.9908, lng: -0.5185 }, initialZoom = 14, points = [], route = [] }: Omit<MapViewProps, "onMapReady">) {
  return <MapView className={className} initialCenter={initialCenter} initialZoom={initialZoom} points={points} route={route} interactive={false} />;
}
