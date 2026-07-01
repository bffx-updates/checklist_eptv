import { listPostos, listTecnicos, listVisitas } from "./firebase-service.js";
import { $, bindShell, escapeHtml, formatDate, renderVisitCard, requireAuth, setText } from "./ui.js";

const { profile } = await requireAuth({ supervisor: true });
bindShell(profile);

const filtersForm = $("#dashboard-filters");
const tableBody = $("#visits-table tbody");
const details = $("#visit-details");
const postoSelect = $("#filter-posto");
const tecnicoSelect = $("#filter-tecnico");

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
  const today = new Date().toISOString().slice(0, 10);
  const visitasHoje = visitas.filter((visita) => visita.data === today);
  const visitadosHoje = new Set(visitasHoje.map((visita) => visita.posto?.codigo));
  const pendentes = visitas.filter((visita) => visita.status === "pendente");

  setText("#dash-postos", postos.length);
  setText("#dash-tecnicos", tecnicos.filter((tecnico) => tecnico.ativo && tecnico.nivel === "tecnico").length);
  setText("#dash-hoje", visitasHoje.length);
  setText("#dash-pendentes", Math.max(0, postos.length - visitadosHoje.size));
  setText("#dash-alertas", pendentes.length);

  tableBody.innerHTML = visitas
    .slice(0, 80)
    .map(
      (visita, index) => `
        <tr data-index="${index}">
          <td>${formatDate(visita.data)}</td>
          <td>${escapeHtml(visita.hora || "-")}</td>
          <td>${escapeHtml(visita.tecnico?.nome || "-")}</td>
          <td>${escapeHtml(visita.posto?.codigo || "-")} - ${escapeHtml(visita.posto?.nome || "-")}</td>
          <td>${escapeHtml(visita.status || "enviada")}</td>
          <td>${(visita.fotos || []).length}</td>
        </tr>
      `
    )
    .join("");

  tableBody.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", () => {
      details.innerHTML = renderVisitCard(visitas[Number(row.dataset.index)]);
    });
  });

  details.innerHTML = visitas[0] ? renderVisitCard(visitas[0]) : `<div class="empty-state">Nenhuma visita para exibir.</div>`;
}
