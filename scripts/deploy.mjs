// Публикация DAYONE на GitHub Pages: сборка с basePath и пуш папки out/ в ветку gh-pages.
// Запуск: npm run deploy
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const run = (cmd, opts = {}) => execSync(cmd, { stdio: "inherit", cwd: root, ...opts });
const read = (cmd) => execSync(cmd, { cwd: root, encoding: "utf8" }).trim();

const remote = read("git remote get-url origin");
const repo = remote.replace(/\.git$/, "").split("/").pop();
const basePath = `/${repo}`;

console.log(`\n▶ Сборка с basePath=${basePath}`);
run("npm run build", { env: { ...process.env, NEXT_PUBLIC_BASE_PATH: basePath, NEXT_TELEMETRY_DISABLED: "1" } });

const out = path.join(root, "out");
// Без .nojekyll GitHub Pages не отдаёт папку _next
fs.writeFileSync(path.join(out, ".nojekyll"), "");
// 404.html в корне — GitHub Pages показывает его для несуществующих адресов
const nested404 = path.join(out, "404", "index.html");
if (fs.existsSync(nested404)) fs.copyFileSync(nested404, path.join(out, "404.html"));

const name = read("git config user.name");
const email = read("git config user.email");
const sha = read("git rev-parse --short HEAD");

console.log("\n▶ Публикация в ветку gh-pages");
fs.rmSync(path.join(out, ".git"), { recursive: true, force: true });
const g = (cmd) => run(cmd, { cwd: out });
g("git init -q -b gh-pages");
g(`git -c user.name="${name}" -c user.email="${email}" add -A`);
g(`git -c user.name="${name}" -c user.email="${email}" commit -q -m "Deploy ${sha}"`);
g(`git push -q -f "${remote}" gh-pages`);
fs.rmSync(path.join(out, ".git"), { recursive: true, force: true });

console.log(`\n✓ Опубликовано: https://${remote.split("/").at(-2).toLowerCase()}.github.io${basePath}/`);
