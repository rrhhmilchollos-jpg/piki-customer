import { trpc } from "@/lib/trpc";
import AccountHub from "@/components/AccountHub";
import { InstallAppBanner } from "@/components/InstallAppBanner";
import { MapView } from "@/components/Map";
import { ThemeToggle } from "@/components/ThemeToggle";
import CustomerNotificationCenter from "@/components/CustomerNotificationCenter";
import { PikiSplash } from "@/components/PikiSplash";
import { useAuth } from "@/_core/hooks/useAuth";
import QRCode from "qrcode";
import type { MenuItem, Restaurant } from "../../../server/catalog";
import {
  ArrowLeft,
  Heart,
  ArrowRight,
  Bike,
  Banknote,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Coffee,
  CreditCard,
  Flame,
  Home as HomeIcon,
  Leaf,
  MapPin,
  MessageCircle,
  Menu,
  Minus,
  Navigation,
  PackageCheck,
  Pizza,
  Plus,
  Salad,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Utensils,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type CartLine = { item: MenuItem; quantity: number };
type TrackingStage = "confirmed" | "preparing" | "onway";
type TrackingOrder = { id: string; restaurant: string; eta: string; stage: TrackingStage; paymentMethod?: "cash"; totalCents?: number };

const categories = [
  { label: "Todos", icon: Sparkles, hue: "bg-[#ffe9df] text-[#bd4f2e]" },
  { label: "Mediterránea", icon: Utensils, hue: "bg-[#e6f0df] text-[#3a633d]" },
  { label: "Hamburguesas", icon: Flame, hue: "bg-[#ffe8cf] text-[#a44b24]" },
  { label: "Pizza", icon: Pizza, hue: "bg-[#fae0de] text-[#a44639]" },
  { label: "Vegana", icon: Leaf, hue: "bg-[#e1f0dd] text-[#4f753c]" },
  { label: "Japonesa", icon: Salad, hue: "bg-[#dcebef] text-[#245866]" },
  { label: "Desayuno", icon: Coffee, hue: "bg-[#f6ead4] text-[#9a692b]" },
];

const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#dc5c35]">{eyebrow}</p>}
        <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-[#171715] sm:text-4xl">{title}</h2>
      </div>
      {action && (
        <button className="group hidden items-center gap-1 text-sm font-bold text-[#171715] sm:flex" onClick={() => document.getElementById("restaurantes")?.scrollIntoView({ behavior: "smooth" })}>
          {action} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      )}
    </div>
  );
}

