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
import { PikiReleaseGate, installPikiReleaseHeaders } from "./pikiRelease";
import { PIKI_RELEASE } from "./release-meta";
import "./index.css";

installPikiReleaseHeaders();
const queryClient = new QueryClient();
const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError) || typeof window === "undefined") return;
  if (error.message === UNAUTHED_ERR_MSG) startLogin();
};
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    redirectToLoginIfUnauthorized(event.query.state.error);
    console.error("[API Query Error]", event.query.state.error);
  }
});
queryClient.getMutationCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    redirectToLoginIfUnauthorized(event.mutation.state.error);
    console.error("[API Mutation Error]", event.mutation.state.error);
  }
});
const trpcClient = trpc.createClient({ links: [httpBatchLink({
  url: "/api/trpc", transformer: superjson,
  headers() {
    try {
      const raw = sessionStorage.getItem("manus-cookie");
      if (raw) {
        const prefix = `${COOKIE_NAME}=`;
        const pair = raw.split(";").find((item) => item.trim().startsWith(prefix));
        const token = pair?.trim().slice(prefix.length);
        if (token) return { Authorization: `Bearer ${token}`, "X-PIKI-Surface": PIKI_RELEASE.surface, "X-PIKI-Client-Version": PIKI_RELEASE.version, "X-PIKI-Client-Build": PIKI_RELEASE.buildId };
      }
    } catch { /* sessionStorage unavailable */ }
    return { "X-PIKI-Surface": PIKI_RELEASE.surface, "X-PIKI-Client-Version": PIKI_RELEASE.version, "X-PIKI-Client-Build": PIKI_RELEASE.buildId };
  },
  fetch(input, init) { return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" }); },
})] });
createRoot(document.getElementById("root")!).render(
  <PikiReleaseGate><trpc.Provider client={trpcClient} queryClient={queryClient}><QueryClientProvider client={queryClient}><ThemeProvider defaultTheme="light" switchable><AppErrorBoundary><App /></AppErrorBoundary></ThemeProvider></QueryClientProvider></trpc.Provider></PikiReleaseGate>,
);
