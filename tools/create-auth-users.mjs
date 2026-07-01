import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  initializeAuth
} from "firebase/auth";
import { firebaseConfig } from "../firebase-config.js";
import { tecnicosBase } from "../js/data.js";

const DEFAULT_PASSWORD = "123456";
const users = [
  { nome: "Supervisor", email: "supervisor@postos.local" },
  ...tecnicosBase.map(({ nome, email }) => ({ nome, email }))
];

const app = initializeApp(firebaseConfig, `setup-${Date.now()}`);
const auth = initializeAuth(app);

for (const user of users) {
  try {
    await createUserWithEmailAndPassword(auth, user.email, DEFAULT_PASSWORD);
    console.log(`Criado: ${user.nome} <${user.email}>`);
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      console.log(`Já existe: ${user.nome} <${user.email}>`);
      continue;
    }
    console.error(`Erro em ${user.nome} <${user.email}>: ${error.code || error.message}`);
    process.exitCode = 1;
  }
}

await deleteApp(app);
