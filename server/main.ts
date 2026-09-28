import { createServer, type ServerResponse } from "node:http";
import type { webcrypto } from "node:crypto";
import { Server } from "socket.io";

const MAX_FILE = 50 * 1024 ** 2 + 28;
const MAX_TOTAL = 500 * 1024 ** 2;
const FILE_TTL = 15 * 60_000;
const MESSAGE_TTL = 24 * 60 * 60_000;

type Message = {
  id: string;
  sender: string;
  receiver: string;
  date: string;
  body: Buffer;
  file?: { id: string; expiresAt: number; burnt?: boolean };
};

type StoredFile = { data: Buffer; conv: string; expiresAt: number };

// username → socketId
const users = new Map<string, string>();
const publicKeys = new Map<string, webcrypto.JsonWebKey>();
// "alice:bob" (sorted) → messages[]
const conversations = new Map<string, Message[]>();
const files = new Map<string, StoredFile>();

function convKey(a: string, b: string) {
  return [a, b].sort().join(":");
}

function json(res: ServerResponse, status: number, body: object = {}) {
  res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(body));
}

function deleteFiles(conv: string) {
  for (const [id, f] of files) if (f.conv === conv) files.delete(id);
}

const httpServer = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const url = new URL(req.url ?? "/", "http://localhost");
  const fileId = url.pathname.match(/^\/files\/([\w-]+)$/)?.[1];

  if (req.method === "GET" && fileId) {
    const file = files.get(fileId);
    if (!file) return json(res, 410);
    res.writeHead(200, { "Content-Type": "application/octet-stream" }).end(file.data);
    return;
  }

  if (req.method === "POST" && url.pathname === "/files") {
    const sender = url.searchParams.get("sender");
    const receiver = url.searchParams.get("receiver");
    const size = Number(req.headers["content-length"]);
    if (!sender || !receiver) return json(res, 400);
    if (!size || size > MAX_FILE) return json(res, 413);
    const used = [...files.values()].reduce((n, f) => n + f.data.length, 0);
    if (used + size > MAX_TOTAL) return json(res, 507);

    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      const id = crypto.randomUUID();
      const expiresAt = Date.now() + FILE_TTL;
      files.set(id, { data: Buffer.concat(chunks), conv: convKey(sender, receiver), expiresAt });
      json(res, 200, { id, expiresAt });
    });
    return;
  }

  json(res, 200, { status: "ok", service: "chat-demo" });
});

const io = new Server(httpServer, {
  cors: { origin: "*" },
  path: "/ws/chat",
});

function burnFile(id: string) {
  const file = files.get(id);
  if (!file) return;
  files.delete(id);
  for (const m of conversations.get(file.conv) ?? []) if (m.file?.id === id) m.file.burnt = true;
  io.to(file.conv).emit("burnt", id);
}

io.on("connection", (socket) => {
  socket.on(
    "init",
    ({ sender, receiver, publicKey }: { sender: string; receiver: string; publicKey: webcrypto.JsonWebKey }) => {
      const key = convKey(sender, receiver);
      socket.data = { sender, receiver, key };
      socket.join(key);
      users.set(sender, socket.id);
      publicKeys.set(sender, publicKey);

      const peerKey = publicKeys.get(receiver);
      if (peerKey) socket.emit("peerKey", peerKey);
      socket.to(key).emit("peerKey", publicKey);
      socket.emit("previousMessages", conversations.get(key) ?? []);
      if (users.has(receiver)) io.to(key).emit("online", true);
    }
  );

  socket.on("message", ({ body, fileId }: { body: Buffer; fileId?: string }) => {
    const { sender, receiver, key } = socket.data;
    if (!key) return;
    const file = fileId ? files.get(fileId) : undefined;
    if (fileId && file?.conv !== key) return;

    const msg: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sender,
      receiver,
      date: new Date().toISOString(),
      body,
      ...(fileId && file ? { file: { id: fileId, expiresAt: file.expiresAt } } : {}),
    };

    const history = conversations.get(key) ?? [];
    history.push(msg);
    conversations.set(key, history);
    io.to(key).emit("message", msg);
  });

  socket.on("burn", (fileId: string) => {
    if (files.get(fileId)?.conv === socket.data.key) burnFile(fileId);
  });

  socket.on("flush", () => {
    const { key } = socket.data;
    if (!key) return;
    conversations.delete(key);
    deleteFiles(key);
    io.to(key).emit("flushed");
  });

  // Echo back for latency measurement
  socket.on("latency_ping", () => socket.emit("latency_pong"));

  socket.on("disconnect", () => {
    const { sender, receiver, key } = socket.data;
    if (!key || users.get(sender) !== socket.id) return;
    users.delete(sender);
    if (users.has(receiver)) return void io.to(key).emit("online", false);
    conversations.delete(key);
    deleteFiles(key);
    publicKeys.delete(sender);
    publicKeys.delete(receiver);
  });
});

setInterval(() => {
  const now = Date.now();
  for (const [id, f] of files) if (f.expiresAt <= now) burnFile(id);
  for (const [key, msgs] of conversations) {
    const expired = msgs.filter((m) => now - Date.parse(m.date) > MESSAGE_TTL).map((m) => m.id);
    if (!expired.length) continue;
    conversations.set(key, msgs.filter((m) => !expired.includes(m.id)));
    io.to(key).emit("expired", expired);
  }
}, 5_000);

httpServer.listen(3005, () => console.log("Chat server → http://localhost:3005"));
