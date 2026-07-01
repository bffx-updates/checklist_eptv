import { checklistBase } from "./data.js";
import { checklistIcons } from "./checklist-icons.js";
import { getPosto, saveVisita } from "./firebase-service.js";
import {
  $,
  bindShell,
  fileToDataUrl,
  requireAuth,
  setText,
  showToast,
  todayParts
} from "./ui.js";

const { profile } = await requireAuth();
bindShell(profile);

const params = new URLSearchParams(location.search);
const posto = await getPosto(params.get("posto"));
const form = $("#checklist-form");
const items = $("#checklist-items");
const photoInput = $("#fotos");
const photoPreview = $("#photo-preview");
const gpsOutput = $("#gps-output");
let fotos = [];
let gps = null;

if (!posto) {
  location.href = "scanner.html";
}

setText("#posto-title", `${posto.codigo} - ${posto.nome}`);
setText("#posto-city", posto.cidade || "");

items.innerHTML = checklistBase
  .map(
    (label, index) => `
      <fieldset class="check-item" aria-label="${index + 1}. ${label}">
        <div class="check-item__head">
          <span class="check-item__icon">${checklistIcons[index] || ""}</span>
          <span class="check-item__label">
            <em>Item ${index + 1} de ${checklistBase.length}</em>
            <strong>${label}</strong>
          </span>
        </div>
        <div class="segmented">
          <label><input required type="radio" name="check-${index}" value="ok"> OK</label>
          <label><input type="radio" name="check-${index}" value="atencao"> Atenção</label>
          <label><input type="radio" name="check-${index}" value="na"> N/A</label>
        </div>
        <input class="input" name="obs-${index}" placeholder="Observação do item">
      </fieldset>
    `
  )
  .join("");

$("#capture-gps").addEventListener("click", () => {
  if (!navigator.geolocation) {
    showToast("GPS indisponível neste dispositivo.", "error");
    return;
  }
  gpsOutput.textContent = "Obtendo localização...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      gps = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        precisao: position.coords.accuracy
      };
      gpsOutput.textContent = `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)} (${Math.round(gps.precisao)} m)`;
    },
    () => {
      gpsOutput.textContent = "Localização não capturada.";
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
  );
});

photoInput.addEventListener("change", async () => {
  const selected = [...photoInput.files];
  fotos = await Promise.all(selected.map((file) => fileToDataUrl(file)));
  photoPreview.innerHTML = fotos
    .map((foto) => `<img src="${foto.dataUrl}" alt="Foto selecionada">`)
    .join("");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  form.classList.add("is-loading");

  const formData = new FormData(form);
  const { data, hora } = todayParts();
  const checklist = checklistBase.map((label, index) => ({
    item: label,
    status: formData.get(`check-${index}`),
    observacao: formData.get(`obs-${index}`) || ""
  }));

  const result = await saveVisita({
    posto: {
      codigo: posto.codigo,
      nome: posto.nome,
      cidade: posto.cidade
    },
    tecnico: {
      uid: profile.uid,
      nome: profile.nome,
      email: profile.email
    },
    data,
    hora,
    gps,
    checklist,
    observacoes: formData.get("observacoes") || "",
    fotos
  });

  form.classList.remove("is-loading");
  showToast(result.status === "enviada" ? "Visita enviada." : "Visita salva para sincronização.", "success");
  window.setTimeout(() => {
    location.href = "historico.html";
  }, 900);
});
