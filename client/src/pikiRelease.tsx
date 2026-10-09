import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { PIKI_RELEASE } from "./release-meta";
import {
  canApplyPwaUpdate,
  isValidReleasePolicy,
  requiresMandatoryPwaUpdate,
  shouldReloadAfterWorkerActivation,
  type ReleasePolicy,
} from "./pikiReleasePolicy";
import { shouldShowPushConsent } from "./pushConsentPolicy";

type GateState = "checking" | "ready" | "required" | "error";
type WorkerActivation = { activated: boolean; controllerChanged: boolean; hadController: boolean };

const apiOrigin = (import.meta.env.VITE_API_URL ?? "https://api.pikidelivery.com").replace(/\/$/, "");
const apiHost = new URL(apiOrigin, window.location.origin).origin;
const requestTimeoutMs = 15_000;

async function registerWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
    try { await registration.update(); } catch { /* Un SW antiguo o una red móvil no debe bloquear la app. */ }
    return registration;
  } catch {
    // La aplicación sigue funcionando aunque Android tarde en actualizar el SW.
    return null;
  }
}

async function waitForWaitingWorker(registration: ServiceWorkerRegistration): Promise<ServiceWorker | null> {
  if (registration.waiting) return registration.waiting;
  try { await registration.update(); } catch { return null; }
  if (registration.waiting) return registration.waiting;
  return await new Promise<ServiceWorker | null>((resolve) => {
    let timer = 0;
    let installing: ServiceWorker | null = null;
    const finish = (worker: ServiceWorker | null) => {
      window.clearTimeout(timer);
      installing?.removeEventListener("statechange", onStateChange);
      registration.removeEventListener("updatefound", onUpdateFound);
      resolve(worker);
    };
    const onStateChange = () => {
      if (!installing) return;
      if (installing.state === "installed") finish(registration.waiting ?? null);
      if (installing.state === "redundant") finish(null);
    };
    const onUpdateFound = () => {
      installing = registration.installing;
      installing?.addEventListener("statechange", onStateChange);
      onStateChange();
    };
    timer = window.setTimeout(() => finish(null), 8_000);
    registration.addEventListener("updatefound", onUpdateFound);
    onUpdateFound();
  });
}

async function activateUpdatedWorker(registration: ServiceWorkerRegistration | null): Promise<WorkerActivation> {
  if (!registration || !("serviceWorker" in navigator)) return { activated: false, controllerChanged: false, hadController: false };
  const waiting = await waitForWaitingWorker(registration);
  if (!waiting) return { activated: false, controllerChanged: false, hadController: Boolean(navigator.serviceWorker.controller) };
  const previousController = navigator.serviceWorker.controller;
  return await new Promise<WorkerActivation>((resolve) => {
    let settled = false;
    const finish = (controllerChanged: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      resolve({ activated: controllerChanged, controllerChanged, hadController: Boolean(previousController) });
    };
    const onControllerChange = () => finish(navigator.serviceWorker.controller !== previousController);
    const timeout = window.setTimeout(() => finish(false), 8_000);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    waiting.postMessage({ type: "SKIP_WAITING" });
  });
}

export function installPikiReleaseHeaders(): void {
  const state = window as unknown as { __pikiReleaseFetchInstalled?: boolean };
  if (state.__pikiReleaseFetchInstalled) return;
  state.__pikiReleaseFetchInstalled = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url, window.location.origin);
    if (url.origin !== apiHost) return nativeFetch(input, init);
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
    headers.set("X-PIKI-Surface", PIKI_RELEASE.surface);
    headers.set("X-PIKI-Client-Version", PIKI_RELEASE.version);
    headers.set("X-PIKI-Client-Build", PIKI_RELEASE.buildId);
    if (input instanceof Request) return nativeFetch(new Request(input, { ...init, headers }));
    return nativeFetch(input, { ...init, headers });
  };
}

