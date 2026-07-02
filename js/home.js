import { bindShell, requireAuth } from "./ui.js";

const { profile } = await requireAuth();
bindShell(profile);
