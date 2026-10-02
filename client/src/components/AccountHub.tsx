import { startLogin } from "@/const";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { MapView } from "@/components/Map";
import CustomerSupport from "@/components/CustomerSupport";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Check,
  Crosshair,
  Eye,
  EyeOff,
  Heart,
  History,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogIn,
  LogOut,
  Map as MapIcon,
  MapPin,
  MessageSquare,
  ShieldCheck,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { toast } from "sonner";

const favoriteKey = "piki-favorites";
const historyKey = "piki-history";

type OrderRecord = { id: string; restaurant: string; total: number; createdAt: number };
type View = "profile" | "support" | "map" | "auth" | null;
type AuthMode = "login" | "register" | "forgot" | "reset";

function CustomerBeeMark() { return <div className="customer-auth-bee" aria-hidden="true"><svg viewBox="0 0 160 120"><circle cx="78" cy="54" r="27" fill="#FFD72E" stroke="#171715" strokeWidth="6"/><path d="M53 47h50M53 61h50" stroke="#171715" strokeWidth="6"/><circle cx="68" cy="50" r="3"/><circle cx="88" cy="50" r="3"/><path d="M56 28c-5-15 9-22 20-11 10-11 24-4 20 11" fill="#e6f3ff" stroke="#171715" strokeWidth="6"/><path d="M49 86h75l-20-31h33l-18-27M55 86a15 15 0 1 0 0 1M119 86a15 15 0 1 0 0 1" fill="none" stroke="#171715" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/><path d="M104 67l27 15v22h-27z" fill="#dc5c35" stroke="#171715" strokeWidth="6"/></svg></div>; }
function PasswordField({ value, onChange, label = "Contraseña", placeholder = "Tu contraseña" }: { value: string; onChange: (value: string) => void; label?: string; placeholder?: string }) {
  const [visible, setVisible] = useState(false);
  return <label className="block"><span className="mb-1.5 block text-sm font-bold text-[#314037]">{label}</span><span className="relative block"><input value={value} onChange={(event) => onChange(event.target.value)} type={visible ? "text" : "password"} placeholder={placeholder} className="w-full rounded-xl border border-[#ded5ca] bg-white px-3.5 py-3 pr-11 text-sm outline-none transition focus:border-[#FFD72E] focus:ring-4 focus:ring-[#FFD72E]/10" /><button type="button" onClick={() => setVisible((current) => !current)} className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-[#667267] hover:text-[#171715]" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}>{visible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}</button></span></label>;
}

export default function AccountHub() {
  const [panel, setPanel] = useState<View>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<OrderRecord[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);
  const { user, loading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const { data: restaurants = [] } = trpc.catalog.list.useQuery({});
  const register = trpc.auth.register.useMutation();
  const login = trpc.auth.login.useMutation();
  const requestReset = trpc.auth.requestPasswordReset.useMutation();
  const resetPassword = trpc.auth.resetPassword.useMutation();
  const pending = register.isPending || login.isPending || requestReset.isPending || resetPassword.isPending;
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const activatePasskey = async () => {
    try { setPasskeyBusy(true); const options = await fetch("https://api.pikidelivery.com/api/v1/passkeys/customer/register/options", { method: "POST", credentials: "include" }).then((r) => r.json()); if (options.error) throw new Error(options.error); const credential = await startRegistration({ optionsJSON: options }); const result = await fetch("https://api.pikidelivery.com/api/v1/passkeys/customer/register/verify", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credential) }).then((r) => r.json()); if (!result.verified) throw new Error(result.error || "PASSKEY_REGISTRATION_FAILED"); toast.success("Inicio biométrico activado", { description: "La próxima vez podrás entrar con huella, Face ID o el bloqueo del dispositivo." }); } catch (error) { toast.error("No se pudo activar la biometría", { description: error instanceof Error ? error.message : "Prueba desde un dispositivo compatible." }); } finally { setPasskeyBusy(false); }
  };
  const loginWithPasskey = async () => {
    try { setPasskeyBusy(true); const options = await fetch("https://api.pikidelivery.com/api/v1/passkeys/customer/auth/options", { method: "POST", credentials: "include" }).then((r) => r.json()); const assertion = await startAuthentication({ optionsJSON: options }); const result = await fetch("https://api.pikidelivery.com/api/v1/passkeys/customer/auth/verify", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(assertion) }).then((r) => r.json()); if (!result.verified) throw new Error(result.error || "PASSKEY_AUTHENTICATION_FAILED"); await utils.auth.me.invalidate(); setPanel(null); toast.success("Sesión iniciada"); } catch (error) { toast.error("No se pudo iniciar con biometría", { description: error instanceof Error ? error.message : "Usa tu contraseña." }); } finally { setPasskeyBusy(false); }
  };

  useEffect(() => {
    try {
      setFavorites(JSON.parse(localStorage.getItem(favoriteKey) || "[]"));
      setHistory(JSON.parse(localStorage.getItem(historyKey) || "[]"));
    } catch {}
  }, [panel]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("reset_token");
    if (token) {
      setResetToken(token);
      setPassword("");
      setConfirmPassword("");
      setAuthMode("reset");
      setPanel("auth");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }
    if (params.get("login") === "rider") {
      setAuthMode("login");
      setPanel("auth");
      window.history.replaceState({}, "", window.location.pathname);
    }
    const openCustomerAuth = () => {
      setAuthMode("login");
      setPanel("auth");
    };
    window.addEventListener("piki:open-customer-auth", openCustomerAuth);
    return () => window.removeEventListener("piki:open-customer-auth", openCustomerAuth);
  }, []);

  const favoriteRestaurants = useMemo(() => restaurants.filter((restaurant) => favorites.includes(restaurant.id)), [favorites, restaurants]);
  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((favorite) => favorite !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem(favoriteKey, JSON.stringify(next));
    toast.success(next.includes(id) ? "Guardado en favoritos" : "Eliminado de favoritos");
  };
  const resetForm = (mode: AuthMode) => {
    setAuthMode(mode);
    setPassword("");
    setConfirmPassword("");
  };
  const finishAuth = async (role: "user" | "partner" | "rider" | "fleet_manager" | "zone_manager" | "admin") => {
    await utils.auth.me.invalidate();
    window.dispatchEvent(new Event("piki-authenticated"));
    toast.success("Bienvenido a PIKI");
    setPanel(null);
  };
  const submitLogin = () => {
    if (!email || !password) return toast.error("Introduce tu email y contraseña");
    login.mutate({ email, password }, { onSuccess: ({ user: signedIn }) => { void finishAuth(signedIn.role); }, onError: (error) => toast.error("No se pudo iniciar sesión", { description: error.message }) });
  };
  const submitRegister = () => {
    if (!fullName.trim() || !email || !password || !confirmPassword) return toast.error("Completa todos los campos");
    if (password.length < 8) return toast.error("Usa al menos 8 caracteres en la contraseña");
    if (password !== confirmPassword) return toast.error("Las contraseñas no coinciden");
    if (!acceptedTerms) return toast.error("Acepta los términos para crear la cuenta");
    register.mutate({ name: fullName.trim(), email, password }, { onSuccess: ({ user: signedIn }) => { void finishAuth(signedIn.role); }, onError: (error) => toast.error("No se pudo crear la cuenta", { description: error.message }) });
  };
  const submitForgot = () => {
    if (!email) return toast.error("Introduce el email de tu cuenta");
    requestReset.mutate({ email }, { onSuccess: ({ previewToken }) => {
      if (previewToken) {
        setResetToken(previewToken);
        resetForm("reset");
        toast.success("Enlace de prueba preparado", { description: "Podrás cambiar tu contraseña ahora. Activa el email transaccional antes de publicar." });
      } else toast.success("Si existe una cuenta, recibirás un enlace para restablecer tu contraseña.");
    }, onError: () => toast.error("No se pudo procesar la solicitud") });
  };
  const submitReset = () => {
    if (!resetToken) return toast.error("Solicita un nuevo enlace de recuperación");
    if (password.length < 8) return toast.error("Usa al menos 8 caracteres en la contraseña");
    if (password !== confirmPassword) return toast.error("Las contraseñas no coinciden");
    resetPassword.mutate({ token: resetToken, password }, { onSuccess: ({ user: signedIn }) => { void finishAuth(signedIn.role); }, onError: (error) => toast.error("No se pudo cambiar la contraseña", { description: error.message }) });
  };

  const useLocation = () => {
    if (!navigator.geolocation) return toast.error("Tu navegador no permite geolocalización");
    toast("Solicitando ubicación…", { description: "Acepta el permiso del navegador para centrar el mapa." });
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const position = { lat: coords.latitude, lng: coords.longitude };
      mapRef.current?.setView([position.lat, position.lng], 16, { animate: true });
      toast.success("Ubicación detectada", { description: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` });
    }, () => toast.error("No pudimos detectar tu ubicación", { description: "Puedes escribir la dirección manualmente." }), { enableHighAccuracy: true, timeout: 10000 });
  };

  return <>
    <div className="fixed bottom-5 right-5 z-30 flex flex-col gap-2 sm:bottom-7 sm:right-7">
      <button onClick={() => setPanel("map")} className="flex items-center gap-2 rounded-full border border-[#ded6cc] bg-white px-4 py-3 text-sm font-extrabold text-[#171715] shadow-lg transition hover:-translate-y-0.5" aria-label="Abrir mapa"><MapIcon className="h-4 w-4" /> Mapa</button>
      <button onClick={() => { setPanel(isAuthenticated ? "profile" : "auth"); if (!isAuthenticated) resetForm("login"); }} className="flex items-center gap-2 rounded-full bg-[#171715] px-4 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5" aria-label={isAuthenticated ? "Abrir perfil" : "Abrir acceso"}>{isAuthenticated ? <UserRound className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}{loading ? "Cargando" : isAuthenticated ? "Mi perfil" : "Acceder"}</button>
    </div>

    {panel && <div className="fixed inset-0 z-[90] bg-[#171715]/45 p-0 backdrop-blur-sm sm:p-6" onMouseDown={() => setPanel(null)}>
      <div onMouseDown={(event) => event.stopPropagation()} className={`ml-auto h-full w-full overflow-y-auto bg-[#FFFDF5] p-5 shadow-2xl sm:rounded-[2rem] sm:p-8 ${panel === "auth" ? "max-w-xl" : "max-w-2xl"}`}>
        {panel === "auth" ? <div className="mx-auto max-w-md py-2 sm:py-6"><CustomerBeeMark /><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">PIKI</p><h2 className="font-display text-3xl font-semibold tracking-[-.05em]">{authMode === "login" ? "Qué bueno verte" : authMode === "register" ? "Tu cuenta, a tu ritmo" : authMode === "forgot" ? "Recupera tu acceso" : "Crea una nueva contraseña"}</h2></div><button onClick={() => setPanel(null)} className="grid h-10 w-10 place-items-center rounded-full border border-[#e5dbd0] bg-white"><X className="h-5 w-5" /></button></div>
          {authMode === "login" && <><p className="mt-3 text-sm leading-relaxed text-[#69766c]">Entra en tu cuenta de cliente para pedir, guardar favoritos y consultar tus pedidos.</p><div className="mt-6 space-y-4"><label className="block"><span className="mb-1.5 block text-sm font-bold text-[#314037]">Email</span><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="nombre@ejemplo.com" onKeyDown={(event) => { if (event.key === "Enter") submitLogin(); }} className="w-full rounded-xl border border-[#ded5ca] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#FFD72E] focus:ring-4 focus:ring-[#FFD72E]/10" /></label><PasswordField value={password} onChange={setPassword} label="Contraseña" placeholder="Tu contraseña" /></div><button disabled={pending} onClick={submitLogin} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#171715] py-3.5 text-sm font-extrabold text-white transition hover:bg-[#050505] disabled:opacity-60">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}{pending ? "Entrando…" : "Iniciar sesión"}</button><button type="button" disabled={passkeyBusy} onClick={loginWithPasskey} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#ded5ca] bg-white py-3 text-sm font-extrabold text-[#314037] disabled:opacity-60"><ShieldCheck className="h-4 w-4 text-[#16856f]" />{passkeyBusy ? "Comprobando…" : "Entrar con huella / Face ID"}</button><div className="mt-5 flex items-center justify-between gap-3 text-sm"><button onClick={() => resetForm("forgot")} className="font-bold text-[#69766c] hover:underline">¿Has olvidado tu contraseña?</button><button onClick={() => resetForm("register")} className="font-extrabold text-[#171715] hover:underline">Crear cuenta</button></div></>}
          {authMode === "register" && <><p className="mt-3 text-sm leading-relaxed text-[#69766c]">Crea tu cuenta de cliente para pedir, guardar favoritos y consultar tus pedidos.</p><div className="mt-6 rounded-2xl border border-[#e3d9cf] bg-[#FFF4BE] p-4"><div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-[#171715]" /><div><p className="text-sm font-extrabold">Cuenta cliente PIKI</p><p className="mt-1 text-xs leading-relaxed text-[#6a766d]">Para partners y riders utiliza sus aplicaciones independientes.</p></div></div></div><div className="mt-5 space-y-4"><label className="block"><span className="mb-1.5 block text-sm font-bold text-[#314037]">Nombre completo</span><input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" placeholder="Cómo te llamamos" className="w-full rounded-xl border border-[#ded5ca] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#FFD72E] focus:ring-4 focus:ring-[#FFD72E]/10" /></label><label className="block"><span className="mb-1.5 block text-sm font-bold text-[#314037]">Email</span><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="nombre@ejemplo.com" className="w-full rounded-xl border border-[#ded5ca] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#FFD72E] focus:ring-4 focus:ring-[#FFD72E]/10" /></label><PasswordField value={password} onChange={setPassword} label="Crea una contraseña" placeholder="Mínimo 8 caracteres" /><PasswordField value={confirmPassword} onChange={setConfirmPassword} label="Repite la contraseña" placeholder="Repite tu contraseña" /></div><label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-[#617064]"><input checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} type="checkbox" className="mt-1 h-4 w-4 accent-[#171715]" />Acepto los términos de uso y la política de privacidad de PIKI.</label><button disabled={pending} onClick={submitRegister} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFD72E] py-3.5 text-sm font-extrabold text-white transition hover:bg-[#E8C600] disabled:opacity-60">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}{pending ? "Creando cuenta…" : "Crear cuenta"}</button><p className="mt-6 text-center text-sm text-[#69766c]">¿Ya tienes cuenta? <button onClick={() => resetForm("login")} className="font-extrabold text-[#171715] hover:underline">Iniciar sesión</button></p></>}
          {authMode === "forgot" && <><p className="mt-3 text-sm leading-relaxed text-[#69766c]">Escribe el email con el que te registraste. Te enviaremos un enlace seguro para crear una contraseña nueva.</p><label className="mt-7 block"><span className="mb-1.5 block text-sm font-bold text-[#314037]">Email de la cuenta</span><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="nombre@ejemplo.com" className="w-full rounded-xl border border-[#ded5ca] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#FFD72E] focus:ring-4 focus:ring-[#FFD72E]/10" /></label><button disabled={pending} onClick={submitForgot} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFD72E] py-3.5 text-sm font-extrabold text-white transition hover:bg-[#E8C600] disabled:opacity-60">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}{pending ? "Enviando…" : "Enviar enlace de recuperación"}</button><button onClick={() => resetForm("login")} className="mt-5 flex w-full items-center justify-center gap-2 text-sm font-extrabold text-[#171715]"><LogIn className="h-4 w-4" /> Volver a iniciar sesión</button></>}
          {authMode === "reset" && <><p className="mt-3 text-sm leading-relaxed text-[#69766c]">Elige una nueva contraseña segura para volver a entrar en tu cuenta.</p><div className="mt-7 space-y-4"><PasswordField value={password} onChange={setPassword} label="Nueva contraseña" placeholder="Mínimo 8 caracteres" /><PasswordField value={confirmPassword} onChange={setConfirmPassword} label="Repite la nueva contraseña" placeholder="Repite tu contraseña" /></div><button disabled={pending} onClick={submitReset} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFD72E] py-3.5 text-sm font-extrabold text-white transition hover:bg-[#E8C600] disabled:opacity-60">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}{pending ? "Actualizando…" : "Guardar nueva contraseña"}</button></>}
        </div> : <><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">PIKI</p><h2 className="font-display text-3xl font-semibold tracking-[-.05em]">{panel === "profile" ? "Tu espacio" : panel === "support" ? "Soporte PIKI" : "Cerca de ti"}</h2></div><button onClick={() => setPanel(null)} className="grid h-10 w-10 place-items-center rounded-full border border-[#e5dbd0] bg-white"><X className="h-5 w-5" /></button></div>
          {panel === "profile" ? <div className="mt-7 space-y-7">{!isAuthenticated ? <div className="rounded-2xl bg-[#FFF4BE] p-5 text-center"><UserRound className="mx-auto h-8 w-8 text-[#171715]" /><h3 className="mt-3 font-display text-2xl font-semibold">Tu cuenta está a un paso</h3><p className="mt-2 text-sm text-[#637165]">Crea una cuenta para guardar favoritos y gestionar tus pedidos.</p><button onClick={() => { setPanel("auth"); resetForm("register"); }} className="mt-5 rounded-xl bg-[#171715] px-5 py-3 text-sm font-extrabold text-white">Crear cuenta</button></div> : <><div className="flex flex-wrap items-center gap-4 rounded-2xl bg-[#FFF4BE] p-4"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#171715] text-white"><UserRound className="h-7 w-7" /></div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#6b7a6b]">Cliente PIKI</p><h3 className="truncate text-lg font-extrabold">{user?.name || "Tu cuenta"}</h3><p className="truncate text-sm text-[#637165]">{user?.email}</p></div></div><div className="rounded-2xl border border-[#e3d9cf] bg-white p-4"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-[#16856f]" /><div className="min-w-0 flex-1"><p className="text-sm font-extrabold">Huella, Face ID o PIN del dispositivo</p><p className="mt-1 text-xs leading-relaxed text-[#69766c]">Activa Passkey para entrar más rápido sin guardar contraseñas en PIKI.</p></div></div><button disabled={passkeyBusy} onClick={activatePasskey} className="mt-3 w-full rounded-xl bg-[#171715] py-2.5 text-xs font-extrabold text-white disabled:opacity-60">{passkeyBusy ? "Configurando…" : "Activar inicio biométrico"}</button></div><button onClick={() => { void logout().then(() => { toast.success("Sesión cerrada"); setPanel(null); }); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ded5ca] bg-white py-3 text-sm font-extrabold text-[#4d5b50]"><LogOut className="h-4 w-4" /> Cerrar sesión</button><button onClick={() => setPanel("support")} className="flex w-full items-center gap-3 rounded-2xl border border-[#e3d9cf] bg-white p-4 text-left transition hover:border-[#FFD72E]"><MessageSquare className="h-5 w-5 text-[#dc5c35]" /><span className="min-w-0 flex-1"><strong className="block text-sm font-extrabold">Centro de soporte</strong><span className="mt-1 block text-xs text-[#69766c]">Crea una solicitud y consulta las respuestas de PIKI.</span></span><span className="text-sm font-extrabold text-[#dc5c35]">Abrir</span></button><section><div className="mb-3 flex items-center gap-2"><Heart className="h-5 w-5 text-[#e45c39]" /><h3 className="font-display text-2xl font-semibold">Tus favoritos</h3></div>{favoriteRestaurants.length ? <div className="grid gap-3 sm:grid-cols-2">{favoriteRestaurants.map((restaurant) => <button key={restaurant.id} onClick={() => toggleFavorite(restaurant.id)} className="flex items-center gap-3 rounded-2xl border border-[#ebe1d7] bg-white p-3 text-left transition hover:border-[#d1c4b6]"><img src={restaurant.image} alt="" className="h-14 w-14 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{restaurant.name}</p><p className="text-xs text-[#6c786f]">{restaurant.cuisine}</p></div><Heart className="h-4 w-4 fill-[#e45c39] text-[#e45c39]" /></button>)}</div> : <div className="rounded-2xl border border-dashed border-[#dcd1c5] p-5 text-sm text-[#6a766d]">Aún no tienes favoritos. Guarda tus restaurantes habituales para encontrarlos rápido.</div>}</section><section><div className="mb-3 flex items-center gap-2"><History className="h-5 w-5 text-[#171715]" /><h3 className="font-display text-2xl font-semibold">Historial de pedidos</h3></div>{history.length ? <div className="space-y-2">{history.map((order) => <div key={order.id} className="flex items-center justify-between rounded-2xl border border-[#ebe1d7] bg-white p-4"><div><p className="text-sm font-extrabold">{order.restaurant}</p><p className="mt-1 text-xs text-[#6c786f]">{order.id} · {new Date(order.createdAt).toLocaleDateString("es-ES")}</p></div><span className="text-sm font-extrabold">{order.total.toFixed(2).replace(".", ",")} €</span></div>)}</div> : <div className="rounded-2xl border border-dashed border-[#dcd1c5] p-5 text-sm text-[#6a766d]">Cuando completes un pedido, aparecerá aquí.</div>}</section></>}</div> : panel === "support" ? <CustomerSupport /> : <div className="mt-6"><div className="mb-4 flex items-center justify-between rounded-2xl bg-[#FFF4BE] p-4"><div><p className="text-sm font-extrabold">Restaurantes en tu zona</p><p className="mt-1 text-xs text-[#657365]">Explora opciones y planifica tu pedido.</p></div><button onClick={useLocation} className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-extrabold text-[#171715] shadow-sm"><Crosshair className="h-4 w-4" /> Usar mi ubicación</button></div><div className="overflow-hidden rounded-[1.4rem] border border-[#e3d8cc] bg-white"><MapView initialCenter={{ lat: 38.9908, lng: -0.5185 }} initialZoom={14} className="h-[420px]" onMapReady={(map) => { mapRef.current = map; }} points={restaurants.slice(0, 6).map((restaurant, index) => ({ lat: 38.9908 + index * 0.0012, lng: -0.5185 + index * 0.0015, label: restaurant.name, kind: "restaurant" }))} /></div><div className="mt-4 grid grid-cols-2 gap-3">{restaurants.slice(0, 4).map((restaurant) => <div key={restaurant.id} className="flex items-center gap-2 rounded-xl border border-[#ebe1d7] bg-white p-2"><MapPin className="h-4 w-4 text-[#FFD72E]" /><span className="truncate text-xs font-bold">{restaurant.name}</span></div>)}</div></div>}</>}
      </div>
    </div>}
  </>;
}
