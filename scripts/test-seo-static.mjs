import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "piki-seo-static-"));

function copy(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

try {
  copy(path.join(projectRoot, "shared", "blog-posts.json"), path.join(fixture, "shared", "blog-posts.json"));
  copy(path.join(projectRoot, "client", "index.html"), path.join(fixture, "dist", "public", "index.html"));
  copy(path.join(projectRoot, "scripts", "seo-restaurants.mjs"), path.join(fixture, "scripts", "seo-restaurants.mjs"));
  copy(path.join(projectRoot, "scripts", "fixtures", "seo-catalog.json"), path.join(fixture, "scripts", "fixtures", "seo-catalog.json"));

  execFileSync(process.execPath, [path.join(projectRoot, "scripts", "generate-seo-static.mjs")], {
    cwd: fixture,
    env: { ...process.env, PIKI_SEO_ROOT: fixture, PIKI_SEO_NOW: "2026-10-10T00:00:00.000Z", PIKI_SEO_CATALOG_FILE: "scripts/fixtures/seo-catalog.json" },
    stdio: "pipe",
  });

  const read = (relative) => fs.readFileSync(path.join(fixture, "dist", "public", relative), "utf8");
  const index = read("noticias/index.html");
  const article = read("noticias/solicitudes-riders-partners-unete/index.html");
  const guide = read("noticias/comprobar-cobertura-xativa/index.html");
  const sitemap = read("sitemap.xml");
  const newsSitemap = read("news-sitemap.xml");
  const rss = read("noticias/rss.xml");
  const restaurantDirectory = read("restaurantes-a-domicilio-xativa/index.html");
  const restaurant = read("restaurantes/casa-piki-xativa/index.html");

  assert.match(index, /Noticias, ideas y buen rollo/);
  assert.match(index, /piki-mascot\.png/);
  assert.match(article, /<link rel="canonical" href="https:\/\/pikidelivery\.com\/noticias\/solicitudes-riders-partners-unete">/);
  assert.match(article, /<meta property="og:type" content="article">/);
  assert.match(article, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(article, /"BlogPosting"/);
  assert.match(article, /"author":\{"@type":"Organization","name":"Equipo PIKI"\}/);
  assert.match(article, /2026-10-09T00:00:00\+00:00/);
  assert.match(guide, /Cómo comprobar la cobertura de PIKI en Xàtiva/);
  assert.match(sitemap, /https:\/\/pikidelivery\.com\/noticias\/comprobar-cobertura-xativa/);
  assert.match(sitemap, /https:\/\/pikidelivery\.com\/noticias\/politica-editorial/);
  assert.match(sitemap, /https:\/\/pikidelivery\.com\/restaurantes\/casa-piki-xativa/);
  assert.doesNotMatch(sitemap, /proximamente-xativa/);
  assert.match(restaurantDirectory, /Restaurantes a domicilio en Xàtiva/);
  assert.match(restaurantDirectory, /Casa PIKI Xàtiva/);
  assert.match(restaurant, /<h1>Casa PIKI Xàtiva<\/h1>/);
  assert.match(restaurant, /"@type":"Restaurant"/);
  assert.match(restaurant, /Carrer de la Plaça, 12/);
  assert.match(rss, /<title>Noticias PIKI<\/title>/);
  assert.match(rss, /Equipo PIKI/);
  assert.match(newsSitemap, /solicitudes-riders-partners-unete/);
  assert.doesNotMatch(newsSitemap, /comprobar-cobertura-xativa/);
  assert.doesNotMatch(newsSitemap, /actualizacion-web-y-nativa/);
  assert.equal((newsSitemap.match(/<news:news>/g) || []).length, 1);

  console.log("SEO static generator checks passed.");
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
