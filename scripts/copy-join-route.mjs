import { mkdir, readFile, writeFile } from "node:fs/promises";

const origin = "https://pikidelivery.com";
const outputRoot = new URL("../dist/public/", import.meta.url);
const indexPath = new URL("../dist/public/index.html", import.meta.url);
const source = await readFile(indexPath, "utf8");

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function setMeta(html, kind, key, value) {
  const matcher = new RegExp(`<meta\\s+${kind}="${key}"[^>]*\\/?\\s*>`);
  const tag = `<meta ${kind}="${key}" content="${escapeAttribute(value)}" />`;
  if (!matcher.test(html)) throw new Error(`Missing ${kind} metadata: ${key}`);
  return html.replace(matcher, tag);
}

function organization() {
  return {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: "PIKI",
    alternateName: "Piki: comida a domicilio",
    url: `${origin}/`,
    logo: `${origin}/piki-delivery-512.png`,
  };
}

function webPage(url, name, about) {
  return {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    inLanguage: "es-ES",
    isPartOf: { "@id": `${origin}/#website` },
    ...(about ? { about: { "@id": about } } : {}),
  };
}

function metadata(html, { path, title, description, imageAlt, graph }) {
  const canonical = `${origin}${path}`;
  html = html.replace(new RegExp(`<title>[\\s\\S]*?</title>`), `<title>${title}</title>`);
  html = setMeta(html, "name", "description", description);
  html = html.replace(new RegExp(`<link\\s+rel="canonical"[^>]*\\/?\\s*>`), `<link rel="canonical" href="${canonical}" />`);
  html = setMeta(html, "property", "og:title", title);
  html = setMeta(html, "property", "og:description", description);
  html = setMeta(html, "property", "og:url", canonical);
  html = setMeta(html, "property", "og:type", "website");
  html = setMeta(html, "property", "og:image:alt", imageAlt);
  html = setMeta(html, "name", "twitter:title", title);
  html = setMeta(html, "name", "twitter:description", description);
  html = setMeta(html, "name", "twitter:image:alt", imageAlt);
  html = html.replace(
    new RegExp(`<script type="application/ld\\+json">[\\s\\S]*?</script>`),
    `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>`,
  );
  return html;
}

function putFallback(html, body) {
  const start = "<!-- PIKI_SEO_START -->";
  const end = "<!-- PIKI_SEO_END -->";
  if (!html.includes(start) || !html.includes(end)) throw new Error("Missing PIKI SEO fallback markers");
  return html.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}${body}${end}`);
}

const joinBody = `
      <div class="seo-fallback">
        <header class="seo-nav"><a class="seo-brand" href="/">PIKI<span aria-hidden="true">.</span></a><nav class="seo-links" aria-label="Enlaces principales"><a href="/">Pedir con PIKI</a><a href="/comida-a-domicilio-xativa">Comida en Xàtiva</a></nav></header>
        <main class="seo-content">
          <p>PIKI · Xàtiva y su entorno</p>
          <h1>Únete a PIKI</h1>
          <p class="seo-lead">PIKI recibe solicitudes iniciales de riders y restaurantes o comercios que quieren informarse sobre una posible colaboración.</p>
          <p>Los riders pueden compartir sus datos de contacto, municipio, vehículo y disponibilidad. Los negocios pueden indicar el establecimiento, dirección y persona de contacto. El equipo responsable revisa cada solicitud y, si procede, contacta para pedir la información necesaria.</p>
          <p>Enviar una solicitud no garantiza su aceptación ni crea un alta. Los formularios y el aviso de privacidad aparecen en esta página cuando se carga la aplicación.</p>
          <a class="seo-cta" href="#riders">Información para riders</a>
          <a class="seo-cta" href="#partners">Información para comercios</a>
          <p>La plataforma tiene como municipio de referencia Xàtiva, Valencia. La expansión y disponibilidad en otras localidades se confirma caso a caso.</p>
        </main>
        <footer class="seo-footer"><span>PIKI · Xàtiva</span><a href="/comida-a-domicilio-xativa">Comida a domicilio en Xàtiva</a></footer>
      </div>`;

let joinHtml = metadata(source, {
  path: "/unete",
  title: "Únete a PIKI: riders y comercios en Xàtiva",
  description: "Envía una solicitud inicial para colaborar como rider o comercio con PIKI en Xàtiva. El equipo responsable revisará cada caso.",
  imageAlt: "Únete a PIKI como rider o comercio en Xàtiva",
  graph: [
    organization(),
    { "@type": "WebSite", "@id": `${origin}/#website`, url: `${origin}/`, name: "Piki: comida a domicilio", inLanguage: "es-ES", publisher: { "@id": `${origin}/#organization` } },
    webPage(`${origin}/unete`, "Únete a PIKI: riders y comercios en Xàtiva"),
  ],
});
joinHtml = putFallback(joinHtml, joinBody);
const joinDirectory = new URL("unete/", outputRoot);
await mkdir(joinDirectory, { recursive: true });
await writeFile(new URL("index.html", joinDirectory), joinHtml, "utf8");
console.log("Generated route-specific recruitment HTML: /unete");

