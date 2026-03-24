<div align="center">
  
  <h1>✨ Ramires Chat ✨</h1>
  <p><b>Uma aplicação de chat em tempo real de alta performance com design Glassmorphism.</b></p>
  
  [![Fastify](https://img.shields.io/badge/Fastify-20232A?style=for-the-badge&logo=fastify&logoColor=fff)](#)
  [![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](#)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](#)
  [![JavaScript](https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)
</div>

---

## 🚀 Sobre o Projeto

O **Ramires Chat** é uma plataforma de comunicação em tempo real _Mobile-First_. Seu objetivo foi construir uma experiência de usuário (UX) premium semelhante aos principais aplicativos de mensagens do mercado, utilizando **Fastify** + **WebSockets** no backend e **Vanilla JS** ultra-otimizado no frontend, sem o peso de frameworks complexos.

A interface gráfica foi desenhada usando a estética **Glassmorphism**, combinando fundos translúcidos e desfoque (_backdrop-filter_) com temas personalizáveis para criar um ambiente de chat profundo, responsivo e agradável.

---

## 🌟 Funcionalidades Principais

- **⚡ Tempo Real Absoluto:** Mensagens, indicativos de digitação e reações sincronizadas via Socket.io.
- **🎨 Glassmorphism & Temas:** Interface incrivelmente polida com temas dinâmicos (Padrão, Zero Two e Hatsune Miku).
- **📱 Mobile-First Perfection:** Layout otimizado para celulares usando `100dvh` e adaptação para a Safe Area (_notch_) do iOS/iPhone.
- **📸 Envio de Imagens & GIFs:**
  - Anexos flutuantes em um menu unificado ("+").
  - Busca de GIFs via **Tenor API**.
  - Upload de imagens com compressão Base64 feita direto no navegador do cliente, economizando servidor e banda visualizado via _Lightbox_ de tela-cheia.
- **🗣️ Menções & Respostas:**
  - Sistema de autocomplete de usuários digitando `@`.
  - Citações interativas ("Reply") que levam você para a mensagem original com clique (_Smart Scroll_).
- **🤣 Reações em Mensagens:** Estilo WhatsApp (👍, ❤️, 😂, 🐵, 😢).
- **🧹 Robô de Limpeza (Auto-Cleanup):** O servidor apaga automaticamente mensagens e arquivos de mídia com mais de 24 horas para master o banco Postgres sempre leve e limpo.
- **⏳ Smart Scroll Inteligente:** O chat avisa se chegou mensagem nova enquanto você lê o histórico antigo (com contador não-intrusivo).

---

## 🛠️ Tecnologias Utilizadas

### Backend

- [Node.js](https://nodejs.org/) & [Fastify](https://fastify.dev/) (Para performance extrema e baixa latência)
- [Socket.IO](https://socket.io/) (via `@wick_studio/fastify-socket.io`)
- [Sequelize](https://sequelize.org/) + **PostgreSQL**
- Sistema de Auto-Cleanup via `setInterval` no núcleo do servidor.

### Frontend

- **HTML5 & CSS3 Vanilla** (Variáveis CSS, Flexbox, CSS Grid, Animações Keyframe, Glassmorphism).
- **Vanilla JavaScript** (ES6+).
- **Tenor API** para o motor de busca de GIFs.
- LocalStorage para persistência de sessão e temas.

---

## ⚙️ Como rodar o projeto localmente

### 1. Pré-requisitos

Certifique-se de ter o **Node.js** e o **PostgreSQL** instalados em sua máquina.

### 2. Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/SEU_USUARIO/chat.git
cd chat
npm install
```

### 3. Configuração do Banco de Dados

Configure as credenciais do seu banco de dados PostgreSQL. Modifique o arquivo de configuração ou crie as variáveis de ambiente necessárias (conforme configurado no arquivo `src/config/database.js`).

### 4. Tenor API Key

A busca de GIFs exige uma Chave de API do Tenor. (O projeto atualmente roda com uma chave padrão V1, mas para produção recomenda-se usar a sua v2 do Google Cloud Console).

### 5. Executar o Servidor

Com o banco rodando, inicie a aplicação:

```bash
npm start
```

Acesse no seu navegador: `http://localhost:3000`

---

## 👨‍💻 Desenvolvedores e Contribuição

Este projeto foi construído colaborativamente do início ao fim misturando conhecimentos de design de interface e back-end performático. Sinta-se à vontade para clonar, estudar a arquitetura do Vanilla JS + Sockets e fazer o seu próprio fork!

---

<div align="center">
  <p>Um Projeto que pessoalmente me deixou orgulhoso</p>
</div>
