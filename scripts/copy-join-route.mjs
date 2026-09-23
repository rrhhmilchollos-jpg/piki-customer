import { mkdir, readFile, writeFile } from "node:fs/promises";

const indexPath = new URL("../dist/public/index.html", import.meta.url);
const joinPath = new URL("../dist/public/unete/index.html", import.meta.url);
const html = await readFile(indexPath, "utf8");
await mkdir(new URL("../dist/public/unete/", import.meta.url), { recursive: true });
await writeFile(joinPath, html, "utf8");
console.log("Generated static recruitment route: dist/public/unete/index.html");
