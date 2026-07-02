import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const outputDir = path.resolve("www");
const files = [
  "assets",
  "css",
  "js",
  "chamado.html",
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

await fs.writeFile(
  path.join(outputDir, "app-version.json"),
  JSON.stringify(await createAppVersion(), null, 2)
);

console.log(`PWA copiado para ${outputDir}`);

async function createAppVersion() {
  const commit = process.env.GITHUB_SHA || (await getGitCommit());
  const builtAt = new Date().toISOString();

  return {
    version: `${commit}-${builtAt}`,
    commit,
    builtAt
  };
}

async function getGitCommit() {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--short", "HEAD"]);
    return stdout.trim();
  } catch {
    return "local";
  }
}
