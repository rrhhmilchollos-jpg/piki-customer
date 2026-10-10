import fs from "node:fs";
import path from "node:path";

const root = process.env.PIKI_SEO_ROOT || process.cwd();
const dist = path.join(root, "dist", "public");
const publicDir = path.join(root, "client", "public");
const origin = "https://pikidelivery.com";
const buildNow = new Date(process.env.PIKI_SEO_NOW || Date.now());
const lastmod = buildNow.toISOString().slice(0, 10);
const blog = JSON.parse(fs.readFileSync(path.join(root, "shared", "blog-posts.json"), "utf8"));

const pages = [
  {
    path: "/",
    title: "PIKI Delivery | Comida a domicilio en Xàtiva",
    description: "Consulta restaurantes y opciones de comida a domicilio disponibles para tu dirección en Xàtiva con PIKI Delivery.",
    heading: "Comida a domicilio en Xàtiva con PIKI Delivery",
    eyebrow: "PIKI Delivery · Xàtiva, Valencia",
    lead: "Consulta restaurantes y productos disponibles para tu dirección. Revisa las condiciones actuales antes de confirmar tu pedido.",
    sections: [
      ["Cómo funciona PIKI", "Introduce tu dirección, consulta la oferta que aparece disponible para tu zona y revisa el pedido antes de confirmar el checkout."],
      ["Servicio local", "PIKI conecta clientes, restaurantes asociados y riders con Xàtiva como municipio de referencia. La disponibilidad de comercios, productos y reparto puede variar."],
      ["Cobertura", "La plataforma muestra la disponibilidad real según la dirección. Consulta la cobertura de Xàtiva y municipios cercanos desde la aplicación."],
    ],
    cta: ["Consultar opciones disponibles", "/"],
    faqs: [["¿PIKI reparte en toda Xàtiva?", "La cobertura se comprueba para la dirección completa y depende de los comercios y riders disponibles en ese momento."], ["¿Qué puedo pedir en PIKI?", "La oferta depende de tu dirección, los establecimientos activos, sus horarios y la operación del momento."], ["¿Cómo colaboro con PIKI?", "Restaurantes, comercios y personas interesadas en repartir pueden enviar una solicitud inicial desde /unete."]],
  },
  {
    path: "/comida-a-domicilio-xativa",
    title: "Comida a domicilio en Xàtiva | PIKI Delivery",
    description: "Consulta comida a domicilio en Xàtiva con PIKI Delivery: revisa restaurantes, productos y disponibilidad para tu dirección.",
    heading: "Comida a domicilio en Xàtiva",
    eyebrow: "PIKI Delivery · Xàtiva",
    lead: "PIKI es una plataforma para consultar restaurantes y pedir comida a domicilio en Xàtiva cuando exista oferta disponible para tu dirección.",
    sections: [
      ["Comprueba la disponibilidad", "La oferta, los comercios activos, los precios, las tarifas y los tiempos de entrega dependen de la dirección y de la operativa del momento."],
      ["Antes de pedir", "Revisa el restaurante, los productos, el total y las condiciones que aparecen en el checkout. La información visible en la aplicación es la referencia válida."],
      ["Zonas cercanas", "PIKI también informa sobre municipios cercanos a Xàtiva. Cada dirección debe comprobarse en la plataforma antes de hacer un pedido."],
    ],
    cta: ["Consultar la oferta", "/"],
  },
  {
    path: "/restaurantes-a-domicilio-xativa",
    title: "Restaurantes con delivery en Xàtiva | PIKI Delivery",
    description: "Información para restaurantes y comercios de Xàtiva que quieren solicitar una posible colaboración con PIKI Delivery.",
    heading: "Restaurantes y delivery en Xàtiva",
    eyebrow: "Para comercios · PIKI Delivery",
    lead: "Los restaurantes y comercios de Xàtiva pueden solicitar información para valorar su incorporación a PIKI Delivery.",
    sections: [
      ["Solicita información", "Comparte el nombre del establecimiento, una persona de contacto, teléfono y dirección. El equipo responsable revisará la solicitud."],
      ["Validación antes del alta", "Enviar una solicitud no activa un establecimiento. El equipo confirma los datos, el catálogo, las condiciones y la disponibilidad operativa antes de publicar un local."],
      ["Oferta actualizada", "La carta, los horarios, las imágenes y las condiciones de cada comercio deben revisarse antes de quedar disponibles para clientes."],
    ],
    cta: ["Solicitar información para mi negocio", "/unete#partners"],
  },
  {
    path: "/trabajo-rider-xativa",
    title: "Trabajo de rider en Xàtiva | PIKI Riders",
    description: "Solicita información para repartir con PIKI Riders en Xàtiva. El equipo revisa documentación, vehículo y disponibilidad.",
    heading: "Trabajar como rider en Xàtiva",
    eyebrow: "PIKI Riders · Xàtiva",
    lead: "Las personas interesadas en repartir pueden enviar una solicitud inicial con sus datos, vehículo, disponibilidad y documentación.",
    sections: [
      ["Proceso de solicitud", "El equipo Fleet revisa los datos de contacto, municipio, vehículo y la documentación necesaria antes de valorar una activación."],
      ["Revisión de seguridad", "La solicitud no garantiza el alta ni la asignación de pedidos. Cada expediente se revisa de forma individual antes de operar."],
      ["Operación local", "Xàtiva es el municipio de referencia. La necesidad de riders y las zonas atendidas pueden variar según la actividad real."],
    ],
    cta: ["Solicitar alta como rider", "/unete#riders"],
  },
  {
    path: "/hazte-partner-xativa",
    title: "Hazte partner de delivery en Xàtiva | PIKI",
    description: "Los comercios de Xàtiva pueden solicitar información para colaborar con PIKI Delivery y preparar su catálogo de reparto.",
    heading: "Hazte partner de PIKI en Xàtiva",
    eyebrow: "Partners PIKI · Xàtiva",
    lead: "PIKI recibe solicitudes de comercios que quieran conocer el proceso de incorporación y reparto local.",
    sections: [
      ["Comparte los datos de tu comercio", "La solicitud incluye datos de contacto y dirección del establecimiento para que el equipo responsable pueda valorar la oportunidad."],
      ["Catálogo y condiciones", "Antes de activar un comercio se revisan los productos, la disponibilidad, la operativa y las condiciones aplicables."],
      ["Presencia local", "La información pública del comercio debe ser clara y estar actualizada para facilitar una experiencia fiable a los clientes."],
    ],
    cta: ["Enviar solicitud de partner", "/unete#partners"],
  },
  {
    path: "/cobertura",
    title: "Cobertura de PIKI Delivery | Xàtiva y municipios cercanos",
    description: "Comprueba cómo confirmar la cobertura de comida a domicilio de PIKI Delivery en Xàtiva y municipios cercanos.",
    heading: "Cobertura de PIKI Delivery",
    eyebrow: "Zonas de servicio · PIKI",
    lead: "PIKI consulta cada dirección para mostrar la oferta y las condiciones disponibles en ese momento.",
    sections: [
      ["Xàtiva como referencia", "PIKI opera con Xàtiva como municipio de referencia y adapta la oferta a la dirección introducida por el cliente."],
      ["Municipios cercanos", "La información pública de PIKI menciona Canals, El Genovés, La Llosa de Ranes, Novetlè y Montesa. Estas menciones no garantizan atención permanente."],
      ["La información válida", "Antes de confirmar un pedido, revisa siempre la disponibilidad, los precios y la entrega mostrados por PIKI para tu dirección."],
    ],
    cta: ["Comprobar mi dirección", "/"],
  },
  {
    path: "/comida-a-domicilio-canals",
    title: "Comida a domicilio en Canals | PIKI Delivery",
    description: "Comprueba si PIKI muestra opciones de comida y reparto para una dirección concreta de Canals.",
    heading: "Comida a domicilio en Canals",
    eyebrow: "PIKI Delivery · Canals",
    lead: "Consulta la disponibilidad real para tu dirección. La mención de Canals como zona de expansión no garantiza reparto activo en todo momento.",
    sections: [["Comprueba tu dirección", "Introduce calle y número para consultar los restaurantes y condiciones que PIKI muestre para ese punto."], ["Revisa el checkout", "La carta, los precios, la tarifa y el tiempo estimado pueden cambiar. Confirma siempre la información visible antes de pedir."], ["Expansión local responsable", "Canals es una zona objetivo de expansión de PIKI. La disponibilidad se valida por dirección, comercio y operación real."]],
    cta: ["Comprobar mi dirección", "/"],
    faqs: [["¿PIKI está disponible en Canals?", "La disponibilidad se confirma introduciendo la dirección completa en la plataforma; no se presupone por municipio."], ["¿Puedo solicitar un restaurante de Canals?", "Sí, un comercio puede enviar una solicitud inicial desde la página de incorporación."], ["¿Dónde consulto las condiciones?", "En la aplicación y el checkout, antes de confirmar el pedido."]],
  },
  {
    path: "/comida-a-domicilio-alberic",
    title: "Comida a domicilio en Alberic | PIKI Delivery",
    description: "Comprueba si PIKI muestra opciones de comida y reparto para una dirección concreta de Alberic.",
    heading: "Comida a domicilio en Alberic",
    eyebrow: "PIKI Delivery · Alberic",
    lead: "Consulta la cobertura real de PIKI para tu dirección de Alberic y revisa las opciones disponibles antes de confirmar.",
    sections: [["Consulta la cobertura real", "Una dirección completa permite comprobar mejor qué opciones aparecen disponibles en ese momento."], ["Información clara antes de pedir", "Revisa restaurante, productos, total, tarifa y tiempo estimado en el checkout."], ["Una zona de expansión", "Alberic es una localidad objetivo de expansión local. La página no supone una promesa de reparto permanente."]],
    cta: ["Comprobar mi dirección", "/"],
    faqs: [["¿La cobertura en Alberic es permanente?", "No se garantiza por esta página; la cobertura se comprueba para cada dirección y momento."], ["¿Cómo puede colaborar un comercio?", "Puede enviar sus datos iniciales desde /unete para que el equipo revise la solicitud."], ["¿Qué información debo revisar?", "La disponibilidad del restaurante, la carta, el precio total, la tarifa y el tiempo estimado."]],
  },
  {
    path: "/unete",
    title: "Únete a PIKI | Riders y restaurantes en Xàtiva",
    description: "Página oficial para enviar solicitudes de rider o partner a PIKI Delivery en Xàtiva.",
    heading: "Únete a PIKI",
    eyebrow: "Riders y comercios · Xàtiva",
    lead: "PIKI recibe solicitudes iniciales de personas interesadas en repartir y de restaurantes o comercios que quieren conocer una posible colaboración.",
    sections: [
      ["Para riders", "Comparte tus datos, municipio, vehículo y disponibilidad. El equipo Fleet revisará la documentación necesaria antes de valorar una activación."],
      ["Para comercios", "Indica los datos de tu establecimiento y una persona de contacto. El equipo responsable revisará la solicitud y explicará los siguientes pasos."],
      ["Solicitud no vinculante", "Enviar un formulario no garantiza una aceptación ni crea un alta automática. Cada caso se revisa antes de operar."],
    ],
    cta: ["Abrir formulario de incorporación", "/unete"],
  },
];

