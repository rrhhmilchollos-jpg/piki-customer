import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist", "public");
const origin = "https://pikidelivery.com";
const lastmod = new Date().toISOString().slice(0, 10);

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

const esc = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const absolute = (value) => `${origin}${value === "/" ? "/" : value}`;
const links = [
  ["Comida a domicilio", "/comida-a-domicilio-xativa"],
  ["Restaurantes", "/restaurantes-a-domicilio-xativa"],
  ["Trabajar como rider", "/trabajo-rider-xativa"],
  ["Hazte partner", "/hazte-partner-xativa"],
  ["Cobertura", "/cobertura"],
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
      { "@type": "Service", "@id": `${origin}/#service`, name: "PIKI Delivery en Xàtiva", description: "Servicio digital para consultar opciones de comida a domicilio disponibles según la dirección del cliente.", serviceType: "Food delivery service", areaServed: { "@type": "City", name: "Xàtiva" }, provider: { "@id": `${origin}/#organization` }, url: `${origin}/comida-a-domicilio-xativa` },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "PIKI Delivery", item: `${origin}/` }, { "@type": "ListItem", position: 2, name: page.heading, item: pageUrl }] },
    ],
  }).replace(/</g, "\\u003c");
}

function pageHtml(page) {
  const pageUrl = absolute(page.path);
  const cards = page.sections.map(([title, body]) => `<article><h2>${esc(title)}</h2><p>${esc(body)}</p></article>`).join("\n");
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
  <style>body{margin:0;background:#fffdf5;color:#171715;font:16px/1.6 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wrap{max-width:1040px;margin:auto;padding:0 22px}.nav{display:flex;gap:16px;flex-wrap:wrap;align-items:center;justify-content:space-between;padding:22px 0;border-bottom:1px solid #ece3d9}.brand{font-size:26px;font-weight:900;letter-spacing:-.06em;color:#171715;text-decoration:none}.brand span{color:#dc5c35}.links{display:flex;gap:14px;flex-wrap:wrap}.links a{font-size:14px;font-weight:700;color:#4e5a50;text-decoration:none}.hero{padding:82px 0 44px}.eyebrow{display:inline-block;background:#fff4be;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.hero h1{max-width:800px;margin:20px 0 18px;font-size:clamp(42px,7vw,80px);line-height:.95;letter-spacing:-.07em}.lead{max-width:720px;font-size:20px;color:#536057}.cta{display:inline-block;margin-top:26px;background:#171715;border-radius:999px;padding:13px 20px;color:#ffd72e;font-weight:800;text-decoration:none}.grid{display:grid;gap:18px;grid-template-columns:repeat(3,minmax(0,1fr));padding:28px 0 64px}.grid article{border:1px solid #eadfd4;border-radius:22px;background:#fff;padding:24px}.grid h2{margin:0;font-size:22px;letter-spacing:-.04em}.grid p{color:#5b695f}.local{margin:12px 0 60px;border-radius:22px;background:#f7f1e7;padding:28px}.local h2{margin-top:0}.footer{border-top:1px solid #ece3d9;padding:28px 0;color:#607065;font-size:14px}@media(max-width:760px){.grid{grid-template-columns:1fr}.hero{padding-top:52px}.links{gap:10px}.links a{font-size:12px}}</style>
</head>
<body>
  <header class="wrap"><nav class="nav" aria-label="Navegación principal"><a class="brand" href="/" aria-label="PIKI Delivery, inicio">PIKI<span>.</span></a><div class="links">${nav}</div></nav></header>
  <main class="wrap"><section class="hero"><span class="eyebrow">${esc(page.eyebrow)}</span><h1>${esc(page.heading)}</h1><p class="lead">${esc(page.lead)}</p><a class="cta" href="${page.cta[1]}">${esc(page.cta[0])}</a></section><section class="grid">${cards}</section><section class="local"><h2>Información oficial de PIKI Delivery</h2><p>PIKI Delivery es una plataforma digital vinculada a Xàtiva, Valencia, España. La disponibilidad de comercios, productos, precios y reparto se confirma para cada dirección dentro del servicio.</p><div class="links">${nav}</div></section></main>
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

fs.mkdirSync(dist, { recursive: true });
const appTemplate = fs.readFileSync(path.join(dist, "index.html"), "utf8");
for (const page of pages) {
  // The home and onboarding pages retain their Vite bundles: they contain the
  // live ordering and application forms. Local information pages are rendered
  // as static HTML so crawlers and AI systems can consume their content first.
  if (page.path === "/" || page.path === "/unete") continue;
  const target = path.join(dist, page.path.slice(1), "index.html");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, pageHtml(page));
}

const joinPage = pages.find((page) => page.path === "/unete");
if (joinPage) {
  const target = path.join(dist, "unete", "index.html");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, appShellPage(appTemplate, joinPage));
}