const localBody = `
      <div class="seo-fallback">
        <header class="seo-nav"><a class="seo-brand" href="/" aria-label="PIKI, inicio">PIKI<span aria-hidden="true">.</span></a><nav class="seo-links" aria-label="Enlaces principales"><a href="/">Inicio</a><a href="/unete">Únete a PIKI</a></nav></header>
        <main class="seo-content">
          <p>Comida a domicilio · Xàtiva, Valencia</p>
          <h1>Comida a domicilio en Xàtiva con PIKI</h1>
          <p class="seo-lead">PIKI es una plataforma para consultar restaurantes y pedir comida a domicilio en Xàtiva. Comprueba las opciones que llegan a tu dirección y la información actual del pedido desde la web.</p>
          <a class="seo-cta" href="https://app.pikidelivery.com/">Consultar la oferta disponible</a>
          <h2>Una forma local de pedir comida</h2>
          <p>Introduce tu dirección para consultar qué restaurantes aparecen disponibles. Revisa sus cartas y las condiciones del pedido, elige los productos que te interesen y confirma la información en el checkout.</p>
          <p>La oferta, los precios, el coste de entrega y el tiempo estimado pueden variar según el establecimiento, la dirección y el momento. Comprueba siempre los datos que muestra la aplicación antes de confirmar.</p>
          <h2>¿En qué zonas opera PIKI?</h2>
          <p>Xàtiva es el municipio de referencia de PIKI. La información pública del servicio también menciona Canals, El Genovés, La Llosa de Ranes, Novetlè y Montesa. La cobertura de cada dirección y la existencia de restaurantes disponibles deben confirmarse en la plataforma; mencionar una localidad no implica disponibilidad garantizada.</p>
          <h2>Cómo pedir</h2>
          <ol><li>Abre la web de PIKI e introduce tu dirección.</li><li>Consulta los restaurantes y artículos disponibles para esa zona.</li><li>Revisa los precios y las condiciones antes de seleccionar.</li><li>Confirma el pedido y sigue las indicaciones que aparecen en la aplicación.</li></ol>
          <h2>Preguntas frecuentes</h2>
          <h3>¿PIKI entrega en toda Xàtiva?</h3><p>La disponibilidad depende de la dirección, los restaurantes activos y la operación en ese momento. Introduce tu dirección en la plataforma para comprobarlo.</p>
          <h3>¿PIKI está disponible en Canals u otros municipios cercanos?</h3><p>Canals, El Genovés, La Llosa de Ranes, Novetlè y Montesa aparecen en la información pública de PIKI. Comprueba la cobertura efectiva de la dirección antes de hacer un pedido.</p>
          <h3>¿Qué restaurantes, precios y tiempos hay?</h3><p>El catálogo, precios, tarifas de entrega y tiempos estimados pueden cambiar. Consulta la información que PIKI muestra para tu dirección antes de confirmar.</p>
          <h2>Comercios y riders</h2>
          <p>PIKI también recibe solicitudes de establecimientos y de personas interesadas en repartir. <a href="/unete#partners">Información para restaurantes y comercios</a> · <a href="/unete#riders">Información para riders</a>.</p>
          <p class="seo-note">PIKI puede ser una opción para consultar comida a domicilio en Xàtiva cuando haya oferta y reparto disponibles para tu dirección. No se garantiza que una zona o restaurante concreto esté activo en todo momento.</p>
          <a class="seo-cta" href="https://app.pikidelivery.com/">Ver opciones en PIKI</a>
        </main>
        <footer class="seo-footer"><span>PIKI · Comida a domicilio en Xàtiva</span><a href="/">Web oficial</a><a href="/unete">Únete a PIKI</a></footer>
      </div>`;

