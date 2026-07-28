import { createServer } from "node:http";
import { Server } from "socket.io";

type Message = {
  id: string;
  sender: string;
  receiver: string;
  text: string;
  date: string;
  replyTo?: {
    id: string;
    sender: string;
    text: string;
  };
};

// username → socketId
const users = new Map<string, string>();
// socketId → username
const socketToUser = new Map<string, string>();
// "alice:bob" (sorted) → messages[]
const conversations = new Map<string, Message[]>();

function convKey(a: string, b: string) {
  return [a, b].sort().join(":");
}

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", service: "chat-demo" }));
});

const io = new Server(httpServer, {
  cors: { origin: "*" },
  path: "/ws/chat",
});

io.on("connection", (socket) => {
  socket.on("init", ({ sender, receiver }: { sender: string; receiver: string }) => {
    users.set(sender, socket.id);
    socketToUser.set(socket.id, sender);

    const key = convKey(sender, receiver);
    socket.emit("previousMessages", conversations.get(key) ?? []);

    const receiverSocketId = users.get(receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("online", true);
      socket.emit("online", true);
    }
  });

  socket.on(
    "message",
    ({
      sender,
      receiver,
      text,
      replyTo,
    }: {
      sender: string;
      receiver: string;
      text: string;
      replyTo?: Message["replyTo"];
    }) => {
      const msg: Message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        sender,
        receiver,
        text,
        date: new Date().toISOString(),
        ...(replyTo ? { replyTo } : {}),
      };

      const key = convKey(sender, receiver);
      const history = conversations.get(key) ?? [];
      history.push(msg);
      conversations.set(key, history);

      socket.emit("message", msg);

      const receiverSocketId = users.get(receiver);
      if (receiverSocketId) io.to(receiverSocketId).emit("message", msg);
    }
  );

  socket.on(
    "flush",
    ({ sender, receiver }: { sender: string; receiver: string }) => {
      const key = convKey(sender, receiver);
      conversations.set(key, []);

      socket.emit("flushed");

      const receiverSocketId = users.get(receiver);
      if (receiverSocketId) io.to(receiverSocketId).emit("flushed");
    }
  );

  // Echo back for latency measurement
  socket.on("latency_ping", () => socket.emit("latency_pong"));

  socket.on("disconnect", () => {
    const username = socketToUser.get(socket.id);
    if (!username) return;

    users.delete(username);
    socketToUser.delete(socket.id);

    const toDelete: string[] = [];

    for (const [key] of conversations) {
      const [a, b] = key.split(":");
      const peer = username === a ? b : username === b ? a : null;
      if (!peer) continue;

      if (!users.has(peer)) {
        // Both users offline — wipe the conversation
        toDelete.push(key);
      } else {
        const peerSocketId = users.get(peer);
        if (peerSocketId) io.to(peerSocketId).emit("online", false);
      }
    }

    for (const key of toDelete) {
      conversations.delete(key);
      console.log(`Cleared conversation: ${key}`);
    }
  });
});

httpServer.listen(3005, () => console.log("Chat server → http://localhost:3005"));
