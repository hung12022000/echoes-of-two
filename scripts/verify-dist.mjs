import { existsSync, readFileSync, readdirSync } from "node:fs";
if (!existsSync("dist/index.html")) throw new Error("dist/index.html missing");
const html = readFileSync("dist/index.html", "utf8");
if (!/<script[^>]+src="[^"]+\.js"/.test(html)) throw new Error("JS entry missing");
if (/\b(?:SUPABASE_SERVICE_ROLE_KEY|service_role)\b/i.test(html)) throw new Error("secret-like key found");
if (/=(?:"|')\/(?:assets|models|textures|audio)\//.test(html)) throw new Error("absolute asset path found");
const files = readdirSync("dist", { recursive: true });
if (!files.some((file) => String(file).endsWith(".js"))) throw new Error("JS bundle missing");
console.log(`dist verified: ${files.length} files`);
