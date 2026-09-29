import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { InstallAppBanner } from "@/components/InstallAppBanner";
import { callNative, installationId, nativeBridgeAvailable, type NativeOrderTicket } from "@/lib/nativeBridge";
import {
  ArrowLeft,
  BellRing,
  Check,
  ChevronRight,
  Clock3,
  ImagePlus,
  Loader2,
  MenuSquare,
  Package,
  Pencil,
  PauseCircle,
  Plus,
  Printer,
  Save,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
  Volume2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type DraftItem = { name: string; description: string; price: string; imageUrl?: string; available: boolean };
const emptyItem: DraftItem = { name: "", description: "", price: "", available: true };
const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function cents(value: string) { return Math.round(Number(value.replace(",", ".")) * 100); }
function euro(value: number) { return (value / 100).toFixed(2).replace(".", ","); }
function decodeVapidKey(value: string) { const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "="); const raw = atob(padded); return Uint8Array.from(raw, (character) => character.charCodeAt(0)); }
function ticketItems(value: string): NativeOrderTicket["items"] { try { const items = JSON.parse(value) as Array<{ id?: string; quantity?: number; notes?: string }>; return items.map((item) => ({ name: item.id || "Producto", quantity: Math.max(1, item.quantity || 1), notes: item.notes })); } catch { return []; } }

