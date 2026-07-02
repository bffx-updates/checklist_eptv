import { POSTO_RIBEIRAO_PRETO, canAccessPosto, isSupervisorProfile } from "./data.js";
import { listVisitas } from "./firebase-service.js";
import { $, bindShell, renderVisitCard, requireAuth } from "./ui.js";

const { profile } = await requireAuth();
bindShell(profile);

const list = $("#history-list");
const filter = $("#history-filter");

async function render() {
  const filters = isSupervisorProfile(profile) ? {} : { tecnicoEmail: profile.email };
  if (profile.nivel === "nivel1") filters.posto = POSTO_RIBEIRAO_PRETO;
  if (filter.value) {
    const posto = filter.value.trim().toUpperCase();
    if (!canAccessPosto(profile, posto)) {
      list.innerHTML = `<div class="empty-state">Posto fora do seu nível de acesso.</div>`;
      return;
    }
    filters.posto = posto;
  }
  const visitas = await listVisitas(filters);

  list.innerHTML = visitas.length
    ? visitas.map(renderVisitCard).join("")
    : `<div class="empty-state">Nenhuma visita encontrada.</div>`;
}

filter.addEventListener("input", render);
render();