const esc = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const xmlEsc = esc;
const absolute = (value) => `${origin}${value === "/" ? "/" : value}`;
const links = [
  ["Comida a domicilio", "/comida-a-domicilio-xativa"],
  ["Restaurantes", "/restaurantes-a-domicilio-xativa"],
  ["Trabajar como rider", "/trabajo-rider-xativa"],
  ["Hazte partner", "/hazte-partner-xativa"],
  ["Cobertura", "/cobertura"],
  ["Canals", "/comida-a-domicilio-canals"],
  ["Alberic", "/comida-a-domicilio-alberic"],
  ["Noticias PIKI", "/noticias"],
  ["Únete a PIKI", "/unete"],
];

function jsonLd(page) {
  const pageUrl = absolute(page.path);
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${origin}/#organization`, name: "PIKI Delivery", alternateName: "PIKI", url: `${origin}/`, logo: `${origin}/piki-delivery-512.png`, areaServed: [{ "@type": "City", name: "Xàtiva" }, { "@type": "AdministrativeArea", name: "Valencia" }] },
      { "@type": "WebSite", "@id": `${origin}/#website`, url: `${origin}/`, name: "PIKI Delivery", inLanguage: "es-ES", publisher: { "@id": `${origin}/#organization` } },
      { "@type": "WebPage", "@id": `${pageUrl}#webpage`, url: pageUrl, name: page.title, description: page.description, inLanguage: "es-ES", isPartOf: { "@id": `${origin}/#website` }, about: { "@id": `${origin}/#service` } },
      { "@type": "Service", "@id": `${origin}/#service`, name: "PIKI Delivery en Xàtiva", description: "Servicio digital para consultar opciones de comida a domicilio disponibles según la dirección del cliente.", serviceType: "Food delivery service", areaServed: [{ "@type": "City", name: "Xàtiva" }, { "@type": "City", name: "Canals" }, { "@type": "City", name: "Alberic" }, { "@type": "GeoCircle", geoMidpoint: { "@type": "GeoCoordinates", latitude: 38.9908, longitude: -0.5186 }, geoRadius: "30000" }], provider: { "@id": `${origin}/#organization` }, url: `${origin}/comida-a-domicilio-xativa` },
      ...(page.faqs ? [{ "@type": "FAQPage", "@id": `${pageUrl}#faq`, mainEntity: page.faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }] : []),
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "PIKI Delivery", item: `${origin}/` }, { "@type": "ListItem", position: 2, name: page.heading, item: pageUrl }] },
    ],
  }).replace(/</g, "\\u003c");
}

