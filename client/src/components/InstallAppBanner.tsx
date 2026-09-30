import { Download, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const copy = { title: "Instala PIKI Delivery", text: "Pide más rápido desde tu pantalla de inicio.", accent: "#FFD72E", soft: "#fff0e9" } as const;

export function InstallAppBanner() {
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handlePrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  if (dismissed || window.matchMedia?.("(display-mode: standalone)").matches) return null;
  const install = async () => {
    if (!installPrompt) return toast("Instala PIKI desde Chrome", { description: "Abre el menú ⋮ y pulsa “Instalar aplicación” o “Añadir a pantalla de inicio”." });
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") toast.success("La instalación de PIKI ha comenzado");
    setInstallPrompt(null);
  };

  return <section className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border p-4 shadow-sm" style={{ borderColor: copy.accent + "33", background: copy.soft }}><div className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: copy.accent }}><Smartphone className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-[#1b2a20]">{copy.title}</p><p className="mt-0.5 text-xs text-[#617064]">{copy.text}</p></div><button onClick={install} className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-extrabold text-white" style={{ background: copy.accent }}><Download className="h-3.5 w-3.5" /> Instalar</button><button onClick={() => setDismissed(true)} className="grid h-8 w-8 place-items-center rounded-full text-[#637165]" aria-label="Ocultar invitación de instalación"><X className="h-4 w-4" /></button></section>;
}
