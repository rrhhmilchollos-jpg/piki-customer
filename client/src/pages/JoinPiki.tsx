import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Bike, CheckCircle2, Handshake, Loader2, MapPin, Store, Zap } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const API_URL = "https://api.pikidelivery.com";
type Vehicle = "bike" | "electric_bike" | "electric_scooter" | "motorcycle" | "scooter" | "car";
type LeadStatus = "idle" | "loading" | "success";
const vehicles: Record<Vehicle, string> = {
  bike: "Bicicleta",
  electric_bike: "Bicicleta eléctrica",
  electric_scooter: "Patinete eléctrico",
  motorcycle: "Moto",
  scooter: "Scooter",
  car: "Coche",
};

export default function JoinPiki() {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id === "riders" || id === "partners") {
      const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
      return () => cancelAnimationFrame(frame);
    }
  }, []);
  const [rider, setRider] = useState({ name: "", email: "", phone: "", city: "Xàtiva", vehicle: "electric_bike" as Vehicle, availability: "Tardes y fines de semana", privacyNoticeAccepted: false });
  const [partner, setPartner] = useState({ name: "", email: "", phone: "", address: "", city: "Xàtiva", privacyNoticeAccepted: false });
  const [riderState, setRiderState] = useState<LeadStatus>("idle");
  const [partnerState, setPartnerState] = useState<LeadStatus>("idle");

  const submitRider = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rider.privacyNoticeAccepted) return toast.error("Debes aceptar el aviso de privacidad para enviar la solicitud.");
    setRiderState("loading");
    try {
      const response = await fetch(`${API_URL}/api/v1/public/rider-leads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...rider, website: "" }) });
      const payload = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.message || payload.error || "No se pudo enviar la solicitud.");
      setRiderState("success");
      setRider({ name: "", email: "", phone: "", city: "Xàtiva", vehicle: "electric_bike", availability: "Tardes y fines de semana", privacyNoticeAccepted: false });
      toast.success("Solicitud recibida", { description: payload.message || "El equipo Fleet revisará tus datos." });
    } catch (error) {
      setRiderState("idle");
      toast.error("No se pudo enviar", { description: error instanceof Error ? error.message : "Revisa los datos e inténtalo de nuevo." });
    }
  };

  const submitPartner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!partner.privacyNoticeAccepted) return toast.error("Debes aceptar el aviso de privacidad para enviar la solicitud.");
    setPartnerState("loading");
    try {
      const response = await fetch(`${API_URL}/api/v1/public/partner-leads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...partner, website: "" }) });
      const payload = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.message || payload.error || "No se pudo enviar la solicitud.");
      setPartnerState("success");
      setPartner({ name: "", email: "", phone: "", address: "", city: "Xàtiva", privacyNoticeAccepted: false });
      toast.success("Solicitud recibida", { description: payload.message || "El equipo comercial revisará tus datos." });
    } catch (error) {
      setPartnerState("idle");
      toast.error("No se pudo enviar", { description: error instanceof Error ? error.message : "Revisa los datos e inténtalo de nuevo." });
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f3ed] text-[#171715]">
      <header className="border-b border-[#eadfd3] bg-[#fffdf8]"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><Link href="/" className="font-display text-2xl font-black tracking-[-.06em]">PIKI<span className="text-[#dc5c35]">.</span></Link><nav className="flex items-center gap-4 text-sm font-bold text-[#5e6b61]" aria-label="Navegación pública"><Link href="/noticias" className="hover:text-[#171715]">Noticias</Link><Link href="/" className="hover:text-[#171715]">Volver a pedir <ArrowRight className="ml-1 inline h-4 w-4" /></Link></nav></div></header>
      <section className="mx-auto max-w-7xl px-5 pb-12 pt-14 sm:px-8 sm:pt-20">
        <div className="mb-10 overflow-hidden rounded-[1.75rem] border border-[#e7d92c] bg-[#ffd72e]"><img src="/piki-join-banner.png" alt="PIKI. Pide. Recibe. Disfruta." className="h-auto w-full object-cover" /></div>
        <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.2em] text-[#171715]">PIKI · Pide. Recibe. Disfruta.</p><h1 className="mt-4 font-display text-5xl font-semibold leading-[.98] tracking-[-.07em] sm:text-7xl">Únete al equipo PIKI.</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#66736a]">Envía una solicitud inicial. Quedará registrada en el sistema central para que el equipo responsable la revise y, si procede, te pida el expediente completo.</p></div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3"><Benefit icon={MapPin} title="Operación local" text="Trabaja con comercios y equipos de tu zona." /><Benefit icon={Zap} title="Proceso por etapas" text="Primero revisamos el contacto; después solicitamos la información necesaria." /><Benefit icon={Handshake} title="Seguimiento" text="El equipo responsable te contactará con los siguientes pasos." /></div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-20 sm:px-8 lg:grid-cols-2">
        <FormShell id="riders" icon={Bike} eyebrow="Para repartidores" title="Solicita tu alta como rider" description="Comparte tus datos básicos y disponibilidad. Fleet te contactará para completar documentación y verificaciones." success={riderState === "success"}>
          <form onSubmit={submitRider} className="space-y-4">
            <Field label="Nombre y apellidos" value={rider.name} onChange={(value) => setRider({ ...rider, name: value })} required />
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Email" type="email" value={rider.email} onChange={(value) => setRider({ ...rider, email: value })} required /><Field label="Teléfono" type="tel" value={rider.phone} onChange={(value) => setRider({ ...rider, phone: value })} required /></div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Ciudad" value={rider.city} onChange={(value) => setRider({ ...rider, city: value })} required /><label className="grid gap-2 text-sm font-bold">Vehículo<select value={rider.vehicle} onChange={(event) => setRider({ ...rider, vehicle: event.target.value as Vehicle })} className="rounded-xl border border-[#e2d8cd] bg-white px-3 py-3 font-normal outline-none focus:border-[#dc5c35]">{Object.entries(vehicles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
            <Field label="Disponibilidad habitual" value={rider.availability} onChange={(value) => setRider({ ...rider, availability: value })} required />
            <PrivacyConsent checked={rider.privacyNoticeAccepted} onChange={(checked) => setRider({ ...rider, privacyNoticeAccepted: checked })} />
            <Honeypot />
            <button disabled={riderState === "loading" || !rider.privacyNoticeAccepted} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#171715] px-5 py-3.5 text-sm font-black text-white disabled:opacity-60">{riderState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bike className="h-4 w-4" />} {riderState === "loading" ? "Enviando…" : "Enviar solicitud de rider"}</button>
          </form>
        </FormShell>
        <FormShell id="partners" icon={Store} eyebrow="Para restaurantes y comercios" title="Hazte partner de PIKI" description="Déjanos los datos de contacto del negocio. El equipo comercial revisará la solicitud y te pedirá la información fiscal y documental necesaria." success={partnerState === "success"}>
          <form onSubmit={submitPartner} className="space-y-4">
            <Field label="Nombre del establecimiento" value={partner.name} onChange={(value) => setPartner({ ...partner, name: value })} required />
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Email de contacto" type="email" value={partner.email} onChange={(value) => setPartner({ ...partner, email: value })} required /><Field label="Teléfono" type="tel" value={partner.phone} onChange={(value) => setPartner({ ...partner, phone: value })} required /></div>
            <Field label="Dirección del establecimiento" value={partner.address} onChange={(value) => setPartner({ ...partner, address: value })} required />
            <Field label="Ciudad / municipio" value={partner.city} onChange={(value) => setPartner({ ...partner, city: value })} required />
            <div className="rounded-xl bg-[#fff4be] p-4 text-sm leading-relaxed text-[#5d531f]"><strong>Condiciones informativas:</strong> la web anuncia 18% de comisión y 200 € de alta anual. El contrato definitivo debe detallar la base de cálculo, impuestos, liquidación y servicios incluidos antes de la firma.</div>
            <PrivacyConsent checked={partner.privacyNoticeAccepted} onChange={(checked) => setPartner({ ...partner, privacyNoticeAccepted: checked })} />
            <Honeypot />
            <button disabled={partnerState === "loading" || !partner.privacyNoticeAccepted} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffd72e] px-5 py-3.5 text-sm font-black text-[#171715] disabled:opacity-60">{partnerState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />} {partnerState === "loading" ? "Enviando…" : "Solicitar información para mi negocio"}</button>
          </form>
        </FormShell>
      </section>
    </main>
  );
}

function Benefit({ icon: Icon, title, text }: { icon: typeof MapPin; title: string; text: string }) { return <div className="flex gap-3 rounded-2xl border border-[#eadfd3] bg-white p-5"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff4be]"><Icon className="h-5 w-5" /></div><div><p className="font-black">{title}</p><p className="mt-1 text-sm leading-relaxed text-[#6c786e]">{text}</p></div></div>; }
function FormShell({ id, icon: Icon, eyebrow, title, description, success, children }: { id: string; icon: typeof MapPin; eyebrow: string; title: string; description: string; success: boolean; children: React.ReactNode }) { return <article id={id} className="scroll-mt-8 rounded-[2rem] border border-[#eadfd3] bg-white p-6 shadow-[0_12px_40px_rgba(55,45,35,.05)] sm:p-8"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff4be]"><Icon className="h-6 w-6" /></div><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#dc5c35]">{eyebrow}</p><h2 className="mt-1 font-display text-3xl font-semibold tracking-[-.06em]">{title}</h2><p className="mt-2 text-sm leading-relaxed text-[#6c786e]">{description}</p></div></div>{success ? <div className="mt-8 flex items-start gap-3 rounded-2xl bg-[#e8f1e4] p-5 text-sm leading-relaxed"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#43834d]" /><p><strong>Solicitud recibida.</strong> El equipo responsable tiene tus datos y se pondrá en contacto contigo.</p></div> : <div className="mt-8">{children}</div>}</article>; }
function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label className="grid gap-2 text-sm font-bold">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="rounded-xl border border-[#e2d8cd] bg-white px-3 py-3 font-normal outline-none focus:border-[#dc5c35]" /></label>; }
function PrivacyConsent({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) { return <label className="flex items-start gap-3 rounded-xl border border-[#eadfd3] bg-[#fffaf0] p-3 text-xs leading-relaxed"><input className="mt-0.5" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>He leído la <a className="underline" href="https://pikidelivery.com/legal/politica-privacidad" target="_blank" rel="noopener noreferrer">información de privacidad para solicitudes</a> y entiendo que STARTBOOKING, S.L. tratará estos datos para gestionar y responder a esta solicitud. Enviarla no garantiza su aceptación ni crea un alta.</span></label>; }
function Honeypot() { return <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}><label>No rellenar<input name="website" tabIndex={-1} autoComplete="off" /></label></div>; }
