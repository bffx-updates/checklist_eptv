# Tarefas

## Encapsular o PWA em APK Android

Objetivo: gerar um APK Android a partir do PWA usando Capacitor.

Checklist:

- [ ] Confirmar login Firebase no celular com a senha inicial `123456`.
- [ ] Testar leitura de QR Code em navegador móvel.
- [ ] Rodar `npm install`.
- [ ] Rodar `npm run cap:add:android` se a pasta `android/` ainda não existir.
- [ ] Rodar `npm run cap:sync`.
- [ ] Abrir no Android Studio com `npm run cap:open`.
- [ ] Validar permissões de câmera e geolocalização.
- [ ] Gerar APK de teste no Android Studio.
- [ ] Instalar APK em celular Android e validar fluxo completo.

Observações:

- O app usa Firebase Authentication e Firestore.
- Firebase Storage não está sendo usado nesta versão.
- Fotos ficam disponíveis apenas no histórico local do aparelho.
