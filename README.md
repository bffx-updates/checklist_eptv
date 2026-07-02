# Sistema de Inspeção Técnica de Postos

Primeira versão em HTML, CSS e JavaScript ES6, com PWA, fluxo offline e integração preparada para Firebase Authentication e Firestore.

## Rodar localmente

```powershell
npm install
npm run serve
```

Abra `http://localhost:4173/login.html`.

Sem `firebase-config.js` preenchido, o sistema roda em modo local. Use a lista de usuários da tela de login e a senha inicial:

```text
123456
```

- `Supervisor` para acessar configurações no app e o dashboard por URL direta
- qualquer técnico da lista para acessar o fluxo de campo

## Níveis de acesso dos técnicos

- `nivel1`: acessa apenas o posto `P001 - Ribeirão Preto`
- `nivel2`: acessa todos os postos, inclusive `P001 - Ribeirão Preto`

Técnicos de `nivel1`:

- Rafael Pedro
- Luiz Bueno
- Ederson Matias
- Vinicius Felix

Os demais técnicos são `nivel2`. Depois de alterar a lista de técnicos ou níveis, entre como supervisor e use `Configurações > Cadastrar postos e técnicos`, ou rode `npm run firebase:seed`, para atualizar os documentos no Firestore.

## Fluxo do app

1. Depois do login, o técnico toca em `Iniciar`.
2. O app abre o leitor de QR Code para identificar o posto.
3. A tela do posto mostra os dados do local e o histórico recente registrado por técnicos.
4. O técnico escolhe `Chamado` para registrar motivo da ocorrência e solução, ou `Preventiva` para preencher o checklist.
5. Ao final do Chamado ou da Preventiva, o técnico marca Verde, Amarelo ou Vermelho e deixa uma descrição para o supervisor.

## Configurar Firebase

Projeto Firebase vinculado:

```text
Nome: Cheklist
ID: cheklist-ecb1a
Número: 615335752323
```

1. Crie ou abra o projeto `cheklist-ecb1a` no Firebase.
2. Ative Authentication com e-mail e senha.
3. Ative Firestore Database.
4. Crie um app Web e copie `apiKey` e `appId` para `firebase-config.js`.
5. Publique `firestore.rules` pelo Console ou pelo comando `npm run firebase:deploy:rules`.
6. Crie as contas no Firebase Authentication usando os e-mails internos cadastrados em `js/data.js`.
   - Use a senha inicial `123456`.
7. Entre como supervisor e use `Configurações > Cadastrar postos e técnicos`.

As fotos não são enviadas para Firebase Storage nesta versão. Elas ficam disponíveis no histórico local do aparelho que fez a inspeção; o Firestore recebe apenas os metadados da visita e das fotos.

Para usar a Firebase CLI:

```powershell
npm run firebase:login
npm run firebase:deploy:rules
```

Na tela de login o técnico escolhe apenas o nome e digita a senha pessoal. O e-mail continua existindo somente como identificador interno do Firebase Authentication. Depois do primeiro acesso, o técnico pode entrar em `Alterar senha` e trocar a senha inicial.

Para produção, prefira criar o documento do técnico com o mesmo UID do usuário do Firebase Authentication. O app também tenta localizar o perfil pelo campo `email`, mas as regras de segurança ficam mais fortes quando o documento usa o UID.

## Gerar APK com Capacitor

```powershell
npm install
npm run cap:add:android
npm run cap:sync
npm run cap:open
```

No Android Studio, gere o APK pelo menu de build.

Também há um workflow do GitHub Actions que gera o APK debug automaticamente ao publicar na branch `main`.
O APK fica disponível em `Releases > APK de teste`.

O APK carrega a versão web publicada em GitHub Pages:

```text
https://bffx-updates.github.io/checklist_eptv/login.html
```

O dashboard não fica na navegação do app. Ele é publicado como página HTML separada no GitHub Pages:

```text
https://bffx-updates.github.io/checklist_eptv/dashboard.html
```

Com isso, alterações de tela, CSS e JavaScript publicadas na branch `main` atualizam o app instalado sem precisar reinstalar o APK. Só será necessário instalar um novo APK quando mudar algo nativo, como permissões, pacote Android ou plugins Capacitor.

Se o login web publicado no GitHub Pages for usado fora do APK, adicione `bffx-updates.github.io` aos domínios autorizados do Firebase Authentication.

## Gerar QR Codes

Cada QR Code deve conter apenas o código do posto, por exemplo `P001`.

```powershell
npm run qrcode:generate
```

Os arquivos serão gerados em:

- `qrcodes/svg/`: QR Codes individuais
- `qrcodes/print.html`: página pronta para imprimir etiquetas
- `qrcodes/lista-qrcodes.csv`: lista de conferência

## Estrutura

- `login.html`: autenticação
- `index.html`: início do técnico/supervisor
- `scanner.html`: leitura do QR Code ou digitação manual
- `posto.html`: ficha do posto
- `chamado.html`: registro de ocorrência e solução
- `checklist.html`: inspeção, fotos, GPS e observações
- `historico.html`: visitas do técnico ou gerais para supervisor
- `senha.html`: alteração de senha do usuário autenticado
- `dashboard.html`: página HTML separada do app para supervisão e filtros via GitHub Pages
- `configuracoes.html`: carga inicial e sincronização
