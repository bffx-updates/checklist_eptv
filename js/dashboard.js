import { listPostos, listTecnicos, listVisitas } from "./firebase-service.js";
import { $, bindShell, escapeHtml, formatDate, requireAuth, setText, statusColorLabel } from "./ui.js";

const { profile } = await requireAuth({ supervisor: true });
bindShell(profile);

const filtersForm = $("#dashboard-filters");
const tableBody = $("#visits-table tbody");
const details = $("#visit-details");
const postoSelect = $("#filter-posto");
const tecnicoSelect = $("#filter-tecnico");
const grid = $("#ops-grid");
const feedEl = $("#ops-feed");
const ringArc = $("#ring-arc");

const RING_CIRC = 2 * Math.PI * 54;
const TONE = { verde: "#30D158", amarelo: "#FF9F0A", vermelho: "#FF453A", pendente: "#636366" };

const [postos, tecnicos] = await Promise.all([listPostos(), listTecnicos()]);

postoSelect.innerHTML = `<option value="">Todos os postos</option>${postos
  .map((posto) => `<option value="${posto.codigo}">${posto.codigo} - ${posto.nome}</option>`)
  .join("")}`;

tecnicoSelect.innerHTML = `<option value="">Todos os técnicos</option>${tecnicos
  .map((tecnico) => `<option value="${tecnico.nome}">${tecnico.nome}</option>`)
  .join("")}`;

if (ringArc) ringArc.setAttribute("stroke-dasharray", String(RING_CIRC));
startClock();
setText("#ops-subtitle", `${postos.length} postos monitorados`);

filtersForm.addEventListener("input", renderTable);
await Promise.all([renderOps(), renderTable()]);

async function renderOps() {
  const todas = await listVisitas();
  const ultimas = latestVisitsByPosto(todas);

  const counts = { verde: 0, amarelo: 0, vermelho: 0, pendente: 0 };
  grid.innerHTML = postos
    .map((posto) => {
      const cor = ultimas.get(posto.codigo)?.supervisorStatus?.cor;
      const bucket = cor === "verde" || cor === "amarelo" || cor === "vermelho" ? cor : "pendente";
      counts[bucket] += 1;
      return `
        <div class="ops-posto">
          <div class="ops-posto__info">
            <strong>${escapeHtml(posto.nome)}</strong>
            <span>${escapeHtml(posto.codigo)}</span>
          </div>
          <i class="ops-posto__dot" style="background:${TONE[bucket]}"></i>
        </div>
      `;
    })
    .join("");

  setText("#dash-verde", counts.verde);
  setText("#dash-amarelo", counts.amarelo);
  setText("#dash-vermelho", counts.vermelho);
  setText("#dash-pendente", counts.pendente);

  const mesAtual = new Date().toISOString().slice(0, 7);
  const visitadosMes = new Set(
    todas.filter((visita) => String(visita.data || "").startsWith(mesAtual)).map((visita) => visita.posto?.codigo).filter(Boolean)
  );
  setRing(postos.length ? Math.round((visitadosMes.size / postos.length) * 100) : 0);

  feedEl.innerHTML = todas.length
    ? todas.slice(0, 4).map(renderFeedItem).join("")
    : `<div class="ops-feed__item"><div><strong>Sem registros ainda</strong><span>Aguardando visitas</span></div></div>`;
}

function renderFeedItem(visita) {
  const cor = visita.supervisorStatus?.cor;
  const tone = TONE[cor] || TONE.pendente;
  const acao =
    visita.tipo === "preventiva" ? "Preventiva concluída" : visita.tipo === "chamado" ? "Chamado registrado" : "Visita enviada";
  return `
    <div class="ops-feed__item">
      <i style="background:${tone}"></i>
      <div>
        <strong>${escapeHtml(visita.posto?.codigo || "-")} · ${acao}</strong>
        <span>${escapeHtml(visita.tecnico?.nome || "-")}</span>
      </div>
      <em>${escapeHtml(visita.hora || formatDate(visita.data) || "")}</em>
    </div>
  `;
}

function setRing(pct) {
  const clamped = Math.max(0, Math.min(100, pct));
  if (ringArc) ringArc.setAttribute("stroke-dashoffset", String(RING_CIRC - (clamped / 100) * RING_CIRC));
  setText("#ring-pct", `${clamped}%`);
}

function startClock() {
  const tick = () =>
    setText("#ops-clock", new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
  tick();
  window.setInterval(tick, 20000);
}

async function renderTable() {
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

  details.innerHTML = visitas[0]
    ? renderServiceDetails(visitas[0])
    : `<div class="empty-state">Nenhuma visita para exibir.</div>`;
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