function pageHtml(page) {
  const pageUrl = absolute(page.path);
  const cards = page.sections.map(([title, body]) => `<article><h2>${esc(title)}</h2><p>${esc(body)}</p></article>`).join("\n");
  const faqs = page.faqs ? `<section class="faq"><h2>Preguntas frecuentes</h2>${page.faqs.map(([question, answer]) => `<div><h3>${esc(question)}</h3><p>${esc(answer)}</p></div>`).join("\n")}</section>` : "";
  const nav = links.map(([label, href]) => `<a href="${href}">${esc(label)}</a>`).join("\n");
  return `<!doctype html>
<html lang="es-ES">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <meta name="description" content="${esc(page.description)}">
  <meta name="theme-color" content="#FFD72E">
  <meta name="geo.region" content="ES-V">
  <meta name="geo.placename" content="Xàtiva, Valencia, España">
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="es-ES" href="${pageUrl}">
  <link rel="alternate" hreflang="x-default" href="${pageUrl}">
  <link rel="sitemap" type="application/xml" href="${origin}/sitemap.xml">
  <link rel="alternate" type="application/rss+xml" title="Noticias PIKI" href="${origin}/noticias/rss.xml">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="PIKI Delivery">
  <meta property="og:locale" content="es_ES">
  <meta property="og:title" content="${esc(page.title)}">
  <meta property="og:description" content="${esc(page.description)}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="${origin}/piki-hero.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(page.title)}">
  <meta name="twitter:description" content="${esc(page.description)}">
  <script type="application/ld+json">${jsonLd(page)}</script>
  <title>${esc(page.title)}</title>
  <style>body{margin:0;background:#fffdf5;color:#171715;font:16px/1.6 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wrap{max-width:1040px;margin:auto;padding:0 22px}.nav{display:flex;gap:16px;flex-wrap:wrap;align-items:center;justify-content:space-between;padding:22px 0;border-bottom:1px solid #ece3d9}.brand{font-size:26px;font-weight:900;letter-spacing:-.06em;color:#171715;text-decoration:none}.brand span{color:#dc5c35}.links{display:flex;gap:14px;flex-wrap:wrap}.links a{font-size:14px;font-weight:700;color:#4e5a50;text-decoration:none}.hero{padding:82px 0 44px}.eyebrow{display:inline-block;background:#fff4be;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.hero h1{max-width:800px;margin:20px 0 18px;font-size:clamp(42px,7vw,80px);line-height:.95;letter-spacing:-.07em}.lead{max-width:720px;font-size:20px;color:#536057}.cta{display:inline-block;margin-top:26px;background:#171715;border-radius:999px;padding:13px 20px;color:#ffd72e;font-weight:800;text-decoration:none}.grid{display:grid;gap:18px;grid-template-columns:repeat(3,minmax(0,1fr));padding:28px 0 64px}.grid article{border:1px solid #eadfd4;border-radius:22px;background:#fff;padding:24px}.grid h2{margin:0;font-size:22px;letter-spacing:-.04em}.grid p{color:#5b695f}.local{margin:12px 0 28px;border-radius:22px;background:#f7f1e7;padding:28px}.faq{margin:0 0 60px;border-radius:22px;background:#fff4be;padding:28px}.faq h2{margin-top:0}.faq h3{margin:20px 0 4px;font-size:18px}.faq p{margin:0;color:#665f35}.local h2{margin-top:0}.footer{border-top:1px solid #ece3d9;padding:28px 0;color:#607065;font-size:14px}@media(max-width:760px){.grid{grid-template-columns:1fr}.hero{padding-top:52px}.links{gap:10px}.links a{font-size:12px}}</style>
</head>
<body>
  <header class="wrap"><nav class="nav" aria-label="Navegación principal"><a class="brand" href="/" aria-label="PIKI Delivery, inicio">PIKI<span>.</span></a><div class="links">${nav}</div></nav></header>
  <main class="wrap"><section class="hero"><span class="eyebrow">${esc(page.eyebrow)}</span><h1>${esc(page.heading)}</h1><p class="lead">${esc(page.lead)}</p><a class="cta" href="${page.cta[1]}">${esc(page.cta[0])}</a></section><section class="grid">${cards}</section>${faqs}<section class="local"><h2>Información oficial de PIKI Delivery</h2><p>PIKI Delivery es una plataforma digital vinculada a Xàtiva, Valencia, España. La disponibilidad de comercios, productos, precios y reparto se confirma para cada dirección dentro del servicio.</p><div class="links">${nav}</div></section></main>
  <footer class="wrap footer">PIKI Delivery · Xàtiva, Valencia, España · <a href="${origin}/">Web oficial</a></footer>
</body>
</html>`;
}

