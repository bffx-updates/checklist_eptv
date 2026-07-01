import { firebaseConfig, firebaseIsConfigured } from "../firebase-config.js";
import { postosBase, tecnicosBase, slugify } from "./data.js";
import {
  listLocalHistory,
  listPendingVisits,
  removePendingVisit,
  saveLocalHistory,
  savePendingVisit
} from "./local-db.js";

let app = null;
let auth = null;
let db = null;
let firebaseModules = null;

const LOCAL_USER_KEY = "inspecao.localUser";
const LOCAL_PASSWORDS_KEY = "inspecao.localPasswords";
export const SENHA_PADRAO_INICIAL = "123456";

async function ensureFirebase() {
  if (!firebaseIsConfigured) {
    throw new Error("Firebase não configurado.");
  }

  if (app && firebaseModules) return firebaseModules;

  const [appModule, authModule, firestoreModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
  ]);

  app = appModule.initializeApp(firebaseConfig);
  auth = authModule.getAuth(app);
  db = firestoreModule.getFirestore(app);
  firebaseModules = { appModule, authModule, firestoreModule };
  return firebaseModules;
}

export function isFirebaseReady() {
  return firebaseIsConfigured;
}

export async function login(email, password) {
  if (firebaseIsConfigured) {
    const { authModule } = await ensureFirebase();
    const credential = await authModule.signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  }

  const expectedPassword = getLocalPassword(email);
  if (password !== expectedPassword) {
    throw new Error("Senha inválida.");
  }

  const tecnico = tecnicosBase.find((item) => item.email === email);
  const localUser =
    email === "supervisor@postos.local"
      ? { uid: "local-supervisor", email, displayName: "Supervisor", nivel: "supervisor" }
      : {
          uid: `local-${slugify(tecnico?.nome || email)}`,
          email,
          displayName: tecnico?.nome || email,
          nivel: "tecnico"
        };

  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
  return localUser;
}

export async function changeCurrentPassword(currentPassword, newPassword) {
  if (firebaseIsConfigured) {
    const { authModule } = await ensureFirebase();
    const user = auth.currentUser;
    if (!user?.email) {
      throw new Error("Usuário não autenticado.");
    }

    const credential = authModule.EmailAuthProvider.credential(user.email, currentPassword);
    await authModule.reauthenticateWithCredential(user, credential);
    await authModule.updatePassword(user, newPassword);
    return;
  }

  const user = getLocalUser();
  if (!user?.email) {
    throw new Error("Usuário não autenticado.");
  }
  if (currentPassword !== getLocalPassword(user.email)) {
    throw new Error("Senha atual inválida.");
  }

  const passwords = getLocalPasswords();
  passwords[user.email] = newPassword;
  localStorage.setItem(LOCAL_PASSWORDS_KEY, JSON.stringify(passwords));
}

export async function logout() {
  if (firebaseIsConfigured) {
    const { authModule } = await ensureFirebase();
    return authModule.signOut(auth);
  }
  localStorage.removeItem(LOCAL_USER_KEY);
}

export function observeUser(callback) {
  if (firebaseIsConfigured) {
    let unsubscribe = () => {};
    ensureFirebase()
      .then(({ authModule }) => {
        unsubscribe = authModule.onAuthStateChanged(auth, callback);
      })
      .catch(() => callback(null));
    return () => unsubscribe();
  }
  callback(getLocalUser());
  return () => {};
}

export function getLocalUser() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USER_KEY));
  } catch {
    return null;
  }
}

function getLocalPassword(email) {
  return getLocalPasswords()[email] || SENHA_PADRAO_INICIAL;
}

function getLocalPasswords() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PASSWORDS_KEY)) || {};
  } catch {
    return {};
  }
}

export async function getCurrentProfile(user) {
  if (!user) return null;

  if (!firebaseIsConfigured) {
    return {
      uid: user.uid,
      nome: user.displayName || user.email,
      email: user.email,
      nivel: user.nivel || "tecnico",
      ativo: true
    };
  }

  const { firestoreModule } = await ensureFirebase();
  const { collection, doc, getDoc, getDocs, limit, query, where } = firestoreModule;
  const direct = await getDoc(doc(db, "tecnicos", user.uid));
  if (direct.exists()) {
    return { uid: user.uid, ...direct.data() };
  }

  const result = await getDocs(query(collection(db, "tecnicos"), where("email", "==", user.email), limit(1)));
  if (!result.empty) {
    const first = result.docs[0];
    return { uid: user.uid, id: first.id, ...first.data() };
  }

  return {
    uid: user.uid,
    nome: user.displayName || user.email,
    email: user.email,
    nivel: user.email === "supervisor@postos.local" ? "supervisor" : "tecnico",
    ativo: true
  };
}

export async function getPosto(codigo) {
  const normalized = String(codigo || "").trim().toUpperCase();
  if (!normalized) return null;

  if (firebaseIsConfigured) {
    try {
      const { firestoreModule } = await ensureFirebase();
      const { doc, getDoc } = firestoreModule;
      const snapshot = await getDoc(doc(db, "postos", normalized));
      if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() };
    } catch {
      // Fallback local mantém o fluxo de campo disponível sem conexão.
    }
  }

  return postosBase.find((posto) => posto.codigo === normalized) || null;
}

export async function listPostos() {
  if (firebaseIsConfigured) {
    try {
      const { firestoreModule } = await ensureFirebase();
      const { collection, getDocs, orderBy, query } = firestoreModule;
      const snapshot = await getDocs(query(collection(db, "postos"), orderBy("codigo")));
      return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    } catch {
      return postosBase;
    }
  }
  return postosBase;
}

