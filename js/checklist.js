import { checklistBase } from "./data.js";
import { checklistIcons } from "./checklist-icons.js";
import { getPostoByAccess, saveVisita } from "./firebase-service.js";
import {
  $,
  $$,
  bindShell,
  escapeHtml,
  fileToDataUrl,
  requireAuth,
  setText,
  showToast,
  todayParts
} from "./ui.js";

const { profile } = await requireAuth();
bindShell(profile);

const params = new URLSearchParams(location.search);
const posto = await getPostoByAccess(params.get("posto"), profile);

if (!posto) {
  location.href = "scanner.html";
} else {
  runWizard(posto);
}

function runWizard(posto) {
  const total = checklistBase.length;
  const state = checklistBase.map(() => ({ status: null, observacao: "" }));
  let index = 0;
  let fotos = [];
  let gps = null;

  const wizardScreen = $("#wizard-screen");
  const finishForm = $("#checklist-form");
  const stage = $("#wiz-stage");
  const iconEl = $("#wiz-icon");
  const labelEl = $("#wiz-label");
  const obsInput = $("#wiz-obs");
  const photoInput = $("#fotos");
  const photoPreview = $("#photo-preview");
  const gpsOutput = $("#gps-output");

  setText("#wiz-total", total);
  setText("#posto-title", `${posto.codigo} · ${posto.nome}`);
  setText("#posto-city", posto.cidade || "");

  $("#wiz-dots").innerHTML = checklistBase.map(() => "<i></i>").join("");
  const dots = $$("#wiz-dots i");

  renderItem();

  function renderItem() {
    setText("#wiz-idx", index + 1);
    iconEl.innerHTML = checklistIcons[index] || "";
    labelEl.textContent = checklistBase[index];
    obsInput.value = state[index].observacao || "";
    dots.forEach((dot, i) => {
      const status = state[i].status;
      dot.className = i === index ? "is-current" : status ? `is-${status}` : "";
    });
    stage.classList.remove("is-anim");
    void stage.offsetWidth;
    stage.classList.add("is-anim");
  }

  function mark(status) {
    state[index].observacao = obsInput.value.trim();
    state[index].status = status;
    if (index >= total - 1) {
      goFinish();
    } else {
      index += 1;
      renderItem();
    }
  }

  $$("[data-mark]").forEach((button) => {
    button.addEventListener("click", () => mark(button.dataset.mark));
  });

  $("#wiz-back").addEventListener("click", () => {
    state[index].observacao = obsInput.value.trim();
    if (index > 0) {
      index -= 1;
      renderItem();
    } else {
      location.href = `posto.html?posto=${encodeURIComponent(posto.codigo)}`;
    }
  });

  $("#finish-back").addEventListener("click", () => {
    finishForm.hidden = true;
    wizardScreen.hidden = false;
    index = total - 1;
    renderItem();
  });

  function goFinish() {
    wizardScreen.hidden = true;
    finishForm.hidden = false;
    const counts = state.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
    $("#checklist-summary").innerHTML = `
      <span class="sum-chip">${escapeHtml(posto.codigo)} · ${escapeHtml(posto.nome)}</span>
      <span class="sum-chip sum-chip--ok">${counts.ok || 0} OK</span>
      <span class="sum-chip sum-chip--at">${counts.atencao || 0} atenção</span>
      <span class="sum-chip sum-chip--na">${counts.na || 0} N/A</span>
    `;
    window.scrollTo(0, 0);
  }

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
    photoPreview.innerHTML = fotos.map((foto) => `<img src="${foto.dataUrl}" alt="Foto selecionada">`).join("");
  });

  finishForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    finishForm.classList.add("is-loading");

    const formData = new FormData(finishForm);
    const { data, hora } = todayParts();
    const checklist = checklistBase.map((label, i) => ({
      item: label,
      status: state[i].status,
      observacao: state[i].observacao || ""
    }));

    try {
      const result = await saveVisita({
        tipo: "preventiva",
        posto: {
          codigo: posto.codigo,
          nome: posto.nome,
          cidade: posto.cidade
        },
        tecnico: {
          uid: profile.uid,
          nome: profile.nome,
          email: profile.email,
          nivel: profile.nivel,
          postosPermitidos: profile.postosPermitidos || []
        },
        data,
        hora,
        gps,
        checklist,
        supervisorStatus: {
          cor: formData.get("supervisorStatus"),
          descricao: formData.get("supervisorDescricao") || ""
        },
        observacoes: formData.get("observacoes") || "",
        fotos
      });

      showToast(result.status === "enviada" ? "Preventiva enviada." : "Preventiva salva para sincronização.", "success");
      window.setTimeout(() => {
        location.href = `posto.html?posto=${encodeURIComponent(posto.codigo)}`;
      }, 900);
    } catch (error) {
      showToast(error.message || "Não foi possível salvar a preventiva.", "error");
    } finally {
      finishForm.classList.remove("is-loading");
    }
  });
}