function appShellPage(template, page, robots = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1") {
  const pageUrl = absolute(page.path);
  const schema = `<script type="application/ld+json">${jsonLd(page)}</script>`;
  const withHead = template
    .replace(/<html[^>]*>/i, '<html lang="es-ES">')
    .replace(/<meta name="description" content="[^"]*"\s*\/>/i, `<meta name="description" content="${esc(page.description)}" />`)
    .replace(/<meta name="robots" content="[^"]*"\s*\/>/i, `<meta name="robots" content="${robots}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/i, `<link rel="canonical" href="${pageUrl}" />`)
    .replace(/<title>[^<]*<\/title>/i, `<title>${esc(page.title)}</title>`);
  const hreflang = `<link rel="alternate" hreflang="es-ES" href="${pageUrl}" />\n    <link rel="alternate" hreflang="x-default" href="${pageUrl}" />`;
  return withHead.replace(/<\/head>/i, `    ${hreflang}\n    ${schema}\n  </head>`);
}

function blogPath(post) {
  return `/noticias/${post.slug}`;
}

function blogNav() {
  return `<header class="blog-header"><a class="brand" href="/" aria-label="PIKI Delivery, inicio">PIKI<span>.</span></a><nav aria-label="Navegación del blog"><a href="/">Pedir</a><a href="/noticias">Noticias</a><a href="/unete">Únete</a></nav></header>`;
}

function blogFooter() {
  return `<footer class="blog-footer"><div><strong>PIKI<span>.</span></strong><p>Blog corporativo de PIKI: guías útiles e información publicada por el Equipo PIKI.</p><p>Contacto y correcciones: <a href="mailto:pikideliveryxat@gmail.com">pikideliveryxat@gmail.com</a></p></div><nav aria-label="Enlaces informativos"><a href="/noticias/politica-editorial">Política editorial</a><a href="/noticias/autoria-y-transparencia">Autoría y transparencia</a><a href="/cobertura">Cobertura</a><a href="/unete">Únete a PIKI</a></nav></footer>`;
}

