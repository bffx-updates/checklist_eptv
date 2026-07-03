// ─────────────────────────────────────────────────────────────────────────────
// Ícones ILUSTRATIVOS do checklist — substitui js/checklist-icons.js
// Estilo: traço 2.4, linear e arredondado, cor via currentColor,
// preenchimentos suaves com fill-opacity para dar profundidade.
// viewBox 48×48 (mais detalhe que os antigos 24×24) — o CSS controla o tamanho.
//
// COMO USAR (2 passos):
// 1. Substitua o conteúdo de js/checklist-icons.js por este arquivo.
// 2. Em js/checklist.js, troque:
//      import { checklistIcons, iconeRack } from "./checklist-icons.js";
//    por:
//      import { checklistIcons, iconeRack, getIconeChecklist } from "./checklist-icons.js";
//    e troque a linha:
//      iconEl.innerHTML = item.rack ? iconeRack : checklistIcons[index] || iconeRack;
//    por:
//      iconEl.innerHTML = getIconeChecklist(item, index);
//    (assim cada item do P001 ganha seu próprio desenho)
// ─────────────────────────────────────────────────────────────────────────────

const svg = (content) =>
  `<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;

// Checklist padrão (10 itens) — mesma ordem de checklistBase em js/data.js
export const checklistIcons = [
  // 1. Energia elétrica e disjuntores — quadro de disjuntores + raio
  svg(`<rect x="8" y="7" width="21" height="28" rx="3.5"/>
<path d="M13 14h11M13 20h11M13 26h6"/>
<path d="M37 17 28 30h5l-2 11 11-13h-5l3-11z" fill="currentColor" fill-opacity=".14" stroke="none"/>
<path d="M37 17 28 30h5l-2 11 11-13h-5l3-11z"/>
<path d="M38 8.5v4M36 10.5h4"/>`),

  // 2. No-break, baterias e autonomia — torre de no-break + bateria
  svg(`<rect x="9" y="6" width="17" height="34" rx="4"/>
<circle cx="17.5" cy="14.5" r="3.4"/><path d="M17.5 10.8v3.2"/>
<rect x="13" y="26" width="9" height="9" rx="1.5" fill="currentColor" fill-opacity=".14" stroke="none"/>
<rect x="13" y="26" width="9" height="9" rx="1.5"/>
<path d="M33 14l-5 8h4l-1.5 7 6.5-9h-4l2.5-6z"/>
<path d="M12 44h12"/>`),

  // 3. Equipamentos de transmissão — gabinete transmitindo
  svg(`<rect x="14" y="12" width="20" height="28" rx="3"/>
<path d="M14 20h20M14 28h20"/>
<path d="M18 16h.01M18 24h.01M18 34h.01"/>
<path d="M22 16h8M22 24h8M22 33h8"/>
<path d="M24 12V7"/><circle cx="24" cy="5.6" r="1.6" fill="currentColor" stroke="none"/>
<path d="M10 15a12 12 0 0 1 3.5-8M38 15a12 12 0 0 0-3.5-8"/>`),

  // 4. Cabos, conectores e identificação — cabo entrando no conector
  svg(`<path d="M5 40c9 0 7-16 16-16h3"/>
<rect x="24" y="18" width="15" height="12" rx="2.5" fill="currentColor" fill-opacity=".14" stroke="none"/>
<rect x="24" y="18" width="15" height="12" rx="2.5"/>
<path d="M39 21.5h4M39 26.5h4"/>
<path d="M28.5 22.5v3M32.5 22.5v3"/>`),

  // 5. Antenas e apontamento visual — parabólica apontando
  svg(`<ellipse cx="18" cy="21" rx="6.5" ry="12.5" transform="rotate(-42 18 21)" fill="currentColor" fill-opacity=".14" stroke="none"/>
<ellipse cx="18" cy="21" rx="6.5" ry="12.5" transform="rotate(-42 18 21)"/>
<path d="M18 21 28 11"/><circle cx="29.5" cy="9.5" r="2" fill="currentColor" stroke="none"/>
<path d="M36 14a12 12 0 0 1 5 5M34.5 19.5a6.5 6.5 0 0 1 3 3"/>
<path d="M20 32.5l-3 9.5M13 42h11"/>`),

  // 6. Torre, estais e estrutura — mastro estaiado
  svg(`<path d="M24 6 15 40M24 6l9 34"/>
<path d="M20.6 20h6.8M18.2 29h11.6"/>
<path d="M22.2 13 6 40M25.8 13 42 40"/>
<path d="M4 42h40"/>
<circle cx="24" cy="5.4" r="1.8" fill="currentColor" stroke="none"/>`),

  // 7. Aterramento e proteção contra surtos — haste + solo
  svg(`<path d="M24 6v16"/>
