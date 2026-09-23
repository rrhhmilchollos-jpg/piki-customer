import { useState, type FormEvent } from "react";
import { ArrowRight, Bike, CheckCircle2, Handshake, Loader2, MapPin, Store, Zap } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const API_URL = "https://api.pikidelivery.com";

type RiderForm = {
  name: string;
  email: string;
  phone: string;
  city: string;
  vehicle: "bike" | "electric_bike" | "electric_scooter" | "motorcycle" | "scooter" | "car";
  availability: string;
};

const initialRider: RiderForm = { name: "", email: "", phone: "", city: "Xàtiva", vehicle: "electric_bike", availability: "Tardes y fines de semana" };
const vehicleLabels: Record<RiderForm["vehicle"], string> = {
  bike: "Bicicleta",
  electric_bike: "Bicicleta eléctrica",
  electric_scooter: "Patinete eléctrico",
  motorcycle: "Moto",
  scooter: "Scooter",
  car: "Coche",
};

export default function JoinPiki() {
  const [rider, setRider] = useState(initialRider);
  const [partner, setPartner] = useState({ name: "", email: "", phone: "", address: "" });
  const [riderState, setRiderState] = useState<"idle" | "loading" | "success">("idle");
  const [partnerState, setPartnerState] = useState<"idle" | "loading" | "success">("idle");

  const submitRider = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRiderState("loading");
    try {
      const response = await fetch(`${API_URL}/api/v1/riders/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rider),
      });
      const payload = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "No se pudo enviar la solicitud");
      setRiderState("success");
      setRider(initialRider);
      toast.success("Solicitud enviada", { description: payload.message || "El equipo Fleet se pondrá en contacto contigo." });
    } catch (error) {
      setRiderState("idle");
      toast.error("No se pudo enviar", { description: error instanceof Error ? error.message : "Revisa los datos e inténtalo de nuevo." });
    }
  };

  const submitPartner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPartnerState("loading");
    try {
      const response = await fetch(`${API_URL}/api/v1/partners/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partner),
      });
      const payload = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "No se pudo enviar la solicitud");
      setPartnerState("success");
      setPartner({ name: "", email: "", phone: "", address: "" });
      toast.success("Solicitud recibida", { description: payload.message || "Un jefe de zona contactará con tu negocio." });
    } catch (error) {
      setPartnerState("idle");
      toast.error("No se pudo enviar", { description: error instanceof Error ? error.message : "Revisa los datos e inténtalo de nuevo." });
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f3ed] text-[#171715]">
      <header className="border-b border-[#eadfd3] bg-[#fffdf8]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="font-display text-2xl font-black tracking-[-.06em]">PIKI<span className="text-[#dc5c35]">.</span></Link>
          <Link href="/" className="text-sm font-bold text-[#5e6b61] hover:text-[#171715]">Volver a pedir <ArrowRight className="ml-1 inline h-4 w-4" /></Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-12 pt-14 sm:px-8 sm:pt-20">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#dc5c35]">Únete a PIKI · Xàtiva</p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[.98] tracking-[-.07em] sm:text-7xl">Crece con la red local de delivery.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#66736a]">Esta es la página oficial para solicitar ser rider o partner de PIKI. Tu solicitud llega directamente al departamento responsable y queda registrada para revisión.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Benefit icon={MapPin} title="Operación local" text="Trabaja en Xàtiva y sus zonas de cobertura." />
          <Benefit icon={Zap} title="Proceso sencillo" text="Envíanos tus datos y te contactaremos." />
          <Benefit icon={Handshake} title="Acompañamiento" text="Un equipo de zona te guía en el alta." />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-20 sm:px-8 lg:grid-cols-2">
        <FormShell icon={Bike} eyebrow="Para repartidores" title="Solicita tu alta como rider" description="El equipo Fleet revisará tu solicitud, disponibilidad y vehículo antes de activarte." success={riderState === "success"}>
          <form onSubmit={submitRider} className="space-y-4">
            <Field label="Nombre y apellidos" value={rider.name} onChange={(value) => setRider({ ...rider, name: value })} required />
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Email" type="email" value={rider.email} onChange={(value) => setRider({ ...rider, email: value })} required /><Field label="Teléfono" value={rider.phone} onChange={(value) => setRider({ ...rider, phone: value })} required /></div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Ciudad" value={rider.city} onChange={(value) => setRider({ ...rider, city: value })} required /><label className="grid gap-2 text-sm font-bold">Vehículo<select value={rider.vehicle} onChange={(event) => setRider({ ...rider, vehicle: event.target.value as RiderForm["vehicle"] })} className="rounded-xl border border-[#e2d8cd] bg-white px-3 py-3 font-normal outline-none focus:border-[#dc5c35]">{Object.entries(vehicleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
            <Field label="Disponibilidad habitual" value={rider.availability} onChange={(value) => setRider({ ...rider, availability: value })} required />
            <button disabled={riderState === "loading"} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#171715] px-5 py-3.5 text-sm font-black text-white disabled:opacity-60">{riderState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bike className="h-4 w-4" />} {riderState === "loading" ? "Enviando…" : "Enviar solicitud de rider"}</button>
          </form>
        </FormShell>

        <FormShell icon={Store} eyebrow="Para restaurantes y comercios" title="Hazte partner de PIKI" description="Un jefe de zona contactará contigo para preparar la ficha, carta y condiciones comerciales." success={partnerState === "success"}>
          <form onSubmit={submitPartner} className="space-y-4">
            <Field label="Nombre del establecimiento" value={partner.name} onChange={(value) => setPartner({ ...partner, name: value })} required />
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Email de contacto" type="email" value={partner.email} onChange={(value) => setPartner({ ...partner, email: value })} required /><Field label="Teléfono" value={partner.phone} onChange={(value) => setPartner({ ...partner, phone: value })} required /></div>
            <Field label="Dirección del establecimiento" value={partner.address} onChange={(value) => setPartner({ ...partner, address: value })} required />
            <div className="rounded-xl bg-[#fff4be] p-4 text-sm leading-relaxed text-[#5d531f]"><strong>Condiciones iniciales:</strong> 18% de comisión y alta anual de 200 €. El equipo comercial explicará el contrato antes de activar el local.</div>
            <button disabled={partnerState === "loading"} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffd72e] px-5 py-3.5 text-sm font-black text-[#171715] disabled:opacity-60">{partnerState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />} {partnerState === "loading" ? "Enviando…" : "Solicitar información para mi negocio"}</button>
          </form>
        </FormShell>
      </section>
    </main>
  );
}

function Benefit({ icon: Icon, title, text }: { icon: typeof MapPin; title: string; text: string }) { return <div className="flex gap-3 rounded-2xl border border-[#eadfd3] bg-white p-5"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff4be]"><Icon className="h-5 w-5" /></div><div><p className="font-black">{title}</p><p className="mt-1 text-sm leading-relaxed text-[#6c786e]">{text}</p></div></div>; }
function FormShell({ icon: Icon, eyebrow, title, description, success, children }: { icon: typeof Bike; eyebrow: string; title: string; description: string; success: boolean; children: React.ReactNode }) { return <article className="rounded-[2rem] border border-[#eadfd3] bg-white p-6 shadow-[0_12px_40px_rgba(55,45,35,.05)] sm:p-8"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff4be]"><Icon className="h-6 w-6" /></div><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#dc5c35]">{eyebrow}</p><h2 className="mt-1 font-display text-3xl font-semibold tracking-[-.06em]">{title}</h2><p className="mt-2 text-sm leading-relaxed text-[#6c786e]">{description}</p></div></div>{success ? <div className="mt-8 flex items-start gap-3 rounded-2xl bg-[#e8f1e4] p-5 text-sm leading-relaxed"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#43834d]" /><p><strong>Solicitud recibida.</strong> Puedes cerrar esta página. El equipo responsable tiene tus datos y se pondrá en contacto contigo.</p></div> : <div className="mt-8">{children}</div>}</article>; }
function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label className="grid gap-2 text-sm font-bold">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="rounded-xl border border-[#e2d8cd] bg-white px-3 py-3 font-normal outline-none focus:border-[#dc5c35]" /></label>; }
