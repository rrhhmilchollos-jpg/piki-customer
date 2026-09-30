import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

function pwaHtmlForPath(template: string) {
  const app = { manifest: "/manifest.json", title: "PIKI Delivery", description: "PIKI Delivery: comida local, a tu ritmo.", theme: "#FFD72E" };
  return template
    .replace(/<link rel="manifest" href="[^"]*"\s*\/>/, `<link rel="manifest" href="${app.manifest}" />`)
    .replace(/<meta name="theme-color" content="[^"]*"\s*\/>/, `<meta name="theme-color" content="${app.theme}" />`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${app.description}" />`)
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
      template = pwaHtmlForPath(template);
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

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", async (req, res, next) => {
    try {
      const template = await fs.promises.readFile(path.resolve(distPath, "index.html"), "utf-8");
      res.status(200).set({ "Content-Type": "text/html" }).end(pwaHtmlForPath(template));
    } catch (error) {
      next(error);
    }
  });
}