<path d="M12 22h24M16.5 28h15M21 34h6"/>
<path d="M6 41c3-2 6-2 9 0s6 2 9 0 6-2 9 0 6 2 9 0"/>
<path d="M38 9l1.4 3.2 3.2 1.4-3.2 1.4L38 18.2l-1.4-3.2-3.2-1.4 3.2-1.4z"/>`),

  // 8. Climatização e ventilação — ar-condicionado soprando
  svg(`<rect x="7" y="9" width="34" height="15" rx="4"/>
<path d="M11.5 19.5h25"/>
<circle cx="36" cy="14" r="1" fill="currentColor" stroke="none"/>
<path d="M13 29c-2 3 2 5 0 8M24 29c-2 3 2 5 0 8M35 29c-2 3 2 5 0 8"/>`),

  // 9. Limpeza e organização do ambiente — brilhos
  svg(`<path d="M19 7l3.4 9.6L32 20l-9.6 3.4L19 33l-3.4-9.6L6 20l9.6-3.4z" fill="currentColor" fill-opacity=".14" stroke="none"/>
<path d="M19 7l3.4 9.6L32 20l-9.6 3.4L19 33l-3.4-9.6L6 20l9.6-3.4z"/>
<path d="M35 26l2 4.6 4.6 2-4.6 2-2 4.6-2-4.6-4.6-2 4.6-2z"/>
<path d="M37 8v5M34.5 10.5h5"/>`),

  // 10. Segurança física e acesso ao posto — cadeado
  svg(`<path d="M17 21v-6a7 7 0 0 1 14 0v6"/>
<rect x="12" y="21" width="24" height="19" rx="6" fill="currentColor" fill-opacity=".14" stroke="none"/>
<rect x="12" y="21" width="24" height="19" rx="6"/>
<circle cx="24" cy="29" r="2.8"/><path d="M24 31.8V35"/>`)
];

// P001 Ribeirão Preto — um desenho por item, mesma ordem de checklistRibeiraoPreto
export const iconesRibeiraoPreto = [
  // Rack 1 · Linhas de Transmissão Pressurizadas — tubulação + manômetro
  svg(`<circle cx="24" cy="16" r="8.5" fill="currentColor" fill-opacity=".14" stroke="none"/>
<circle cx="24" cy="16" r="8.5"/>
<path d="M24 16l4.5-4"/>
<path d="M24 9.5v2.2M18.2 12.6l1.8 1.2M29.8 12.6 28 13.8"/>
<path d="M24 24.5V30"/>
<rect x="6" y="30" width="36" height="9" rx="2.5"/>
<path d="M13 30v9M35 30v9"/>`),

  // Rack 1 · Monitoração Áudio CBN (Marshall) — caixa de som + ondas
  svg(`<rect x="9" y="8" width="17" height="32" rx="3"/>
<circle cx="17.5" cy="15.5" r="2.4"/>
<circle cx="17.5" cy="28.5" r="6"/><circle cx="17.5" cy="28.5" r="1.8" fill="currentColor" stroke="none"/>
<path d="M31 19a7.5 7.5 0 0 1 0 10M35.5 15a14 14 0 0 1 0 18"/>`),

  // Rack 1 · Orban Titular — processador + selo de titular (check)
  svg(`<rect x="5" y="17" width="30" height="15" rx="3"/>
<circle cx="11" cy="24.5" r="2.6"/>
<path d="M16.5 24.5l2.4-3.4 2.8 6 2.4-4.4 2 1.8h3.4"/>
<circle cx="38" cy="12" r="7" fill="currentColor" fill-opacity=".14" stroke="none"/>
<circle cx="38" cy="12" r="7"/>
<path d="M35 12l2.2 2.2 4-4.4"/>`),

  // Rack 1 · Orban Reserva — processador + selo standby
  svg(`<rect x="5" y="19" width="30" height="15" rx="3"/>
<circle cx="11" cy="26.5" r="2.6"/>
<path d="M16.5 26.5l2.4-3.4 2.8 6 2.4-4.4 2 1.8h3.4"/>
<circle cx="38" cy="12" r="7" fill="currentColor" fill-opacity=".14" stroke="none"/>
<circle cx="38" cy="12" r="7"/>
<path d="M38 8.2v4"/><path d="M35.2 10.4a4.3 4.3 0 1 0 5.6 0"/>`),

  // Rack 2 · Rádios Ceragon — rádio + corneta irradiando
  svg(`<rect x="5" y="17" width="19" height="14" rx="3"/>
