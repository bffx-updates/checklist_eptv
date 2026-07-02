import { $, bindShell, requireAuth, setText } from "./ui.js";
import { isSupervisorProfile } from "./data.js";
import { listVisitas } from "./firebase-service.js";

const { profile } = await requireAuth();
bindShell(profile);

const nome = profile?.nome || profile?.email || "";
const firstName = nome.split(" ")[0] || "técnico";

const initials =
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "EP";
setText("#home-avatar", initials);

const hour = new Date().getHours();
const saudacao = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
setText("#home-greeting", `${saudacao}, ${firstName}!`);

const dataLabel = new Date().toLocaleDateString("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long"
});
setText("#home-sub", dataLabel.charAt(0).toUpperCase() + dataLabel.slice(1));

try {
  const filtro = isSupervisorProfile(profile) ? {} : { tecnicoEmail: profile.email };
  const visitas = await listVisitas(filtro);

  const mesAtual = new Date().toISOString().slice(0, 7);
  const noMes = visitas.filter((visita) => String(visita.data || "").startsWith(mesAtual)).length;
  setText("#tile-count", String(noMes));

  const cor = visitas[0]?.supervisorStatus?.cor;
  const tileStatus = $("#tile-status");
  if (tileStatus) {
    const label =
      cor === "verde" ? "Verde" : cor === "amarelo" ? "Amarelo" : cor === "vermelho" ? "Vermelho" : "—";
    tileStatus.textContent = label;
    tileStatus.className = cor ? `is-${cor}` : "";
  }
} catch {
  setText("#tile-count", "–");
}
