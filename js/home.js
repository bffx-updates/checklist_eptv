import { bindShell, requireAuth, setText } from "./ui.js";

const { profile } = await requireAuth();
bindShell(profile);
setText("#home-user-name", profile?.nome || profile?.email || "");