<path d="M9 21.5h6M9 26h4"/>
<path d="M24 20l10-6v20l-10-7z"/>
<path d="M38.5 16a12 12 0 0 1 0 16M36 20a7 7 0 0 1 0 8"/>`),

  // Rack 2 · Conversor ASI - IP — caixa com entrada e saída
  svg(`<rect x="14" y="14" width="20" height="20" rx="4" fill="currentColor" fill-opacity=".14" stroke="none"/>
<rect x="14" y="14" width="20" height="20" rx="4"/>
<rect x="20" y="20" width="8" height="8" rx="1.5"/>
<path d="M3 24h8M8.5 20.5 12 24l-3.5 3.5"/>
<path d="M37 24h8M41.5 20.5 45 24l-3.5 3.5"/>`),

  // Rack 2 · Switch MNG Ceragons — switch com portas + tráfego
  svg(`<rect x="5" y="19" width="38" height="14" rx="3"/>
<rect x="9.5" y="24" width="4.5" height="4.5" rx=".8"/>
<rect x="16.5" y="24" width="4.5" height="4.5" rx=".8"/>
<rect x="23.5" y="24" width="4.5" height="4.5" rx=".8"/>
<rect x="30.5" y="24" width="4.5" height="4.5" rx=".8"/>
<path d="M38.5 24.5v3.5"/>
<path d="M14 14V7M11 10l3-3 3 3"/>
<path d="M34 7v7M31 11l3 3 3-3"/>`),

  // Rack 3 · Monitor de Temperatura — termômetro
  svg(`<path d="M20.5 8a4 4 0 0 1 8 0v16.5a7.5 7.5 0 1 1-8 0z"/>
<circle cx="24.5" cy="31" r="3.2" fill="currentColor" stroke="none"/>
<path d="M24.5 27.5V17"/>
<path d="M33 11h5M33 17h3.5M33 23h5"/>`),

  // Rack 3 · Conversor ASI - SDI Tecsys — conversor com setas de troca
  svg(`<rect x="10" y="12" width="28" height="24" rx="5" fill="currentColor" fill-opacity=".14" stroke="none"/>
<rect x="10" y="12" width="28" height="24" rx="5"/>
<path d="M16 20h13M26 16.5 29.5 20 26 23.5"/>
<path d="M32 28H19M22 24.5 18.5 28l3.5 3.5"/>`),

  // Rack 3 · Computador NEC — desktop
  svg(`<rect x="8" y="8" width="32" height="21" rx="3"/>
<path d="M13 14h11M13 19h7"/>
<path d="M35 24.5h.01"/>
<path d="M24 29v5M15 38h18"/>`),

  // Rack 4 · MK2 (inspeção visual) — unidade com tela de forma de onda
  svg(`<rect x="5" y="14" width="38" height="20" rx="3"/>
<rect x="9" y="18" width="17" height="12" rx="1.5" fill="currentColor" fill-opacity=".14" stroke="none"/>
<rect x="9" y="18" width="17" height="12" rx="1.5"/>
<path d="M11.5 25l2.6-3 2.6 4.5 2.6-3.8 2.2 2.3h2"/>
<circle cx="34.5" cy="24" r="3"/>
<path d="M39.5 19.5h.01M39.5 24h.01M39.5 28.5h.01"/>`),

  // Rack 4 · Switchs (inspeção visual) — dois switches ligados
  svg(`<rect x="7" y="8" width="34" height="11" rx="2.5"/>
<rect x="7" y="29" width="34" height="11" rx="2.5"/>
<path d="M12 13.5h.01M16 13.5h.01M12 34.5h.01M16 34.5h.01"/>
<path d="M27 13.5h8M27 34.5h8"/>
<path d="M24 19v10"/>`),

  // Rack 4 · Monitores Marshall — dupla de monitores
  svg(`<rect x="5" y="11" width="17" height="13" rx="2"/>
<rect x="26" y="11" width="17" height="13" rx="2"/>
<path d="M8 18.5l2.2-2.6 2.2 3.6 2.2-2.6M29 18.5l2.2-2.6 2.2 3.6 2.2-2.6"/>
<path d="M13.5 24v4M34.5 24v4"/>
<path d="M6 32h36"/>`),

  // Rack 4 · Distribuidor Titular — um sinal para várias saídas
  svg(`<circle cx="9" cy="24" r="3"/>