const blogCss = `*{box-sizing:border-box}body{margin:0;background:#fffdf6;color:#171715;font:16px/1.65 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:inherit}.blog-header,.blog-footer,.blog-wrap{max-width:1120px;margin:auto;padding-left:22px;padding-right:22px}.blog-header{min-height:78px;display:flex;align-items:center;justify-content:space-between;gap:18px}.blog-header nav,.blog-footer nav{display:flex;flex-wrap:wrap;gap:14px}.blog-header nav a,.blog-footer nav a{font-size:14px;font-weight:750;text-decoration:none;color:#526057}.brand{font-size:27px;font-weight:900;letter-spacing:-.07em;text-decoration:none}.brand span,.blog-footer strong span{color:#dc5c35}.blog-hero{overflow:hidden;background:#ffd72e;border-top:1px solid #eee0a5;border-bottom:1px solid #e2c528}.blog-hero-inner{position:relative;max-width:1120px;margin:auto;padding:68px 22px}.blog-hero h1,.article-hero h1,.static-hero h1{max-width:880px;margin:18px 0 0;font-size:clamp(44px,7vw,80px);line-height:.94;letter-spacing:-.075em}.blog-hero p,.article-hero p{max-width:720px;font-size:19px;line-height:1.55;color:#5f531b}.badge{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:7px 12px;background:#fff4be;color:#5f531b;font-size:11px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.blog-hero .badge{background:rgba(255,255,255,.65)}.mascot{position:absolute;right:28px;bottom:-24px;width:min(22vw,220px);filter:drop-shadow(0 16px 18px rgba(94,68,0,.16))}.posts{padding-top:52px;padding-bottom:62px}.post-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin-top:24px}.post{position:relative;overflow:hidden;border:1px solid #e8ddd1;border-radius:28px;background:#fff;padding:28px;box-shadow:0 8px 24px rgba(67,53,33,.05)}.post.featured{padding:34px}.post h2{max-width:780px;margin:18px 0 0;font-size:clamp(28px,4vw,48px);line-height:1;letter-spacing:-.055em}.post h2 a{text-decoration:none}.post p{max-width:720px;color:#607065}.meta{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin-top:22px;color:#68766c;font-size:12px;font-weight:750}.meta i{width:4px;height:4px;border-radius:999px;background:#abb6ac}.more{display:inline-block;margin-top:20px;font-size:14px;font-weight:850;text-decoration:none}.transparency{margin:0 0 56px;border-radius:26px;background:#f7f1e7;padding:28px}.transparency h2{margin:9px 0 0;font-size:28px;letter-spacing:-.045em}.transparency p{max-width:780px;color:#627066}.article-hero,.static-hero{border-top:1px solid #ece2d6;border-bottom:1px solid #ece2d6;background:#fff7d5}.article-hero-inner,.static-hero-inner{max-width:880px;margin:auto;padding:58px 22px}.article-hero .back{font-size:14px;font-weight:800;color:#5c531d;text-decoration:none}.article-body{display:grid;grid-template-columns:minmax(0,1fr) 238px;gap:52px;max-width:1120px;margin:auto;padding:58px 22px 72px}.article-copy{max-width:720px}.summary{border:1px solid #e5dccf;border-radius:24px;background:#fff;padding:26px;font-size:22px;line-height:1.45;color:#2c3b30;box-shadow:0 7px 22px rgba(68,51,27,.04)}.article-copy h2,.static-copy h2{margin:42px 0 0;font-size:32px;line-height:1.1;letter-spacing:-.05em}.article-copy p,.static-copy p{color:#56645a}.article-copy section p{margin-top:15px}.cta-box{margin-top:46px;border-radius:26px;background:#e8f1e4;padding:26px}.cta-box a{display:block;margin-top:12px;border-radius:16px;background:#fff;padding:15px;text-decoration:none;font-weight:850;box-shadow:0 4px 14px rgba(43,75,48,.07)}.cta-box a small{display:block;margin-top:5px;color:#627065;font-size:13px;font-weight:500}.article-aside{height:max-content;border:1px solid #e8ded2;border-radius:24px;background:#fff;padding:20px;box-shadow:0 6px 20px rgba(67,53,33,.04)}.article-aside dt{margin-top:15px;color:#78857b;font-size:13px}.article-aside dd{margin:2px 0 0;font-weight:750}.static-copy{max-width:760px;margin:auto;padding:54px 22px 72px}.blog-footer{display:flex;flex-wrap:wrap;align-items:end;justify-content:space-between;gap:22px;border-top:1px solid #e8ddd1;padding-top:34px;padding-bottom:34px;color:#637066;font-size:14px}.blog-footer strong{font-size:22px;letter-spacing:-.05em;color:#171715}.blog-footer p{max-width:520px;margin:8px 0 0}.blog-footer nav{max-width:410px}@media(max-width:760px){.blog-header{min-height:70px}.blog-header nav{gap:10px}.blog-header nav a{font-size:12px}.blog-hero-inner{padding-top:52px;padding-bottom:54px}.mascot{opacity:.10;right:-13px;width:155px}.post-grid{grid-template-columns:1fr}.post,.post.featured{padding:23px}.article-body{grid-template-columns:1fr;gap:28px;padding-top:40px}.article-aside{order:-1}.article-hero-inner,.static-hero-inner{padding-top:44px;padding-bottom:44px}.blog-footer{align-items:start}}`;

function blogJsonLd({ path: itemPath, title, description, graph }) {
  const pageUrl = absolute(itemPath);
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${origin}/#organization`, name: "PIKI Delivery", alternateName: "PIKI", url: `${origin}/`, logo: `${origin}/piki-delivery-512.png` },
      { "@type": "WebSite", "@id": `${origin}/#website`, name: "Noticias PIKI", url: `${origin}/noticias`, inLanguage: "es-ES", publisher: { "@id": `${origin}/#organization` } },
      { "@type": "WebPage", "@id": `${pageUrl}#webpage`, url: pageUrl, name: title, description, inLanguage: "es-ES", isPartOf: { "@id": `${origin}/#website` } },
      ...graph,
    ],
  }).replace(/</g, "\\u003c");
}

