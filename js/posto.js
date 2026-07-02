import { getPostoByAccess, listVisitas } from "./firebase-service.js";
import { $, bindShell, renderVisitCard, requireAuth, setText } from "./ui.js";

const { profile } = await requireAuth();
bindShell(profile);

const params = new URLSearchParams(location.search);
const codigo = params.get("posto");
const posto = await getPostoByAccess(codigo, profile);

if (!posto) {
  $(".empty-state").textContent = "Posto não encontrado ou fora do seu nível de acesso.";
  $(".empty-state").hidden = false;
  $(".posto-view").hidden = true;
} else {
  $(".empty-state").hidden = true;
  $(".posto-view").hidden = false;
  setText("#posto-codigo", posto.codigo);
  setText("#posto-codigo-meta", posto.codigo);
  setText("#posto-nome", posto.nome);
  setText("#posto-cidade-meta", posto.cidade || "-");
  setText("#posto-endereco", posto.endereco || "Endereço não informado");
  setText("#posto-status", posto.ativo ? "Ativo" : "Inativo");
  $("#start-chamado").href = `chamado.html?posto=${encodeURIComponent(posto.codigo)}`;
  $("#start-preventiva").href = `checklist.html?posto=${encodeURIComponent(posto.codigo)}`;

  const historico = await listVisitas({ posto: posto.codigo });
  $("#posto-history").innerHTML = historico.length
    ? historico.slice(0, 6).map(renderVisitCard).join("")
    : `<div class="empty-state">Nenhum registro anterior encontrado para este posto.</div>`;
}
