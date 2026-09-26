import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function CustomerSurfaceNotice() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#FFFDF5] p-5 text-[#171715]">
      <section className="w-full max-w-xl rounded-[2rem] border border-[#e9dfd5] bg-white p-8 text-center shadow-[0_20px_60px_rgba(55,45,35,.1)] sm:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.4rem] bg-[#FFF4BE] text-[#171715]">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">PIKI Delivery</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.06em]">Esta es la app de clientes</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#68746a]">
          La gestión de restaurantes, reparto y operaciones se realiza desde aplicaciones independientes. Aquí solo puedes crear una cuenta de cliente y hacer pedidos.
        </p>
        <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#171715] px-5 py-3.5 text-sm font-extrabold text-white">
          <ArrowLeft className="h-4 w-4" /> Ir a PIKI Delivery
        </Link>
      </section>
    </main>
  );
}
