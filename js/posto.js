import { getPosto } from "./firebase-service.js";
import { $, bindShell, requireAuth, setText } from "./ui.js";

const { profile } = await requireAuth();
bindShell(profile);

const params = new URLSearchParams(location.search);
const codigo = params.get("posto");
const posto = await getPosto(codigo);

if (!posto) {
  $(".empty-state").hidden = false;
  $(".posto-view").hidden = true;
} else {
  $(".empty-state").hidden = true;
  $(".posto-view").hidden = false;
  setText("#posto-codigo", posto.codigo);
  setText("#posto-codigo-meta", posto.codigo);
  setText("#posto-nome", posto.nome);
  setText("#posto-cidade", posto.cidade || "-");
  setText("#posto-cidade-meta", posto.cidade || "-");
  setText("#posto-endereco", posto.endereco || "Endereço não informado");
  setText("#posto-status", posto.ativo ? "Ativo" : "Inativo");
  $("#start-checklist").href = `checklist.html?posto=${encodeURIComponent(posto.codigo)}`;
}