<path d="M12 24h8"/>
<path d="M20 24c6 0 6-13 11-13h4.8M20 24h15.8M20 24c6 0 6 13 11 13h4.8"/>
<circle cx="38" cy="11" r="2.2"/><circle cx="38" cy="24" r="2.2"/><circle cx="38" cy="37" r="2.2"/>`),

  // Rack 5 · Monitores Bird (inspeção visual) — medidor analógico
  svg(`<path d="M8 33a16 16 0 0 1 32 0z" fill="currentColor" fill-opacity=".14" stroke="none"/>
<path d="M8 33a16 16 0 0 1 32 0"/>
<path d="M8 33h32"/>
<path d="M24 33l8.5-12"/>
<circle cx="24" cy="33" r="2.4" fill="currentColor" stroke="none"/>
<path d="M24 15.5v3.5M13 19.5l2.5 2.5M35 19.5l-2.5 2.5"/>
<path d="M10 39h28"/>`),

  // Rack 5 · Chave NEC — chave comutadora A/B
  svg(`<path d="M4 26h3.4"/>
<circle cx="10" cy="26" r="2.6"/>
<circle cx="34" cy="13" r="2.6"/>
<circle cx="34" cy="35" r="2.6"/>
<path d="M12.4 25 31.5 14.2"/>
<path d="M36.6 13H43M36.6 35H43"/>
<path d="M36 19a14 14 0 0 1 0 12" stroke-dasharray="1 4.5"/>`),

  // Rack 5 · Conversor NEC SDI HD — tela widescreen HD
  svg(`<rect x="6" y="10" width="36" height="22" rx="3"/>
<text x="24" y="25.5" text-anchor="middle" font-family="inherit" font-size="11" font-weight="800" fill="currentColor" stroke="none">HD</text>
<path d="M24 32v5M16 39h16"/>`),

  // Rack 5 · Conversor NEC SDI 1Seg — celular recebendo sinal
  svg(`<rect x="15" y="7" width="17" height="32" rx="4"/>
<path d="M20.5 11.5h6"/>
<text x="23.5" y="26" text-anchor="middle" font-family="inherit" font-size="7.5" font-weight="800" fill="currentColor" stroke="none">1SEG</text>
<path d="M23.5 34.5h.01"/>
<path d="M36 10a9 9 0 0 1 4.5 4.5M35 15.5a5 5 0 0 1 2.5 2.5"/>`),

  // Rack 6 · TX NEC 1 — transmissor no ar, selo 1
  svg(`<rect x="8" y="15" width="22" height="25" rx="3"/>
<path d="M8 22h22"/>
<circle cx="14.5" cy="31" r="2.6"/>
<path d="M21 29h5M21 34h5"/>
<path d="M19 15V6.5"/><circle cx="19" cy="5.4" r="1.5" fill="currentColor" stroke="none"/>
<path d="M24.5 8a7.5 7.5 0 0 1 3.5 3.5"/>
<circle cx="38" cy="31" r="7" fill="currentColor" fill-opacity=".14" stroke="none"/>
<circle cx="38" cy="31" r="7"/>
<text x="38" y="34.8" text-anchor="middle" font-family="inherit" font-size="10.5" font-weight="800" fill="currentColor" stroke="none">1</text>`),

  // Rack 6 · TX NEC 2 — transmissor, selo 2
  svg(`<rect x="8" y="15" width="22" height="25" rx="3"/>
<path d="M8 22h22"/>
<circle cx="14.5" cy="31" r="2.6"/>
<path d="M21 29h5M21 34h5"/>
<path d="M19 15V6.5"/><circle cx="19" cy="5.4" r="1.5" fill="currentColor" stroke="none"/>
<path d="M24.5 8a7.5 7.5 0 0 1 3.5 3.5"/>
<circle cx="38" cy="31" r="7" fill="currentColor" fill-opacity=".14" stroke="none"/>
<circle cx="38" cy="31" r="7"/>
<text x="38" y="34.8" text-anchor="middle" font-family="inherit" font-size="10.5" font-weight="800" fill="currentColor" stroke="none">2</text>`)
];

// Ícone genérico de rack — mantido por compatibilidade (fallback)
export const iconeRack = svg(
  `<rect x="8" y="7" width="32" height="34" rx="4"/><path d="M8 18h32M8 29h32"/><path d="M13 12.5h.01M13 23.5h.01M13 34.5h.01"/><path d="M20 12.5h13M20 23.5h13M20 34.5h13"/>`
);

// Retorna o ícone certo para o item: desenho próprio do P001 ou o do checklist padrão.
export function getIconeChecklist(item, index) {
  if (item && item.rack) return iconesRibeiraoPreto[index] || iconeRack;
  return checklistIcons[index] || iconeRack;
}
