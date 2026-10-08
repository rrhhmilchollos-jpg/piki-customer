import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

const siteOrigin = "https://pikidelivery.com";
const localPages: Record<string, { title: string; description: string }> = {
  "/comida-a-domicilio-xativa": { title: "Comida a domicilio en Xàtiva | PIKI", description: "Consulta restaurantes y opciones de comida a domicilio disponibles para tu dirección en Xàtiva con PIKI." },
  "/restaurantes-a-domicilio-xativa": { title: "Restaurantes con delivery en Xàtiva | PIKI", description: "Información para restaurantes y comercios de Xàtiva que quieren solicitar una posible colaboración con PIKI." },
  "/hazte-partner-xativa": { title: "Hazte partner de delivery en Xàtiva | PIKI", description: "Los comercios de Xàtiva pueden solicitar información para colaborar con PIKI y preparar su catálogo de reparto." },
  "/trabajo-rider-xativa": { title: "Trabajo de rider en Xàtiva | PIKI Riders", description: "Solicita información para repartir con PIKI Riders en Xàtiva. El equipo revisa documentación, vehículo y disponibilidad." },
  "/cobertura": { title: "Cobertura de PIKI | Xàtiva y municipios cercanos", description: "Comprueba cómo confirmar la cobertura de comida a domicilio de PIKI en Xàtiva y municipios cercanos." },
  "/unete": { title: "Únete a PIKI | Riders y restaurantes en Xàtiva", description: "Página oficial para enviar solicitudes de rider o partner a PIKI en Xàtiva." },
};

function pwaHtmlForPath(template: string, requestUrl: string) {
  const pathname = requestUrl.split("?")[0].replace(/\/$/, "") || "/";
  const local = localPages[pathname];
  const app = pathname.startsWith("/riders") ? { manifest: "/manifest-riders.json", title: "PIKI Riders", description: "Rutas, pedidos y operaciones de reparto de PIKI.", theme: "#171715", robots: "noindex,nofollow,noarchive" } : pathname.startsWith("/admin") ? { manifest: "/manifest-admin.json", title: "PIKI Admin", description: "Centro de control de reparto, flotas y documentos de PIKI.", theme: "#143b2b", robots: "noindex,nofollow,noarchive" } : pathname.startsWith("/partners") ? { manifest: "/manifest-partners.json", title: "PIKI Partners", description: "Comandero y pedidos para comercios PIKI.", theme: "#FFD72E", robots: "noindex,nofollow,noarchive" } : local ? { manifest: "/manifest.json", title: local.title, description: local.description, theme: "#FFD72E", robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" } : { manifest: "/manifest.json", title: "Comida a domicilio en Xàtiva | PIKI", description: "Consulta restaurantes y opciones de comida a domicilio disponibles para tu dirección en Xàtiva con PIKI.", theme: "#FFD72E", robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" };
  const canonical = `${siteOrigin}${pathname === "/" ? "/" : pathname}`;
  return template
    .replace(/<link rel="manifest" href="[^"]*"\s*\/>/, `<link rel="manifest" href="${app.manifest}" />`)
    .replace(/<meta name="theme-color" content="[^"]*"\s*\/>/, `<meta name="theme-color" content="${app.theme}" />`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${app.description}" />`)
    .replace(/<meta name="robots" content="[^"]*"\s*\/>/, `<meta name="robots" content="${app.robots}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${app.title}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${app.description}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<title>[^<]*<\/title>/, `<title>${app.title}</title>`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = pwaHtmlForPath(template, url);
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath, { redirect: false }));

  const generatedPageRoutes = [
    "/comida-a-domicilio-xativa",
    "/restaurantes-a-domicilio-xativa",
    "/hazte-partner-xativa",
    "/trabajo-rider-xativa",
    "/cobertura",
    "/unete",
    "/noticias",
    "/riders",
    "/partners",
    "/admin",
  ];
  app.get(generatedPageRoutes, (req, res, next) => {
    const segment = req.path.slice(1);
    const page = path.resolve(distPath, segment, "index.html");
    res.sendFile(page, (error) => {
      if (error) next(error);
    });
  });

  // Blog articles are generated from shared/blog-posts.json. This generic
  // static route keeps new article slugs out of server source code while
  // rejecting path traversal or arbitrary file names.
  app.get("/noticias/:slug", (req, res, next) => {
    const { slug } = req.params;
    if (!/^[a-z0-9-]+$/.test(slug)) return next();
    const page = path.resolve(distPath, "noticias", slug, "index.html");
    res.sendFile(page, (error) => {
      if (error) next(error);
    });
  });

  // fall through to index.html if the file doesn't exist
  app.use("*", async (req, res, next) => {
    try {
      const template = await fs.promises.readFile(path.resolve(distPath, "index.html"), "utf-8");
      res.status(200).set({ "Content-Type": "text/html" }).end(pwaHtmlForPath(template, req.originalUrl));
    } catch (error) {
      next(error);
    }
  });
}