function blogHead({ itemPath, title, description, type = "website", json }) {
  const pageUrl = absolute(itemPath);
  return `<!doctype html>
<html lang="es-ES">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#FFD72E">
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="es-ES" href="${pageUrl}">
  <link rel="alternate" hreflang="x-default" href="${pageUrl}">
  <link rel="alternate" type="application/rss+xml" title="Noticias PIKI" href="${origin}/noticias/rss.xml">
  <link rel="sitemap" type="application/xml" href="${origin}/sitemap.xml">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="PIKI Delivery">
  <meta property="og:locale" content="es_ES">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="${origin}/piki-mascot.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${origin}/piki-mascot.png">
  <script type="application/ld+json">${json}</script>
  <title>${esc(title)}</title>
  <style>${blogCss}</style>
</head>`;
}

function displayDate(iso) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

function typeBadge(type) {
  return `<span class="badge">${esc(type)}</span>`;
}

function blogIndexHtml() {
  const itemPath = "/noticias";
  const title = "Noticias PIKI | Actualidad corporativa y guías locales";
  const description = "Información corporativa y guías prácticas publicadas por el Equipo PIKI.";
  const json = blogJsonLd({
    path: itemPath,
    title,
    description,
    graph: [{ "@type": "CollectionPage", "@id": `${origin}${itemPath}#collection`, name: "Noticias PIKI", description, hasPart: blog.articles.map((post) => ({ "@type": "BlogPosting", headline: post.title, url: absolute(blogPath(post)), datePublished: post.datePublished, author: { "@type": "Organization", name: "Equipo PIKI" } })) }],
  });
  const cards = blog.articles.map((post, index) => `<article class="post${index === 0 ? " featured" : ""}">${typeBadge(post.type)}<h2><a href="${blogPath(post)}">${esc(post.title)}</a></h2><p>${esc(post.summary)}</p><div class="meta"><span>Equipo PIKI</span><i></i><time datetime="${post.datePublished}">${esc(displayDate(post.datePublished))}</time></div><a class="more" href="${blogPath(post)}">Leer artículo →</a></article>`).join("\n");
  return `${blogHead({ itemPath, title, description, json })}
<body>
${blogNav()}
<section class="blog-hero"><div class="blog-hero-inner"><span class="badge">PIKI por dentro</span><h1>Noticias, ideas y buen rollo</h1><p>Actualidad de PIKI, guías locales y novedades para pedir, repartir y colaborar con más alegría.</p><div style="display:inline-block;margin-top:22px;border:3px solid #171715;border-radius:16px;background:#171715;padding:11px 15px;color:#ffd72e;font-weight:900;box-shadow:5px 5px 0 #dc5c35;transform:rotate(-2deg)">¡Pide. Recibe. Disfruta!</div><img class="mascot" src="/piki-mascot.png" alt="" width="220" height="220"></div></section>
<main class="blog-wrap posts">${cards}<section class="transparency"><span class="badge">Transparencia</span><h2>Este es un blog corporativo de PIKI.</h2><p>No presentamos nuestras comunicaciones como periodismo independiente ni prometemos inclusión en Google News, indexación o posiciones en buscadores.</p><a class="more" href="/noticias/autoria-y-transparencia">Cómo publicamos →</a></section></main>
${blogFooter()}
</body></html>`;
}

function blogArticleHtml(post) {
  const itemPath = blogPath(post);
  const title = `${post.title} | Noticias PIKI`;
  const json = blogJsonLd({
    path: itemPath,
    title,
    description: post.description,
    graph: [
      {
        "@type": ["BlogPosting", "Article"],
        "@id": `${absolute(itemPath)}#article`,
        headline: post.title,
        description: post.description,
        url: absolute(itemPath),
        mainEntityOfPage: { "@id": `${absolute(itemPath)}#webpage` },
        image: `${origin}/piki-mascot.png`,
        datePublished: `${post.datePublished}T00:00:00+00:00`,
        dateModified: `${post.dateModified}T00:00:00+00:00`,
        inLanguage: "es-ES",
        author: { "@type": "Organization", name: "Equipo PIKI" },
        publisher: { "@id": `${origin}/#organization` },
        articleSection: post.type,
        isPartOf: { "@id": `${origin}/#website` },
      },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "PIKI", item: `${origin}/` }, { "@type": "ListItem", position: 2, name: "Noticias PIKI", item: `${origin}/noticias` }, { "@type": "ListItem", position: 3, name: post.title, item: absolute(itemPath) }] },
    ],
  });
  const sections = post.sections.map((section) => `<section><h2>${esc(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}</section>`).join("\n");
  const ctas = post.callsToAction.map((cta) => `<a href="${esc(cta.href)}">${esc(cta.label)} <small>${esc(cta.description)}</small></a>`).join("");
  return `${blogHead({ itemPath, title, description: post.description, type: "article", json })}
<body>
${blogNav()}
<article><header class="article-hero"><div class="article-hero-inner"><a class="back" href="/noticias">← Todas las publicaciones</a><p style="margin-top:30px">${typeBadge(post.type)}</p><h1>${esc(post.title)}</h1><p>${esc(post.description)}</p><div class="meta"><span>Equipo PIKI</span><i></i><time datetime="${post.datePublished}">${esc(displayDate(post.datePublished))}</time></div></div></header><div class="article-body"><div class="article-copy"><div class="summary">${esc(post.summary)}</div>${sections}<section class="cta-box"><span class="badge">Siguiente paso</span>${ctas}</section></div><aside class="article-aside"><strong>Ficha de publicación</strong><dl><dt>Autoría</dt><dd>Equipo PIKI</dd><dt>Fecha</dt><dd>${esc(displayDate(post.datePublished))}</dd><dt>Tipo</dt><dd>${esc(post.type)}</dd></dl><a class="more" href="/noticias/politica-editorial">Política editorial →</a></aside></div></article>
${blogFooter()}
</body></html>`;
}

