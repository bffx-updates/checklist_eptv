import { isFirebaseReady, seedInitialData, syncPendingVisits } from "./firebase-service.js";
import { $, bindShell, requireAuth, setText, showToast } from "./ui.js";

const { profile } = await requireAuth({ supervisor: true });
bindShell(profile);

setText("#firebase-ready", isFirebaseReady() ? "Configurado" : "Não configurado");

$("#seed-data").addEventListener("click", async () => {
  try {
    await seedInitialData();
    showToast("Postos e técnicos cadastrados.", "success");
  } catch (error) {
    showToast(error.message, "error");
  }
});

$("#sync-now").addEventListener("click", async () => {
  const result = await syncPendingVisits();
  showToast(`${result.sent} visita(s) enviada(s). ${result.pending} pendente(s).`, "success");
});
