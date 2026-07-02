import "./register-sw.js";
import { isSupervisorProfile } from "./data.js";
import { getCurrentProfile, logout, observeUser, syncPendingVisits } from "./firebase-service.js";

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function setText(selector, value, root = document) {
  const element = $(selector, root);
  if (element) element.textContent = value ?? "";
}

export function showToast(message, type = "info") {
  let toast = $(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.dataset.type = type;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

export function normalizePostoCode(value) {
  return String(value || "").trim().toUpperCase();
}

export function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function todayParts() {
  const now = new Date();
  return {
    data: now.toISOString().slice(0, 10),
    hora: now.toTimeString().slice(0, 5)
  };
}

export async function requireAuth({ supervisor = false } = {}) {
  return new Promise((resolve) => {
    observeUser(async (user) => {
      if (!user) {
        location.href = "login.html";
        return;
      }
      const profile = await getCurrentProfile(user);
      if (supervisor && !isSupervisorProfile(profile)) {
        location.href = "index.html";
        return;
      }
      resolve({ user, profile });
    });
  });
}

export function bindShell(profile) {
  setText("[data-user-name]", profile?.nome || profile?.email || "");
  const roleLabel =
    profile?.nivel === "supervisor" ? "Supervisor" : profile?.nivel === "nivel1" ? "Técnico nível 1" : "Técnico nível 2";
  setText("[data-user-role]", roleLabel);

  const dashboardLinks = $$("[data-supervisor-only]");
  dashboardLinks.forEach((item) => {
    item.hidden = !isSupervisorProfile(profile);
  });

  const logoutButton = $("[data-logout]");
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      await logout();
      location.href = "login.html";
    });
  }

  syncPendingVisits().catch(() => {});
}

export async function fileToDataUrl(file, maxWidth = 1600) {
  const dataUrl = await readFile(file);
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, maxWidth / image.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return {
    nome: file.name,
    type: "image/jpeg",
    dataUrl: canvas.toDataURL("image/jpeg", 0.82)
  };
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export function renderVisitCard(visita) {
  const fotos = visita.fotos || [];
  const checklist = visita.checklist || [];
  const pendente = visita.status === "pendente";
  const tipo = visita.tipo || (checklist.length ? "preventiva" : "registro");
  const tipoLabel = tipo === "chamado" ? "Chamado" : tipo === "preventiva" ? "Preventiva" : "Registro";
  const postoCodigo = escapeHtml(visita.posto?.codigo || "-");
  const postoNome = escapeHtml(visita.posto?.nome || "-");
  const postoCidade = escapeHtml(visita.posto?.cidade || "-");
  const tecnicoNome = escapeHtml(visita.tecnico?.nome || "-");
  const observacoes = escapeHtml(visita.observacoes || "");
  const chamadoMotivo = escapeHtml(visita.chamado?.motivo || "");
  const chamadoSolucao = escapeHtml(visita.chamado?.solucao || "");
  const supervisorCor = visita.supervisorStatus?.cor || "";
  const supervisorDescricao = escapeHtml(visita.supervisorStatus?.descricao || "");
  const supervisorLabel = statusColorLabel(supervisorCor);

  return `
    <article class="visit-card">
      <div class="visit-card__head">
        <div>
          <strong>${postoCodigo} - ${postoNome}</strong>
          <span>${formatDate(visita.data)} às ${visita.hora || "-"}</span>
        </div>
        <span class="status ${pendente ? "status--pending" : "status--ok"}">${pendente ? "Pendente" : "Enviada"}</span>
      </div>
      <dl class="meta-grid">
        <div><dt>Tipo</dt><dd>${tipoLabel}</dd></div>
        <div><dt>Técnico</dt><dd>${tecnicoNome}</dd></div>
        <div><dt>Cidade</dt><dd>${postoCidade}</dd></div>
        <div><dt>Checklist</dt><dd>${checklist.length} itens</dd></div>
        <div><dt>Fotos</dt><dd>${fotos.length}</dd></div>
        <div><dt>Supervisor</dt><dd>${supervisorLabel}</dd></div>
      </dl>
      ${
        supervisorCor || supervisorDescricao
          ? `<div class="supervisor-note">
              <span class="posto-status-dot posto-status-dot--${escapeHtml(supervisorCor || "sem-status")}"></span>
              <p>${supervisorDescricao || "Sem descrição para o supervisor."}</p>
            </div>`
          : ""
      }
      ${
        tipo === "chamado"
          ? `<div class="visit-card__text">
              <p><strong>Motivo</strong><span>${chamadoMotivo || "-"}</span></p>
              <p><strong>Solução</strong><span>${chamadoSolucao || "-"}</span></p>
            </div>`
          : ""
      }
      ${observacoes ? `<p class="visit-card__obs">${observacoes}</p>` : ""}
      ${
        fotos.length
          ? `<div class="photo-strip">${fotos
              .map((foto) => `<a href="${foto.url || foto.dataUrl}" target="_blank"><img src="${foto.url || foto.dataUrl}" alt="Foto da visita"></a>`)
              .join("")}</div>`
          : ""
      }
    </article>
  `;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function statusColorLabel(cor) {
  if (cor === "verde") return "Verde";
  if (cor === "amarelo") return "Amarelo";
  if (cor === "vermelho") return "Vermelho";
  return "Sem status";
}
