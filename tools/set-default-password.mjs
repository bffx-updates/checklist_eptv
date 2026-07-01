import { firebaseConfig } from "../firebase-config.js";
import { tecnicosBase } from "../js/data.js";

const OLD_PASSWORDS = ["123456", "Checklist1234", "Inspecao@2026"];
const DEFAULT_PASSWORD = "123456";
const users = [
  { nome: "Supervisor", email: "supervisor@postos.local" },
  ...tecnicosBase.map(({ nome, email }) => ({ nome, email }))
];

for (const user of users) {
  try {
    const idToken = await signInWithAnyKnownPassword(user.email);
    await updatePassword(idToken, DEFAULT_PASSWORD);
    console.log(`Senha inicial ajustada: ${user.nome} <${user.email}>`);
  } catch (error) {
    console.error(`Erro em ${user.nome} <${user.email}>: ${error.message}`);
    process.exitCode = 1;
  }
}

async function signInWithAnyKnownPassword(email) {
  let lastError = null;
  for (const password of OLD_PASSWORDS) {
    try {
      return await signIn(email, password);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Não foi possível autenticar.");
}

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
    throw new Error(result.error?.message || response.statusText);
  }
  return result.idToken;
}

async function updatePassword(idToken, password) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${firebaseConfig.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, password, returnSecureToken: true })
    }
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || response.statusText);
  }
}
