import { ArrowRight, Bike, MapPin, Store, Utensils } from "lucide-react";
import { Link } from "wouter";

type PageKey = "food" | "restaurants" | "riders" | "partners" | "coverage";

type LocalPage = {
  eyebrow: string;
  title: string;
  description: string;
  sections: Array<{ title: string; body: string }>;
  primaryHref: string;
  primaryLabel: string;
};

const pages: Record<PageKey, LocalPage> = {
  food: {
    eyebrow: "PIKI Delivery · Xàtiva",
    title: "Comida a domicilio en Xàtiva",
    description: "Consulta los restaurantes y productos que aparecen disponibles para tu dirección en PIKI Delivery.",
    sections: [
      { title: "Comprueba la disponibilidad por dirección", body: "La oferta, los comercios activos, los precios, las tarifas y los tiempos de entrega dependen de la dirección y de la operativa del momento. Introduce tu ubicación para consultar las opciones que PIKI muestra para tu zona." },
      { title: "Una plataforma local", body: "PIKI conecta clientes, comercios asociados y riders en Xàtiva. Antes de confirmar un pedido, revisa siempre el restaurante, los productos, el total y las condiciones que aparecen en el checkout." },
      { title: "Cobertura", body: "Xàtiva es el municipio de referencia. PIKI también informa sobre cobertura en localidades cercanas; la disponibilidad real de cada dirección se confirma dentro de la aplicación." },
    ],
    primaryHref: "/",
    primaryLabel: "Consultar opciones disponibles",
  },
  restaurants: {
    eyebrow: "Para comercios · Xàtiva",
    title: "Restaurantes con delivery en Xàtiva",
    description: "PIKI ayuda a los restaurantes y comercios locales interesados en mostrar su oferta a clientes de Xàtiva.",
    sections: [
      { title: "Solicita información para tu negocio", body: "Los comercios pueden enviar una solicitud inicial para que el equipo responsable revise los datos del establecimiento, la zona de servicio y las condiciones de incorporación." },
      { title: "Información clara antes del alta", body: "La solicitud no supone una activación automática. El equipo comercial confirma las condiciones, el catálogo y el flujo operativo antes de que un establecimiento aparezca disponible para clientes." },
      { title: "Presencia local", body: "Una carta actualizada, imágenes propias y horarios operativos fiables ayudan a que los clientes conozcan mejor cada comercio antes de hacer un pedido." },
    ],
    primaryHref: "/unete#partners",
    primaryLabel: "Solicitar información para mi negocio",
  },
  riders: {
    eyebrow: "PIKI Riders · Xàtiva",
    title: "Trabajar como rider en Xàtiva",
    description: "Envía tu solicitud para repartir con PIKI y el equipo Fleet revisará tu documentación, vehículo y disponibilidad.",
    sections: [
      { title: "Proceso de solicitud", body: "Las personas interesadas pueden compartir sus datos de contacto, municipio, vehículo y disponibilidad. Para completar el expediente se solicita la documentación necesaria para operar de forma segura." },
      { title: "Revisión antes de activar", body: "Cada solicitud es revisada por el equipo correspondiente. Enviar el formulario no garantiza el alta ni la asignación de pedidos." },
      { title: "Operación local", body: "PIKI desarrolla su operación con Xàtiva como municipio de referencia. La necesidad de riders y las zonas atendidas pueden variar según la actividad real." },
    ],
    primaryHref: "/unete#riders",
    primaryLabel: "Solicitar alta como rider",
  },
  partners: {
    eyebrow: "Partners PIKI · Xàtiva",
    title: "Hazte partner de delivery en Xàtiva",
    description: "Los restaurantes y comercios de Xàtiva pueden solicitar información para valorar su incorporación a PIKI Delivery.",
    sections: [
      { title: "Cuéntanos sobre tu establecimiento", body: "Indica el nombre del comercio, una persona de contacto, teléfono y dirección. El equipo de zona utiliza esos datos solo para revisar la oportunidad y explicar los siguientes pasos." },
      { title: "Preparación del catálogo", body: "Antes de activar un local, se revisan datos, carta, disponibilidad y condiciones operativas. No se publica un establecimiento sin validación previa." },
      { title: "Una red de proximidad", body: "La propuesta de PIKI se centra en facilitar el acceso a la oferta local de comida y productos, respetando la disponibilidad real de cada negocio." },
    ],
    primaryHref: "/unete#partners",
    primaryLabel: "Enviar solicitud de partner",
  },
  coverage: {
    eyebrow: "Zonas de servicio · PIKI",
    title: "Cobertura de PIKI Delivery",
    description: "Consulta cómo comprobar si PIKI Delivery puede atender tu dirección en Xàtiva y municipios cercanos.",
    sections: [
      { title: "Xàtiva como zona de referencia", body: "PIKI opera con Xàtiva como municipio de referencia. La aplicación consulta la dirección concreta para mostrar una oferta adaptada a la zona." },
      { title: "Municipios cercanos", body: "La información pública de PIKI menciona Canals, El Genovés, La Llosa de Ranes, Novetlè y Montesa. Estas menciones no garantizan atención permanente: confirma siempre la dirección en la aplicación." },
      { title: "Disponibilidad actual", body: "La actividad de los comercios, riders, horarios y condiciones de entrega puede cambiar. La información que aparece en PIKI en el momento de pedir es la referencia válida." },
    ],
    primaryHref: "/",
    primaryLabel: "Comprobar mi dirección",
  },
};

