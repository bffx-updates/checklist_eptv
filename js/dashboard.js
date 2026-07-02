import { listPostos, listTecnicos, listVisitas } from "./firebase-service.js";
import { $, bindShell, escapeHtml, formatDate, requireAuth, setText, statusColorLabel } from "./ui.js";

const { profile } = await requireAuth({ supervisor: true });
bindShell(profile);

const filtersForm = $("#dashboard-filters");
const tableBody = $("#visits-table tbody");
const details = $("#visit-details");
const postoSelect = $("#filter-posto");
const tecnicoSelect = $("#filter-tecnico");
const board = $("#ops-board");
const feedEl = $("#ops-feed");
const tickerEl = $("#ops-ticker");
const ringArc = $("#ring-arc");

const RING_CIRC = 2 * Math.PI * 54;
const COLUMNS = [
  { key: "vermelho", label: "Crítico" },
  { key: "amarelo", label: "Atenção" },
  { key: "pendente", label: "Pendente" },
  { key: "verde", label: "OK" }
];

const [postos, tecnicos] = await Promise.all([listPostos(), listTecnicos()]);

postoSelect.innerHTML = `<option value="">Todos os postos</option>${postos
  .map((posto) => `<option value="${posto.codigo}">${posto.codigo} - ${posto.nome}</option>`)
  .join("")}`;

tecnicoSelect.innerHTML = `<option value="">Todos os técnicos</option>${tecnicos
  .map((tecnico) => `<option value="${tecnico.nome}">${tecnico.nome}</option>`)
  .join("")}`;

if (ringArc) ringArc.setAttribute("stroke-dasharray", String(RING_CIRC));
startClock();

filtersForm.addEventListener("input", renderTable);
await Promise.all([renderOps(), renderTable()]);

async function renderOps() {
  const todas = await listVisitas();
  const ultimas = latestVisitsByPosto(todas);

  const buckets = { vermelho: [], amarelo: [], pendente: [], verde: [] };
  for (const posto of postos) {
    const cor = ultimas.get(posto.codigo)?.supervisorStatus?.cor;
    const bucket = cor === "vermelho" || cor === "amarelo" || cor === "verde" ? cor : "pendente";
    buckets[bucket].push(posto);
  }

  setText("#dash-verde", buckets.verde.length);
  setText("#dash-amarelo", buckets.amarelo.length);
  setText("#dash-vermelho", buckets.vermelho.length);
  setText("#dash-pendente", buckets.pendente.length);

  const mesAtual = new Date().toISOString().slice(0, 7);
  const hoje = new Date().toISOString().slice(0, 10);
  const visitadosMes = new Set(
    todas.filter((visita) => String(visita.data || "").startsWith(mesAtual)).map((visita) => visita.posto?.codigo).filter(Boolean)
  );
  const visitasHoje = todas.filter((visita) => visita.data === hoje).length;
  const pct = postos.length ? Math.round((visitadosMes.size / postos.length) * 100) : 0;
  setRing(pct);

  const dataLabel = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  setText(
    "#ops-subtitle",
    `${postos.length} postos monitorados · ${dataLabel.charAt(0).toUpperCase() + dataLabel.slice(1)} · ${visitasHoje} visitas hoje`
  );

  board.innerHTML = COLUMNS.map(({ key, label }) => renderColumn(key, label, buckets[key], ultimas)).join("");

  feedEl.innerHTML = todas.length
    ? todas.slice(0, 6).map(renderFeedItem).join("")
    : `<div class="ops-feed__item"><div><strong>Sem registros ainda</strong><span>Aguardando visitas</span></div></div>`;

  const alertas = [...buckets.vermelho, ...buckets.amarelo].map((posto) => {
    const cor = ultimas.get(posto.codigo)?.supervisorStatus?.cor;
    return `${posto.codigo} ${posto.nome}: ${cor === "vermelho" ? "status crítico" : "requer atenção"}`;
  });
  const tickerText = (alertas.length ? alertas.join("   ·   ") : "Todos os postos sob controle") + "   ·   ";
  tickerEl.innerHTML = `<span>${escapeHtml(tickerText)}</span><span>${escapeHtml(tickerText)}</span>`;
}

function renderColumn(key, label, list, ultimas) {
  const chips = list
    .map((posto) => {
      const visita = ultimas.get(posto.codigo);
      const info = key === "pendente" ? "sem visita" : relativeDays(visita?.data);
      return `<div class="ops-chip"><strong>${escapeHtml(posto.codigo)}</strong><span>${escapeHtml(posto.nome)} · ${escapeHtml(info)}</span></div>`;
    })
    .join("");
  return `
    <section class="ops-col ops-col--${key}">
      <div class="ops-col__head"><i></i><strong>${label}</strong><b>${list.length}</b></div>
      <div class="ops-col__list">${chips || `<div class="ops-chip"><span>Nenhum posto</span></div>`}</div>
    </section>
  `;
}

function renderFeedItem(visita) {
  const cor = visita.supervisorStatus?.cor;
  const dot =
    cor === "verde" ? "#1FA35C" : cor === "amarelo" ? "#D99000" : cor === "vermelho" ? "#E23D3D" : "#7C8499";
  return `
    <div class="ops-feed__item">
      <i style="background:${dot}"></i>
      <div>
        <strong>${escapeHtml(visita.tecnico?.nome || "-")}</strong>
        <span>${serviceLabel(visita)} · ${escapeHtml(visita.posto?.codigo || "-")}</span>
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

function relativeDays(dateStr) {
  if (!dateStr) return "—";
  const then = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(then.getTime())) return "—";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.floor((now.getTime() - then.getTime()) / 86400000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  return `${days}d`;
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
