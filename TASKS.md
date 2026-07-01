# Tarefas

## Encapsular o PWA em APK Android

Objetivo: gerar um APK Android a partir do PWA usando Capacitor.

Checklist:

- [ ] Confirmar login Firebase no celular com a senha inicial `123456`.
- [ ] Testar leitura de QR Code em navegador móvel.
- [ ] Rodar `npm install`.
- [x] Criar workflow GitHub Actions para gerar APK debug.
- [x] Adicionar permissões Android de câmera e localização no Manifest.
- [ ] Baixar o APK gerado na Release `apk-latest`.
- [ ] Instalar APK em celular Android.
- [ ] Validar permissões de câmera e geolocalização.
- [ ] Instalar APK em celular Android e validar fluxo completo.

Observações:

- O app usa Firebase Authentication e Firestore.
- Firebase Storage não está sendo usado nesta versão.
- Fotos ficam disponíveis apenas no histórico local do aparelho.