async function fetchPolicy(): Promise<ReleasePolicy> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const query = new URLSearchParams({
      surface: PIKI_RELEASE.surface,
      clientVersion: PIKI_RELEASE.version,
      clientBuildId: PIKI_RELEASE.buildId,
    });
    const response = await fetch(`${apiOrigin}/api/v1/app-version?${query}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`VERSION_CHECK_${response.status}`);
    return await response.json() as ReleasePolicy;
  } finally {
    window.clearTimeout(timeout);
  }
}

function base64UrlToUint8Array(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function storedEmployeeToken(): string | null {
  const key = `piki-${location.hostname}-api-token`;
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}

async function syncPushSubscription(showNotification: boolean): Promise<string> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) throw new Error("Este navegador no admite notificaciones push.");
  const config = await fetch(`${apiOrigin}/api/v1/push/config`, { cache: "no-store", headers: { Accept: "application/json" } }).then(async (response) => {
    if (!response.ok) throw new Error("La configuración de avisos no está disponible.");
    return await response.json() as { enabled?: boolean; vapidPublicKey?: string };
  });
  if (!config.enabled || !config.vapidPublicKey) throw new Error("Los avisos todavía no están habilitados.");
  const permission = showNotification ? await Notification.requestPermission() : Notification.permission;
  if (permission !== "granted") throw new Error("No se concedió permiso para mostrar avisos.");
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription()
    ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToUint8Array(config.vapidPublicKey).buffer as ArrayBuffer });
  const token = storedEmployeeToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", "X-PIKI-Surface": PIKI_RELEASE.surface };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${apiOrigin}/api/v1/push/subscriptions`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error === "AUTHENTICATION_REQUIRED" ? "Inicia sesión antes de activar avisos." : body.error || "No se pudo guardar el dispositivo.");
  }
  return "Avisos activados correctamente.";
}

function PushConsentControl() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [authEpoch, setAuthEpoch] = useState(0);
  const [supported] = useState(() => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window);
  const [visible, setVisible] = useState(false);
  const customerSurface: boolean = String(PIKI_RELEASE.surface) === "customer";
  useEffect(() => {
    const wake = () => setAuthEpoch((value) => value + 1);
    window.addEventListener("piki-authenticated", wake);
    return () => window.removeEventListener("piki-authenticated", wake);
  }, []);
  useEffect(() => {
    if (!supported) return;
    if (customerSurface && authEpoch === 0) {
      void fetch(`${apiOrigin}/api/trpc/auth.me`, { credentials: "include" }).then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json() as { result?: { data?: { json?: unknown } } };
        return payload.result?.data?.json ?? null;
      }).then((user) => { if (user) setAuthEpoch(1); }).catch(() => undefined);
      setVisible(false);
      return;
    }
    const authenticated = customerSurface ? authEpoch > 0 : Boolean(storedEmployeeToken());
    const permission = "Notification" in window ? Notification.permission : "default";
    if (!shouldShowPushConsent({ supported, authenticated, permission })) {
      setVisible(false);
      if (authenticated && permission === "granted") void syncPushSubscription(false).catch((error) => console.warn("No se pudo sincronizar la suscripción de avisos.", error));
      return;
    }
    setVisible(true);
  }, [authEpoch, customerSurface, supported]);
  const enable = useCallback(async () => {
    setBusy(true); setMessage("");
    try { await syncPushSubscription(true); setMessage(""); setVisible(false); }
    catch (error) {
      const permission = "Notification" in window ? Notification.permission : "default";
      if (permission === "default") { setMessage(error instanceof Error ? error.message : "No se pudieron activar los avisos."); setVisible(true); }
      else { setMessage(""); setVisible(false); console.warn("No se pudo registrar este dispositivo para avisos.", error); }
    }
    finally { setBusy(false); }
  }, []);
  useEffect(() => {
    if (!supported) return;
    const listener = (event: MessageEvent) => {
      if (event.data?.type === "PIKI_PUSH_SUBSCRIPTION_CHANGED" && Notification.permission === "granted" && (!customerSurface || authEpoch > 0)) void syncPushSubscription(false).catch((error) => {
        console.warn("No se pudo resincronizar la suscripción de avisos.", error);
        setMessage(""); setVisible(false);
      });
    };
    navigator.serviceWorker.addEventListener("message", listener);
    return () => navigator.serviceWorker.removeEventListener("message", listener);
  }, [supported, customerSurface, authEpoch]);
  if (!supported || !visible) return null;
  return <aside aria-live="polite" style={{ position: "fixed", right: "16px", bottom: "16px", zIndex: 9999, maxWidth: "320px", padding: "12px", borderRadius: "12px", background: "#111827", color: "white", boxShadow: "0 10px 30px rgba(0,0,0,.25)" }}>
    <button type="button" onClick={() => setVisible(false)} aria-label="Cerrar aviso de PIKI" style={{ float: "right", border: 0, background: "transparent", color: "white", fontSize: "20px", lineHeight: 1, cursor: "pointer" }}>×</button>
    <strong style={{ display: "block", marginBottom: "6px" }}>Avisos de PIKI</strong>
    <p style={{ fontSize: "13px", margin: "0 24px 10px 0" }}>Activa notificaciones para recibir avisos operativos y de pedidos en este dispositivo.</p>
    <button type="button" onClick={() => void enable()} disabled={busy} style={{ padding: "8px 10px", borderRadius: "8px", border: 0, fontWeight: 700, cursor: "pointer" }}>{busy ? "Activando…" : "Activar avisos"}</button>
    {message && <p style={{ fontSize: "12px", margin: "8px 0 0" }}>{message}</p>}
  </aside>;
}