export function LocalSeoPage({ page }: { page: PageKey }) {
  const content = pages[page];
  const icon = page === "riders" ? Bike : page === "restaurants" || page === "partners" ? Store : page === "coverage" ? MapPin : Utensils;
  const Icon = icon;

  return (
    <main className="min-h-screen bg-[#fffdf5] text-[#171715]">
      <header className="border-b border-[#eee3d8] bg-[#fffdf5]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" className="font-display text-2xl font-black tracking-[-.06em]" aria-label="PIKI Delivery, inicio">PIKI<span className="text-[#dc5c35]">.</span></Link>
          <nav className="flex items-center gap-4 text-sm font-bold text-[#56635a]" aria-label="Navegación principal">
            <Link href="/comida-a-domicilio-xativa" className="hover:text-[#171715]">Comida a domicilio</Link>
            <Link href="/unete" className="hover:text-[#171715]">Únete a PIKI</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-5 pb-10 pt-16 sm:pt-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff4be] px-3 py-1.5 text-xs font-black uppercase tracking-[.15em] text-[#5f5521]"><Icon className="h-3.5 w-3.5" />{content.eyebrow}</div>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[.95] tracking-[-.07em] sm:text-7xl">{content.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#59675e]">{content.description}</p>
          <Link href={content.primaryHref} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#171715] px-5 py-3 text-sm font-extrabold text-[#ffd72e] transition hover:bg-black">{content.primaryLabel}<ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-16 md:grid-cols-3">
        {content.sections.map((section) => <article key={section.title} className="rounded-[1.5rem] border border-[#eadfd4] bg-white p-6 shadow-[0_6px_18px_rgba(48,40,28,.04)]"><h2 className="font-display text-2xl font-semibold tracking-[-.04em]">{section.title}</h2><p className="mt-3 text-sm leading-relaxed text-[#637166]">{section.body}</p></article>)}
      </section>
      <section className="border-y border-[#eee2d6] bg-[#f7f1e7] px-5 py-12">
        <div className="mx-auto max-w-6xl"><p className="text-xs font-black uppercase tracking-[.16em] text-[#b95231]">Enlaces útiles</p><div className="mt-4 flex flex-wrap gap-3 text-sm font-bold"><Link href="/comida-a-domicilio-xativa" className="rounded-full bg-white px-4 py-2 hover:bg-[#fff4be]">Comida a domicilio en Xàtiva</Link><Link href="/restaurantes-a-domicilio-xativa" className="rounded-full bg-white px-4 py-2 hover:bg-[#fff4be]">Restaurantes y comercios</Link><Link href="/trabajo-rider-xativa" className="rounded-full bg-white px-4 py-2 hover:bg-[#fff4be]">Trabajar como rider</Link><Link href="/cobertura" className="rounded-full bg-white px-4 py-2 hover:bg-[#fff4be]">Cobertura</Link></div></div>
      </section>
      <footer className="px-5 py-10"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm text-[#66736a]"><span>PIKI Delivery · Xàtiva, Valencia</span><Link href="/" className="font-bold text-[#171715]">Web oficial</Link></div></footer>
    </main>
  );
}
