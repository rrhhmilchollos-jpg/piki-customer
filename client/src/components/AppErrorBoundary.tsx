import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

interface Props { children: ReactNode }
interface State { failed: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[PIKI] Error de interfaz recuperable", error, info.componentStack);
  }

  private recover = async () => {
    try {
      const registrations = await navigator.serviceWorker?.getRegistrations();
      await Promise.all(registrations?.map((registration) => registration.update()) || []);
    } catch {
      // A normal reload is still safe when the browser does not support service workers.
    }
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f7f3] p-6 text-[#17241c]">
        <section className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-[0_20px_60px_rgba(20,59,43,.14)]">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0e9] text-[#c45435]"><TriangleAlert className="h-7 w-7" /></div>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[.18em] text-[#62806a]">PIKI</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-.05em]">Actualicemos la aplicación</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#67766b]">La interfaz recibió una versión anterior almacenada en el dispositivo. No se ha perdido ningún pedido ni dato.</p>
          <button onClick={() => void this.recover()} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#143b2b] py-3.5 text-sm font-extrabold text-white transition hover:bg-[#1d5139] active:scale-[.98]"><RefreshCw className="h-4 w-4" /> Actualizar ahora</button>
        </section>
      </main>
    );
  }
}
