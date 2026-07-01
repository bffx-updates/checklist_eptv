import { firebaseConfig } from "../firebase-config.js";
import { postosBase, slugify, tecnicosBase } from "../js/data.js";

const SUPERVISOR_EMAIL = "supervisor@postos.local";
const DEFAULT_PASSWORD = "123456";
const DATABASE = "(default)";

const { idToken, localId } = await signIn(SUPERVISOR_EMAIL, DEFAULT_PASSWORD);

for (const posto of postosBase) {
  await putDocument("postos", posto.codigo, posto, idToken);
}

for (const tecnico of tecnicosBase) {
  await putDocument("tecnicos", slugify(tecnico.nome), tecnico, idToken);
}

await putDocument(
  "tecnicos",
  localId,
  {
    nome: "Supervisor",
    ativo: true,
    nivel: "supervisor",
    telefone: "",
    email: SUPERVISOR_EMAIL
  },
  idToken
);

await deleteDocument("tecnicos", "supervisor", idToken);

console.log(`Firestore carregado: ${postosBase.length} postos, ${tecnicosBase.length} técnicos e 1 supervisor.`);

async function signIn(email, password) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    }
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Falha no login: ${result.error?.message || response.statusText}`);
  }
  return { idToken: result.idToken, localId: result.localId };
}

async function putDocument(collection, id, data, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${DATABASE}/documents/${collection}/${id}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) })
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Falha ao gravar ${collection}/${id}: ${result.error?.message || response.statusText}`);
  }
}

async function deleteDocument(collection, id, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${DATABASE}/documents/${collection}/${id}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${idToken}`
    }
  });

  if (!response.ok && response.status !== 404) {
    const result = await response.json();
    throw new Error(`Falha ao apagar ${collection}/${id}: ${result.error?.message || response.statusText}`);
  }
}

function toFirestoreFields(data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)]));
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === "number") return { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  return { mapValue: { fields: toFirestoreFields(value) } };
}