export default function Partners() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const enabled = isAuthenticated && (user?.role === "partner" || user?.role === "admin");
  const { data: stores = [], isLoading } = trpc.partner.dashboard.useQuery(undefined, { enabled });
  const { data: incomingOrders = [], refetch: refetchOrders, dataUpdatedAt } = trpc.partner.orders.useQuery(undefined, { enabled, refetchInterval: 5000 });
  const pushConfig = trpc.partner.pushConfig.useQuery(undefined, { enabled });
  const createStore = trpc.partner.createStore.useMutation({ onSuccess: () => { void utils.partner.dashboard.invalidate(); } });
  const updateStore = trpc.partner.updateStore.useMutation({ onSuccess: () => { void utils.partner.dashboard.invalidate(); } });
  const updateOrder = trpc.partner.updateOrder.useMutation({ onSuccess: () => { void refetchOrders(); } });
  const subscribePush = trpc.partner.subscribePush.useMutation();
  const registerNativeDevice = trpc.partner.registerNativeDevice.useMutation();
  const addMenuItem = trpc.partner.addMenuItem.useMutation({ onSuccess: () => { void utils.partner.dashboard.invalidate(); } });
  const updateMenuItem = trpc.partner.updateMenuItem.useMutation({ onSuccess: () => { void utils.partner.dashboard.invalidate(); } });
  const deleteMenuItem = trpc.partner.deleteMenuItem.useMutation({ onSuccess: () => { void utils.partner.dashboard.invalidate(); } });
  const uploadImage = trpc.partner.uploadImage.useMutation();

  const [activeStoreId, setActiveStoreId] = useState<number | null>(null);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [newItems, setNewItems] = useState<DraftItem[]>([{ ...emptyItem }]);
  const [newStore, setNewStore] = useState({ name: "", cuisine: "Mediterránea", address: "", phone: "", email: "", description: "", prepMinutes: "20", minimumOrder: "0", coverImageUrl: "" });
  const [newItem, setNewItem] = useState<DraftItem>({ ...emptyItem });
  const [editStore, setEditStore] = useState({ name: "", cuisine: "", address: "", phone: "", email: "", description: "", prepMinutes: "20", minimumOrder: "0", coverImageUrl: "", scheduleJson: "" });
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [alertingOrder, setAlertingOrder] = useState<string | null>(null);
  const [nativeTerminal, setNativeTerminal] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const knownOrders = useRef(new Set<string>());
  useEffect(() => { const onOnline = () => setOnline(true); const onOffline = () => setOnline(false); window.addEventListener("online", onOnline); window.addEventListener("offline", onOffline); return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); }; }, []);

  const activeStore = useMemo(() => stores.find((store) => store.id === activeStoreId) ?? stores[0] ?? null, [stores, activeStoreId]);
  useEffect(() => { setNativeTerminal(nativeBridgeAvailable()); }, []);
  const playAlert = () => {
    if (!soundEnabled) return;
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    audioContext.current ??= new AudioCtor();
    const context = audioContext.current;
    void context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.setValueAtTime(660, context.currentTime + 0.18);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.45);
  };
  useEffect(() => {
    const pending = incomingOrders.find((order) => order.status === "placed");
    if (pending && !knownOrders.current.has(pending.publicCode)) {
      knownOrders.current.add(pending.publicCode);
      setAlertingOrder(pending.publicCode);
      playAlert();
      void callNative({ action: "alert.start", orderCode: pending.publicCode, restaurant: pending.restaurantName, customerName: pending.customerName || "Cliente" }).catch(() => undefined);
    }
  }, [incomingOrders, soundEnabled]);
  useEffect(() => {
    if (!alertingOrder || !soundEnabled) return;
    const interval = window.setInterval(playAlert, 1800);
    return () => window.clearInterval(interval);
  }, [alertingOrder, soundEnabled]);
  useEffect(() => { if (stores.length && !stores.some((store) => store.id === activeStoreId)) setActiveStoreId(stores[0].id); }, [stores, activeStoreId]);
  useEffect(() => {
    if (!activeStore) return;
    setEditStore({
      name: activeStore.name,
      cuisine: activeStore.cuisine,
      address: activeStore.address,
      phone: activeStore.phone || "",
      email: activeStore.email || "",
      description: activeStore.description || "",
      prepMinutes: String(activeStore.prepMinutes || 20),
      minimumOrder: euro(activeStore.minimumOrderCents || 0),
      coverImageUrl: activeStore.coverImageUrl || "",
      scheduleJson: activeStore.scheduleJson || "{\n  \"lunes-domingo\": \"12:00–23:30\"\n}",
    });
  }, [activeStore?.id]);

  const stopNativeAlert = (orderCode: string) => { void callNative({ action: "alert.stop", orderCode }).catch(() => undefined); };
  const printTicket = async (order: typeof incomingOrders[number]) => {
    const ticket: NativeOrderTicket = { orderCode: order.publicCode, restaurant: order.restaurantName, customerName: order.customerName || "Cliente", address: order.address, totalCents: order.totalCents, items: ticketItems(order.itemsJson) };
    try {
      const result = await callNative<{ printed?: boolean }>({ action: "printer.ticket", ticket });
      if (!result) return toast("Impresión disponible en el comandero SUNMI", { description: "Abre PIKI Partners desde el icono instalado en el terminal." });
      if (result.printed) toast.success("Ticket enviado a la impresora SUNMI");
    } catch { toast.error("No se pudo imprimir el ticket", { description: "Comprueba papel, tapa de impresora y conexión del comandero." }); }
  };
  const activateBackgroundAlerts = async () => {
    if (!activeStore) return toast.error("Selecciona un establecimiento antes de activar alertas");
    try {
      if (nativeBridgeAvailable()) {
        if (!pushConfig.data?.fcmConfigured) return toast("FCM pendiente de configuración", { description: "Falta cargar las credenciales seguras del proyecto Android en el servidor." });
        const result = await callNative<{ token?: string }>({ action: "push.token" });
        if (!result?.token) throw new Error("No se obtuvo token FCM");
        registerNativeDevice.mutate({ storeId: activeStore.id, installationId: installationId(), fcmToken: result.token }, { onSuccess: () => toast.success("Alertas nativas activadas", { description: "El SUNMI avisará aunque PIKI esté en segundo plano." }) });
        return;
      }
      if (!pushConfig.data?.webPushConfigured || !pushConfig.data.publicKey) return toast("Alertas en preparación", { description: "El equipo técnico debe activar las credenciales Web Push." });
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return toast.error("Este navegador no admite alertas de fondo");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return toast.error("Permiso de notificaciones no concedido");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeVapidKey(pushConfig.data.publicKey) });
      const data = subscription.toJSON();
      if (!data.endpoint || !data.keys?.p256dh || !data.keys.auth) throw new Error("Suscripción incompleta");
      subscribePush.mutate({ storeId: activeStore.id, installationId: installationId(), endpoint: data.endpoint, p256dh: data.keys.p256dh, auth: data.keys.auth }, { onSuccess: () => toast.success("Alertas de fondo activadas") });
    } catch { toast.error("No se pudieron activar las alertas", { description: "Comprueba permisos y conexión WiFi." }); }
  };

  const imageData = async (event: ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) return toast.error("Usa imágenes JPG, PNG o WebP");
    if (file.size > 4 * 1024 * 1024) return toast.error("La imagen no puede superar 4 MB");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      uploadImage.mutate({ fileName: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", dataUrl }, { onSuccess: ({ url }) => { callback(url); toast.success("Imagen subida"); }, onError: () => toast.error("No pudimos subir la imagen") });
    };
    reader.readAsDataURL(file);
  };

  const addInitialItem = () => setNewItems((current) => [...current, { ...emptyItem }]);
  const changeInitialItem = (index: number, patch: Partial<DraftItem>) => setNewItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const submitStore = () => {
    if (!newStore.name.trim() || !newStore.address.trim() || !newStore.email.trim()) return toast.error("Completa nombre, dirección y email de contacto");
    if (newItems.some((item) => !item.name.trim() || !Number.isFinite(cents(item.price)) || cents(item.price) < 1)) return toast.error("Añade al menos un plato con un precio válido");
    createStore.mutate({
      name: newStore.name.trim(), cuisine: newStore.cuisine, address: newStore.address.trim(), phone: newStore.phone.trim() || undefined, email: newStore.email.trim(), description: newStore.description.trim() || undefined,
      coverImageUrl: newStore.coverImageUrl || undefined, prepMinutes: Number(newStore.prepMinutes) || 20, minimumOrderCents: Math.max(0, cents(newStore.minimumOrder)), scheduleJson: JSON.stringify({ "lunes-domingo": "12:00–23:30" }),
      items: newItems.map((item) => ({ name: item.name.trim(), description: item.description.trim() || undefined, priceCents: cents(item.price), imageUrl: item.imageUrl || undefined, available: item.available ? 1 : 0 })),
    }, { onSuccess: ({ storeId }) => { toast.success("Establecimiento enviado a revisión", { description: "Puedes seguir preparando la carta mientras validamos los datos." }); setActiveStoreId(storeId); setShowStoreForm(false); setNewStore({ name: "", cuisine: "Mediterránea", address: "", phone: "", email: "", description: "", prepMinutes: "20", minimumOrder: "0", coverImageUrl: "" }); setNewItems([{ ...emptyItem }]); }, onError: (error) => toast.error("No se pudo guardar el establecimiento", { description: error.message }) });
  };
  const saveStoreDetails = () => {
    if (!activeStore) return;
    let scheduleJson = editStore.scheduleJson.trim();
    try { JSON.parse(scheduleJson); } catch { return toast.error("El horario debe tener formato JSON válido"); }
    updateStore.mutate({ storeId: activeStore.id, name: editStore.name.trim(), cuisine: editStore.cuisine, address: editStore.address.trim(), phone: editStore.phone.trim() || undefined, email: editStore.email.trim() || undefined, description: editStore.description.trim() || undefined, coverImageUrl: editStore.coverImageUrl || undefined, prepMinutes: Number(editStore.prepMinutes) || 20, minimumOrderCents: Math.max(0, cents(editStore.minimumOrder)), scheduleJson }, { onSuccess: () => toast.success("Cambios guardados"), onError: (error) => toast.error("No se pudieron guardar", { description: error.message }) });
  };
  const submitMenuItem = () => {
    if (!activeStore) return;
    if (!newItem.name.trim() || !Number.isFinite(cents(newItem.price)) || cents(newItem.price) < 1) return toast.error("Escribe el nombre y un precio válido");
    addMenuItem.mutate({ storeId: activeStore.id, name: newItem.name.trim(), description: newItem.description.trim() || undefined, priceCents: cents(newItem.price), imageUrl: newItem.imageUrl || undefined, available: newItem.available ? 1 : 0 }, { onSuccess: () => { toast.success("Producto añadido a la carta"); setNewItem({ ...emptyItem }); setShowItemForm(false); }, onError: (error) => toast.error("No se pudo añadir el producto", { description: error.message }) });
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f7f3ed]"><Loader2 className="h-7 w-7 animate-spin text-[#171715]" /></div>;
  if (!isAuthenticated) return <PartnerGate title="Gestiona tu local, desde tu bolsillo" description="Crea una cuenta partner para dar de alta establecimientos, organizar la carta, subir imágenes y gestionar tu operativa." primary="Crear cuenta partner" onPrimary={() => { window.location.href = "/?account=partner"; }} secondary="Ya tengo cuenta" onSecondary={() => startLogin()} />;
  if (!enabled) return <PartnerGate title="Esta cuenta no es de partner" description="El panel de Partners se activa durante el registro con el perfil “Soy partner”. Inicia sesión con esa cuenta o crea una nueva para tu establecimiento." primary="Crear cuenta partner" onPrimary={() => { void logout().then(() => { window.location.href = "/?account=partner"; }); }} secondary="Volver a PIKI" onSecondary={() => { window.location.href = "/"; }} />;

  return <div className="min-h-screen bg-[#f7f3ed] text-[#171715]">
    <header className="sticky top-0 z-30 border-b border-[#e7ddd2] bg-[#FFFDF5]/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8"><div className="flex items-center gap-3"><Link href="/" className="grid h-9 w-9 place-items-center rounded-full border border-[#e1d6c9] bg-white"><ArrowLeft className="h-4 w-4" /></Link><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">Centro partner</p><h1 className="font-display text-xl font-semibold tracking-[-.04em]">PIKI Partners</h1></div></div><div className="flex items-center gap-2"><span className="hidden items-center gap-2 rounded-full bg-[#e8f1e4] px-3 py-2 text-xs font-bold text-[#171715] sm:flex"><ShieldCheck className="h-3.5 w-3.5" /> Cuenta partner</span><button onClick={() => setShowStoreForm(true)} className="flex items-center gap-2 rounded-full bg-[#FFD72E] px-4 py-2.5 text-sm font-extrabold text-white shadow-sm"><Plus className="h-4 w-4" /> Nuevo local</button></div></div></header>
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <InstallAppBanner service="partners" />
      <section className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#ead892] bg-[#fff9dc] p-4"><BellRing className="h-5 w-5 text-[#171715]" /><div className="min-w-0 flex-1"><p className="text-sm font-extrabold">Alertas prioritarias del comandero</p><p className="mt-0.5 text-xs text-[#6f6120]">{nativeTerminal ? "Activa el canal nativo para avisos persistentes aunque la app esté en segundo plano." : "Activa Web Push como respaldo si este dispositivo no usa el wrapper SUNMI."}</p></div><button onClick={() => void activateBackgroundAlerts()} disabled={subscribePush.isPending || registerNativeDevice.isPending} className="rounded-full bg-[#171715] px-3.5 py-2 text-xs font-extrabold text-white disabled:opacity-60">{subscribePush.isPending || registerNativeDevice.isPending ? "Activando…" : nativeTerminal ? "Activar alertas SUNMI" : "Activar alertas"}</button></section>
      <section className="mb-6 rounded-2xl border border-[#e9dfd5] bg-[#171715] p-5 text-white sm:p-6" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#FFD72E]">Operativa de cocina</p><h2 className="mt-1 font-display text-2xl font-semibold tracking-[-.04em]">Pedidos sin perder ninguno</h2><p className="mt-1 text-sm text-[#d8e4d3]">La PWA consulta nuevos pedidos cada 5 segundos y mantiene la alerta activa hasta aceptarlos.</p></div>
          <div className="flex flex-wrap items-center gap-2"><span className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold ${online ? "bg-white/15 text-[#d7e8cf]" : "bg-[#8b5846] text-white"}`}>{online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}{online ? "WiFi conectado" : "Sin conexión"}</span><button onClick={() => { setSoundEnabled(true); setAlertingOrder(null); playAlert(); }} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold ${soundEnabled ? "bg-[#d7e8cf] text-[#143B2B]" : "bg-[#FFD72E] text-[#171715]"}`}><Volume2 className="h-4 w-4" />{soundEnabled ? "Sonido activado" : "Activar sonido"}</button></div>
        </div>
        <p className="mt-3 text-[11px] text-[#aebead]">Última sincronización: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("es-ES") : "pendiente"} · Si se corta el WiFi, la última bandeja queda visible y se reintenta al recuperar la conexión.</p>
        {incomingOrders.length > 0 ? <div className="mt-5 space-y-3">{incomingOrders.slice(0, 6).map((order) => <div key={order.publicCode} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/10 p-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-[#FFD72E] text-[#171715]"><BellRing className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="text-sm font-extrabold">{order.publicCode} · {order.customerName || "Cliente"}</p><p className="truncate text-xs text-[#d8e4d3]">{order.address} · {(order.totalCents / 100).toFixed(2).replace(".", ",")} €</p></div>{order.status === "placed" ? <><button onClick={() => { setAlertingOrder(null); stopNativeAlert(order.publicCode); updateOrder.mutate({ orderCode: order.publicCode, status: "accepted", prepMinutes: activeStore?.prepMinutes || 20 }, { onSuccess: () => void printTicket(order) }); }} disabled={updateOrder.isPending} className="rounded-lg bg-[#FFD72E] px-3 py-2 text-xs font-extrabold text-[#171715]">Aceptar</button><button onClick={() => { setAlertingOrder(null); stopNativeAlert(order.publicCode); }} className="rounded-lg border border-white/25 px-3 py-2 text-xs font-bold text-white">Silenciar</button></> : order.status === "accepted" ? <><button onClick={() => void printTicket(order)} className="flex items-center gap-1 rounded-lg border border-white/25 px-3 py-2 text-xs font-extrabold text-white"><Printer className="h-3.5 w-3.5" /> Ticket</button><button onClick={() => updateOrder.mutate({ orderCode: order.publicCode, status: "ready" })} disabled={updateOrder.isPending} className="rounded-lg bg-[#d7e8cf] px-3 py-2 text-xs font-extrabold text-[#143B2B]">Marcar listo</button></> : <span className="rounded-lg bg-white/15 px-3 py-2 text-xs font-bold">Listo para rider</span>}</div>)}</div> : <p className="mt-5 border-t border-white/15 pt-4 text-sm text-[#d8e4d3]">No hay pedidos activos. Cuando entre uno, aparecerá aquí con alerta sonora.</p>}
      </section>
      {isLoading ? <div className="grid gap-5 lg:grid-cols-[260px_1fr]"><div className="h-[360px] animate-pulse rounded-2xl bg-[#e9e1d8]" /><div className="h-[680px] animate-pulse rounded-2xl bg-[#e9e1d8]" /></div> : !stores.length ? <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#e9dfd5] bg-white p-8 text-center shadow-[0_12px_40px_rgba(55,45,35,.05)] sm:p-12"><div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.4rem] bg-[#FFF4BE] text-[#171715]"><Store className="h-8 w-8" /></div><p className="mt-7 text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">Bienvenido, {user?.name}</p><h2 className="mt-2 font-display text-4xl font-semibold tracking-[-.06em]">Tu primer local empieza aquí</h2><p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#67746b]">Añade los datos de tu establecimiento y una primera selección de platos. Lo dejaremos en revisión antes de mostrarlo a los clientes.</p><button onClick={() => setShowStoreForm(true)} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#FFD72E] px-5 py-3.5 text-sm font-extrabold text-white"><Plus className="h-4 w-4" /> Dar de alta mi local</button></div> : <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-[#e9dfd5] bg-white p-3"><p className="px-3 pb-3 pt-2 text-xs font-bold uppercase tracking-[.16em] text-[#8a958b]">Mis establecimientos</p>{stores.map((store) => <button key={store.id} onClick={() => setActiveStoreId(store.id)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${activeStore?.id === store.id ? "bg-[#FFF4BE]" : "hover:bg-[#faf6f0]"}`}>{store.coverImageUrl ? <img src={store.coverImageUrl} alt="" className="h-10 w-10 rounded-xl object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f6ead4] text-[#9a692b]"><Store className="h-4 w-4" /></span>}<span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold">{store.name}</span><span className="block text-xs text-[#718076]">{store.status === "active" ? "Activo" : store.status === "paused" ? "En pausa" : "En revisión"}</span></span><ChevronRight className="h-4 w-4 text-[#879187]" /></button>)}<button onClick={() => setShowStoreForm(true)} className="mt-2 flex w-full items-center gap-2 rounded-xl border border-dashed border-[#d7cec2] p-3 text-sm font-bold text-[#171715]"><Plus className="h-4 w-4" /> Añadir local</button></aside>
        {activeStore && <section className="space-y-6"><div className="overflow-hidden rounded-2xl border border-[#e9dfd5] bg-white">{activeStore.coverImageUrl && <img src={activeStore.coverImageUrl} alt={`Fachada de ${activeStore.name}`} className="h-44 w-full object-cover" />}<div className="p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">Panel de control</p><h2 className="font-display text-3xl font-semibold tracking-[-.05em]">{activeStore.name}</h2><p className="mt-2 text-sm text-[#68746a]">{activeStore.cuisine} · {activeStore.address}</p></div><button onClick={() => updateStore.mutate({ storeId: activeStore.id, status: activeStore.status === "paused" ? "active" : "paused" }, { onSuccess: () => toast.success(activeStore.status === "paused" ? "Local reactivado" : "Local pausado") })} className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold ${activeStore.status === "active" ? "bg-[#FFF4BE] text-[#171715]" : activeStore.status === "paused" ? "bg-[#f5e7df] text-[#8b5846]" : "bg-[#f6ead4] text-[#8b6526]"}`}><span className={`h-2 w-2 rounded-full ${activeStore.status === "active" ? "bg-[#56a362]" : activeStore.status === "paused" ? "bg-[#bd765a]" : "bg-[#c99a32]"}`} />{activeStore.status === "active" ? "Abierto" : activeStore.status === "paused" ? "Pausado" : "Pendiente de revisión"}</button></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric icon={Clock3} label="Preparación" value={`${activeStore.prepMinutes} min`} /><Metric icon={MenuSquare} label="Productos" value={String(activeStore.menu.length)} /><Metric icon={Package} label="Pedido mínimo" value={activeStore.minimumOrderCents ? money.format(activeStore.minimumOrderCents / 100) : "Sin mínimo"} /></div></div></div>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><section className="rounded-2xl border border-[#e9dfd5] bg-white p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">Carta digital</p><h3 className="mt-1 font-display text-3xl font-semibold tracking-[-.05em]">Productos y disponibilidad</h3></div><button onClick={() => setShowItemForm(true)} className="flex items-center gap-2 rounded-full bg-[#171715] px-4 py-2.5 text-sm font-extrabold text-white"><Plus className="h-4 w-4" /> Añadir producto</button></div><div className="mt-6 space-y-3">{activeStore.menu.length ? activeStore.menu.map((item) => <div key={item.id} className="flex gap-3 rounded-2xl border border-[#ebe1d7] bg-[#fffdfa] p-3"><div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f5eee5] text-[#9b6d47]">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <MenuSquare className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-extrabold">{item.name}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${item.available ? "bg-[#FFF4BE] text-[#171715]" : "bg-[#f5e7df] text-[#8b5846]"}`}>{item.available ? "Disponible" : "Agotado"}</span></div><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#6b786e]">{item.description || "Sin descripción"}</p><p className="mt-2 text-sm font-extrabold">{money.format(item.priceCents / 100)}</p></div><div className="flex flex-col justify-between gap-2"><button onClick={() => updateMenuItem.mutate({ storeId: activeStore.id, itemId: item.id, available: item.available ? 0 : 1 }, { onSuccess: () => toast.success(item.available ? "Producto marcado como agotado" : "Producto disponible") })} className={`grid h-8 w-8 place-items-center rounded-lg bg-white shadow-sm ${item.available ? "text-[#171715]" : "text-[#4b8b52]"}`} aria-label={item.available ? "Pausar producto" : "Reactivar producto"}>{item.available ? <PauseCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}</button><button onClick={() => { if (window.confirm(`¿Eliminar ${item.name} de la carta?`)) deleteMenuItem.mutate({ storeId: activeStore.id, itemId: item.id }, { onSuccess: () => toast.success("Producto eliminado") }); }} className="grid h-8 w-8 place-items-center rounded-lg bg-white text-[#a45b48] shadow-sm" aria-label="Eliminar producto"><Trash2 className="h-4 w-4" /></button></div></div>) : <div className="rounded-2xl border border-dashed border-[#dcd1c5] p-6 text-center text-sm text-[#6a766d]">Todavía no hay productos. Añade el primero para empezar tu carta.</div>}</div></section>
            <section className="rounded-2xl border border-[#e9dfd5] bg-white p-5 sm:p-7"><div className="flex items-center gap-2"><Pencil className="h-4 w-4 text-[#dc5c35]" /><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">Ficha del local</p><h3 className="font-display text-3xl font-semibold tracking-[-.05em]">Datos y horario</h3></div></div><div className="mt-6 space-y-3"><Input label="Nombre comercial" value={editStore.name} onChange={(value) => setEditStore((current) => ({ ...current, name: value }))} /><div className="grid grid-cols-2 gap-3"><Input label="Tipo de cocina" value={editStore.cuisine} onChange={(value) => setEditStore((current) => ({ ...current, cuisine: value }))} /><Input label="Preparación (min)" value={editStore.prepMinutes} type="number" onChange={(value) => setEditStore((current) => ({ ...current, prepMinutes: value }))} /></div><Input label="Dirección" value={editStore.address} onChange={(value) => setEditStore((current) => ({ ...current, address: value }))} /><div className="grid grid-cols-2 gap-3"><Input label="Teléfono" value={editStore.phone} type="tel" onChange={(value) => setEditStore((current) => ({ ...current, phone: value }))} /><Input label="Pedido mínimo (€)" value={editStore.minimumOrder} type="number" onChange={(value) => setEditStore((current) => ({ ...current, minimumOrder: value }))} /></div><label className="block"><span className="mb-1.5 block text-sm font-bold">Descripción</span><textarea value={editStore.description} onChange={(event) => setEditStore((current) => ({ ...current, description: event.target.value }))} rows={3} className="w-full resize-none rounded-xl border border-[#ded5ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#FFD72E]" /></label><label className="block"><span className="mb-1.5 block text-sm font-bold">Horario (JSON)</span><textarea value={editStore.scheduleJson} onChange={(event) => setEditStore((current) => ({ ...current, scheduleJson: event.target.value }))} rows={3} className="w-full resize-none rounded-xl border border-[#ded5ca] bg-white px-3 py-2.5 font-mono text-xs outline-none focus:border-[#FFD72E]" /></label><label className="flex items-center justify-between rounded-xl border border-dashed border-[#d9cec2] bg-[#FFFDF5] p-3 text-sm font-bold text-[#171715]"><span className="flex items-center gap-2"><ImagePlus className="h-4 w-4" /> {uploadImage.isPending ? "Subiendo imagen…" : "Subir foto de portada"}</span><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadImage.isPending} onChange={(event) => void imageData(event, (url) => setEditStore((current) => ({ ...current, coverImageUrl: url })))} /></label>{editStore.coverImageUrl && <img src={editStore.coverImageUrl} alt="Previsualización de portada" className="h-24 w-full rounded-xl object-cover" />}<button onClick={saveStoreDetails} disabled={updateStore.isPending} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFD72E] py-3.5 text-sm font-extrabold text-white disabled:opacity-60"><Save className="h-4 w-4" /> {updateStore.isPending ? "Guardando…" : "Guardar cambios"}</button></div></section></div>
        </section>}
      </div>}
    </main>
    {showStoreForm && <StoreForm store={newStore} setStore={setNewStore} items={newItems} onItemChange={changeInitialItem} onAddItem={addInitialItem} onRemoveItem={(index) => setNewItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} uploadPending={uploadImage.isPending} onUpload={(event, callback) => void imageData(event, callback)} onClose={() => setShowStoreForm(false)} onSave={submitStore} saving={createStore.isPending} />}
    {showItemForm && activeStore && <MenuItemForm item={newItem} setItem={setNewItem} uploadPending={uploadImage.isPending} onUpload={(event, callback) => void imageData(event, callback)} onClose={() => setShowItemForm(false)} onSave={submitMenuItem} saving={addMenuItem.isPending} />}
  </div>;
}

function PartnerGate({ title, description, primary, secondary, onPrimary, onSecondary }: { title: string; description: string; primary: string; secondary: string; onPrimary: () => void; onSecondary: () => void }) {
  return <div className="grid min-h-screen place-items-center bg-[#f7f3ed] p-5"><div className="w-full max-w-xl rounded-[2rem] border border-[#e9dfd5] bg-[#FFFDF5] p-8 text-center shadow-[0_20px_60px_rgba(55,45,35,.1)] sm:p-12"><div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.4rem] bg-[#1a2e25] text-[#FFE36A]"><Store className="h-8 w-8" /></div><p className="mt-7 text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">PIKI Partners</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.06em] text-[#171715]">{title}</h1><p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#68746a]">{description}</p><button onClick={onPrimary} className="mt-7 w-full rounded-xl bg-[#FFD72E] py-3.5 text-sm font-extrabold text-white">{primary}</button><button onClick={onSecondary} className="mt-3 w-full rounded-xl border border-[#ded5ca] bg-white py-3 text-sm font-extrabold text-[#171715]">{secondary}</button><Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#647267]"><ArrowLeft className="h-4 w-4" /> Volver a PIKI</Link></div></div>;
}
function Metric({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) { return <div className="rounded-xl bg-[#faf6f0] p-3"><Icon className="h-4 w-4 text-[#dc5c35]" /><p className="mt-2 text-xs font-bold text-[#778379]">{label}</p><p className="mt-0.5 text-sm font-extrabold">{value}</p></div>; }
function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block"><span className="mb-1.5 block text-sm font-bold">{label}</span><input value={value} type={type} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-[#ded5ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#FFD72E]" /></label>; }
function StoreForm({ store, setStore, items, onItemChange, onAddItem, onRemoveItem, uploadPending, onUpload, onClose, onSave, saving }: { store: { name: string; cuisine: string; address: string; phone: string; email: string; description: string; prepMinutes: string; minimumOrder: string; coverImageUrl: string }; setStore: React.Dispatch<React.SetStateAction<typeof store>>; items: DraftItem[]; onItemChange: (index: number, patch: Partial<DraftItem>) => void; onAddItem: () => void; onRemoveItem: (index: number) => void; uploadPending: boolean; onUpload: (event: ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void; onClose: () => void; onSave: () => void; saving: boolean }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#171715]/45 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-[#FFFDF5] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">Alta de partner</p><h2 className="font-display text-3xl font-semibold tracking-[-.05em]">Añadir establecimiento</h2></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-[#e5dbd0] bg-white"><X className="h-4 w-4" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Input label="Nombre comercial" value={store.name} onChange={(value) => setStore((current) => ({ ...current, name: value }))} /><label className="block"><span className="mb-1.5 block text-sm font-bold">Tipo de cocina</span><select value={store.cuisine} onChange={(event) => setStore((current) => ({ ...current, cuisine: event.target.value }))} className="w-full rounded-xl border border-[#ded5ca] bg-white px-3 py-2.5 text-sm outline-none"><option>Mediterránea</option><option>Pizza</option><option>Hamburguesas</option><option>Japonesa</option><option>Vegana</option><option>Desayuno</option><option>Otro</option></select></label><div className="sm:col-span-2"><Input label="Dirección completa" value={store.address} onChange={(value) => setStore((current) => ({ ...current, address: value }))} /></div><Input label="Email del local" value={store.email} type="email" onChange={(value) => setStore((current) => ({ ...current, email: value }))} /><Input label="Teléfono" value={store.phone} type="tel" onChange={(value) => setStore((current) => ({ ...current, phone: value }))} /><Input label="Tiempo de preparación (min)" value={store.prepMinutes} type="number" onChange={(value) => setStore((current) => ({ ...current, prepMinutes: value }))} /><Input label="Pedido mínimo (€)" value={store.minimumOrder} type="number" onChange={(value) => setStore((current) => ({ ...current, minimumOrder: value }))} /><label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-bold">Descripción del local</span><textarea value={store.description} onChange={(event) => setStore((current) => ({ ...current, description: event.target.value }))} rows={3} className="w-full resize-none rounded-xl border border-[#ded5ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#FFD72E]" /></label><label className="sm:col-span-2 flex items-center justify-between rounded-xl border border-dashed border-[#d9cec2] bg-white p-3 text-sm font-bold text-[#171715]"><span className="flex items-center gap-2"><Upload className="h-4 w-4" /> {uploadPending ? "Subiendo foto…" : "Subir foto de portada"}</span><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadPending} onChange={(event) => onUpload(event, (url) => setStore((current) => ({ ...current, coverImageUrl: url })))} /></label>{store.coverImageUrl && <img src={store.coverImageUrl} alt="Previsualización de portada" className="sm:col-span-2 h-32 w-full rounded-xl object-cover" />}</div><div className="mt-7"><div className="mb-3 flex items-center justify-between"><div><h3 className="font-display text-2xl font-semibold">Primeros productos</h3><p className="mt-1 text-xs text-[#718076]">Crea una carta inicial que podrás ampliar cuando quieras.</p></div><button onClick={onAddItem} className="flex items-center gap-1 text-sm font-extrabold text-[#171715]"><Plus className="h-4 w-4" /> Añadir</button></div><div className="space-y-3">{items.map((item, index) => <div key={index} className="rounded-2xl border border-[#e8ded4] bg-white p-3"><div className="grid gap-2 sm:grid-cols-[1fr_120px_36px]"><input value={item.name} onChange={(event) => onItemChange(index, { name: event.target.value })} placeholder="Nombre del plato" className="rounded-lg border border-[#e7ddd2] px-3 py-2 text-sm outline-none" /><input value={item.price} onChange={(event) => onItemChange(index, { price: event.target.value })} placeholder="Precio €" type="number" step="0.01" className="rounded-lg border border-[#e7ddd2] px-3 py-2 text-sm outline-none" /><button onClick={() => onRemoveItem(index)} className="grid h-9 w-9 place-items-center rounded-lg text-[#a45b48] hover:bg-[#fff0e9] disabled:opacity-30" disabled={items.length === 1}><Trash2 className="h-4 w-4" /></button><input value={item.description} onChange={(event) => onItemChange(index, { description: event.target.value })} placeholder="Descripción breve y alérgenos" className="rounded-lg border border-[#e7ddd2] px-3 py-2 text-sm outline-none sm:col-span-2" /><label className="flex items-center justify-center gap-1 rounded-lg bg-[#f7f3ed] text-xs font-bold text-[#657167]"><ImagePlus className="h-4 w-4" /> Foto<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadPending} onChange={(event) => onUpload(event, (url) => onItemChange(index, { imageUrl: url }))} /></label></div>{item.imageUrl && <img src={item.imageUrl} alt="Previsualización de producto" className="mt-3 h-20 w-20 rounded-xl object-cover" />}</div>)}</div></div><button onClick={onSave} disabled={saving} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFD72E] py-3.5 text-sm font-extrabold text-white disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar para revisión"}</button><p className="mt-3 text-center text-xs text-[#7a857b]">La publicación queda pendiente de validación del gerente de zona.</p></div></div>;
}
function MenuItemForm({ item, setItem, uploadPending, onUpload, onClose, onSave, saving }: { item: DraftItem; setItem: React.Dispatch<React.SetStateAction<DraftItem>>; uploadPending: boolean; onUpload: (event: ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void; onClose: () => void; onSave: () => void; saving: boolean }) { return <div className="fixed inset-0 z-[60] grid place-items-center bg-[#171715]/45 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-[2rem] bg-[#FFFDF5] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">Carta digital</p><h2 className="font-display text-3xl font-semibold tracking-[-.05em]">Añadir producto</h2></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-[#e5dbd0] bg-white"><X className="h-4 w-4" /></button></div><div className="mt-6 space-y-4"><Input label="Nombre del plato" value={item.name} onChange={(value) => setItem((current) => ({ ...current, name: value }))} /><Input label="Precio (€)" value={item.price} type="number" onChange={(value) => setItem((current) => ({ ...current, price: value }))} /><label className="block"><span className="mb-1.5 block text-sm font-bold">Descripción y alérgenos</span><textarea value={item.description} onChange={(event) => setItem((current) => ({ ...current, description: event.target.value }))} rows={3} className="w-full resize-none rounded-xl border border-[#ded5ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#FFD72E]" /></label><label className="flex items-center justify-between rounded-xl border border-dashed border-[#d9cec2] bg-white p-3 text-sm font-bold text-[#171715]"><span className="flex items-center gap-2"><ImagePlus className="h-4 w-4" /> {uploadPending ? "Subiendo…" : "Añadir foto"}</span><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadPending} onChange={(event) => onUpload(event, (url) => setItem((current) => ({ ...current, imageUrl: url })))} /></label>{item.imageUrl && <img src={item.imageUrl} alt="Previsualización de producto" className="h-32 w-full rounded-xl object-cover" />}<label className="flex items-center gap-3 rounded-xl bg-[#FFF4BE] p-3 text-sm font-bold text-[#171715]"><input type="checkbox" checked={item.available} onChange={(event) => setItem((current) => ({ ...current, available: event.target.checked }))} className="h-4 w-4 accent-[#171715]" />Disponible para pedir al publicarlo</label></div><button onClick={onSave} disabled={saving} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#171715] py-3.5 text-sm font-extrabold text-white disabled:opacity-60"><Plus className="h-4 w-4" /> {saving ? "Añadiendo…" : "Añadir a la carta"}</button></div></div>; }