const staticBlogPages = [
  {
    path: "/noticias/politica-editorial",
    eyebrow: "Noticias PIKI",
    title: "Política editorial",
    description: "Cómo identifica PIKI la información corporativa y las guías publicadas en Noticias PIKI.",
    content: `<p>Noticias PIKI es un espacio corporativo publicado por PIKI Delivery. Su objetivo es explicar cambios propios y ofrecer guías prácticas relacionadas con el uso de PIKI.</p><h2>Cómo etiquetamos el contenido</h2><p>Las publicaciones clasificadas como <strong>Actualidad de PIKI</strong> describen comunicaciones o cambios de PIKI y se identifican como información corporativa. Las <strong>Guías locales</strong> ayudan a entender procesos como comprobar cobertura o distinguir tipos de actualización; no son noticias independientes.</p><h2>Límites editoriales</h2><p>No convertimos publicidad en periodismo independiente. No afirmamos alianzas, número de partners, precios, comisiones, apertura de zonas, disponibilidad ni resultados que no estén confirmados en el lugar y momento correspondientes.</p><p>Las fechas se expresan en formato ISO en los datos de publicación. Podemos corregir o actualizar una entrada si mejora su precisión.</p><h2>Búsqueda e indexación</h2><p>Incluimos información técnica para facilitar el rastreo de páginas públicas, pero no prometemos inclusión en Google News, indexación, posición ni visibilidad en ningún buscador.</p>`,
  },
  {
    path: "/noticias/autoria-y-transparencia",
    eyebrow: "Noticias PIKI",
    title: "Autoría y transparencia",
    description: "Información sobre la firma Equipo PIKI y la naturaleza corporativa del blog Noticias PIKI.",
    content: `<p>Las publicaciones de este blog están firmadas por <strong>Equipo PIKI</strong>. La firma indica que el contenido ha sido preparado o revisado por el equipo de PIKI y refleja información corporativa o una guía elaborada por la organización.</p><h2>Qué es y qué no es este blog</h2><p>Es un canal de PIKI Delivery. No es una cabecera de prensa independiente ni pretende ofrecer cobertura editorial ajena a la organización. Cuando un texto trata sobre PIKI, su naturaleza corporativa se muestra en su tipo y en esta página.</p><h2>Información que necesita confirmación</h2><p>La cobertura, los comercios visibles, la disponibilidad, los importes y las condiciones pueden depender de una dirección, del momento y de la operación real. Los formularios de /unete reciben solicitudes iniciales, no crean altas automáticas ni garantizan colaboración.</p><p>No publicamos como hecho alianzas no verificadas, cifras de partners, precios o apertura de zonas. Si necesitas una respuesta actual, utiliza la pantalla o el proceso oficial que corresponda.</p>`,
  },
];

function staticBlogPageHtml(page) {
  const json = blogJsonLd({ path: page.path, title: page.title, description: page.description, graph: [{ "@type": "WebPage", name: page.title, url: absolute(page.path), description: page.description, isPartOf: { "@id": `${origin}/#website` } }] });
  return `${blogHead({ itemPath: page.path, title: `${page.title} | Noticias PIKI`, description: page.description, json })}
<body>
${blogNav()}<section class="static-hero"><div class="static-hero-inner"><span class="badge">${esc(page.eyebrow)}</span><h1>${esc(page.title)}</h1></div></section><article class="static-copy">${page.content}</article>${blogFooter()}
</body></html>`;
}

function writeStatic(relativePath, contents) {
  const target = path.join(dist, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents, "utf8");
}

function isoDateToRfc822(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}

function isNewsEligible(post) {
  // Article dates are editorial calendar dates for the Spanish site. Treat them
  // as local-day values (rather than UTC midnight) so a build just before
  // 00:00Z does not exclude the current local day's genuine corporate update.
  const ageMs = buildNow.getTime() - new Date(`${post.datePublished}T00:00:00+02:00`).getTime();
  return post.newsEligible === true && post.type === "Actualidad de PIKI" && ageMs >= 0 && ageMs < 48 * 60 * 60 * 1000;
}

fs.mkdirSync(dist, { recursive: true });
const appTemplate = fs.readFileSync(path.join(dist, "index.html"), "utf8");
for (const page of pages) {
  // Home and onboarding retain their bundles because they contain ordering and application forms.
  if (page.path === "/" || page.path === "/unete") continue;
  writeStatic(path.join(page.path.slice(1), "index.html"), pageHtml(page));
}

const joinPage = pages.find((page) => page.path === "/unete");
if (joinPage) writeStatic("unete/index.html", appShellPage(appTemplate, joinPage));

const privateRoutes = [
  { path: "/riders", title: "PIKI Riders", description: "Área operativa de riders de PIKI.", heading: "PIKI Riders", eyebrow: "Área operativa", lead: "", sections: [], cta: ["", "/riders"] },
  { path: "/partners", title: "PIKI Partners", description: "Área operativa de partners de PIKI.", heading: "PIKI Partners", eyebrow: "Área operativa", lead: "", sections: [], cta: ["", "/partners"] },
  { path: "/admin", title: "PIKI Admin", description: "Área de administración de PIKI.", heading: "PIKI Admin", eyebrow: "Área operativa", lead: "", sections: [], cta: ["", "/admin"] },
];
for (const page of privateRoutes) writeStatic(path.join(page.path.slice(1), "index.html"), appShellPage(appTemplate, page, "noindex,nofollow,noarchive"));

