import { getChecklistForPosto } from "./data.js";
import { checklistIcons, iconeRack } from "./checklist-icons.js";
import { getPostoByAccess, saveVisita } from "./firebase-service.js";
import {
  $,
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
  const items = getChecklistForPosto(posto.codigo);
  const total = items.length;
  const state = items.map(() => ({ value: null, label: "", tone: null, observacao: "" }));
  let index = 0;
  let fotos = [];
  let gps = null;

  const wizardScreen = $("#wizard-screen");
  const finishForm = $("#checklist-form");
  const stage = $("#wiz-stage");
  const iconEl = $("#wiz-icon");
  const rackEl = $("#wiz-rack");
  const labelEl = $("#wiz-label");
  const obsInput = $("#wiz-obs");
  const actionsEl = $("#wiz-actions");
  const photoInput = $("#fotos");
  const photoPreview = $("#photo-preview");
  const gpsOutput = $("#gps-output");

  setText("#wiz-total", total);
  setText("#posto-title", `${posto.codigo} · ${posto.nome}`);
  setText("#posto-city", posto.cidade || "");

  $("#wiz-dots").innerHTML = items.map(() => "<i></i>").join("");
  const dots = [...$("#wiz-dots").children];

  renderItem();

  function renderItem() {
    const item = items[index];
    setText("#wiz-idx", index + 1);
    iconEl.innerHTML = item.rack ? iconeRack : checklistIcons[index] || iconeRack;
    rackEl.textContent = item.rack || "";
    rackEl.hidden = !item.rack;
    labelEl.textContent = item.label;
    obsInput.value = state[index].observacao || "";
    renderOptions(item);
    dots.forEach((dot, i) => {
      dot.className = i === index ? "is-current" : state[i].tone ? `is-${state[i].tone}` : "";
    });
    stage.classList.remove("is-anim");
    void stage.offsetWidth;
    stage.classList.add("is-anim");
  }

  function renderOptions(item) {
    actionsEl.innerHTML = item.opcoes
      .map((opcao) => {
        const selected = state[index].value === opcao.value ? " is-selected" : "";
        return `<button type="button" class="wiz-btn wiz-btn--${opcao.tone}${selected}" data-value="${escapeHtml(opcao.value)}">${escapeHtml(opcao.label)}</button>`;
      })
      .join("");
    actionsEl.querySelectorAll(".wiz-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const opcao = item.opcoes.find((option) => option.value === button.dataset.value);
        mark(opcao);
      });
    });
  }

  function mark(opcao) {
    state[index] = {
      value: opcao.value,
      label: opcao.label,
      tone: opcao.tone,
      observacao: obsInput.value.trim()
    };
    if (index >= total - 1) {
      goFinish();
    } else {
      index += 1;
      renderItem();
    }
  }

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
    renderSummary();
    window.scrollTo(0, 0);
  }

  function renderSummary() {
    const ordemTone = { ok: 0, nc: 1, warn: 2, na: 3 };
    const agrupado = new Map();
    for (const item of state) {
      if (!item.value) continue;
      const atual = agrupado.get(item.label) || { count: 0, tone: item.tone };
      atual.count += 1;
      agrupado.set(item.label, atual);
    }
    const chips = [...agrupado.entries()]
      .sort((a, b) => (ordemTone[a[1].tone] ?? 9) - (ordemTone[b[1].tone] ?? 9))
      .map(([label, info]) => `<span class="sum-chip sum-chip--${info.tone}">${info.count} ${escapeHtml(label)}</span>`)
      .join("");
    $("#checklist-summary").innerHTML = `<span class="sum-chip">${escapeHtml(posto.codigo)} · ${escapeHtml(posto.nome)}</span>${chips}`;
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
    const checklist = items.map((item, i) => ({
      rack: item.rack || null,
      item: item.label,
      status: state[i].value,
      statusLabel: state[i].label,
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
