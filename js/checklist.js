import { getChecklistForPosto } from "./data.js";
import { checklistIcons, iconeRack, getIconeChecklist } from "./checklist-icons.js";
import { getPostoByAccess, saveVisita } from "./firebase-service.js";
import {
  $,
  bindShell,
  escapeHtml,
  fileToDataUrl,
  formatDate,
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

  setText("#wiz-total", total);
  setText("#posto-title", `${posto.codigo} · ${posto.nome}`);
  setText("#posto-city", posto.cidade || "");

  $("#wiz-dots").innerHTML = items.map(() => "<i></i>").join("");
  const dots = [...$("#wiz-dots").children];

  renderItem();

  function renderItem() {
    const item = items[index];
    setText("#wiz-idx", index + 1);
    iconEl.innerHTML = getIconeChecklist(item, index);
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
    actionsEl.classList.toggle("wiz-actions--row", item.opcoes.length === 2);
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
    const supervisorStatus = {
      cor: formData.get("supervisorStatus"),
      descricao: formData.get("supervisorDescricao") || ""
    };
    const observacoes = formData.get("observacoes") || "";
    const checklist = items.map((item, i) => ({
      rack: item.rack || null,
      item: item.label,
      status: state[i].value,
      statusLabel: state[i].label,
      observacao: state[i].observacao || ""
    }));

    const mensagem = buildWhatsappText({ data, hora, supervisorStatus, observacoes });
    // Copia dentro do gesto do clique para o navegador liberar a área de transferência.
    await copyToClipboard(mensagem);

    try {
      await saveVisita({
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
        gps: null,
        checklist,
        supervisorStatus,
        observacoes,
        fotos
      });
      openShareModal(mensagem);
    } catch (error) {
      showToast(error.message || "Não foi possível salvar a preventiva.", "error");
      finishForm.classList.remove("is-loading");
    }
  });

  function buildWhatsappText({ data, hora, supervisorStatus, observacoes }) {
    const EMOJI = { ok: "✅", nao_conforme: "❌", na: "➖", atencao: "⚠️", no_ar: "✅", standby: "🟡" };
    const SUP = { verde: "🟢 Verde", amarelo: "🟡 Amarelo", vermelho: "🔴 Vermelho" };

    const linhas = [];
    linhas.push("📋 *CHECKLIST PREVENTIVA*");
    linhas.push(`📍 ${posto.codigo} - ${posto.nome}`);
    linhas.push(`👤 ${profile.nome || profile.email || "-"}`);
    linhas.push(`📅 ${formatDate(data)} ${hora}`);
    linhas.push("");

    let rackAtual = null;
    items.forEach((item, i) => {
      if (item.rack && item.rack !== rackAtual) {
        if (rackAtual !== null) linhas.push("");
        rackAtual = item.rack;
        linhas.push(`*${item.rack}*`);
      }
      const atual = state[i];
      const emoji = EMOJI[atual.value] || "•";
      const sufixo = atual.value === "ok" ? "" : ` — ${atual.label}`;
      let linha = `${emoji} ${item.label}${sufixo}`;
      if (atual.observacao) linha += ` _(${atual.observacao})_`;
      linhas.push(linha);
    });

    linhas.push("");
    linhas.push(`Status para o supervisor: ${SUP[supervisorStatus.cor] || "-"}`);
    if (supervisorStatus.descricao) linhas.push(`🗒️ ${supervisorStatus.descricao}`);
    if (observacoes) linhas.push(`📝 ${observacoes}`);

    return linhas.join("\n");
  }

  function openShareModal(mensagem) {
    const modal = $("#share-modal");
    $("#share-preview").textContent = mensagem;
    $("#share-open").href = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    finishForm.classList.remove("is-loading");
    modal.hidden = false;

    $("#share-copy").onclick = async () => {
      const copiou = await copyToClipboard(mensagem);
      showToast(
        copiou ? "Checklist copiado de novo." : "Não consegui copiar. Selecione o texto e copie manualmente.",
        copiou ? "success" : "error"
      );
    };
    $("#share-done").onclick = () => {
      location.href = `posto.html?posto=${encodeURIComponent(posto.codigo)}`;
    };
  }
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Cai para o método alternativo abaixo.
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copiou = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copiou;
  } catch {
    return false;
  }
}
