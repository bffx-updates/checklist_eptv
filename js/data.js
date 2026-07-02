export const POSTO_RIBEIRAO_PRETO = "P001";
export const TECNICOS_NIVEL_1 = [
  "Rafael Pedro",
  "Luiz Bueno",
  "Ederson Matias",
  "Vinicius Felix"
];

const tecnicosNivel1Slugs = new Set(TECNICOS_NIVEL_1.map(slugify));

export const tecnicosBase = [
  "Carlos Dalsin",
  "Rhony Sobrani",
  "Jorge Lemes",
  "João Abrantes",
  "Robison Arruda",
  "Marcus Candido",
  "Marcus Felix",
  "Luiz Bueno",
  "Ederson Matias",
  "Rafael Pedro",
  "Vinicius Felix",
  "Jaime Borges"
].map((nome) => {
  const nivel = isTecnicoNivel1({ nome }) ? "nivel1" : "nivel2";
  return {
    nome,
    ativo: true,
    nivel,
    postosPermitidos: nivel === "nivel1" ? [POSTO_RIBEIRAO_PRETO] : ["*"],
    telefone: "",
    email: `${slugify(nome)}@postos.local`
  };
});

export const postosBase = [
  ["P001", "Ribeirão Preto"],
  ["P002", "Altinópolis"],
  ["P003", "Barretos"],
  ["P004", "Barrinha"],
  ["P005", "Batatais"],
  ["P006", "Bebedouro"],
  ["P007", "Buritizal"],
  ["P008", "Cajuru"],
  ["P009", "Colômbia"],
  ["P010", "Cravinhos"],
  ["P011", "Fernando Prestes"],
  ["P012", "Franca"],
  ["P013", "Guaíra"],
  ["P014", "Guariba"],
  ["P015", "Igarapava"],
  ["P016", "Ipuã"],
  ["P017", "Ituverava"],
  ["P018", "Miguelópolis"],
  ["P019", "Monte Alto"],
  ["P020", "Monte Azul Paulista"],
  ["P021", "Orlândia"],
  ["P022", "Patrocínio Paulista"],
  ["P023", "Pirangi"],
  ["P024", "Rifaina"],
  ["P025", "Santo Antônio da Alegria"],
  ["P026", "São Joaquim da Barra"],
  ["P027", "Sertãozinho"],
  ["P028", "Taiúva"],
  ["P029", "Taquaritinga"],
  ["P030", "Terra Roxa"],
  ["P031", "Viradouro"],
  ["P032", "Jaboticabal"],
  ["P033", "Santa Rita do Passa Quatro"],
  ["P034", "Mococa"]
].map(([codigo, nome]) => ({
  codigo,
  nome,
  cidade: nome,
  endereco: "",
  latitude: null,
  longitude: null,
  ativo: true
}));

export const checklistBase = [
  "Energia elétrica e disjuntores",
  "No-break, baterias e autonomia",
  "Equipamentos de transmissão",
  "Cabos, conectores e identificação",
  "Antenas e apontamento visual",
  "Torre, estais e estrutura",
  "Aterramento e proteção contra surtos",
  "Climatização e ventilação",
  "Limpeza e organização do ambiente",
  "Segurança física e acesso ao posto"
];

export function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "");
}

export function isSupervisorProfile(profile) {
  return profile?.nivel === "supervisor";
}

export function isTecnicoNivel1(tecnico) {
  const nomeSlug = slugify(tecnico?.nome || tecnico?.displayName || "");
  const emailSlug = slugify(String(tecnico?.email || "").replace(/@.*/, ""));
  return tecnicosNivel1Slugs.has(nomeSlug) || tecnicosNivel1Slugs.has(emailSlug);
}

export function resolveTecnicoNivel(tecnico) {
  if (isSupervisorProfile(tecnico)) return "supervisor";
  if (isTecnicoNivel1(tecnico)) return "nivel1";
  if (tecnico?.nivel === "nivel1") return "nivel1";
  return "nivel2";
}

export function withAccessProfile(profile) {
  if (!profile) return null;
  const nivel = resolveTecnicoNivel(profile);
  if (nivel === "supervisor") return { ...profile, nivel };
  return {
    ...profile,
    nivel,
    postosPermitidos: nivel === "nivel1" ? [POSTO_RIBEIRAO_PRETO] : ["*"]
  };
}

export function canAccessPosto(profile, postoOrCodigo) {
  const codigo = typeof postoOrCodigo === "string" ? postoOrCodigo : postoOrCodigo?.codigo;
  if (!codigo) return false;
  const accessProfile = withAccessProfile(profile);
  if (isSupervisorProfile(accessProfile)) return true;
  if (accessProfile?.nivel === "nivel1") return codigo === POSTO_RIBEIRAO_PRETO;
  return accessProfile?.nivel === "nivel2";
}

export function filterPostosByAccess(postos, profile) {
  return postos.filter((posto) => canAccessPosto(profile, posto));
}

export function isTecnicoProfile(profile) {
  const nivel = resolveTecnicoNivel(profile);
  return nivel === "nivel1" || nivel === "nivel2";
}
