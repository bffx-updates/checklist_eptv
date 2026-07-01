import { listVisitas } from "./firebase-service.js";
import { $, bindShell, renderVisitCard, requireAuth } from "./ui.js";

const { profile } = await requireAuth();
bindShell(profile);

const list = $("#history-list");
const filter = $("#history-filter");

async function render() {
  const filters = profile.nivel === "supervisor" ? {} : { tecnicoEmail: profile.email };
  if (filter.value) filters.posto = filter.value.trim().toUpperCase();
  const visitas = await listVisitas(filters);

  list.innerHTML = visitas.length
    ? visitas.map(renderVisitCard).join("")
    : `<div class="empty-state">Nenhuma visita encontrada.</div>`;
}

filter.addEventListener("input", render);
render();
