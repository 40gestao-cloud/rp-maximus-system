# RH Maximus — Sistema de Gestão de Pessoas

Sistema de controle de ponto e check-in por código diário.
Funciona como **PWA** — pode ser instalado como aplicativo no Android e iOS diretamente pelo navegador, sem precisar da Play Store ou App Store.

---

## 🐛 Erros corrigidos nesta versão

| # | Problema | Correção |
|---|----------|----------|
| 1 | `break` e `return` são palavras reservadas do JS usadas como chaves de objeto | Renomeadas para `intervalo` e `retorno` em `CHECKPOINTS` e em todos os acessos (`r.intervalo`, `r.retorno`) |
| 2 | `catch` vazios — erros do Firebase eram silenciosos | Todos os `catch` agora exibem mensagem de erro na tela |
| 3 | Tela branca caso o Firebase falhe ao carregar | Adicionada tela de erro com botão "Tentar novamente" |
| 4 | `saveRec` não mostrava feedback de loading ao colaborador | Adicionado estado `saving` com botão desabilitado durante o salvamento |
| 5 | Falta de suporte a PWA (instalação como app) | Adicionado `vite-plugin-pwa` com manifest completo |
| 6 | `index.html` sem meta tags PWA para iOS/Android | Adicionados `apple-mobile-web-app-capable`, `theme-color`, `manifest` |
| 7 | Admin não conseguia corrigir um registro errado | Adicionado botão ✕ na tela de Frequência para limpar registros |

---

## 📁 Estrutura do Projeto

```
rh-maximus/
├── index.html             ← com meta tags PWA
├── package.json           ← inclui vite-plugin-pwa
├── vite.config.js         ← configuração PWA
├── firebase.json          ← Firebase Hosting
├── .gitignore
├── public/
│   ├── icon-192.png       ← ícone do app (você deve criar)
│   └── icon-512.png       ← ícone do app (você deve criar)
└── src/
    ├── main.jsx
    ├── App.jsx            ← aplicação corrigida
    └── firebase.js        ← configuração do Firebase
```

---

## 🔥 Passo 1 — Verificar / Criar o Projeto Firebase

1. Acesse [https://console.firebase.google.com](https://console.firebase.google.com)
2. Selecione o projeto **rh-maximus** (ou crie um novo)
3. Vá em **Firestore Database** → confirme que o banco existe
4. Vá em **Firestore → Regras** e configure:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gpmax/{document} {
      allow read, write: if true;
    }
  }
}
```

5. Clique em **Publicar**

> ⚠️ Estas regras permitem acesso aberto. Para produção, adicione autenticação.

---

## 🔑 Verificar a API Key do Firebase

A API key original tinha 40 caracteres — as chaves do Firebase têm 39.
O arquivo `src/firebase.js` já está corrigido. Se você criar um projeto novo, copie o `firebaseConfig` completo do console:

**Configurações do projeto → Seus aplicativos → `</>` (Web) → Configuração do SDK**

---

## 🖼️ Passo 2 — Criar os Ícones do App

Para o PWA funcionar, crie dois arquivos PNG e coloque-os na pasta `public/`:

- `public/icon-192.png` — 192×192 pixels
- `public/icon-512.png` — 512×512 pixels

Você pode usar o logo da empresa ou criar um ícone simples com o texto "GP".
Sites gratuitos: [favicon.io](https://favicon.io) ou [realfavicongenerator.net](https://realfavicongenerator.net)

---

## 💻 Passo 3 — Instalar e Rodar Localmente

```bash
# Instalar dependências (inclui vite-plugin-pwa)
npm install

# Rodar em desenvolvimento
npm run dev
```

Acesse: `http://localhost:5173`

> O PWA só funciona completamente após o build e deploy (não no modo dev).

---

## 🚀 Passo 4 — Deploy no Firebase Hosting

```bash
# Build de produção
npm run build

# Instalar Firebase CLI (só na primeira vez)
npm install -g firebase-tools

# Login
firebase login

# Inicializar (só na primeira vez)
firebase init hosting
# → Use an existing project → rh-maximus
# → Public directory: dist
# → Single-page app: Yes
# → Overwrite dist/index.html: No

# Deploy
firebase deploy
```

Você receberá uma URL pública: `https://rh-maximus.web.app`

---

## 📱 Passo 5 — Instalar como App no Celular

### Android (Chrome)
1. Abra a URL do app no Chrome
2. Toque no menu (⋮) → **"Adicionar à tela inicial"** ou aguarde o banner aparecer automaticamente
3. Confirme — o app aparecerá na tela inicial como qualquer outro aplicativo

### iPhone / iPad (Safari)
1. Abra a URL no Safari (obrigatório — Chrome no iOS não suporta PWA)
2. Toque no ícone de compartilhar (□↑)
3. Role e toque em **"Adicionar à Tela de Início"**
4. Confirme

---

## 🔑 Credenciais de Admin

| Login    | Senha       | Cargo                    |
|----------|-------------|--------------------------|
| Chairman | 03315077    | Chairman                 |
| CEO      | lolic0778   | CEO                      |
| Agnus    | A03Maximus  | Gerente de GP / RH & DP  |

---

## ❓ Problemas comuns

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| Tela de erro "Erro de conexão com Firebase" | API key errada ou regras do Firestore bloqueando | Verifique `src/firebase.js` e as regras do Firestore |
| Colaborador não consegue fazer check-in | Código do dia não gerado | Admin deve ir ao Dashboard e clicar "Gerar Código do Dia" |
| App não aparece opção de instalar no iPhone | Está usando Chrome no iPhone | Use o Safari |
| Ícone não aparece ao instalar | Arquivos de ícone ausentes | Coloque `icon-192.png` e `icon-512.png` em `/public/` |
