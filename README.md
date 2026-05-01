# GP Maximus — Sistema de Gestão de Pessoas

Sistema de controle de frequência e check-in por código diário.

---

## 📁 Estrutura do Projeto

```
gp-maximus/
├── index.html
├── package.json
├── vite.config.js
├── firebase.json          ← configuração do Firebase Hosting
├── .gitignore
└── src/
    ├── main.jsx           ← entrada React
    ├── App.jsx            ← aplicação completa
    └── firebase.js        ← configuração do Firebase (EDITAR AQUI)
```

---

## 🔥 Passo 1 — Criar o Projeto no Firebase

1. Acesse [https://console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"** e dê um nome (ex: `gp-maximus`)
3. No menu lateral, vá em **Firestore Database** → **Criar banco de dados**
   - Escolha **modo de produção**
   - Selecione uma região (ex: `southamerica-east1`)
4. Vá em **Configurações do projeto** (ícone de engrenagem) → **Seus aplicativos** → **`</>`** (Web)
   - Registre o app e copie o objeto `firebaseConfig`

5. Cole os valores no arquivo `src/firebase.js`:

```js
const firebaseConfig = {
  apiKey:            "SUA_API_KEY",
  authDomain:        "SEU_PROJETO.firebaseapp.com",
  projectId:         "SEU_PROJETO_ID",
  storageBucket:     "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId:             "SEU_APP_ID",
};
```

6. **Regras do Firestore** — No console do Firebase, vá em **Firestore → Regras** e cole:

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

> ⚠️ Estas regras permitem acesso aberto. Para produção, implemente autenticação.

---

## 💻 Passo 2 — Instalar e Rodar Localmente

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

Acesse: `http://localhost:5173`

---

## 🚀 Passo 3 — Publicar no GitHub

```bash
git init
git add .
git commit -m "feat: GP Maximus com Firebase Firestore"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/gp-maximus.git
git push -u origin main
```

---

## ☁️ Passo 4 — Deploy no Firebase Hosting

```bash
# Instalar Firebase CLI (só na primeira vez)
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar o projeto (só na primeira vez)
firebase init hosting
# → Use an existing project → selecione seu projeto
# → Public directory: dist
# → Single-page app: Yes
# → Overwrite index.html: No

# Build e deploy
npm run build
firebase deploy
```

Após o deploy, você receberá uma URL pública no formato:
`https://SEU_PROJETO.web.app`

---

## 🔑 Credenciais de Admin (já configuradas no sistema)

| Login    | Senha       | Cargo                    |
|----------|-------------|--------------------------|
| Chairman | 03315077    | Chairman                 |
| CEO      | lolic0778   | CEO                      |
| Agnus    | A03Maximus  | Gerente de GP / RH & DP  |
