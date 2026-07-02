import { getPostoByAccess } from "./firebase-service.js";
import { $, bindShell, normalizePostoCode, requireAuth, showToast } from "./ui.js";

const { profile } = await requireAuth();
bindShell(profile);

const video = $("#camera");
const manualForm = $("#manual-form");
const manualCode = $("#manual-code");
const status = $("#scan-status");
let stream = null;
let stopped = false;

manualForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await openPosto(manualCode.value);
});

async function openPosto(value) {
  const codigo = normalizePostoCode(value);
  const posto = await getPostoByAccess(codigo, profile);
  if (!posto) {
    showToast("Posto não encontrado ou fora do seu nível de acesso.", "error");
    return;
  }
  location.href = `posto.html?posto=${encodeURIComponent(posto.codigo)}`;
}

async function startScanner() {
  if (!("BarcodeDetector" in window)) {
    status.textContent = "Scanner automático indisponível neste navegador. Use a entrada manual.";
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
    video.srcObject = stream;
    await video.play();

    const detector = new BarcodeDetector({ formats: ["qr_code"] });
    status.textContent = "Aponte a câmera para o QR Code do posto.";

    while (!stopped) {
      const codes = await detector.detect(video);
      if (codes.length) {
        stopped = true;
        await openPosto(codes[0].rawValue);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  } catch (error) {
    status.textContent = "Não foi possível acessar a câmera. Use a entrada manual.";
  }
}

window.addEventListener("pagehide", () => {
  stopped = true;
  stream?.getTracks().forEach((track) => track.stop());
});

startScanner();
