import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { startLogin } from "./const";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CUSTOMER_RELEASE, compareVersions } from "./lib/release";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((registration) => registration.update()).catch((error) => console.warn("No se pudo activar el modo sin conexión", error));
  });
}

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        // Preview auto-login fallback: when the browser blocks iframe cookies
        // (Safari ITP / private browsing / WebView), the runtime mirrors the
        // session into sessionStorage so we can forward it as a Bearer token.
        // The regular OAuth cookie flow keeps working and takes priority server-side.
        try {
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // sessionStorage unavailable
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" switchable>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  </trpc.Provider>
);

function checkPikiMinimumVersion() {
  const current = CUSTOMER_RELEASE.version;
  const api = "https://api.pikidelivery.com";
  void fetch(`${api}/api/v1/app-version?surface=${encodeURIComponent(CUSTOMER_RELEASE.surface)}`, { cache: "no-store" })
    .then((r) => r.ok ? r.json() as Promise<{ minimumVersion?: string }> : null)
    .then((v) => {
      const minimumComparison = v?.minimumVersion ? compareVersions(v.minimumVersion, current) : null;
      // Only a minimum version newer than this build is blocking. Previously
      // this compared against 0.2.1 and blocked the valid 0.2.2 build.
      if (minimumComparison !== null && minimumComparison > 0) {
        document.body.innerHTML = `<main style="font-family:system-ui;padding:32px;max-width:560px;margin:auto"><h1>Actualización obligatoria</h1><p>Hay una nueva versión de PIKI disponible. Recarga para continuar.</p><button style="padding:12px 18px" onclick="location.reload()">Actualizar ahora</button></main>`;
        if ("serviceWorker" in navigator) {
          void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
            await Promise.all(registrations.map((registration) => registration.update()));
            for (const registration of registrations) registration.waiting?.postMessage({ type: "SKIP_WAITING" });
          });
        }
      }
    }).catch(() => undefined);
}
checkPikiMinimumVersion();
