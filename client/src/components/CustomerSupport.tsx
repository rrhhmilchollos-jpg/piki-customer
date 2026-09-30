import { useState, type FormEvent } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type SupportCategory = "order" | "account" | "technical" | "billing" | "finance" | "other";
type SupportPriority = "low" | "normal" | "high";

const statusLabels: Record<string, string> = {
  open: "Abierto",
  in_progress: "En curso",
  waiting: "Esperando respuesta",
  resolved: "Resuelto",
  closed: "Cerrado",
};

const categoryLabels: Record<SupportCategory, string> = {
  order: "Pedido",
  account: "Cuenta",
  technical: "Problema técnico",
  billing: "Cobros y facturación",
  finance: "Finanzas",
  other: "Otro",
};

export default function CustomerSupport() {
  const utils = trpc.useUtils();
  const { data: tickets = [], isLoading } = trpc.customer.support.list.useQuery(undefined, { refetchInterval: 30_000 });
  const createTicket = trpc.customer.support.create.useMutation({
    onSuccess: () => {
      setSubject("");
      setDescription("");
      setOrderRef("");
      setCategory("order");
      setPriority("normal");
      toast.success("Solicitud enviada", { description: "El equipo de soporte revisará tu incidencia." });
      void utils.customer.support.list.invalidate();
    },
    onError: (error) => toast.error("No se pudo enviar la solicitud", { description: error.message }),
  });
  const [category, setCategory] = useState<SupportCategory>("order");
  const [priority, setPriority] = useState<SupportPriority>("normal");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [orderRef, setOrderRef] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createTicket.mutate({ category, priority, subject: subject.trim(), description: description.trim(), orderRef: orderRef.trim() || undefined });
  }

  return <div className="mt-7 space-y-7">
    <section className="rounded-2xl border border-[#e3d9cf] bg-white p-5">
      <div className="flex items-start gap-3"><MessageSquare className="mt-0.5 h-5 w-5 text-[#dc5c35]" /><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#6b7a6b]">Atención PIKI</p><h3 className="font-display text-2xl font-semibold">¿En qué podemos ayudarte?</h3><p className="mt-1 text-sm leading-relaxed text-[#69766c]">Cuéntanos qué ha ocurrido y nuestro equipo te responderá desde el centro de soporte.</p></div></div>
      <form className="mt-5 space-y-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-sm font-bold text-[#314037]">Tipo de incidencia</span><select value={category} onChange={(event) => setCategory(event.target.value as SupportCategory)} className="w-full rounded-xl border border-[#ded5ca] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#FFD72E]">{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block"><span className="mb-1.5 block text-sm font-bold text-[#314037]">Prioridad</span><select value={priority} onChange={(event) => setPriority(event.target.value as SupportPriority)} className="w-full rounded-xl border border-[#ded5ca] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#FFD72E]"><option value="low">Baja</option><option value="normal">Normal</option><option value="high">Alta</option></select></label></div>
        <label className="block"><span className="mb-1.5 block text-sm font-bold text-[#314037]">Asunto</span><input required minLength={3} maxLength={180} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Ej. No puedo localizar mi pedido" className="w-full rounded-xl border border-[#ded5ca] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#FFD72E]" /></label>
        <label className="block"><span className="mb-1.5 block text-sm font-bold text-[#314037]">Código de pedido (opcional)</span><input value={orderRef} onChange={(event) => setOrderRef(event.target.value)} placeholder="PIKI-… o código del pedido" className="w-full rounded-xl border border-[#ded5ca] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#FFD72E]" /></label>
        <label className="block"><span className="mb-1.5 block text-sm font-bold text-[#314037]">Describe lo ocurrido</span><textarea required minLength={3} maxLength={4000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Incluye los detalles que nos ayuden a resolverlo…" className="w-full resize-y rounded-xl border border-[#ded5ca] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#FFD72E]" /></label>
        <button type="submit" disabled={createTicket.isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#171715] py-3.5 text-sm font-extrabold text-white disabled:opacity-60">{createTicket.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{createTicket.isPending ? "Enviando…" : "Enviar a soporte"}</button>
      </form>
    </section>
    <section><div className="mb-3 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-[#171715]" /><h3 className="font-display text-2xl font-semibold">Mis solicitudes</h3></div>{isLoading ? <div className="rounded-2xl border border-dashed border-[#dcd1c5] p-5 text-sm text-[#6a766d]">Cargando solicitudes…</div> : tickets.length ? <div className="space-y-3">{tickets.map((ticket) => <article key={ticket._id} className="rounded-2xl border border-[#ebe1d7] bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#6b7a6b]">{ticket.ticketNumber} · {categoryLabels[ticket.category as SupportCategory] || ticket.category}</p><h4 className="mt-1 text-sm font-extrabold">{ticket.subject}</h4></div><span className="rounded-full bg-[#FFF4BE] px-3 py-1 text-xs font-bold text-[#5f5518]">{statusLabels[ticket.status] || ticket.status}</span></div><p className="mt-3 text-sm leading-relaxed text-[#69766c]">{ticket.description}</p>{ticket.messages?.length ? <div className="mt-3 space-y-2 border-t border-[#f0e7dc] pt-3">{ticket.messages.map((message, index) => <div key={`${message.createdAt}-${index}`} className="rounded-xl bg-[#f8f5ee] p-3"><p className="text-xs font-bold text-[#4d5b50]">{message.senderName || "Soporte PIKI"}</p><p className="mt-1 text-sm text-[#69766c]">{message.body}</p></div>)}</div> : null}</article>)}</div> : <div className="rounded-2xl border border-dashed border-[#dcd1c5] p-5 text-sm text-[#6a766d]">Todavía no has enviado ninguna solicitud.</div>}</section>
  </div>;
}
