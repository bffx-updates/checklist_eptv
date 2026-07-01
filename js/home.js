import { listPostos, listTecnicos, listVisitas } from "./firebase-service.js";
import { bindShell, requireAuth, setText } from "./ui.js";

const { profile } = await requireAuth();
bindShell(profile);

const [postos, tecnicos, visitas] = await Promise.all([
  listPostos(),
  listTecnicos(),
  listVisitas(profile.nivel === "supervisor" ? {} : { tecnicoEmail: profile.email })
]);

const today = new Date().toISOString().slice(0, 10);
const visitasHoje = visitas.filter((visita) => visita.data === today);
const visitados = new Set(visitasHoje.map((visita) => visita.posto?.codigo));

setText("#total-postos", postos.length);
setText("#total-tecnicos", tecnicos.filter((tecnico) => tecnico.ativo && tecnico.nivel === "tecnico").length);
setText("#visitas-hoje", visitasHoje.length);
setText("#postos-pendentes", Math.max(0, postos.length - visitados.size));
