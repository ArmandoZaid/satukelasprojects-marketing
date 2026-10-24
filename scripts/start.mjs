import { cp, access } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, ".next", "standalone");
const server = path.join(output, "server.js");
try {
  await access(server);
} catch {
  console.error("Build belum tersedia. Jalankan npm run build terlebih dahulu.");
  process.exit(1);
}
// Standalone Next.js does not copy static/public assets automatically.
await cp(path.join(root, "public"), path.join(output, "public"), { recursive: true });
await cp(path.join(root, ".next", "static"), path.join(output, ".next", "static"), { recursive: true });
process.env.HOSTNAME = process.env.MARKETING_HOSTNAME || "127.0.0.1";
process.env.PORT ||= "3100";
await import(pathToFileURL(server).href);