let localHtml = metadata(source, {
  path: "/comida-a-domicilio-xativa",
  title: "Comida a domicilio en Xàtiva | PIKI",
  description: "Consulta con PIKI restaurantes y opciones de comida a domicilio en Xàtiva. Comprueba la cobertura, la oferta y las condiciones para tu dirección.",
  imageAlt: "PIKI, plataforma de comida a domicilio en Xàtiva",
  graph: [
    organization(),
    { "@type": "WebSite", "@id": `${origin}/#website`, url: `${origin}/`, name: "Piki: comida a domicilio", inLanguage: "es-ES", publisher: { "@id": `${origin}/#organization` } },
    webPage(`${origin}/comida-a-domicilio-xativa`, "Comida a domicilio en Xàtiva | PIKI", `${origin}/#service`),
    { "@type": "Service", "@id": `${origin}/#service`, name: "Comida a domicilio PIKI en Xàtiva", url: `${origin}/comida-a-domicilio-xativa`, description: "Plataforma para consultar restaurantes y opciones de comida a domicilio disponibles en Xàtiva.", serviceType: "Comida a domicilio", areaServed: { "@type": "City", name: "Xàtiva" }, provider: { "@id": `${origin}/#organization` } },
  ],
});
localHtml = putFallback(localHtml, localBody);
function removeExecutableScripts(html) {
  const startTag = '<script type="application/ld+json">';
  const closingTag = "</script>";
  const jsonStart = html.indexOf(startTag);
  const jsonEnd = jsonStart < 0 ? -1 : html.indexOf(closingTag, jsonStart);
  const jsonLd = jsonEnd < 0 ? "" : html.slice(jsonStart, jsonEnd + closingTag.length);
  if (jsonLd) html = html.slice(0, jsonStart) + "<!--PIKI_JSONLD_HOLD-->" + html.slice(jsonEnd + closingTag.length);

  while (true) {
    const scriptStart = html.toLowerCase().indexOf("<script");
    if (scriptStart < 0) break;
    const openingEnd = html.indexOf(">", scriptStart);
    const scriptEnd = html.toLowerCase().indexOf(closingTag, openingEnd + 1);
    if (openingEnd < 0 || scriptEnd < 0) throw new Error("Unclosed script tag in generated static page");
    html = html.slice(0, scriptStart) + html.slice(scriptEnd + closingTag.length);
  }

  while (true) {
    const preloadStart = html.toLowerCase().indexOf('<link rel="modulepreload"');
    if (preloadStart < 0) break;
    const preloadEnd = html.indexOf(">", preloadStart);
    if (preloadEnd < 0) throw new Error("Unclosed modulepreload link in generated static page");
    html = html.slice(0, preloadStart) + html.slice(preloadEnd + 1);
  }

  return jsonLd ? html.replace("<!--PIKI_JSONLD_HOLD-->", jsonLd) : html;
}

localHtml = removeExecutableScripts(localHtml);
const localDirectory = new URL("comida-a-domicilio-xativa/", outputRoot);
await mkdir(localDirectory, { recursive: true });
await writeFile(new URL("index.html", localDirectory), localHtml, "utf8");
console.log("Generated static local landing HTML: /comida-a-domicilio-xativa");