function QuantityControl({ quantity, onChange }: { quantity: number; onChange: (quantity: number) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-[#e7ddd1] bg-white p-1 shadow-sm">
      <button aria-label="Restar unidad" onClick={() => onChange(quantity - 1)} className="grid h-7 w-7 place-items-center rounded-full text-[#526056] transition hover:bg-[#f5efe7] active:scale-95">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-4 text-center text-sm font-bold">{quantity}</span>
      <button aria-label="Sumar unidad" onClick={() => onChange(quantity + 1)} className="grid h-7 w-7 place-items-center rounded-full bg-[#FFD72E] text-white transition hover:bg-[#E8C600] active:scale-95">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function RestaurantCard({ restaurant, onOpen }: { restaurant: Restaurant; onOpen: (restaurant: Restaurant) => void }) {
  return (
    <article className="card-lift group relative overflow-hidden rounded-[1.55rem] border border-[#eee4da] bg-white shadow-[0_5px_16px_rgba(55,45,35,.05)]">
      <button className="block w-full text-left" onClick={() => onOpen(restaurant)}>
        <div className="relative h-44 overflow-hidden">
          <img src={restaurant.image} alt={`Plato de ${restaurant.name}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-transparent" />
          {restaurant.promoted && <span className="absolute left-3 top-3 rounded-full bg-[#fff7ed] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#bd4f2e] shadow-sm">Favorito local</span>}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-[#171715] shadow-sm"><Star className="h-3.5 w-3.5 fill-[#f5aa31] text-[#f5aa31]" /> {restaurant.rating.toFixed(1)} <span className="font-medium text-[#6a746b]">({restaurant.reviews})</span></div>
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold tracking-[-0.02em] text-[#171715]">{restaurant.name}</h3>
              <p className="mt-0.5 text-sm text-[#657066]">{restaurant.cuisine}</p>
            </div>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#859087] transition-transform group-hover:translate-x-1" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#506056]">
            <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {restaurant.eta}</span>
            <span className="h-1 w-1 rounded-full bg-[#b7c0b8]" />
            <span>{restaurant.fee === 0 ? "Envío gratis" : `Envío ${money.format(restaurant.fee)}`}</span>
          </div>
        </div>
      </button>
      <button onClick={() => { const key = "piki-favorites"; const saved = JSON.parse(localStorage.getItem(key) || "[]") as string[]; const next = saved.includes(restaurant.id) ? saved.filter((id) => id !== restaurant.id) : [...saved, restaurant.id]; localStorage.setItem(key, JSON.stringify(next)); toast.success(next.includes(restaurant.id) ? "Guardado en favoritos" : "Eliminado de favoritos"); }} aria-label="Guardar restaurante" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#d95737] shadow-sm transition hover:scale-105"><Heart className="h-4 w-4" /></button>
    </article>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cartRestaurant, setCartRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash">("cash");
  const [addressOpen, setAddressOpen] = useState(false);
  const [address, setAddress] = useState("Carrer de Montcada, Xàtiva");
  const [addressDraft, setAddressDraft] = useState(address);
  const [deliveryLocation, setDeliveryLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [deviceLocationBusy, setDeviceLocationBusy] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ label: string; latitude: number; longitude: number }>>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [tracking, setTracking] = useState<TrackingOrder | null>(null);

  const catalogInput = useMemo(
    () => ({ category: category === "Todos" ? undefined : category, query: search.trim() || undefined }),
    [category, search],
  );
  const { data: restaurants, isLoading } = trpc.catalog.list.useQuery(catalogInput);
  const checkoutMutation = trpc.order.checkout.useMutation();
  const savedDeliveryAddress = trpc.customer.deliveryAddress.get.useQuery(undefined, { enabled: isAuthenticated, retry: false, refetchOnWindowFocus: false });
  const saveDeliveryAddress = trpc.customer.deliveryAddress.save.useMutation({
    onSuccess: (saved) => {
      setAddress(saved.address); setAddressDraft(saved.address); setDeliveryLocation(saved.deliveryLocation); setAddressOpen(false);
      void savedDeliveryAddress.refetch();
      toast.success("Dirección guardada", { description: "La usaremos en tus próximos envíos hasta que decidas cambiarla." });
    },
    onError: (error) => toast.error("No se pudo guardar la dirección", { description: error.message || "Inténtalo de nuevo." }),
  });
  const trackingInput = useMemo(() => ({ id: tracking?.id ?? "" }), [tracking?.id]);
  const { data: liveTracking } = trpc.order.get.useQuery(trackingInput, { enabled: Boolean(tracking) && isAuthenticated, refetchInterval: 3000, retry: false });
  const customerTracking = trpc.order.customerTracking.useQuery(trackingInput, { enabled: Boolean(tracking) && isAuthenticated, refetchInterval: 8_000, retry: false });
  const trackingTotalCents = tracking?.totalCents ?? liveTracking?.totalCents;
  useEffect(() => {
    const saved = savedDeliveryAddress.data;
    if (!saved?.saved || !saved.address || !saved.deliveryLocation) return;
    setAddress(saved.address); setAddressDraft(saved.address); setDeliveryLocation(saved.deliveryLocation);
  }, [savedDeliveryAddress.data]);

  const openAddressDialog = () => { setAddressDraft(address); setAddressOpen(true); };
  const saveSelectedAddress = () => {
    if (addressDraft.trim().length < 5) { toast.error("Escribe una dirección más completa"); return; }
    if (!deliveryLocation) { toast.error("Selecciona una sugerencia de PIKI", { description: "Necesitamos coordenadas verificadas para guardar la dirección." }); return; }
    if (!isAuthenticated) { setAddressOpen(false); window.dispatchEvent(new CustomEvent("piki:open-customer-auth")); toast("Inicia sesión para guardar tu dirección", { description: "La conservaremos para tus próximos envíos." }); return; }
    saveDeliveryAddress.mutate({ address: addressDraft.trim(), deliveryLocation });
  };

  useEffect(() => {
    const query = addressDraft.trim();
    if (query.length < 3 || !addressOpen) { setLocationSuggestions([]); return; }
    const controller = new AbortController(); const timer = window.setTimeout(async () => {
      setLocationsLoading(true);
      try { const response = await fetch(`https://api.pikidelivery.com/api/v1/locations/search?q=${encodeURIComponent(query)}`, { signal: controller.signal }); const payload = await response.json(); setLocationSuggestions(payload.results || []); } catch {} finally { setLocationsLoading(false); }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [addressDraft, addressOpen]);

  const useDeviceLocation = () => {
    if (!navigator.geolocation) { toast.error("Este dispositivo no permite usar tu GPS."); return; }
    setDeviceLocationBusy(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const latitude = position.coords.latitude; const longitude = position.coords.longitude;
      setDeliveryLocation({ latitude, longitude });
      try {
        const response = await fetch(`https://api.pikidelivery.com/api/v1/locations/reverse?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`);
        const payload = await response.json();
        setAddressDraft(typeof payload.label === "string" ? payload.label : `Ubicación GPS ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      } catch { setAddressDraft(`Ubicación GPS ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`); }
      setLocationSuggestions([]); setDeviceLocationBusy(false);
      toast.success("Ubicación GPS detectada", { description: `Precisión aproximada: ${Math.round(position.coords.accuracy)} m` });
    }, (error) => { setDeviceLocationBusy(false); toast.error("No se pudo usar tu GPS", { description: error.message || "Revisa el permiso de ubicación del navegador." }); }, { enableHighAccuracy: true, maximumAge: 15_000, timeout: 15_000 });
  };

  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cart.reduce((total, line) => total + line.item.price * line.quantity, 0);
  const deliveryFee = cartRestaurant?.fee ?? 0;
  const serviceFee = cart.length ? 0.79 : 0;
  const total = subtotal + deliveryFee + serviceFee;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    if (orderId && !params.get("checkout")) {
      setTracking({ id: orderId, restaurant: "Pedido PIKI", eta: "actualizando…", stage: "confirmed" });
      window.history.replaceState({}, "", `${window.location.pathname}?order_id=${encodeURIComponent(orderId)}`);
      toast.success("Pedido abierto", { description: "Este QR enlaza con la página pública de clientes PIKI." });
    }
    if (params.get("checkout") === "success" && orderId) {
      setTracking({ id: orderId, restaurant: "Pedido PIKI", eta: "actualizando…", stage: "confirmed" });
      window.history.replaceState({}, "", window.location.pathname);
      toast.success("Pago recibido", { description: "Estamos confirmando tu pedido." });
    }
    if (params.get("checkout") === "cancelled") {
      window.history.replaceState({}, "", window.location.pathname);
      toast("Pago cancelado", { description: "Tu cesta sigue disponible para cuando quieras." });
    }
  }, []);

  useEffect(() => {
    if (!liveTracking?.status) return;
    const serverStage: TrackingStage = ["placed", "accepted"].includes(liveTracking.status) ? "confirmed" : liveTracking.status === "ready" ? "preparing" : "onway";
    setTracking((current) => current ? { ...current, restaurant: liveTracking.restaurant, stage: serverStage } : current);
  }, [liveTracking]);

  const addItem = (restaurant: Restaurant, item: MenuItem) => {
    if (cartRestaurant && cartRestaurant.id !== restaurant.id) {
      setCartRestaurant(restaurant);
      setCart([{ item, quantity: 1 }]);
      toast("Hemos iniciado una nueva cesta", { description: `Tu pedido ahora será de ${restaurant.name}.` });
    } else {
      setCartRestaurant(restaurant);
      setCart((current) => {
        const existing = current.find((line) => line.item.id === item.id);
        if (existing) return current.map((line) => line.item.id === item.id ? { ...line, quantity: line.quantity + 1 } : line);
        return [...current, { item, quantity: 1 }];
      });
      toast.success(`${item.name} añadido`);
    }
  };

  const changeQuantity = (itemId: string, quantity: number) => {
    setCart((current) => {
      const next = quantity <= 0 ? current.filter((line) => line.item.id !== itemId) : current.map((line) => line.item.id === itemId ? { ...line, quantity } : line);
      if (next.length === 0) setCartRestaurant(null);
      return next;
    });
  };

  const submitOrder = () => {
    if (!cartRestaurant || !cart.length) return;
    if (!isAuthenticated) {
      toast.error("Inicia sesión para realizar el pedido", { description: "Tu cesta se conservará mientras accedes a tu cuenta de cliente." });
      window.dispatchEvent(new CustomEvent("piki:open-customer-auth"));
      return;
    }
    if (!deliveryLocation) { toast.error("Selecciona una dirección válida", { description: "El pedido necesita coordenadas para poder asignarse a un Rider." }); setAddressOpen(true); return; }
    checkoutMutation.mutate(
      { restaurantId: cartRestaurant.id, address, deliveryLocation, items: cart.map((line) => ({ id: line.item.id, quantity: line.quantity })), total, paymentMethod: "cash" },
      {
        onSuccess: ({ checkoutUrl, orderId, totalCents }) => {
          const confirmedTotal = Number.isFinite(totalCents) ? totalCents / 100 : total;
          setCheckoutOpen(false);
          if (paymentMethod === "cash" || !checkoutUrl) {
            setTracking({ id: orderId, restaurant: cartRestaurant.name, eta: "actualizando…", stage: "confirmed", paymentMethod: "cash", totalCents: Number.isFinite(totalCents) ? totalCents : Math.round(total * 100) });
            setCart([]); setCartRestaurant(null);
            toast.success("Pedido confirmado", { description: `Paga ${money.format(confirmedTotal)} en efectivo al Rider cuando te lo entregue. No se ha cobrado online.` });
            return;
          }
          const opened = window.open(checkoutUrl, "_blank", "noopener,noreferrer");
          if (!opened) window.location.assign(checkoutUrl);
          toast.success(paymentMethod === "bizum" ? "Abriendo pago con Bizum" : "Abriendo pago seguro", { description: `Pedido ${orderId} reservado hasta que Stripe confirme el pago.` });
        },
        onError: (error) => toast.error("No se pudo iniciar el pago", { description: error.message || (paymentMethod === "cash" ? "No se pudo sincronizar el pedido. No se ha confirmado ni cobrado." : "Revisa la configuración de Stripe.") }),
      },
    );
  };

  return (
    <div className="piki-app min-h-screen overflow-x-hidden bg-[#FFFDF5] text-[#171715]"><PikiSplash service="delivery" />
      <header className="sticky top-0 z-30 border-b border-[#ece3d9]/80 bg-[#FFFDF5]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button className="flex items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Inicio de PIKI">
            <span className="grid h-9 w-9 place-items-center rounded-[13px] bg-[#FFD72E] text-xl font-black text-[#171715] shadow-[0_7px_15px_rgba(255,215,46,.32)]">P</span>
            <span className="font-display text-2xl font-bold tracking-[-0.06em]">PIKI</span>
          </button>
          <nav className="hidden items-center gap-7 text-sm font-bold text-[#536056] md:flex">
            <button onClick={() => document.getElementById("explorar")?.scrollIntoView({ behavior: "smooth" })} className="transition hover:text-[#171715]">Explorar</button>
            <button onClick={() => document.getElementById("restaurantes")?.scrollIntoView({ behavior: "smooth" })} className="transition hover:text-[#171715]">Restaurantes</button>
            <button onClick={() => toast("Próximamente", { description: "Las ventajas PIKI Plus estarán disponibles pronto." })} className="transition hover:text-[#171715]">PIKI Plus</button>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={openAddressDialog} className="hidden max-w-[240px] items-center gap-2 rounded-full border border-[#e5dbd0] bg-white px-3 py-2 text-sm font-semibold text-[#304037] shadow-sm transition hover:border-[#bdc9b9] sm:flex"><MapPin className="h-4 w-4 shrink-0 text-[#FFD72E]" /><span className="truncate">{address}</span><ChevronDown className="h-3.5 w-3.5" /></button>
            <ThemeToggle />
            {isAuthenticated && <CustomerNotificationCenter authenticated />}
            <button onClick={() => setCartOpen(true)} className="relative grid h-10 w-10 place-items-center rounded-full bg-[#171715] text-white transition hover:bg-[#171715] active:scale-95" aria-label="Abrir cesta"><ShoppingBag className="h-4.5 w-4.5" />{cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#FFD72E] px-1 text-[10px] font-extrabold">{cartCount}</span>}</button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="grid h-10 w-10 place-items-center rounded-full border border-[#e5dbd0] bg-white text-[#171715] md:hidden" aria-label="Abrir menú"><Menu className="h-5 w-5" /></button>
          </div>
        </div>
        {menuOpen && <div className="border-t border-[#eee3d7] bg-white px-5 py-4 md:hidden"><div className="flex flex-col gap-3 text-sm font-bold"><button className="text-left" onClick={() => { setMenuOpen(false); document.getElementById("explorar")?.scrollIntoView({ behavior: "smooth" }); }}>Explorar</button><button className="text-left" onClick={() => { setMenuOpen(false); document.getElementById("restaurantes")?.scrollIntoView({ behavior: "smooth" }); }}>Restaurantes</button><button className="text-left" onClick={openAddressDialog}>Cambiar dirección</button></div></div>}
      </header>

      <main><div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8"><InstallAppBanner service="delivery" /></div>
        <section className="piki-grid px-4 pb-8 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-9">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-[#FFD72E] shadow-[0_24px_60px_rgba(31,43,33,.18)] lg:grid-cols-[1.02fr_.98fr]">
            <div className="relative z-10 p-7 sm:p-10 lg:p-14">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,.32),transparent_38%)]" />
              <div className="relative max-w-xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#171715] px-3 py-1.5 text-xs font-bold text-[#FFD72E]"><Sparkles className="h-3.5 w-3.5 text-[#FFD72E]" /> PIKI Delivery · Cerca de ti.</div>
                <h1 className="font-display text-[2.8rem] font-semibold leading-[.95] tracking-[-0.065em] text-[#171715] sm:text-6xl lg:text-7xl">Pide lo que quieras.<br /><span className="text-[#171715]">Recibe. Disfruta.</span></h1>
                <p className="mt-6 max-w-md text-base leading-relaxed text-[#2c2b20] sm:text-lg">Restaurantes, supermercados y tus antojos favoritos. Todo llega rápido, cerca de ti y con la alegría de PIKI.</p>
                <button onClick={() => document.getElementById("explorar")?.scrollIntoView({ behavior: "smooth" })} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#171715] px-5 py-3 text-sm font-extrabold text-[#FFD72E] shadow-[0_10px_20px_rgba(31,31,20,.2)] transition hover:bg-black active:scale-[.98]">Pedir ahora <ArrowRight className="h-4 w-4" /></button>
                <button onClick={openAddressDialog} className="mt-7 flex items-center gap-2 text-sm font-semibold text-[#29281e] transition hover:text-black"><MapPin className="h-4 w-4 text-[#171715]" /> Entregando en <span className="border-b border-dashed border-[#171715]/45">{address}</span></button>
              </div>
            </div>
            <div className="relative min-h-[320px] overflow-hidden bg-[#171715] lg:min-h-full"><img src="/piki-hero.webp" alt="PIKI Delivery: avispa repartidora, comida y app" className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 hover:scale-[1.02]" /><div className="absolute inset-0 bg-gradient-to-r from-[#FFD72E]/18 via-transparent to-[#171715]/15" /><div className="absolute bottom-5 right-5 rounded-2xl bg-[#FFFDF5]/95 p-3.5 shadow-xl backdrop-blur"><div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#FFD72E] text-[#171715]"><Bike className="h-5 w-5" /></div><div><p className="text-xs font-bold text-[#667267]">Tiempo medio</p><p className="text-sm font-extrabold text-[#171715]">Menos de 30 min</p></div></div></div></div>
          </div>
        </section>

        <section id="explorar" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionTitle eyebrow="Elige tu antojo" title="¿Qué te apetece hoy?" />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-7">
            {categories.map(({ label, icon: Icon, hue }) => (
              <button key={label} onClick={() => setCategory(label)} className={`group flex min-w-[116px] flex-col items-start gap-3 rounded-2xl border p-4 text-left transition sm:min-w-0 ${category === label ? "border-[#171715] bg-[#FFF9DD] shadow-[0_8px_18px_rgba(49,91,63,.08)]" : "border-[#ede4da] bg-white hover:-translate-y-0.5 hover:border-[#cdddc7]"}`}>
                <span className={`grid h-11 w-11 place-items-center rounded-[14px] ${hue}`}><Icon className="h-5 w-5" /></span>
                <span className="text-sm font-extrabold text-[#263229]">{label}</span>
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="cobertura-piki" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="rounded-[1.8rem] border border-[#eadfce] bg-[#fff8d9] p-6 sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#bd4f2e]">PIKI cerca de ti</p>
            <h2 id="cobertura-piki" className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-[#171715] sm:text-4xl">Delivery en Xàtiva y alrededores</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#526056] sm:text-base">Pide comida, productos y tus favoritos a negocios locales de Xàtiva, sus pedanías y las localidades cercanas. PIKI conecta restaurantes partners con clientes y riders de la zona.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-[#3a473d]">
              {['Xàtiva', 'Annauir', 'Bixquert', 'Sorió', 'El Genovés', 'Novetlè', 'La Llosa de Ranes', 'Vallés', 'Rotglà i Corberà', "L'Alcúdia de Crespins", 'Canals', 'Montesa', 'Barxeta'].map((place) => <span key={place} className="rounded-full bg-white px-3 py-2 shadow-sm">{place}</span>)}
            </div>
          </div>
        </section>

        <section id="restaurantes" className="mx-auto max-w-7xl px-4 pb-28 pt-2 sm:px-6 lg:px-8">
          <SectionTitle eyebrow="Ahora cerca de ti" title="Comida que merece el desvío" action="Ver todos" />
          <div className="mb-7 flex flex-col gap-3 rounded-2xl border border-[#e9dfd5] bg-white p-3 shadow-[0_8px_20px_rgba(54,42,31,.04)] sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-xl bg-[#faf6f0] px-3.5 py-3"><Search className="h-5 w-5 text-[#718073]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Busca un restaurante o tipo de comida" className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-[#9aa49b]" aria-label="Buscar restaurantes" /></div>
            <button onClick={() => { setSearch(""); setCategory("Todos"); }} className="flex items-center justify-center gap-2 rounded-xl border border-[#e8ded4] px-4 py-3 text-sm font-bold text-[#3a473d] transition hover:bg-[#faf6f0]" aria-label="Buscar en todos los comercios"><Search className="h-4 w-4 text-[#FFD72E]" /> Buscar <ChevronDown className="h-4 w-4" /></button>
          </div>
          {isLoading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((index) => <div key={index} className="h-[280px] animate-pulse rounded-[1.55rem] bg-[#eee6dd]" />)}</div> : restaurants?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} onOpen={setSelectedRestaurant} />)}</div> : <div className="rounded-[1.6rem] border border-dashed border-[#d9d0c5] bg-[#fffcf8] px-6 py-16 text-center"><Search className="mx-auto h-8 w-8 text-[#a3afa2]" /><h3 className="mt-4 text-lg font-extrabold">No encontramos ese sabor</h3><p className="mt-1 text-sm text-[#68746a]">Prueba con otra búsqueda o vuelve a ver todo el barrio.</p><button onClick={() => { setSearch(""); setCategory("Todos"); }} className="mt-5 rounded-full bg-[#171715] px-4 py-2 text-sm font-bold text-white">Ver todos</button></div>}
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#e8ded4] bg-[#FFFDF5]/95 px-4 py-3 backdrop-blur lg:hidden"><button onClick={() => setCartOpen(true)} className="flex w-full items-center justify-between rounded-xl bg-[#171715] px-4 py-3 text-white shadow-lg"><span className="flex items-center gap-2 text-sm font-bold"><ShoppingBag className="h-4 w-4" /> {cartCount ? `${cartCount} en tu cesta` : "Tu cesta está vacía"}</span><span className="text-sm font-extrabold">{cartCount ? money.format(total) : "Ver cesta"}</span></button></div>

      {selectedRestaurant && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#171715]/45 p-0 backdrop-blur-sm sm:p-4" onMouseDown={() => setSelectedRestaurant(null)}>
          <div className="relative flex max-h-[96vh] w-full max-w-[770px] flex-col overflow-hidden rounded-none bg-[#FFFDF5] shadow-2xl sm:rounded-[1.8rem]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="relative h-[260px] shrink-0 overflow-hidden sm:h-[290px]">
              <img src={selectedRestaurant.image} alt={`Imagen de ${selectedRestaurant.name}`} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#171715]/80 via-[#171715]/10 to-black/10" />
              <button onClick={() => setSelectedRestaurant(null)} className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#171715] shadow-lg" aria-label="Cerrar carta"><X className="h-5 w-5" /></button>
              <div className="absolute bottom-5 left-6 right-6 text-white sm:left-8 sm:right-8"><p className="mb-2 text-xs font-extrabold uppercase tracking-[.16em] text-[#FFE88A]">{selectedRestaurant.cuisine} · {selectedRestaurant.category}</p><h1 className="font-display text-4xl font-semibold leading-none tracking-[-.05em] sm:text-5xl">{selectedRestaurant.name}</h1><div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold"><span className="flex items-center gap-1"><Star className="h-4 w-4 fill-[#f9b43d] text-[#f9b43d]" /> {selectedRestaurant.rating.toFixed(1)} ({selectedRestaurant.reviews})</span><span>·</span><span>{selectedRestaurant.eta}</span><span>·</span><span>{selectedRestaurant.fee === 0 ? "Envío gratis" : `Envío ${money.format(selectedRestaurant.fee)}`}</span></div></div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-7"><div className="flex items-start justify-between gap-4"><p className="max-w-2xl text-sm leading-relaxed text-[#647166] sm:text-base">{selectedRestaurant.tagline}</p><span className="hidden shrink-0 rounded-full bg-[#FFF2AD] px-3 py-1.5 text-xs font-bold text-[#171715] sm:inline-flex">Entrega sostenible</span></div><div className="mt-7 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">Carta completa</p><h2 className="mt-1 font-display text-3xl font-semibold tracking-[-.04em]">Lo más pedido</h2></div><span className="text-xs font-bold text-[#7a887b]">{selectedRestaurant.menu.length} productos</span></div><div className="mt-5 space-y-3">{selectedRestaurant.menu.map((item) => { const quantity = cart.find((line) => line.item.id === item.id)?.quantity ?? 0; return <article key={item.id} className="flex gap-4 rounded-2xl border border-[#e5dbd0] bg-white p-4 shadow-[0_4px_12px_rgba(61,49,36,.04)] transition hover:border-[#c9d5bf]"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-extrabold text-[#263229]">{item.name}</h3>{item.popular && <span className="rounded-full bg-[#ffe6dc] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#c14f2d]">Top</span>}{item.vegetarian && <Leaf className="h-3.5 w-3.5 text-[#4f883c]" />}</div><p className="mt-1 text-sm leading-relaxed text-[#68746a]">{item.description || "Preparado al momento con ingredientes seleccionados."}</p><p className="mt-2 text-sm font-extrabold text-[#263229]">{money.format(item.price)}</p></div>{quantity ? <QuantityControl quantity={quantity} onChange={(next) => changeQuantity(item.id, next)} /> : <button onClick={() => addItem(selectedRestaurant, item)} className="grid h-10 w-10 shrink-0 place-items-center self-center rounded-full bg-[#171715] text-white transition hover:bg-black active:scale-95" aria-label={`Añadir ${item.name}`}><Plus className="h-5 w-5" /></button>}</article>; })}</div></div>
            {cartCount > 0 && <div className="shrink-0 border-t border-[#e8ded4] bg-[#FFFDF5] p-4 sm:p-5"><button onClick={() => { setSelectedRestaurant(null); setCartOpen(true); }} className="flex w-full items-center justify-between rounded-xl bg-[#171715] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-black"><span>Añade productos a la cesta · {cartCount}</span><span className="flex items-center gap-2">Ver cesta <ArrowRight className="h-4 w-4" /></span></button></div>}
          </div>
        </div>
      )}

      {cartOpen && <div className="fixed inset-0 z-50 bg-[#171715]/35 backdrop-blur-sm" onMouseDown={() => setCartOpen(false)}><aside onMouseDown={(event) => event.stopPropagation()} className="ml-auto flex h-full w-full max-w-md flex-col bg-[#FFFDF5] shadow-2xl"><div className="flex items-center justify-between border-b border-[#ece2d8] p-5"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">Tu selección</p><h2 className="font-display text-3xl font-semibold tracking-[-.05em]">La cesta</h2></div><button onClick={() => setCartOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-[#e5dbd0] bg-white"><X className="h-5 w-5" /></button></div>{cartRestaurant && cart.length ? <><div className="flex-1 overflow-y-auto p-5"><div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#FFF4BE] p-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#171715] text-white"><Store className="h-4 w-4" /></div><div><p className="text-xs font-bold text-[#617162]">Pedido de</p><p className="text-sm font-extrabold">{cartRestaurant.name}</p></div></div><div className="space-y-4">{cart.map((line) => <div key={line.item.id} className="flex gap-3"><div className="min-w-0 flex-1"><p className="font-bold">{line.item.name}</p><p className="mt-0.5 text-sm text-[#68746a]">{money.format(line.item.price)} · unidad</p></div><div className="flex flex-col items-end gap-2"><p className="text-sm font-extrabold">{money.format(line.item.price * line.quantity)}</p><QuantityControl quantity={line.quantity} onChange={(next) => changeQuantity(line.item.id, next)} /></div></div>)}</div></div><div className="border-t border-[#ece2d8] p-5"><div className="mb-4 space-y-2 text-sm"><div className="flex justify-between text-[#667267]"><span>Productos</span><span>{money.format(subtotal)}</span></div><div className="flex justify-between text-[#667267]"><span>Entrega</span><span>{deliveryFee ? money.format(deliveryFee) : "Gratis"}</span></div><div className="flex justify-between text-[#667267]"><span>Servicio</span><span>{money.format(serviceFee)}</span></div><div className="mt-3 flex justify-between border-t border-[#e6ddd2] pt-3 text-base font-extrabold text-[#171715]"><span>Total</span><span>{money.format(total)}</span></div></div><button onClick={() => { setCartOpen(false); setCheckoutOpen(true); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFD72E] py-3.5 text-sm font-extrabold text-white shadow-[0_10px_20px_rgba(255,107,61,.22)] transition hover:bg-[#E8C600] active:scale-[.98]">Continuar al pago <ArrowRight className="h-4 w-4" /></button></div></> : <div className="flex flex-1 flex-col items-center justify-center px-9 text-center"><div className="grid h-16 w-16 place-items-center rounded-[1.4rem] bg-[#f2e9df] text-[#b5724c]"><ShoppingBag className="h-7 w-7" /></div><h3 className="mt-5 font-display text-3xl font-semibold tracking-[-.05em]">Aún no hay nada</h3><p className="mt-2 text-sm leading-relaxed text-[#68746a]">Explora los restaurantes de tu barrio y guarda algo rico para luego.</p><button onClick={() => { setCartOpen(false); document.getElementById("restaurantes")?.scrollIntoView({ behavior: "smooth" }); }} className="mt-6 rounded-full bg-[#171715] px-5 py-2.5 text-sm font-bold text-white">Explorar restaurantes</button></div>}</aside></div>}

      {checkoutOpen && <div className="fixed inset-0 z-[60] grid place-items-end bg-[#171715]/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-6"><div className="w-full max-w-lg rounded-t-[2rem] bg-[#FFFDF5] p-6 shadow-2xl sm:rounded-[2rem] sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">Revisión final</p><h2 className="font-display text-3xl font-semibold tracking-[-.05em]">Casi en camino</h2></div><button onClick={() => setCheckoutOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-[#e5dbd0] bg-white"><X className="h-4 w-4" /></button></div><div className="mt-6 space-y-4"><div className="rounded-2xl border border-[#e9dfd5] bg-white p-4"><div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-[#FFD72E]" /><div className="min-w-0 flex-1"><p className="text-xs font-bold text-[#69756a]">Entregar en</p><p className="truncate text-sm font-extrabold">{address}</p></div><button onClick={() => { setCheckoutOpen(false); setAddressOpen(true); }} className="text-xs font-extrabold text-[#171715]">Cambiar</button></div></div><section className="rounded-2xl border border-[#e9dfd5] bg-white p-4"><div className="mb-3 flex items-center gap-3"><CreditCard className="h-5 w-5 text-[#171715]" /><div><p className="text-xs font-bold text-[#69756a]">Método de pago</p><p className="text-sm font-extrabold">Elige cómo quieres pagar</p></div></div><div className="space-y-2">{([
  ["stripe", "Tarjeta, Apple Pay o Google Pay", "Temporalmente no disponible. Los pagos online se activarán tras la configuración aprobada de la pasarela.", CreditCard, false],
  ["bizum", "Bizum", "Temporalmente no disponible. PIKI avisará cuando Bizum esté habilitado.", CreditCard, false],
  ["cash", "Contrarreembolso · efectivo al Rider", `No pagas ahora. El Rider cobrará ${money.format(total)} en efectivo al entregar.`, Banknote, true],
] as const).map(([method, title, note, Icon, enabled]) => <button type="button" key={method} disabled={!enabled} onClick={() => enabled && setPaymentMethod(method)} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${paymentMethod === method ? "border-[#171715] bg-[#FFF4BE] shadow-sm" : "border-[#ebe3da]"} ${enabled ? "hover:border-[#c6b8a9]" : "cursor-not-allowed opacity-55"}`}><span className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full border-2 ${paymentMethod === method ? "border-[#171715] bg-[#171715]" : "border-[#b9b2a9] bg-white"}`}>{paymentMethod === method && <Check className="h-3 w-3 text-white" />}</span><Icon className="mt-0.5 h-4 w-4 shrink-0" /><span><span className="block text-sm font-extrabold">{title}{!enabled && <span className="ml-2 text-[10px] uppercase tracking-wide text-[#a04b35]">No disponible</span>}</span><span className="mt-0.5 block text-xs leading-relaxed text-[#68756a]">{note}</span></span></button>)}</div></section><div className="flex items-center justify-between rounded-xl bg-[#f3eee7] px-4 py-3"><span className="text-sm font-bold">Total del pedido</span><span className="text-lg font-extrabold">{money.format(total)}</span></div></div><button disabled={checkoutMutation.isPending} onClick={submitOrder} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFD72E] py-3.5 text-sm font-extrabold text-white transition hover:bg-[#E8C600] disabled:opacity-60">{checkoutMutation.isPending ? "Confirmando pedido…" : paymentMethod === "cash" ? "Confirmar pedido · pagar al recibir" : "Continuar al pago seguro"}<ArrowRight className="h-4 w-4" /></button><p className="mt-3 text-center text-xs leading-relaxed text-[#7b857d]">No se cobra ahora: el pedido queda como contrarreembolso hasta que el Rider confirma la entrega y registra el efectivo.</p></div></div>}

      {addressOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-[#171715]/45 p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-[2rem] bg-[#FFFDF5] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">Zona de entrega</p><h2 className="font-display text-3xl font-semibold tracking-[-.05em]">¿Dónde estás?</h2><p className="mt-1 text-xs text-[#68746a]">Busca cualquier calle de Xàtiva, pedanía o localidad de la Comunitat Valenciana.</p></div><button onClick={() => setAddressOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-[#e5dbd0] bg-white"><X className="h-4 w-4" /></button></div><div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[#e9dfd5] bg-[#f8fbf6] p-3"><div><p className="text-sm font-extrabold text-[#314037]">Usar mi ubicación actual</p><p className="text-xs text-[#68746a]">Se solicitará GPS real solo para este pedido.</p></div><button type="button" onClick={useDeviceLocation} disabled={deviceLocationBusy} className="rounded-xl bg-[#171715] px-3 py-2 text-xs font-extrabold text-white disabled:opacity-60">{deviceLocationBusy ? "Localizando…" : "Usar GPS"}</button></div><div className="mt-3 rounded-2xl border border-[#e9dfd5] bg-white p-3"><label className="flex items-center gap-3"><MapPin className="h-5 w-5 text-[#FFD72E]" /><input autoFocus value={addressDraft} onChange={(event) => { setAddressDraft(event.target.value); setDeliveryLocation(null); }} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" aria-label="Calle, número, localidad o código postal" placeholder="Calle, número, localidad o CP" /></label></div>{locationsLoading && <p className="mt-3 text-xs font-semibold text-[#68746a]">Buscando calles y localidades…</p>}{locationSuggestions.length > 0 && <div className="mt-2 max-h-52 overflow-y-auto rounded-2xl border border-[#e9dfd5] bg-white p-1">{locationSuggestions.map((suggestion) => <button key={`${suggestion.latitude}-${suggestion.longitude}-${suggestion.label}`} onClick={() => { setAddressDraft(suggestion.label); setDeliveryLocation({ latitude: suggestion.latitude, longitude: suggestion.longitude }); setLocationSuggestions([]); }} className="flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#314037] hover:bg-[#FFF4BE]"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#dc5c35]" /><span>{suggestion.label}</span></button>)}</div>}<div className="mt-3 flex items-start gap-2 rounded-xl bg-[#FFF4BE] p-3 text-xs leading-relaxed text-[#526952]"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#171715]" />La selección y los tiempos se ajustan a tu zona. Los resultados proceden del buscador geográfico de PIKI.</div><button onClick={saveSelectedAddress} disabled={saveDeliveryAddress.isPending} className="mt-6 w-full rounded-xl bg-[#171715] py-3.5 text-sm font-extrabold text-white transition hover:bg-[#050505] disabled:opacity-60">{saveDeliveryAddress.isPending ? "Guardando dirección…" : "Guardar esta dirección"}</button><p className="mt-3 text-center text-xs leading-relaxed text-[#7b857d]">La guardaremos para tus próximos envíos. Puedes modificarla cuando quieras.</p></div></div>}

      {tracking && <div className="fixed inset-0 z-[80] grid place-items-center bg-[#171715]/45 p-4 backdrop-blur-sm"><div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-[#FFFDF5] shadow-2xl"><div className="relative overflow-hidden bg-[#171715] p-6 text-white"><div className="absolute -right-12 -top-10 h-44 w-44 rounded-full border-[24px] border-white/10" /><button onClick={() => setTracking(null)} className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-white/15"><X className="h-4 w-4" /></button><p className="relative text-xs font-bold uppercase tracking-[.16em] text-[#cfe1c8]">Pedido {tracking.id}</p><h2 className="relative mt-2 font-display text-3xl font-semibold tracking-[-.05em]">{tracking.stage === "confirmed" ? "¡Lo tenemos!" : tracking.stage === "preparing" ? "Ya están cocinando" : "Va de camino"}</h2><p className="relative mt-2 text-sm text-[#e3efe0]">{tracking.restaurant} · llegada estimada {tracking.eta}</p></div><div className="p-6"><div className="relative grid grid-cols-3 before:absolute before:left-[16.5%] before:right-[16.5%] before:top-5 before:h-0.5 before:bg-[#dfe6dc]">{([{ label: "Confirmado", icon: Check, state: "confirmed" }, { label: "En cocina", icon: Utensils, state: "preparing" }, { label: "En ruta", icon: Bike, state: "onway" }] as const).map(({ label, icon: Icon, state }, index) => { const active = ["confirmed", "preparing", "onway"].indexOf(tracking.stage) >= index; return <div key={state} className="relative z-10 flex flex-col items-center gap-2 text-center"><div className={`grid h-10 w-10 place-items-center rounded-full border-4 border-[#FFFDF5] ${active ? "bg-[#FFD72E] text-white" : "bg-[#dfe6dc] text-[#758275]"}`}><Icon className="h-4 w-4" /></div><span className={`text-xs font-bold ${active ? "text-[#263229]" : "text-[#879187]"}`}>{label}</span></div>; })}</div>{(tracking.paymentMethod === "cash" || liveTracking?.paymentMethod === "cash") && <div className="mt-5 rounded-2xl border border-[#eadfce] bg-[#fff8d9] p-4"><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#bd4f2e]">{liveTracking?.paymentState === "paid" ? "Efectivo cobrado al entregar" : "Contrarreembolso"}</p><p className="mt-1 text-sm font-semibold text-[#314037]">{liveTracking?.paymentState === "paid" ? `El Rider registró el cobro de ${trackingTotalCents == null ? "el importe del pedido" : money.format(trackingTotalCents / 100)}.` : `Pagarás ${trackingTotalCents == null ? "el importe del pedido" : money.format(trackingTotalCents / 100)} al Rider en efectivo cuando te entregue el pedido. No se ha cobrado online.`}</p></div>}<CustomerLiveTracking isAuthenticated={isAuthenticated} tracking={customerTracking.data} loading={customerTracking.isLoading} /><button onClick={() => setChatOpen(true)} disabled={!isAuthenticated || !["picked_up", "on_the_way"].includes(liveTracking?.status || "")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d8e4d3] bg-white py-3 text-sm font-extrabold text-[#314037] disabled:cursor-not-allowed disabled:opacity-50"><MessageCircle className="h-4 w-4" /> Chat con tu rider</button>{chatOpen && <OrderChat orderId={tracking.id} isAuthenticated={isAuthenticated} onClose={() => setChatOpen(false)} />}<div className="mt-5 rounded-2xl bg-white p-4 shadow-[0_6px_18px_rgba(53,45,35,.06)]"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffe8df] text-[#d45731]"><PackageCheck className="h-5 w-5" /></div><div><p className="text-sm font-extrabold">Sigue disfrutando del día</p><p className="mt-0.5 text-xs text-[#6c786e]">Te avisaremos cuando el repartidor esté cerca.</p></div></div></div><button onClick={() => setTracking(null)} className="mt-5 w-full rounded-xl border border-[#ded5cb] bg-white py-3 text-sm font-extrabold text-[#314037]">Seguir explorando</button></div></div></div>}
      {tracking && <DeliveryCredentials orderId={tracking.id} status={liveTracking?.status} />}

      <AccountHub />

      <footer className="hidden border-t border-[#ede3d9] bg-[#f6efe6] px-6 py-10 lg:block"><div className="mx-auto flex max-w-7xl items-center justify-between"><div><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-[11px] bg-[#FFD72E] text-sm font-black text-[#171715]">P</span><span className="font-display text-xl font-bold tracking-[-.06em]">PIKI</span></div><p className="mt-2 text-sm text-[#68756a]">Comida local, a tu ritmo.</p></div><p className="text-sm font-medium text-[#7a857b]">PIKI · Pago digital seguro</p></div></footer>
    </div>
  );
}

function OrderChat({ orderId, isAuthenticated, onClose }: { orderId: string; isAuthenticated: boolean; onClose: () => void }) {
  const [body, setBody] = useState("");
  const { data: messages = [], isLoading } = trpc.order.messages.useQuery({ id: orderId }, { enabled: isAuthenticated, refetchInterval: 4000, retry: false });
  const send = trpc.order.sendMessage.useMutation({ onSuccess: () => setBody("") });
  if (!isAuthenticated) return null;
  return <div className="fixed inset-0 z-[95] grid place-items-center bg-[#171715]/55 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-label="Chat con el rider" className="flex max-h-[78vh] w-full max-w-md flex-col overflow-hidden rounded-[1.75rem] bg-[#FFFDF5] shadow-2xl"><div className="flex items-center justify-between border-b border-[#e2eadf] p-4"><div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#315b3f]" /><div><p className="text-sm font-extrabold">Chat con tu rider</p><p className="text-xs text-[#6c786e]">Mensajes privados mientras el pedido está en reparto.</p></div></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-[#dce6d8] bg-white" aria-label="Cerrar chat"><X className="h-4 w-4" /></button></div><div className="p-4"><div className="mt-3 max-h-36 space-y-2 overflow-y-auto">{isLoading ? <p className="text-xs text-[#718076]">Cargando conversación…</p> : messages.length ? messages.map((message) => <div key={message.id} className={`rounded-xl px-3 py-2 text-xs ${message.senderRole === "customer" ? "ml-8 bg-[#fff4be]" : "mr-8 bg-[#f2f6ef]"}`}><p>{message.body}</p><span className="mt-1 block text-[10px] text-[#718076]">{new Date(message.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span></div>) : <p className="text-xs text-[#718076]">Todavía no hay mensajes.</p>}</div><form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (body.trim()) send.mutate({ id: orderId, body: body.trim() }); }}><input value={body} onChange={(event) => setBody(event.target.value)} maxLength={500} placeholder="Escribe un mensaje…" className="min-w-0 flex-1 rounded-xl border border-[#e2eadf] px-3 py-2 text-xs outline-none focus:border-[#315b3f]" disabled={send.isPending} /><button className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#171715] text-white disabled:opacity-50" disabled={!body.trim() || send.isPending} aria-label="Enviar mensaje"><MessageCircle className="h-4 w-4" /></button></form></div></section></div>;
}
function CustomerLiveTracking({ isAuthenticated, tracking, loading }: { isAuthenticated: boolean; tracking: { available: boolean; riderName?: string; riderPhotoUrl?: string | null; vehicle?: string; phase?: string; etaMinutes?: number | null; latitude?: number; longitude?: number; accuracyMeters?: number | null; updatedAt?: number } | undefined; loading: boolean }) {
  if (!isAuthenticated) return <div className="mt-7 rounded-2xl border border-[#dfe6dc] bg-[#f5f8f3] p-4 text-xs leading-relaxed text-[#647166]">Inicia sesión con la cuenta que realizó el pedido para ver la ubicación del rider en tiempo real.</div>;
  if (loading) return <div className="mt-7 h-28 animate-pulse rounded-2xl bg-[#edf2ea]" />;
  const riderPhoto = tracking?.riderPhotoUrl || (tracking?.riderName ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(tracking.riderName)}&backgroundColor=143b2b&fontFamily=Arial` : "");
  const riderCard = tracking?.riderName ? <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[#dbe5d7] bg-white p-3"><img src={riderPhoto} alt={`Foto de ${tracking.riderName}`} className="h-12 w-12 rounded-full object-cover ring-2 ring-[#e7f2e4]" /><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#718076]">Tu rider</p><p className="text-base font-extrabold text-[#171715]">{tracking.riderName}</p><p className="text-xs text-[#6c786e]">{tracking.vehicle === "moto" ? "Moto" : tracking.vehicle === "car" ? "Coche" : tracking.vehicle === "electric_scooter" ? "Patinete eléctrico" : "Bicicleta"}</p></div></div> : null;
  if (!tracking?.available || tracking.latitude === undefined || tracking.longitude === undefined) return <div className="mt-7">{riderCard}<div className="rounded-2xl border border-[#dfe6dc] bg-[#f5f8f3] p-4 text-xs leading-relaxed text-[#647166]">Tu rider ya está asignado. El seguimiento GPS aparecerá en cuanto haya una señal reciente; la ubicación solo se comparte durante la entrega.</div></div>;
  return <section className="mt-7">{riderCard}<div className="overflow-hidden rounded-2xl border border-[#dbe5d7] bg-white"><div className="flex items-center justify-between gap-3 px-4 py-3"><div className="flex items-center gap-2"><Navigation className="h-4 w-4 text-[#171715]" /><div><p className="text-sm font-extrabold">{tracking.riderName || "Tu rider"} está en ruta</p><p className="text-xs text-[#6c786e]">{tracking.phase === "going_to_customer" ? "Yendo a tu domicilio" : tracking.phase === "going_to_restaurant" ? "Yendo al restaurante" : "Esperando que preparen tu pedido"}</p></div></div><span className="rounded-full bg-[#e7f2e4] px-2.5 py-1 text-[10px] font-extrabold text-[#171715]">EN DIRECTO</span></div><MapView className="h-52" initialCenter={{ lat: tracking.latitude, lng: tracking.longitude }} initialZoom={16} interactive={false} points={[{ lat: tracking.latitude, lng: tracking.longitude, label: `${tracking.riderName || "Tu rider"} · GPS`, kind: "rider" }]} /><p className="px-4 py-3 text-[11px] font-semibold text-[#748074]">Tiempo estimado: {tracking.etaMinutes ? `${tracking.etaMinutes} min` : "actualizando…"} · última señal {tracking.updatedAt ? new Date(tracking.updatedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "ahora"}</p></div></section>;
}

function DeliveryCredentials({ orderId, status }: { orderId: string; status?: string }) {
  const { isAuthenticated } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const { data } = trpc.order.deliveryCredentials.useQuery({ id: orderId }, { enabled: isAuthenticated && ["assigned", "picked_up", "delivering", "on_the_way"].includes(status || ""), refetchInterval: 5000, retry: false });
  useEffect(() => { if (data?.qrToken) QRCode.toDataURL(data.qrToken, { margin: 1, width: 180 }).then(setQrDataUrl).catch(() => setQrDataUrl("")); }, [data?.qrToken]);
  if (!isAuthenticated || !data?.available || data.state === "confirmed") return null;
  return <div className="fixed inset-0 z-[85] pointer-events-none flex items-end justify-center p-4"><div className="pointer-events-auto w-full max-w-md rounded-[1.4rem] border border-[#d8e3d4] bg-[#FFFDF5] p-4 shadow-2xl"><div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FFF4BE] text-[#171715]"><PackageCheck className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="text-sm font-extrabold">Código de entrega seguro</p><p className="mt-1 text-xs leading-relaxed text-[#68746a]">Muéstraselo al rider al recibir el pedido. La entrega solo se cierra con este PIN o QR.</p></div></div><div className="mt-4 grid grid-cols-[1fr_116px] gap-3"><div className="rounded-2xl bg-[#143b2b] p-4 text-white"><p className="text-xs font-bold text-[#cfe2cf]">PIN</p><p className="mt-2 font-mono text-4xl font-black tracking-[.18em]">{data.pin}</p></div><div className="grid place-items-center rounded-2xl bg-white p-2 ring-1 ring-[#e2eadf]">{qrDataUrl ? <img src={qrDataUrl} alt="QR de confirmación de entrega" className="h-24 w-24" /> : <span className="text-xs font-bold text-[#718076]">QR</span>}</div></div></div></div>;
}
