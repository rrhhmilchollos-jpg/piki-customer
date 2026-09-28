import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";

type InboxItem = { id: string; title: string; body: string; url: string; readAt: string | null; createdAt: string };
type InboxResponse = { notifications?: InboxItem[]; unreadCount?: number };

export default function CustomerNotificationCenter({ authenticated }: { authenticated: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    try {
      const response = await fetch("/api/v1/notifications?limit=20", { credentials: "include", cache: "no-store", headers: { "X-PIKI-Surface": "customer" } });
      if (!response.ok) throw new Error(response.status === 401 ? "Inicia sesión para consultar tus avisos." : "No se pudieron cargar tus avisos.");
      const payload = await response.json() as InboxResponse;
      setItems(Array.isArray(payload.notifications) ? payload.notifications : []);
      setUnreadCount(Math.max(0, Number(payload.unreadCount || 0)));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar tus avisos.");
    } finally { setLoading(false); }
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return;
    const initialLoad = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(), 30_000);
    const refresh = () => void load();
    window.addEventListener("piki:realtime", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.clearTimeout(initialLoad); window.clearInterval(interval); window.removeEventListener("piki:realtime", refresh); window.removeEventListener("focus", refresh); };
  }, [authenticated, load]);

  const markAllRead = async () => {
    if (!unreadCount) return;
    try {
      const response = await fetch("/api/v1/notifications/read-all", { method: "PATCH", credentials: "include", headers: { "X-PIKI-Surface": "customer" } });
      if (!response.ok) throw new Error("No se pudieron marcar como leídos.");
      const readAt = new Date().toISOString();
      setItems((current) => current.map((item) => item.readAt ? item : { ...item, readAt }));
      setUnreadCount(0); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudieron marcar como leídos."); }
  };

  const openNotification = async (item: InboxItem) => {
    if (!item.readAt) {
      try { await fetch(`/api/v1/notifications/${encodeURIComponent(item.id)}/read`, { method: "PATCH", credentials: "include", headers: { "X-PIKI-Surface": "customer" } }); } catch { /* Navigation remains available if read receipt cannot be saved. */ }
      setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, readAt: new Date().toISOString() } : candidate));
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    setOpen(false);
    window.location.assign(item.url.startsWith("/") && !item.url.startsWith("//") ? item.url : "/");
  };

  if (!authenticated) return null;
  return <div className="relative inline-flex">
    <button type="button" onClick={() => { setOpen((value) => !value); if (!open) void load(); }} aria-label={unreadCount ? `Notificaciones, ${unreadCount} sin leer` : "Notificaciones"} aria-expanded={open} aria-haspopup="dialog" className="relative grid h-10 w-10 place-items-center rounded-full border border-[#e5dbd0] bg-white text-[#304037] shadow-sm transition hover:border-[#bdc9b9]">
      <Bell className="h-4 w-4" />{unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-[#FFFDF5] bg-[#315b3f] px-1 text-[10px] font-extrabold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </button>
    {open && <section role="dialog" aria-label="Centro de notificaciones" className="absolute right-0 top-[calc(100%+12px)] z-[80] flex max-h-[min(72vh,540px)] w-[min(370px,calc(100vw-28px))] flex-col overflow-hidden rounded-2xl border border-[#e2eadf] bg-white text-[#171715] shadow-[0_18px_55px_rgba(18,35,25,.2)]">
      <header className="flex items-center justify-between gap-3 border-b border-[#edf1ed] bg-[#fbfcfb] px-4 py-3.5"><div><strong className="block text-sm font-extrabold">Notificaciones</strong><span className="text-xs text-[#738078]">{unreadCount ? `${unreadCount} sin leer` : "Al día"}</span></div><div className="flex gap-1">{unreadCount > 0 && <button type="button" onClick={() => void markAllRead()} aria-label="Marcar todas como leídas" title="Marcar todas como leídas" className="grid h-8 w-8 place-items-center rounded-lg text-[#52645a] hover:bg-[#edf3ec]"><CheckCheck className="h-4 w-4" /></button>}<button type="button" onClick={() => setOpen(false)} aria-label="Cerrar notificaciones" className="grid h-8 w-8 place-items-center rounded-lg text-[#52645a] hover:bg-[#edf3ec]"><X className="h-4 w-4" /></button></div></header>
      <div className="overflow-auto overscroll-contain" aria-busy={loading}>{loading && !items.length && <p className="p-6 text-center text-sm text-[#6a786f]">Cargando avisos…</p>}{!loading && !items.length && <p className="p-6 text-center text-sm text-[#6a786f]">No tienes notificaciones nuevas.</p>}{items.map((item) => <button key={item.id} type="button" onClick={() => void openNotification(item)} className={`flex w-full gap-2.5 border-b border-[#f0f2ef] px-4 py-3 text-left hover:bg-[#f8faf7] ${item.readAt ? "bg-white" : "bg-[#f7fbf2]"}`}><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.readAt ? "bg-[#9aa89d]" : "bg-[#16866e] ring-4 ring-[#d9f2e6]"}`} /><span className="grid min-w-0 gap-1"><strong className="text-[13px] font-extrabold">{item.title}</strong><span className="text-xs leading-relaxed text-[#526158]">{item.body}</span><small className="text-[10px] text-[#87928b]">{new Date(item.createdAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}</small></span></button>)}</div>
      {error && <p className="px-4 pb-3 text-xs text-red-700" role="status">{error}</p>}
    </section>}
  </div>;
}
