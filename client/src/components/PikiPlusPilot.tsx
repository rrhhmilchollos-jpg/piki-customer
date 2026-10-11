import { BadgeCheck, Headphones, Sparkles, TicketCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const supportPhoneHref = "tel:+34960500685";

export default function PikiPlusPilot() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const requestPilot = trpc.customer.support.create.useMutation({
    onSuccess: () => {
      toast.success("Solicitud PIKI Plus enviada", {
        description: "Soporte PIKI revisará tu acceso prioritario al piloto de Xàtiva.",
      });
      void utils.customer.support.list.invalidate();
    },
    onError: (error) => toast.error("No se pudo solicitar el piloto", { description: error.message }),
  });

  const requestAccess = () => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent("piki:open-customer-auth"));
      toast("Crea o inicia sesión", { description: "Necesitamos una cuenta para registrar tu solicitud de acceso prioritario." });
      return;
    }
    requestPilot.mutate({
      category: "account",
      priority: "normal",
      subject: "PIKI Plus · solicitud de acceso piloto",
      description: "Quiero participar en el piloto PIKI Plus de Xàtiva y recibir información prioritaria sobre sus ventajas cuando se activen.",
    });
  };

  return (
    <section id="piki-plus" className="mx-auto max-w-7xl px-4 pb-4 pt-2 sm:px-6 lg:px-8" aria-labelledby="piki-plus-title">
      <div className="overflow-hidden rounded-[2rem] border border-[#1c2a20] bg-[#171715] text-white shadow-[0_22px_54px_rgba(23,23,21,.20)]">
        <div className="grid gap-7 p-6 sm:p-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-10 lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFD72E] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.13em] text-[#171715]"><Sparkles className="h-3.5 w-3.5" /> PIKI Plus · piloto local</div>
            <h2 id="piki-plus-title" className="mt-5 font-display text-4xl font-semibold leading-[.95] tracking-[-.06em] sm:text-5xl">Más cerca de tus favoritos.<br /><span className="text-[#FFD72E]">Sin promesas vacías.</span></h2>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#d6d8d2] sm:text-base">PIKI Plus empieza como una prueba local en Xàtiva. Puedes solicitar acceso prioritario para conocer antes las campañas y comercios del programa. No hay cuota, cobro ni ventaja automática asociada a un pedido durante este piloto.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="button" onClick={requestAccess} disabled={requestPilot.isPending} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FFD72E] px-5 py-3.5 text-sm font-extrabold text-[#171715] transition hover:bg-[#ffe265] disabled:opacity-60"><TicketCheck className="h-4 w-4" />{requestPilot.isPending ? "Registrando solicitud…" : "Solicitar acceso prioritario"}</button>
              <a href={supportPhoneHref} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-5 py-3.5 text-sm font-extrabold text-white transition hover:border-[#FFD72E] hover:text-[#FFD72E]"><Headphones className="h-4 w-4" /> Soporte PIKI · 960 500 685</a>
            </div>
          </div>
          <div className="grid content-center gap-3">
            {[
              ["Acceso de lanzamiento", "Tu solicitud queda registrada y trazable en Soporte PIKI."],
              ["Información local primero", "Campañas y nuevos comercios de Xàtiva antes de su apertura general."],
              ["Atención con contexto", "Cuando el piloto se active, Soporte podrá identificar tu solicitud sin cambiar tus pedidos."],
            ].map(([title, detail]) => <article key={title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur-sm"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FFD72E] text-[#171715]"><BadgeCheck className="h-5 w-5" /></span><div><h3 className="text-sm font-extrabold">{title}</h3><p className="mt-1 text-xs leading-relaxed text-[#c8cdc3]">{detail}</p></div></article>)}
          </div>
        </div>
      </div>
    </section>
  );
}