export function PikiReleaseGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>("checking");
  const [requiredVersion, setRequiredVersion] = useState("");
  const [detail, setDetail] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deferredUpdate, setDeferredUpdate] = useState(false);
  const sensitiveActivityRef = useRef(false);
  const reloadMarkerRef = useRef<string | null>(null);
  const controllerChangedRef = useRef(false);
  const updateInFlightRef = useRef(false);
  const hadControllerOnMountRef = useRef("serviceWorker" in navigator && Boolean(navigator.serviceWorker.controller));

  const isSafeToReload = useCallback(() => ({
    online: navigator.onLine,
    visible: document.visibilityState === "visible",
    hasSensitiveActivity: sensitiveActivityRef.current || Boolean(document.querySelector("[data-piki-sensitive-activity='true'], form :focus, input:focus, textarea:focus, select:focus, [contenteditable='true']:focus")),
  }), []);

  const reloadAfterControllerChange = useCallback(() => {
    const reloadKey = PIKI_RELEASE.buildId;
    const alreadyReloadedForBuild = reloadMarkerRef.current === reloadKey || sessionStorage.getItem("piki-pwa-reloaded-for") === reloadKey;
    if (!shouldReloadAfterWorkerActivation({ controllerChanged: controllerChangedRef.current, safety: isSafeToReload(), alreadyReloadedForBuild })) {
      if (controllerChangedRef.current) setDeferredUpdate(true);
      return;
    }
    reloadMarkerRef.current = reloadKey;
    sessionStorage.setItem("piki-pwa-reloaded-for", reloadKey);
    window.location.reload();
  }, [isSafeToReload]);

  const requestWorkerActivation = useCallback((registration: ServiceWorkerRegistration | null) => {
    if (!registration || !canApplyPwaUpdate(isSafeToReload())) return;
    if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }, [isSafeToReload]);

  const check = useCallback(async () => {
    try {
      const registration = await registerWorker();
      requestWorkerActivation(registration);
      registration?.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        const onStateChange = () => {
          if (installing.state === "installed") requestWorkerActivation(registration);
          if (installing.state === "installed" || installing.state === "redundant") installing.removeEventListener("statechange", onStateChange);
        };
        installing.addEventListener("statechange", onStateChange);
        onStateChange();
      }, { once: true });
      const policy = await fetchPolicy();
      if (!isValidReleasePolicy(policy, PIKI_RELEASE.surface)) throw new Error("La política de versión no es válida.");
      const requiresUpdate = requiresMandatoryPwaUpdate(policy, PIKI_RELEASE);
      if (requiresUpdate) {
        setRequiredVersion(`${String(policy.version || policy.minimumVersion)} · ${policy.buildId}`);
        if (!canApplyPwaUpdate(isSafeToReload())) {
          setDeferredUpdate(true);
          setState("ready");
        } else {
          setState("required");
        }
      } else {
        setState("ready");
      }
    } catch (error) {
      // The API independently rejects obsolete, versioned requests. The UI remains usable only
      // while the policy cannot be reached, avoiding a permanent client-side outage offline.
      if (error instanceof Error && error.name === "AbortError") {
        setDetail("");
        setState("ready");
        return;
      }
      setDetail(error instanceof Error ? error.message : "No se pudo comprobar la versión.");
      setState("error");
    }
  }, [isSafeToReload, requestWorkerActivation]);

  useEffect(() => {
    installPikiReleaseHeaders();
    void check();
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(() => void check(), 5 * 60_000);
    return () => { window.removeEventListener("focus", onFocus); window.clearInterval(timer); };
  }, [check]);

  const update = useCallback(async () => {
    if (!canApplyPwaUpdate(isSafeToReload())) {
      setDeferredUpdate(true);
      setDetail("La actualización se aplicará cuando recuperes la conexión y termines la acción en curso.");
      return;
    }
    setUpdating(true);
    setDetail("");
    try {
      const registration = await registerWorker();
      const activation = await activateUpdatedWorker(registration);
      if (!activation.activated) {
        setUpdating(false);
        setDeferredUpdate(true);
        setDetail("La nueva versión todavía se está descargando. Mantén esta PWA abierta y vuelve a intentarlo cuando esté lista.");
        return;
      }
      controllerChangedRef.current = activation.controllerChanged;
      if (activation.controllerChanged) {
        reloadAfterControllerChange();
        return;
      }
      setUpdating(false);
      setDeferredUpdate(true);
      setDetail("La actualización está lista y se aplicará al volver a una pantalla segura.");
    } catch (error) {
      setUpdating(false);
      setDetail(error instanceof Error ? error.message : "No se pudo descargar la actualización.");
    }
  }, [isSafeToReload, reloadAfterControllerChange, requestWorkerActivation]);

  useEffect(() => {
    const setSensitiveActivity = (event: Event) => {
      sensitiveActivityRef.current = Boolean((event as CustomEvent<{ active?: boolean }>).detail?.active);
      if (!sensitiveActivityRef.current) {
        reloadAfterControllerChange();
        if (deferredUpdate) void check();
      }
    };
    const onControllerChange = () => {
      if (!hadControllerOnMountRef.current) return;
      controllerChangedRef.current = true;
      // Let the browser publish the new controller before reading safety and reloading.
      window.setTimeout(reloadAfterControllerChange, 0);
    };
    const retryDeferredUpdate = () => {
      if (controllerChangedRef.current) reloadAfterControllerChange();
      if (deferredUpdate && canApplyPwaUpdate(isSafeToReload()) && !updateInFlightRef.current) {
        updateInFlightRef.current = true;
        void check().finally(() => { updateInFlightRef.current = false; });
      }
    };
    window.addEventListener("piki-sensitive-activity", setSensitiveActivity);
    window.addEventListener("focus", retryDeferredUpdate);
    window.addEventListener("online", retryDeferredUpdate);
    if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => {
      window.removeEventListener("piki-sensitive-activity", setSensitiveActivity);
      window.removeEventListener("focus", retryDeferredUpdate);
      window.removeEventListener("online", retryDeferredUpdate);
      if ("serviceWorker" in navigator) navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, [check, deferredUpdate, isSafeToReload, reloadAfterControllerChange]);

  if (state === "checking") return <main aria-live="polite" style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui", padding: "24px" }}>Comprobando la versión segura de PIKI…</main>;
  if (state === "required") return <main aria-labelledby="piki-update-title" style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui", padding: "24px", background: "#f8fafc" }}><section role="dialog" aria-modal="true" style={{ maxWidth: "480px", padding: "28px", background: "white", borderRadius: "16px", boxShadow: "0 12px 40px rgba(15,23,42,.15)" }}><p style={{ fontWeight: 700, color: "#b45309" }}>PIKI · ACTUALIZACIÓN NECESARIA</p><h1 id="piki-update-title">Hay una nueva versión de la PWA</h1><p>La versión {requiredVersion} debe estar lista antes de continuar. La PWA conserva tu sesión y solo se recarga cuando hay conexión y no hay una acción en curso.</p>{detail && <p role="alert">{detail}</p>}<button type="button" onClick={() => void update()} disabled={updating} style={{ padding: "12px 16px", border: 0, borderRadius: "9px", background: "#111827", color: "white", fontWeight: 700 }}>{updating ? "Preparando actualización…" : "Buscar actualización"}</button></section></main>;
  return <>{state === "error" && <div role="status" style={{ position: "fixed", zIndex: 9998, top: 0, left: 0, right: 0, padding: "8px", textAlign: "center", background: "#fef3c7", color: "#78350f", fontSize: "13px" }}>No se ha podido comprobar la versión: {detail}</div>}{state === "ready" && deferredUpdate && <div role="status" style={{ position: "fixed", zIndex: 9998, top: 0, left: 0, right: 0, padding: "8px", textAlign: "center", background: "#e8f4e5", color: "#24532b", fontSize: "13px" }}>Hay una nueva versión de la PWA pendiente. Se aplicará al terminar la acción en curso y con conexión.</div>}{children}<PushConsentControl /></>;
}
