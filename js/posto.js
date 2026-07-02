import { getPostoByAccess, listVisitas } from "./firebase-service.js";
import { $, bindShell, escapeHtml, formatDate, renderVisitCard, requireAuth, setText, statusColorLabel } from "./ui.js";

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
  setText("#posto-nome", posto.nome);
  $("#start-chamado").href = `chamado.html?posto=${encodeURIComponent(posto.codigo)}`;
  $("#start-preventiva").href = `checklist.html?posto=${encodeURIComponent(posto.codigo)}`;

  const historico = await listVisitas({ posto: posto.codigo });
  renderPills(historico[0]);

  $("#posto-history").innerHTML = historico.length
    ? historico.slice(0, 6).map(renderVisitCard).join("")
    : `<div class="empty-state">Nenhum registro anterior encontrado para este posto.</div>`;
}

function renderPills(ultima) {
  const pills = $("#posto-pills");
  if (!pills) return;

  if (!ultima) {
    pills.innerHTML = `<span class="posto-pill">Sem visita registrada</span>`;
    return;
  }

  const cor = ultima.supervisorStatus?.cor;
  const statusPill = cor
    ? `<span class="posto-pill posto-pill--${cor}">Última: ${statusColorLabel(cor)}</span>`
    : "";
  const quando = ultima.data ? `${formatDate(ultima.data)}` : "";
  const tecnico = ultima.tecnico?.nome ? `${ultima.tecnico.nome}${quando ? ` · ${quando}` : ""}` : quando;
  const infoPill = tecnico ? `<span class="posto-pill">${escapeHtml(tecnico)}</span>` : "";

  pills.innerHTML = `${statusPill}${infoPill}` || `<span class="posto-pill">Sem visita registrada</span>`;
}
