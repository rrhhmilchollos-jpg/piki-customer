import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { connectCustomerRealtime } from "./lib/realtime";
import Home from "./pages/Home";
import Partners from "./pages/Partners";
import Riders from "./pages/Riders";
import Admin from "./pages/Admin";
import JoinPiki from "./pages/JoinPiki";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/partners" component={Partners} />
      <Route path="/riders" component={Riders} />
      <Route path="/admin" component={Admin} />
      <Route path="/unete" component={JoinPiki} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function CustomerRealtimeBridge() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!isAuthenticated) return;
    return connectCustomerRealtime((event) => {
      void queryClient.invalidateQueries();
      if (event.type === "order.processing") toast.success("Pago confirmado: tu pedido está siendo procesado por el restaurante.");
      if (event.type === "order.status_changed" && typeof event.payload.message === "string") toast.info(event.payload.message);
    });
  }, [isAuthenticated, queryClient]);
  return null;
}

function RouteAppManifest() {
  useEffect(() => {
    const path = window.location.pathname;
    const manifest = path.startsWith("/partners") ? "/manifest-partners.json" : path.startsWith("/riders") ? "/manifest-riders.json" : path.startsWith("/admin") ? "/manifest-admin.json" : "/manifest.json";
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) { link = document.createElement("link"); link.rel = "manifest"; document.head.appendChild(link); }
    link.href = manifest;
    document.documentElement.style.backgroundColor = "#FFD72E";
  }, []);
  return null;
}

export default function App() {
  useEffect(() => {
    const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifest) return;
    manifest.href = window.location.pathname.startsWith("/partners") ? "/manifest-partners.json" : "/manifest.json";
  }, []);
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" richColors />
          <CustomerRealtimeBridge />
          <RouteAppManifest />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
