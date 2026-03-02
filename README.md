# CRM Prospecto - Firebase Setup

## 1. Configuração do Firebase Console
1. Vá para o [Firebase Console](https://console.firebase.google.com/).
2. Crie um novo projeto.
3. No painel, adicione um App Web.
4. Vá em **Firestore Database** e clique em **Create database**. Comece no **Test mode**.
5. Vá em **Project Settings** e copie as credenciais para o seu arquivo `.env`.

## 2. Deploy para Firebase Hosting
1. Instale o CLI do Firebase globalmente: `npm install -g firebase-tools`
2. Faça login: `firebase login`
3. Gere o build: `npm run build`
4. Deploy: `firebase deploy`
