import { changeCurrentPassword, isFirebaseReady, SENHA_PADRAO_INICIAL } from "./firebase-service.js";
import { $, bindShell, requireAuth, setText, showToast } from "./ui.js";

const { profile } = await requireAuth();
bindShell(profile);

const form = $("#password-form");
setText(
  "#password-note",
  isFirebaseReady()
    ? `Senha inicial: ${SENHA_PADRAO_INICIAL}. Depois defina sua nova senha pessoal.`
    : `Modo local: a senha inicial é ${SENHA_PADRAO_INICIAL}.`
);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword.length < 6) {
    showToast("A nova senha deve ter pelo menos 6 caracteres.", "error");
    return;
  }
  if (newPassword !== confirmPassword) {
    showToast("A confirmação não confere com a nova senha.", "error");
    return;
  }

  form.classList.add("is-loading");
  try {
    await changeCurrentPassword(currentPassword, newPassword);
    form.reset();
    showToast("Senha alterada com sucesso.", "success");
  } catch (error) {
    showToast(error.message || "Não foi possível alterar a senha.", "error");
  } finally {
    form.classList.remove("is-loading");
  }
});
