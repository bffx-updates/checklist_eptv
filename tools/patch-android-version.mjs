import fs from "node:fs/promises";
import path from "node:path";

const gradlePath = path.resolve("android/app/build.gradle");
const versionCode = Number(process.env.VERSION_CODE || process.env.GITHUB_RUN_NUMBER || "1");
const versionName = process.env.VERSION_NAME || `1.0.${versionCode}`;

let gradle = await fs.readFile(gradlePath, "utf8");

gradle = gradle
  .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
  .replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`);

await fs.writeFile(gradlePath, gradle, "utf8");
console.log(`Android version atualizado: versionCode ${versionCode}, versionName ${versionName}`);
