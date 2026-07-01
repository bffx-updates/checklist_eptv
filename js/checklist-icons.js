// Ícones SVG das seções do checklist — traço 1.8, estilo linear, cor via currentColor
const svg = (content) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;

export const checklistIcons = [
  // 1. Energia elétrica e disjuntores — raio
  svg(`<path d="M13 2.5 5.5 13.5h5L9.5 21.5l9-11.5h-5.4L14.5 2.5z"/>`),

  // 2. No-break, baterias e autonomia — bateria com raio
  svg(`<rect x="2.5" y="7.5" width="17" height="9.5" rx="2"/><path d="M21.5 10.5v3.5"/><path d="M12.6 9.6l-2.4 3h2.8l-2 3"/>`),

  // 3. Equipamentos de transmissão — torre irradiando
  svg(`<circle cx="12" cy="7.6" r="1.6"/><path d="M12 9.4 8.4 21M12 9.4 15.6 21M9.6 17.4h4.8"/><path d="M7.8 4.2a6 6 0 0 0-1.6 3.4M16.2 4.2a6 6 0 0 1 1.6 3.4"/>`),

  // 4. Cabos, conectores e identificação — cabo com conector
  svg(`<path d="M2.5 19c4.5 0 4.5-5.5 8.5-5.5h2"/><rect x="13" y="10.5" width="6" height="6" rx="1.5"/><path d="M19.5 12h2M19.5 15h2"/>`),

  // 5. Antenas e apontamento visual — feixe direcional
  svg(`<g transform="rotate(45 12 12)"><circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none"/><path d="M8.6 14.6a5 5 0 0 1 6.8 0"/><path d="M5.6 11.6a9.2 9.2 0 0 1 12.8 0"/></g>`),

  // 6. Torre, estais e estrutura — mastro estaiado
  svg(`<path d="M12 3.5V21M12 7 5 21M12 7l7 14M3.5 21h17"/><path d="M12 12.5l-3.4 4.4M12 12.5l3.4 4.4"/>`),

  // 7. Aterramento e proteção contra surtos — símbolo de terra
  svg(`<path d="M12 3.5V12M6.5 12.5h11M8.6 16h6.8M10.7 19.5h2.6"/>`),

  // 8. Climatização e ventilação — floco / fluxo de ar
  svg(`<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path d="M9.6 5.6 12 8l2.4-2.4M9.6 18.4 12 16l2.4 2.4"/>`),

  // 9. Limpeza e organização do ambiente — brilhos
  svg(`<path d="M11 4.5l1.6 4.4 4.4 1.6-4.4 1.6L11 16.5l-1.6-4.4L5 10.5l4.4-1.6L11 4.5z"/><path d="M18 15.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z"/>`),

  // 10. Segurança física e acesso ao posto — escudo com fechadura
  svg(`<path d="M12 3l7 2.7v5.3c0 4.6-2.9 7.9-7 10-4.1-2.1-7-5.4-7-10V5.7L12 3z"/><circle cx="12" cy="10.3" r="1.7"/><path d="M12 12v3"/>`)
];
