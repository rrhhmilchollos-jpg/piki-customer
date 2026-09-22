export type MetricsOrder = { createdAt: number | string | Date; status: string; address?: string | null };
export type MetricsZone = { name: string };
export type MetricsRider = { status: string; availability: string; location?: { createdAt: number | string | Date } | null };

export function buildDailyOrderMetrics(orders: MetricsOrder[], now = Date.now(), days = 7) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - index));
    return {
      label: date.toLocaleDateString("es-ES", { weekday: "short" }),
      value: orders.filter((order) => new Date(order.createdAt).toDateString() === date.toDateString()).length,
    };
  });
}

export function buildZoneOrderMetrics(orders: MetricsOrder[], zones: MetricsZone[]) {
  const knownZones = zones.length ? zones : [{ name: "Otras" }];
  return knownZones.map((zone) => ({
    name: zone.name,
    value: orders.filter((order) => zone.name === "Otras"
      ? !zones.some((item) => String(order.address || "").toLowerCase().includes(String(item.name).toLowerCase()))
      : String(order.address || "").toLowerCase().includes(String(zone.name).toLowerCase())).length,
  })).sort((a, b) => b.value - a.value).slice(0, 5);
}

export function getOperationalAlerts(orders: MetricsOrder[], riders: MetricsRider[], now = Date.now()) {
  return {
    delayedOrders: orders.filter((order) => !["delivered", "cancelled"].includes(order.status) && now - new Date(order.createdAt).getTime() > 40 * 60 * 1000),
    staleRiders: riders.filter((rider) => rider.status === "active" && rider.availability !== "offline" && (!rider.location?.createdAt || now - new Date(rider.location.createdAt).getTime() > 90 * 1000)),
  };
}
