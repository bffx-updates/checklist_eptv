import { isTecnicoProfile } from "./data.js";
import { listPostos, listTecnicos, listVisitas } from "./firebase-service.js";
import { $, bindShell, escapeHtml, formatDate, requireAuth, setText, statusColorLabel } from "./ui.js";

const { profile } = await requireAuth({ supervisor: true });
bindShell(profile);

const filtersForm = $("#dashboard-filters");
const tableBody = $("#visits-table tbody");
const details = $("#visit-details");
const postoSelect = $("#filter-posto");
const tecnicoSelect = $("#filter-tecnico");
const postosStatusGrid = $("#postos-status-grid");

const [postos, tecnicos] = await Promise.all([listPostos(), listTecnicos()]);

postoSelect.innerHTML = `<option value="">Todos os postos</option>${postos
  .map((posto) => `<option value="${posto.codigo}">${posto.codigo} - ${posto.nome}</option>`)
  .join("")}`;

tecnicoSelect.innerHTML = `<option value="">Todos os técnicos</option>${tecnicos
  .map((tecnico) => `<option value="${tecnico.nome}">${tecnico.nome}</option>`)
  .join("")}`;

filtersForm.addEventListener("input", renderDashboard);
await renderDashboard();

async function renderDashboard() {
  const data = new FormData(filtersForm);
  const filters = {
    posto: data.get("posto"),
    tecnico: data.get("tecnico"),
    cidade: data.get("cidade"),
    data: data.get("data"),
    status: data.get("status")
  };
  Object.keys(filters).forEach((key) => {
    if (!filters[key]) delete filters[key];
  });

  const visitas = await listVisitas(filters);
  const todasVisitas = Object.keys(filters).length ? await listVisitas() : visitas;
  const today = new Date().toISOString().slice(0, 10);
  const visitasHoje = visitas.filter((visita) => visita.data === today);
  const visitadosHoje = new Set(visitasHoje.map((visita) => visita.posto?.codigo));
  const pendentes = visitas.filter((visita) => visita.status === "pendente");
  const ultimasPorPosto = latestVisitsByPosto(todasVisitas);
  const alertasSupervisor = postos.filter((posto) => {
    const cor = ultimasPorPosto.get(posto.codigo)?.supervisorStatus?.cor;
    return cor === "amarelo" || cor === "vermelho";
  });

  setText("#dash-postos", postos.length);
  setText("#dash-tecnicos", tecnicos.filter((tecnico) => tecnico.ativo && isTecnicoProfile(tecnico)).length);
  setText("#dash-hoje", visitasHoje.length);
  setText("#dash-pendentes", Math.max(0, postos.length - visitadosHoje.size));
  setText("#dash-alertas", alertasSupervisor.length + pendentes.length);

  postosStatusGrid.innerHTML = postos
    .map((posto) => renderPostoStatus(posto, ultimasPorPosto.get(posto.codigo)))
    .join("");

  tableBody.innerHTML = visitas
    .slice(0, 80)
    .map(
      (visita, index) => `
        <tr data-index="${index}">
          <td>${formatDate(visita.data)}</td>
          <td>${escapeHtml(visita.hora || "-")}</td>
          <td>${serviceLabel(visita)}</td>
          <td>${escapeHtml(visita.tecnico?.nome || "-")}</td>
          <td>${escapeHtml(visita.posto?.codigo || "-")} - ${escapeHtml(visita.posto?.nome || "-")}</td>
          <td>${statusColorLabel(visita.supervisorStatus?.cor)}</td>
          <td>${escapeHtml(visita.status || "enviada")}</td>
          <td>${(visita.fotos || []).length}</td>
        </tr>
      `
    )
    .join("");

  tableBody.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", () => {
      details.innerHTML = renderServiceDetails(visitas[Number(row.dataset.index)]);
    });
  });

  details.innerHTML = visitas[0] ? renderServiceDetails(visitas[0]) : `<div class="empty-state">Nenhuma visita para exibir.</div>`;
}

function latestVisitsByPosto(visitas) {
  const map = new Map();
  for (const visita of visitas) {
    const codigo = visita.posto?.codigo;
    if (!codigo || map.has(codigo)) continue;
    map.set(codigo, visita);
  }
  return map;
}

function renderPostoStatus(posto, visita) {
  const cor = visita?.supervisorStatus?.cor || "sem-status";
  const descricao = visita?.supervisorStatus?.descricao || "Sem visita registrada.";
  const tecnico = visita?.tecnico?.nome || "-";
  const data = visita?.data ? `${formatDate(visita.data)} ${visita.hora || ""}` : "-";
  return `
    <article class="posto-status-card">
      <div class="posto-status-card__head">
        <span class="posto-status-dot posto-status-dot--${escapeHtml(cor)}" title="${statusColorLabel(cor)}"></span>
        <strong>${escapeHtml(posto.codigo)} - ${escapeHtml(posto.nome)}</strong>
      </div>
      <p>${escapeHtml(descricao)}</p>
      <small>${escapeHtml(tecnico)} · ${escapeHtml(data)}</small>
    </article>
  `;
}

function renderServiceDetails(visita) {
  const supervisorCor = visita.supervisorStatus?.cor || "sem-status";
  const supervisorDescricao = visita.supervisorStatus?.descricao || "Sem descrição para o supervisor.";
  const chamadoMotivo = visita.chamado?.motivo || "";
  const chamadoSolucao = visita.chamado?.solucao || "";
  const itensAvaliados = visita.checklist?.length || 0;

  return `
    <article class="visit-card">
      <div class="visit-card__head">
        <div>
          <strong>${serviceLabel(visita)} - ${escapeHtml(visita.posto?.codigo || "-")} ${escapeHtml(visita.posto?.nome || "")}</strong>
          <span>${formatDate(visita.data)} às ${escapeHtml(visita.hora || "-")}</span>
        </div>
        <span class="status ${visita.status === "pendente" ? "status--pending" : "status--ok"}">${escapeHtml(visita.status || "enviada")}</span>
      </div>
      <dl class="meta-grid">
        <div><dt>Técnico</dt><dd>${escapeHtml(visita.tecnico?.nome || "-")}</dd></div>
        <div><dt>Cidade</dt><dd>${escapeHtml(visita.posto?.cidade || "-")}</dd></div>
        <div><dt>Status supervisor</dt><dd>${statusColorLabel(supervisorCor)}</dd></div>
        <div><dt>Itens avaliados</dt><dd>${itensAvaliados}</dd></div>
      </dl>
      <div class="supervisor-note">
        <span class="posto-status-dot posto-status-dot--${escapeHtml(supervisorCor)}"></span>
        <p>${escapeHtml(supervisorDescricao)}</p>
      </div>
      ${
        chamadoMotivo || chamadoSolucao
          ? `<div class="visit-card__text">
              <p><strong>Motivo</strong><span>${escapeHtml(chamadoMotivo || "-")}</span></p>
              <p><strong>Solução</strong><span>${escapeHtml(chamadoSolucao || "-")}</span></p>
            </div>`
          : ""
      }
    </article>
  `;
}

function serviceLabel(visita) {
  if (visita.tipo === "chamado") return "Chamado";
  if (visita.tipo === "preventiva") return "Preventiva";
  return "Registro";
}
