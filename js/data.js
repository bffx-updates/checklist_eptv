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
  "Jaime Borges"
].map((nome) => ({
  nome,
  ativo: true,
  nivel: "tecnico",
  telefone: "",
  email: `${slugify(nome)}@postos.local`
}));

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
