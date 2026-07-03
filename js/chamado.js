import { getPostoByAccess, saveVisita } from "./firebase-service.js";
import { $, bindShell, requireAuth, setText, showToast, todayParts } from "./ui.js";

const { profile } = await requireAuth();
bindShell(profile);

const params = new URLSearchParams(location.search);
const posto = await getPostoByAccess(params.get("posto"), profile);
const form = $("#chamado-form");

if (!posto) {
  location.href = "scanner.html";
}

setText("#posto-title", `Chamado - ${posto.codigo} - ${posto.nome}`);
setText("#posto-city", posto.cidade || "");

const backLink = $("#chamado-back");
if (backLink) backLink.href = `posto.html?posto=${encodeURIComponent(posto.codigo)}`;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  form.classList.add("is-loading");

  const formData = new FormData(form);
  const { data, hora } = todayParts();

  try {
    const result = await saveVisita({
      tipo: "chamado",
      posto: {
        codigo: posto.codigo,
        nome: posto.nome,
        cidade: posto.cidade
      },
      tecnico: {
        uid: profile.uid,
        nome: profile.nome,
        email: profile.email,
        nivel: profile.nivel,
        postosPermitidos: profile.postosPermitidos || []
      },
      data,
      hora,
      chamado: {
        motivo: formData.get("motivo") || "",
        solucao: formData.get("solucao") || ""
      },
      supervisorStatus: {
        cor: formData.get("supervisorStatus"),
        descricao: formData.get("supervisorDescricao") || ""
      },
      observacoes: "",
      checklist: [],
      fotos: []
    });

    showToast(result.status === "enviada" ? "Chamado enviado." : "Chamado salvo para sincronização.", "success");
    window.setTimeout(() => {
      location.href = `posto.html?posto=${encodeURIComponent(posto.codigo)}`;
    }, 900);
  } catch (error) {
    showToast(error.message || "Não foi possível salvar o chamado.", "error");
  } finally {
    form.classList.remove("is-loading");
  }
});
