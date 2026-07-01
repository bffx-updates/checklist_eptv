import fs from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("www");
const files = [
  "assets",
  "css",
  "js",
  "checklist.html",
  "configuracoes.html",
  "dashboard.html",
  "firebase-config.js",
  "historico.html",
  "index.html",
  "login.html",
  "manifest.webmanifest",
  "posto.html",
  "preview-icones.html",
  "scanner.html",
  "senha.html",
  "service-worker.js"
];

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

for (const file of files) {
  const source = path.resolve(file);
  const target = path.join(outputDir, file);
  const stat = await fs.stat(source);
  await fs.mkdir(path.dirname(target), { recursive: true });

  if (stat.isDirectory()) {
    await fs.cp(source, target, { recursive: true });
  } else {
    await fs.copyFile(source, target);
  }
}

console.log(`PWA copiado para ${outputDir}`);
