import blog from "@shared/blog-posts.json";
import { ArrowLeft, ArrowRight, CalendarDays, ChevronRight, FileText, Info, MapPin, Newspaper, Sparkles, UserRound } from "lucide-react";
import { Link } from "wouter";

type CallToAction = { label: string; href: string; description: string };
type BlogSection = { heading: string; paragraphs: string[] };
type BlogPost = {
  slug: string;
  title: string;
  description: string;
  summary: string;
  type: "Actualidad de PIKI" | "Guía local";
  author: string;
  datePublished: string;
  dateModified: string;
  newsEligible: boolean;
  sections: BlogSection[];
  callsToAction: CallToAction[];
};

const posts = blog.articles as BlogPost[];
const dateFormatter = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function prettyDate(isoDate: string) {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

function BlogHeader() {
  return (
    <header className="border-b border-[#ece2d6] bg-[#fffdf6]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-black tracking-[-.065em] text-[#171715]" aria-label="PIKI Delivery, inicio">
          PIKI<span className="text-[#dc5c35]">.</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm font-extrabold text-[#516056] sm:gap-5" aria-label="Navegación del blog">
          <Link href="/" className="hidden transition hover:text-[#171715] sm:inline">Pedir</Link>
          <Link href="/noticias" className="rounded-full bg-[#fff4be] px-3 py-2 text-[#171715] transition hover:bg-[#ffd72e]">Noticias</Link>
          <Link href="/unete" className="transition hover:text-[#171715]">Únete</Link>
        </nav>
      </div>
    </header>
  );
}

function BlogFooter() {
  return (
    <footer className="border-t border-[#e8ddd1] bg-[#f6efe5] px-5 py-9 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 text-sm text-[#637066] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-display text-xl font-bold tracking-[-.05em] text-[#171715]">PIKI<span className="text-[#dc5c35]">.</span></div>
          <p className="mt-2 max-w-lg leading-relaxed">Blog corporativo de PIKI: guías útiles e información publicada por el Equipo PIKI.</p>
          <p className="mt-2">Contacto y correcciones: <a className="underline" href="mailto:pikideliveryxat@gmail.com">pikideliveryxat@gmail.com</a></p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 font-bold" aria-label="Enlaces informativos">
          <Link href="/noticias/politica-editorial" className="hover:text-[#171715]">Política editorial</Link>
          <Link href="/noticias/autoria-y-transparencia" className="hover:text-[#171715]">Autoría y transparencia</Link>
          <Link href="/cobertura" className="hover:text-[#171715]">Cobertura</Link>
          <Link href="/unete" className="hover:text-[#171715]">Únete a PIKI</Link>
        </nav>
      </div>
    </footer>
  );
}

function BlogMeta({ post }: { post: BlogPost }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-bold text-[#68766c]">
      <span className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" />{post.author}</span>
      <span className="h-1 w-1 rounded-full bg-[#adb7ad]" aria-hidden="true" />
      <time className="inline-flex items-center gap-1.5" dateTime={post.datePublished}><CalendarDays className="h-3.5 w-3.5" />{prettyDate(post.datePublished)}</time>
    </div>
  );
}

function TypePill({ type }: { type: BlogPost["type"] }) {
  const isNews = type === "Actualidad de PIKI";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[.12em] ${isNews ? "bg-[#ffe5d9] text-[#a84427]" : "bg-[#e7f0e2] text-[#386342]"}`}>{isNews ? <Newspaper className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}{type}</span>;
}

function PostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  return (
    <article className={`group relative overflow-hidden rounded-[1.8rem] border border-[#e8ddd1] bg-white ${featured ? "p-6 shadow-[0_18px_48px_rgba(67,53,33,.09)] sm:p-8" : "p-6 shadow-[0_8px_24px_rgba(67,53,33,.045)]"}`}>
      <div className={`absolute right-0 top-0 h-28 w-28 rounded-bl-[5rem] ${post.type === "Actualidad de PIKI" ? "bg-[#ffe7dc]" : "bg-[#edf5e9]"}`} aria-hidden="true" />
      <div className="relative">
        <TypePill type={post.type} />
        <h2 className={`mt-5 max-w-3xl font-display font-semibold leading-[.98] tracking-[-.055em] text-[#171715] ${featured ? "text-4xl sm:text-5xl" : "text-3xl"}`}><Link href={`/noticias/${post.slug}`} className="outline-offset-4 hover:underline decoration-[#ffd72e] decoration-4">{post.title}</Link></h2>
        <p className={`mt-4 max-w-2xl leading-relaxed text-[#617066] ${featured ? "text-base sm:text-lg" : "text-sm"}`}>{post.summary}</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><BlogMeta post={post} /><Link href={`/noticias/${post.slug}`} className="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#171715] transition group-hover:gap-2.5">Leer artículo <ArrowRight className="h-4 w-4" /></Link></div>
      </div>
    </article>
  );
}

export function NoticiasIndex() {
  const [featured, ...rest] = posts;
  return (
    <main className="min-h-screen bg-[#fffdf6] text-[#171715]">
      <BlogHeader />
      <section className="relative overflow-hidden border-b border-[#eee2d7] bg-[#ffd72e] px-5 py-14 sm:px-8 sm:py-20">
        <div className="absolute -right-10 -top-14 h-56 w-56 rounded-full border-[26px] border-white/30" aria-hidden="true" />
        <img src="/piki-mascot.png" alt="" className="pointer-events-none absolute -bottom-7 right-0 w-36 opacity-10 drop-shadow-[0_14px_18px_rgba(92,72,0,.18)] sm:bottom-0 sm:right-8 sm:w-52 sm:opacity-100" />
        <div className="relative mx-auto max-w-6xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/65 px-3 py-1.5 text-xs font-black uppercase tracking-[.16em] text-[#5c4a00]"><Sparkles className="h-3.5 w-3.5" />PIKI por dentro</p>
          <h1 className="mt-5 max-w-4xl font-display text-5xl font-semibold leading-[.92] tracking-[-.075em] sm:text-7xl">Noticias, ideas y buen rollo</h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-[#5c531f] sm:text-lg">Actualidad de PIKI, guías locales y novedades para pedir, repartir y colaborar con más alegría.</p>
          <div className="mt-7 inline-flex rotate-[-1deg] rounded-2xl bg-[#171715] px-4 py-3 text-sm font-black text-[#ffd72e] shadow-[6px_6px_0_rgba(220,92,53,.45)]">¡Pide. Recibe. Disfruta!</div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        {featured && <PostCard post={featured} featured />}
        <div className="mt-11 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#b45231]">Más información</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-[-.05em]">Actualidad y ayuda local</h2></div><span className="hidden rounded-full bg-[#f2eee7] px-3 py-2 text-xs font-bold text-[#657166] sm:block">{posts.length} publicaciones</span></div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">{rest.map((post) => <PostCard key={post.slug} post={post} />)}</div>
      </section>
      <section className="border-y border-[#ebe0d3] bg-[#f7f1e7] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl rounded-[1.6rem] bg-white p-6 shadow-[0_7px_22px_rgba(68,51,27,.05)] sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8"><div><div className="flex items-center gap-2 text-[#b45231]"><Info className="h-5 w-5" /><p className="text-xs font-black uppercase tracking-[.14em]">Transparencia</p></div><h2 className="mt-3 font-display text-2xl font-semibold tracking-[-.04em]">Este es un blog corporativo de PIKI.</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#647167]">No presentamos nuestras comunicaciones como periodismo independiente ni garantizamos resultados de búsqueda o indexación.</p></div><Link href="/noticias/autoria-y-transparencia" className="mt-5 inline-flex shrink-0 items-center gap-1.5 text-sm font-extrabold text-[#171715] sm:mt-0">Cómo publicamos <ChevronRight className="h-4 w-4" /></Link></div>
      </section>
      <BlogFooter />
    </main>
  );
}

export function NoticiasArticle({ slug }: { slug: string }) {
  const post = posts.find((candidate) => candidate.slug === slug);
  if (!post) return <NoticiasMissing />;
  return (
    <main className="min-h-screen bg-[#fffdf6] text-[#171715]">
      <BlogHeader />
      <article>
        <header className="border-b border-[#ece2d6] bg-[#fff7d5] px-5 py-12 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-4xl"><Link href="/noticias" className="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#5d531d] hover:text-[#171715]"><ArrowLeft className="h-4 w-4" />Todas las publicaciones</Link><div className="mt-8"><TypePill type={post.type} /></div><h1 className="mt-5 font-display text-5xl font-semibold leading-[.94] tracking-[-.075em] sm:text-7xl">{post.title}</h1><p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#5e5b48] sm:text-xl">{post.description}</p><div className="mt-7"><BlogMeta post={post} /></div></div>
        </header>
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_250px]">
          <div className="max-w-3xl"><div className="rounded-[1.45rem] border border-[#e5dccf] bg-white p-6 text-base leading-relaxed text-[#49574d] shadow-[0_7px_22px_rgba(68,51,27,.04)] sm:p-8"><p className="font-display text-2xl font-medium leading-snug tracking-[-.035em] text-[#243228]">{post.summary}</p></div>{post.sections.map((section) => <section key={section.heading} className="mt-10"><h2 className="font-display text-3xl font-semibold leading-tight tracking-[-.05em] sm:text-4xl">{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 text-base leading-8 text-[#56645a]">{paragraph}</p>)}</section>)}<section className="mt-12 rounded-[1.6rem] bg-[#e8f1e4] p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[.16em] text-[#3e7047]">Siguiente paso</p><div className="mt-4 grid gap-3">{post.callsToAction.map((cta) => <a key={cta.href} href={cta.href} className="group rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(43,75,48,.07)] transition hover:-translate-y-0.5"><span className="flex items-center justify-between gap-3 font-extrabold text-[#171715]">{cta.label}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span><span className="mt-1.5 block text-sm leading-relaxed text-[#627065]">{cta.description}</span></a>)}</div></section></div>
          <aside className="h-fit rounded-[1.5rem] border border-[#e8ded2] bg-white p-5 shadow-[0_6px_20px_rgba(67,53,33,.04)] lg:sticky lg:top-5"><FileText className="h-5 w-5 text-[#dc5c35]" /><p className="mt-3 text-xs font-black uppercase tracking-[.15em] text-[#a64a2d]">Ficha de publicación</p><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-[#78857b]">Autoría</dt><dd className="mt-0.5 font-bold">{post.author}</dd></div><div><dt className="text-[#78857b]">Fecha</dt><dd className="mt-0.5 font-bold">{prettyDate(post.datePublished)}</dd></div><div><dt className="text-[#78857b]">Tipo</dt><dd className="mt-0.5 font-bold">{post.type}</dd></div></dl><Link href="/noticias/politica-editorial" className="mt-6 inline-flex text-sm font-extrabold text-[#171715] underline decoration-[#ffd72e] decoration-2 underline-offset-4">Política editorial</Link></aside>
        </div>
      </article>
      <BlogFooter />
    </main>
  );
}

function StaticPage({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#fffdf6] text-[#171715]"><BlogHeader /><section className="border-b border-[#ece2d6] bg-[#fff4be] px-5 py-14 sm:px-8 sm:py-20"><div className="mx-auto max-w-4xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#665500]">{eyebrow}</p><h1 className="mt-4 font-display text-5xl font-semibold leading-[.94] tracking-[-.07em] sm:text-7xl">{title}</h1></div></section><article className="mx-auto max-w-3xl px-5 py-12 text-base leading-8 text-[#536157] sm:px-8 sm:py-16">{children}</article><BlogFooter /></main>;
}

export function PoliticaEditorial() {
  return <StaticPage eyebrow="Noticias PIKI" title="Política editorial"><p>Noticias PIKI es un espacio corporativo publicado por PIKI Delivery. Su objetivo es explicar cambios propios y ofrecer guías prácticas relacionadas con el uso de PIKI.</p><h2 className="mt-10 font-display text-3xl font-semibold tracking-[-.05em] text-[#171715]">Cómo etiquetamos el contenido</h2><p className="mt-3">Las publicaciones clasificadas como <strong>Actualidad de PIKI</strong> describen comunicaciones o cambios de PIKI y se identifican como información corporativa. Las <strong>Guías locales</strong> ayudan a entender procesos como comprobar cobertura o distinguir tipos de actualización; no son noticias independientes.</p><h2 className="mt-10 font-display text-3xl font-semibold tracking-[-.05em] text-[#171715]">Límites editoriales</h2><p className="mt-3">No convertimos publicidad en periodismo independiente. No afirmamos alianzas, número de partners, precios, comisiones, apertura de zonas, disponibilidad ni resultados que no estén confirmados en el lugar y momento correspondientes.</p><p className="mt-3">Las fechas se expresan en formato ISO en los datos de publicación. Podemos corregir o actualizar una entrada si mejora su precisión.</p><h2 className="mt-10 font-display text-3xl font-semibold tracking-[-.05em] text-[#171715]">Búsqueda e indexación</h2><p className="mt-3">Incluimos información técnica para facilitar el rastreo de páginas públicas, pero no prometemos inclusión en Google News, indexación, posición ni visibilidad en ningún buscador.</p></StaticPage>;
}

export function AutoriaYTransparencia() {
  return <StaticPage eyebrow="Noticias PIKI" title="Autoría y transparencia"><p>Las publicaciones de este blog están firmadas por <strong>Equipo PIKI</strong>. La firma indica que el contenido ha sido preparado o revisado por el equipo de PIKI y refleja información corporativa o una guía elaborada por la organización.</p><h2 className="mt-10 font-display text-3xl font-semibold tracking-[-.05em] text-[#171715]">Qué es y qué no es este blog</h2><p className="mt-3">Es un canal de PIKI Delivery. No es una cabecera de prensa independiente ni pretende ofrecer cobertura editorial ajena a la organización. Cuando un texto trata sobre PIKI, su naturaleza corporativa se muestra en su tipo y en esta página.</p><h2 className="mt-10 font-display text-3xl font-semibold tracking-[-.05em] text-[#171715]">Información que necesita confirmación</h2><p className="mt-3">La cobertura, los comercios visibles, la disponibilidad, los importes y las condiciones pueden depender de una dirección, del momento y de la operación real. Los formularios de /unete reciben solicitudes iniciales, no crean altas automáticas ni garantizan colaboración.</p><p className="mt-3">No publicamos como hecho alianzas no verificadas, cifras de partners, precios o apertura de zonas. Si necesitas una respuesta actual, utiliza la pantalla o el proceso oficial que corresponda.</p></StaticPage>;
}

function NoticiasMissing() {
  return <main className="grid min-h-screen place-items-center bg-[#fffdf6] p-5 text-center text-[#171715]"><div><p className="text-xs font-black uppercase tracking-[.17em] text-[#b45231]">Noticias PIKI</p><h1 className="mt-3 font-display text-5xl font-semibold tracking-[-.07em]">Artículo no encontrado</h1><Link href="/noticias" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#ffd72e] px-5 py-3 text-sm font-extrabold">Volver a noticias <ArrowRight className="h-4 w-4" /></Link></div></main>;
}