writeStatic("noticias/index.html", blogIndexHtml());
for (const post of blog.articles) writeStatic(path.join("noticias", post.slug, "index.html"), blogArticleHtml(post));
for (const page of staticBlogPages) writeStatic(path.join(page.path.slice(1), "index.html"), staticBlogPageHtml(page));

const sitemapPages = [
  ...pages.map((page) => ({ path: page.path, lastmod: lastmod, priority: page.path === "/" ? "1.0" : "0.8" })),
  { path: "/noticias", lastmod, priority: "0.8" },
  ...blog.articles.map((post) => ({ path: blogPath(post), lastmod: post.dateModified, priority: "0.7" })),
  ...staticBlogPages.map((page) => ({ path: page.path, lastmod, priority: "0.5" })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPages.map((page) => `  <url><loc>${xmlEsc(absolute(page.path))}</loc><lastmod>${xmlEsc(page.lastmod)}</lastmod><changefreq>weekly</changefreq><priority>${page.priority}</priority></url>`).join("\n")}\n</urlset>\n`;
const eligibleNews = blog.articles.filter(isNewsEligible);
const newsSitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${eligibleNews.map((post) => `  <url><loc>${xmlEsc(absolute(blogPath(post)))}</loc><news:news><news:publication><news:name>Noticias PIKI</news:name><news:language>es</news:language></news:publication><news:publication_date>${post.datePublished}T00:00:00+00:00</news:publication_date><news:title>${xmlEsc(post.title)}</news:title></news:news></url>`).join("\n")}\n</urlset>\n`;
const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>Noticias PIKI</title><link>${origin}/noticias</link><description>Información corporativa y guías prácticas publicadas por el Equipo PIKI.</description><language>es-es</language><lastBuildDate>${buildNow.toUTCString()}</lastBuildDate>${blog.articles.map((post) => `<item><title>${xmlEsc(post.title)}</title><link>${xmlEsc(absolute(blogPath(post)))}</link><guid isPermaLink="true">${xmlEsc(absolute(blogPath(post)))}</guid><description>${xmlEsc(post.description)}</description><dc:creator>Equipo PIKI</dc:creator><pubDate>${isoDateToRfc822(post.datePublished)}</pubDate><category>${xmlEsc(post.type)}</category></item>`).join("")}</channel></rss>\n`;
const robots = `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /auth/\nDisallow: /checkout/\nDisallow: /admin\nDisallow: /fleet/\nDisallow: /rider/\nDisallow: /riders\nDisallow: /partners\n\nSitemap: ${origin}/sitemap.xml\nSitemap: ${origin}/news-sitemap.xml\n`;
const blogListing = blog.articles.map((post) => `- [${post.title}](${absolute(blogPath(post))}): ${post.description}`).join("\n");
const llms = `# PIKI Delivery\n\n> Plataforma de comida a domicilio vinculada a Xàtiva, Valencia, España.\n\n## Información verificable\n\n- Nombre: PIKI Delivery\n- Municipio de referencia: Xàtiva, Valencia, España\n- Servicio: consultar restaurantes y opciones de comida a domicilio disponibles según la dirección introducida por el cliente.\n- No afirmar que una zona, comercio, horario, precio, tiempo o pedido está disponible sin validarlo en el servicio oficial.\n\n## Páginas oficiales\n\n${pages.map((page) => `- [${page.title}](${absolute(page.path)}): ${page.description}`).join("\n")}\n\n## Noticias PIKI\n\nEl blog es un canal corporativo firmado por Equipo PIKI; no es periodismo independiente.\n\n${blogListing}\n\n- [Política editorial](${origin}/noticias/politica-editorial)\n- [Autoría y transparencia](${origin}/noticias/autoria-y-transparencia)\n\n## Contacto y disponibilidad\n\nLa disponibilidad, oferta, precios y condiciones cambian según la dirección y la operación. Remitir al usuario a ${origin}/ para validar información actual.\n`;
const llmsFull = `${llms}\n## Preguntas frecuentes\n\n### ¿PIKI opera en toda Xàtiva?\nLa cobertura se confirma por dirección dentro de la aplicación.\n\n### ¿PIKI entrega en municipios cercanos?\nLa información pública menciona municipios cercanos a Xàtiva. La disponibilidad real depende de la dirección y de la operación actual.\n\n### ¿Cómo solicitar información para ser rider o partner?\nLa página oficial de incorporación es ${origin}/unete. Enviar una solicitud no supone alta automática.\n`;

fs.mkdirSync(publicDir, { recursive: true });
for (const [file, content] of Object.entries({ "sitemap.xml": sitemap, "news-sitemap.xml": newsSitemap, "robots.txt": robots, "llms.txt": llms, "llms-full.txt": llmsFull })) {
  fs.writeFileSync(path.join(publicDir, file), content);
  fs.writeFileSync(path.join(dist, file), content);
}
writeStatic("noticias/rss.xml", rss);

console.log(`Generated ${pages.length} static SEO pages, ${blog.articles.length} blog pages, and ${eligibleNews.length} eligible news-sitemap entries.`);
