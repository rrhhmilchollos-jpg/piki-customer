import { Clock3, MapPin, Phone, Star, Truck, X } from "lucide-react";
import type { Restaurant } from "../../../server/catalog";

const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

type RestaurantInfoModalProps = {
  restaurant: Restaurant;
  onClose: () => void;
};

export function RestaurantInfoModal({ restaurant, onClose }: RestaurantInfoModalProps) {
  const openingHours = restaurant.partnerProfile?.openingHours;
  const openingEntries = openingHours && typeof openingHours === "object"
    ? Object.entries(openingHours as Record<string, { open?: string; close?: string; closed?: boolean }>)
    : [];

  return (
    <div className="fixed inset-0 z-[65] grid place-items-center bg-[#171715]/50 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-label={`Información de ${restaurant.name}`} onMouseDown={event => event.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-[2rem] bg-[#FFFDF5] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[#ece2d8] p-5 sm:p-7">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#dc5c35]">Información del establecimiento</p>
            <h2 className="mt-1 font-display text-3xl font-semibold tracking-[-.05em] text-[#171715]">{restaurant.name}</h2>
            <p className="mt-1 text-sm text-[#68746a]">Datos operativos visibles antes de pedir.</p>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#e5dbd0] bg-white" aria-label="Cerrar información"><X className="h-5 w-5" /></button>
        </header>
        <div className="max-h-[68vh] overflow-y-auto p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-3">
            {typeof restaurant.rating === "number" && <div className="rounded-2xl bg-white p-4 ring-1 ring-[#e9dfd5]"><Star className="h-5 w-5 fill-[#f5aa31] text-[#f5aa31]" /><p className="mt-3 text-lg font-extrabold">{restaurant.rating.toFixed(1)}</p><p className="text-xs text-[#68746a]">{restaurant.reviews ?? 0} reseñas</p></div>}
            {restaurant.eta && <div className="rounded-2xl bg-white p-4 ring-1 ring-[#e9dfd5]"><Clock3 className="h-5 w-5 text-[#dc5c35]" /><p className="mt-3 text-lg font-extrabold">{restaurant.eta}</p><p className="text-xs text-[#68746a]">Tiempo estimado</p></div>}
            <div className="rounded-2xl bg-white p-4 ring-1 ring-[#e9dfd5]"><Truck className="h-5 w-5 text-[#315b3f]" /><p className="mt-3 text-lg font-extrabold">{typeof restaurant.fee === "number" && restaurant.fee === 0 ? "Gratis" : typeof restaurant.fee === "number" ? money.format(restaurant.fee) : "Según dirección"}</p><p className="text-xs text-[#68746a]">Entrega PIKI</p></div>
          </div>
          {restaurant.tagline && <div className="mt-5 rounded-2xl bg-[#fff4be] p-4 text-sm leading-relaxed text-[#526052]"><strong className="text-[#171715]">Sobre el establecimiento</strong><p className="mt-1">{restaurant.tagline}</p></div>}
          <div className="mt-5 space-y-3 rounded-2xl border border-[#e9dfd5] bg-white p-4">
            <h3 className="font-extrabold text-[#263229]">Dónde encontrarlo</h3>
            {restaurant.address && <p className="flex items-start gap-2 text-sm text-[#68746a]"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#dc5c35]" />{restaurant.address}</p>}
            {restaurant.phone && <p className="flex items-center gap-2 text-sm text-[#68746a]"><Phone className="h-4 w-4 shrink-0 text-[#315b3f]" />{restaurant.phone}</p>}
            {!restaurant.address && !restaurant.phone && <p className="text-sm text-[#68746a]">La dirección exacta y el contacto operativo se muestran cuando el establecimiento los publica en PIKI.</p>}
          </div>
          <div className="mt-5 rounded-2xl border border-[#e9dfd5] bg-white p-4">
            <h3 className="font-extrabold text-[#263229]">Horario de apertura</h3>
            {openingEntries.length ? <div className="mt-3 space-y-2">{openingEntries.map(([day, value]) => <div key={day} className="flex justify-between gap-4 text-sm"><span className="capitalize text-[#68746a]">{day}</span><span className="font-bold text-[#263229]">{value.closed ? "Cerrado" : `${value.open || "—"} – ${value.close || "—"}`}</span></div>)}</div> : <p className="mt-2 text-sm leading-relaxed text-[#68746a]">El estado de apertura y la disponibilidad se calculan en tiempo real según la configuración del partner.</p>}
          </div>
        </div>
        <footer className="border-t border-[#ece2d8] bg-[#FFFDF5] p-5 sm:p-7"><button onClick={onClose} className="w-full rounded-xl bg-[#171715] py-3.5 text-sm font-extrabold text-white">Volver a la carta</button></footer>
      </section>
    </div>
  );
}
