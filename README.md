# Chat Demo — Real-Time Messenger

> A minimal, production-ready real-time chat demo built with **Bun**, **Socket.io**, and a **Vite + React + shadcn/ui** frontend.  
> No database. No external services. Just connect and chat.

---

## Quick Start

Make sure **Bun** is installed (`curl -fsSL https://bun.sh/install | bash`).

```bash
git clone https://github.com/nodiry/chat-demo.git
cd chat-demo
chmod +x run.sh
./run.sh
```

`run.sh` installs dependencies for both `server/` and `client/`, then starts them in parallel.

---

## Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3005 |

---

## How to Use

1. Open **http://localhost:5173** in two browser tabs (or two browsers).
2. Tab A: enter name `alice`, chatting with `bob` → **Start Chatting**.
3. Tab B: enter name `bob`, chatting with `alice` → **Start Chatting**.
4. Messages sync in real time. The sidebar shows live ping and render time.
5. Attach a file (up to 100 MB) with the paperclip or paste it from the clipboard. It burns after 15 minutes, or earlier if either user hits the flame button.
6. Messages expire 24 hours after they are sent. When both users close the chat, everything is wiped from memory immediately.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | **Bun** |
| Backend | **Bun native HTTP** + **Socket.io** |
| Storage | **In-memory** (Maps) — no database required |
| Frontend | **React 19** + **Vite** |
| UI | **shadcn/ui** + **Tailwind CSS v4** |
| Language | **TypeScript** |

---

## Project Structure

```
chat-demo/
├── server/          # Bun HTTP + Socket.io backend
│   ├── main.ts      # Single entry point
│   ├── package.json
│   └── README.md    # Socket.io integration guide
│
├── client/          # React SPA
│   ├── src/
│   │   ├── App.tsx          # Login + Chat views
│   │   ├── context/socket.tsx  # Socket context + speed metrics
│   │   └── components/ui/   # shadcn components incl. sidebar
│   ├── package.json
│   └── README.md    # UI & component docs
│
└── run.sh           # One-command launcher
```

---

## Commands

| Action | Command |
|--------|---------|
| Start everything | `./run.sh` |
| Backend only | `cd server && bun run dev` |
| Frontend only | `cd client && bun run dev` |
| Stop | `Ctrl+C` |

---

## Features

- **Zero external dependencies** — no MongoDB, Redis, or Memcached needed
- **End-to-end encryption**: messages are encrypted in the browser (ECDH P-256 + AES-GCM), the server only holds ciphertext
- **Burning files**: up to 100 MB per file, uploaded in parallel 512 KB chunks with live progress, kept in server memory for 15 minutes (1 GB total cap), can be burnt early
- **Auto-cleanup**: messages expire after 24 hours and everything is deleted when both users disconnect
- **Live speed metrics** — socket ping RTT and React render time shown in sidebar
- **Dark / light theme** — persisted to localStorage
- **Peer presence** — real-time online/offline indicator

---

## Docs

- [Backend — Socket.io integration guide](server/README.md)
- [Frontend — UI & component docs](client/README.md)

---

> *"Fast servers, clean UI, zero nonsense — just chat."*
