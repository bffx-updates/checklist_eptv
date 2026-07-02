import { tecnicosBase } from "./data.js";
import { isFirebaseReady, login, observeUser } from "./firebase-service.js";
import { $, showToast } from "./ui.js";

const form = $("#login-form");
const password = $("#password");
const userSelect = $("#user-select");
const userPickerButton = $("#user-picker-button");
const userPickerMenu = $("#user-picker-menu");
const firebaseStatus = $("#firebase-status");
const nextUrl = getSafeNextUrl(new URLSearchParams(location.search).get("next"));

firebaseStatus.textContent = isFirebaseReady()
  ? "Senha inicial: 123456. Depois altere para sua senha pessoal."
  : "Modo local: senha inicial 123456.";

const loginUsers = [
  { nome: "Supervisor", email: "supervisor@postos.local" },
  ...tecnicosBase.map((tecnico) => ({ nome: tecnico.nome, email: tecnico.email }))
];

userPickerMenu.innerHTML = loginUsers
  .map(
    (user) => `
      <button class="user-picker__option" type="button" role="option" data-email="${user.email}">
        ${user.nome}
      </button>
    `
  )
  .join("");

selectLoginUser(loginUsers[0]);

userPickerButton.addEventListener("click", () => {
  const opened = userPickerMenu.hidden;
  userPickerMenu.hidden = !opened;
  userPickerButton.setAttribute("aria-expanded", String(opened));
});

userPickerMenu.addEventListener("click", (event) => {
  const option = event.target.closest("[data-email]");
  if (!option) return;
  const user = loginUsers.find((item) => item.email === option.dataset.email);
  selectLoginUser(user);
  userPickerMenu.hidden = true;
  userPickerButton.setAttribute("aria-expanded", "false");
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".user-picker")) return;
  userPickerMenu.hidden = true;
  userPickerButton.setAttribute("aria-expanded", "false");
});

function selectLoginUser(user) {
  userSelect.value = user.email;
  userPickerButton.textContent = user.nome;
  userPickerMenu.querySelectorAll("[data-email]").forEach((option) => {
    option.setAttribute("aria-selected", String(option.dataset.email === user.email));
  });
}

observeUser((user) => {
  if (user) location.href = nextUrl || "index.html";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  form.classList.add("is-loading");
  try {
    await login(userSelect.value, password.value);
    location.href = nextUrl || "index.html";
  } catch (error) {
    showToast(error.message || "Não foi possível entrar.", "error");
  } finally {
    form.classList.remove("is-loading");
  }
});

function getSafeNextUrl(value) {
  if (!value || value.startsWith("login.html")) return "";
  return /^[a-z0-9-]+\.html(?:\?.*)?$/i.test(value) ? value : "";
}