const privateRoutes = [
  { path: "/riders", title: "PIKI Riders", description: "Área operativa de riders de PIKI.", heading: "PIKI Riders", eyebrow: "Área operativa", lead: "", sections: [], cta: ["", "/riders"] },
  { path: "/partners", title: "PIKI Partners", description: "Área operativa de partners de PIKI.", heading: "PIKI Partners", eyebrow: "Área operativa", lead: "", sections: [], cta: ["", "/partners"] },
  { path: "/admin", title: "PIKI Admin", description: "Área de administración de PIKI.", heading: "PIKI Admin", eyebrow: "Área operativa", lead: "", sections: [], cta: ["", "/admin"] },
];
for (const page of privateRoutes) {
  const target = path.join(dist, page.path.slice(1), "index.html");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, appShellPage(appTemplate, page, "noindex,nofollow,noarchive"));
}

const publicDir = path.join(root, "client", "public");
fs.mkdirSync(publicDir, { recursive: true });
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((page) => `  <url><loc>${absolute(page.path)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>${page.path === "/" ? "1.0" : "0.8"}</priority></url>`).join("\n")}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /auth/\nDisallow: /checkout/\nDisallow: /admin\nDisallow: /fleet/\nDisallow: /rider/\nDisallow: /riders\nDisallow: /partners\n\nSitemap: ${origin}/sitemap.xml\n`;
const llms = `# PIKI Delivery\n\n> Plataforma de comida a domicilio vinculada a Xàtiva, Valencia, España.\n\n## Información verificable\n\n- Nombre: PIKI Delivery\n- Municipio de referencia: Xàtiva, Valencia, España\n- Servicio: consultar restaurantes y opciones de comida a domicilio disponibles según la dirección introducida por el cliente.\n- No afirmar que una zona, comercio, horario, precio, tiempo o pedido está disponible sin validarlo en el servicio oficial.\n\n## Páginas oficiales\n\n${pages.map((page) => `- [${page.title}](${absolute(page.path)}): ${page.description}`).join("\n")}\n\n## Contacto y disponibilidad\n\nLa disponibilidad, oferta, precios y condiciones cambian según la dirección y la operación. Remitir al usuario a ${origin}/ para validar información actual.\n`;
const llmsFull = `${llms}\n## Preguntas frecuentes\n\n### ¿PIKI opera en toda Xàtiva?\nLa cobertura se confirma por dirección dentro de la aplicación.\n\n### ¿PIKI entrega en municipios cercanos?\nLa información pública menciona municipios cercanos a Xàtiva. La disponibilidad real depende de la dirección y de la operación actual.\n\n### ¿Cómo solicitar información para ser rider o partner?\nLa página oficial de incorporación es ${origin}/unete. Enviar una solicitud no supone alta automática.\n`;
for (const [file, content] of Object.entries({ "sitemap.xml": sitemap, "robots.txt": robots, "llms.txt": llms, "llms-full.txt": llmsFull })) {
  fs.writeFileSync(path.join(publicDir, file), content);
  fs.writeFileSync(path.join(dist, file), content);
}

console.log(`Generated ${pages.length} static SEO pages and discovery files.`);
