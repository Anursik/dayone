// Шаги после `next build`: офлайн-кэш (service worker) и файлы для GitHub Pages.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "out");
const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

if (!fs.existsSync(out)) {
  console.error("postbuild: папка out/ не найдена — сначала выполните next build");
  process.exit(1);
}

// GitHub Pages: без .nojekyll папка _next не отдаётся; 404.html — страница для несуществующих адресов
fs.writeFileSync(path.join(out, ".nojekyll"), "");
const nested404 = path.join(out, "404", "index.html");
if (fs.existsSync(nested404)) fs.copyFileSync(nested404, path.join(out, "404.html"));

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const files = walk(out)
  .map((f) => path.relative(out, f).split(path.sep).join("/"))
  .filter((f) => f !== "sw.js" && !f.startsWith(".") && f !== "404.html" && !f.startsWith("404/") && !f.startsWith("_not-found/"))
  .sort();

const hash = createHash("sha256");
for (const f of files) hash.update(f).update(fs.readFileSync(path.join(out, f)));
const version = hash.digest("hex").slice(0, 12);

// Страницы кэшируются по адресу каталога (/habits/), остальные файлы — по своему пути
const urls = files.map((f) => {
  if (f === "index.html") return `${base}/`;
  if (f.endsWith("/index.html")) return `${base}/${f.slice(0, -"index.html".length)}`;
  return `${base}/${f}`;
});

const template = fs.readFileSync(path.join(root, "scripts", "sw-template.js"), "utf8");
const sw = template
  .replace("__VERSION__", version)
  .replace("__BASE__", base)
  .replace("__PRECACHE__", JSON.stringify(urls, null, 0));
fs.writeFileSync(path.join(out, "sw.js"), sw);

console.log(`postbuild: sw.js (версия ${version}, ${urls.length} файлов в офлайн-кэше, base="${base || "/"}")`);
