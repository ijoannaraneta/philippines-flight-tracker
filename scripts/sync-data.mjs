// Copies price history and config into web/public/data so the dashboard
// (a static site) can fetch them at runtime.
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "web", "public", "data");

mkdirSync(join(OUT, "history"), { recursive: true });
cpSync(join(ROOT, "config", "routes.json"), join(OUT, "routes.json"));
cpSync(join(ROOT, "config", "airlines.json"), join(OUT, "airlines.json"));
if (existsSync(join(ROOT, "data", "history"))) {
  cpSync(join(ROOT, "data", "history"), join(OUT, "history"), { recursive: true });
}
console.log("Synced config and history into web/public/data");