export async function listTecnicos() {
  if (firebaseIsConfigured) {
    try {
      const { firestoreModule } = await ensureFirebase();
      const { collection, getDocs, orderBy, query } = firestoreModule;
      const snapshot = await getDocs(query(collection(db, "tecnicos"), orderBy("nome")));
      return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    } catch {
      return tecnicosBase;
    }
  }
  return tecnicosBase;
}

export async function seedInitialData() {
  if (!firebaseIsConfigured) {
    throw new Error("Configure o Firebase antes de cadastrar os dados iniciais.");
  }

  const { firestoreModule } = await ensureFirebase();
  const { doc, setDoc } = firestoreModule;

  await Promise.all(
    postosBase.map((posto) => setDoc(doc(db, "postos", posto.codigo), posto, { merge: true }))
  );

  await Promise.all(
    tecnicosBase.map((tecnico) =>
      setDoc(doc(db, "tecnicos", slugify(tecnico.nome)), tecnico, { merge: true })
    )
  );

  await setDoc(
    doc(db, "tecnicos", auth.currentUser?.uid || "supervisor"),
    {
      nome: "Supervisor",
      ativo: true,
      nivel: "supervisor",
      telefone: "",
      email: "supervisor@postos.local"
    },
    { merge: true }
  );
}

export async function saveVisita(visit) {
  const enriched = {
    ...visit,
    localId: visit.localId || crypto.randomUUID(),
    createdLocalAt: new Date().toISOString()
  };

  if (!firebaseIsConfigured || !navigator.onLine) {
    const pending = await savePendingVisit(enriched);
    await saveLocalHistory({ ...pending, status: "pendente" });
    return { status: "pendente", visita: pending };
  }

  try {
    const sent = await sendVisitToFirebase(enriched);
    await saveLocalHistory({ ...sent, status: "enviada" });
    return { status: "enviada", visita: sent };
  } catch (error) {
    const pending = await savePendingVisit({ ...enriched, lastError: error.message });
    await saveLocalHistory({ ...pending, status: "pendente" });
    return { status: "pendente", visita: pending };
  }
}

async function sendVisitToFirebase(visit) {
  const { firestoreModule } = await ensureFirebase();
  const { addDoc, collection, serverTimestamp } = firestoreModule;
  const fotosMetadata = (visit.fotos || []).map((foto, index) => ({
    nome: foto.nome || `foto-${index + 1}.jpg`,
    type: foto.type || "image/jpeg",
    localOnly: true
  }));

  const payload = {
    posto: visit.posto,
    tecnico: visit.tecnico,
    data: visit.data,
    hora: visit.hora,
    gps: visit.gps || null,
    observacoes: visit.observacoes || "",
    checklist: visit.checklist || [],
    fotos: fotosMetadata,
    fotosLocalOnly: true,
    createdAt: serverTimestamp(),
    status: "enviada"
  };

  const docRef = await addDoc(collection(db, "visitas"), payload);
  return { ...payload, fotos: visit.fotos || [], id: docRef.id, localId: visit.localId };
}

export async function syncPendingVisits() {
  if (!firebaseIsConfigured || !navigator.onLine) {
    return { sent: 0, pending: (await listPendingVisits()).length };
  }

  const pending = await listPendingVisits();
  let sent = 0;

  for (const visit of pending) {
    try {
      const result = await sendVisitToFirebase(visit);
      await saveLocalHistory({ ...result, status: "enviada" });
      await removePendingVisit(visit.localId);
      sent += 1;
    } catch (error) {
      await savePendingVisit({ ...visit, lastError: error.message });
    }
  }

  return { sent, pending: (await listPendingVisits()).length };
}

export async function listVisitas(filters = {}) {
  let visitas = [];

  if (firebaseIsConfigured) {
    try {
      const { firestoreModule } = await ensureFirebase();
      const { collection, getDocs, limit, orderBy, query } = firestoreModule;
      const snapshot = await getDocs(query(collection(db, "visitas"), orderBy("createdAt", "desc"), limit(300)));
      visitas = snapshot.docs.map((item) => ({ id: item.id, ...item.data(), status: item.data().status || "enviada" }));
    } catch {
      visitas = await listLocalHistory();
    }
  } else {
    visitas = await listLocalHistory();
  }

  const pending = await listPendingVisits();
  const merged = mergeByLocalId([...visitas, ...pending.map((item) => ({ ...item, status: "pendente" }))]);
  return applyVisitFilters(merged, filters).sort((a, b) => `${b.data || ""}${b.hora || ""}`.localeCompare(`${a.data || ""}${a.hora || ""}`));
}

function mergeByLocalId(visitas) {
  const map = new Map();
  for (const visita of visitas) {
    const key = visita.id || visita.localId;
    map.set(key, { ...map.get(key), ...visita });
  }
  return [...map.values()];
}

function applyVisitFilters(visitas, filters) {
  return visitas.filter((visita) => {
    if (filters.tecnicoEmail && visita.tecnico?.email !== filters.tecnicoEmail) return false;
    if (filters.posto && visita.posto?.codigo !== filters.posto) return false;
    if (filters.tecnico && !visita.tecnico?.nome?.toLowerCase().includes(filters.tecnico.toLowerCase())) return false;
    if (filters.cidade && !visita.posto?.cidade?.toLowerCase().includes(filters.cidade.toLowerCase())) return false;
    if (filters.data && visita.data !== filters.data) return false;
    if (filters.status && visita.status !== filters.status) return false;
    return true;
  });
}

window.addEventListener("online", () => {
  syncPendingVisits().catch(() => {});
});
