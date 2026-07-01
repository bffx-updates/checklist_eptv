import fs from "node:fs/promises";
import path from "node:path";

const manifestPath = path.resolve("android/app/src/main/AndroidManifest.xml");
let manifest = await fs.readFile(manifestPath, "utf8");

const permissions = [
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
  '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
  '<uses-feature android:name="android.hardware.camera" android:required="false" />',
  '<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />'
];

const missing = permissions.filter((permission) => !manifest.includes(permission));

if (missing.length) {
  manifest = manifest.replace(
    /<application\b/,
    `${missing.map((permission) => `    ${permission}`).join("\n")}\n\n    <application`
  );
}

await fs.writeFile(manifestPath, manifest, "utf8");
console.log(`AndroidManifest atualizado com ${missing.length} permissão/recurso(s).`);
