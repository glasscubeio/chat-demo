import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { markTabUnread } from "@/lib/tabAttention";
import {
  decrypt,
  deriveSharedKey,
  encrypt,
  exportPublicKey,
  getKeyPair,
} from "@/lib/crypto";

const API_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3005";

export type ReplyTo = {
  id: string;
  sender: string;
  text: string;
};

export type FileMeta = {
  id: string;
  name: string;
  type: string;
  size: number;
  expiresAt: number;
  burnt?: boolean;
};

export type Message = {
  id: string;
  sender: string;
  receiver: string;
  text: string;
  date: string;
  replyTo?: ReplyTo;
  file?: FileMeta;
  locked?: boolean;
};

type Payload = {
  text: string;
  replyTo?: ReplyTo;
  file?: Pick<FileMeta, "name" | "type" | "size">;
};

type WireMessage = Pick<Message, "id" | "sender" | "receiver" | "date"> & {
  body: ArrayBuffer;
  file?: Pick<FileMeta, "id" | "expiresAt" | "burnt">;
};

const burn = (id: string) => (prev: Message[]) =>
  prev.map((m) =>
    m.file?.id === id ? { ...m, file: { ...m.file, burnt: true } } : m,
  );

async function openMessage(
  key: CryptoKey | null,
  { body, file, ...meta }: WireMessage,
): Promise<Message> {
  try {
    if (!key) throw new Error("no key");
    const p: Payload = JSON.parse(
      new TextDecoder().decode(await decrypt(key, body)),
    );
    return {
      ...meta,
      text: p.text,
      replyTo: p.replyTo,
      file: file && p.file && { ...file, ...p.file },
    };
  } catch {
    return { ...meta, text: "", locked: true };
  }
}

async function uploadFile(
  key: CryptoKey,
  file: File,
  sender: string,
  receiver: string,
) {
  const res = await fetch(
    `${API_URL}/files?${new URLSearchParams({ sender, receiver })}`,
    { method: "POST", body: await encrypt(key, await file.arrayBuffer()) },
  );
  if (!res.ok) throw new Error(`upload ${res.status}`);
  return ((await res.json()) as { id: string }).id;
}

type SocketContextType = {
  connected: boolean;
  ready: boolean;
  peerOnline: boolean;
  peerJustLeft: boolean;
  acknowledgePeerLeft: () => void;
  messages: Message[];
  ping: number | null;
  renderTime: number | null;
  sendMessage: (text: string, replyTo?: ReplyTo, file?: File) => Promise<void>;
  downloadFile: (file: FileMeta) => Promise<void>;
  burnFile: (id: string) => void;
  flushChat: () => void;
};

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [ready, setReady] = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);
  const [peerJustLeft, setPeerJustLeft] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ping, setPing] = useState<number | null>(null);
  const [renderTime, setRenderTime] = useState<number | null>(null);
  const receiveTimeRef = useRef<number | null>(null);
  const keyRef = useRef<CryptoKey | null>(null);
  // tracks whether peer was ever online so we only fire "just left" after they joined
  const peerWasOnlineRef = useRef(false);

  useLayoutEffect(() => {
    if (receiveTimeRef.current !== null) {
      setRenderTime(Math.round(performance.now() - receiveTimeRef.current));
      receiveTimeRef.current = null;
    }
  }, [messages]);

  useEffect(() => {
    const sender = localStorage.getItem("name");
    const receiver = localStorage.getItem("peer");
    if (!sender || !receiver) return;

    const s = io(API_URL, { path: "/ws/chat" });
    setSocket(s);
    const pair = getKeyPair(sender);
    // decryption is async, so events are chained to keep message order and derive the key first
    let queue: Promise<unknown> = Promise.resolve();
    const serial = (fn: () => unknown) => {
      queue = queue.then(fn).catch(console.error);
    };

    const measurePing = () => {
      if (!s.connected) return;
      const t = performance.now();
      s.emit("latency_ping");
      s.once("latency_pong", () => setPing(Math.round(performance.now() - t)));
    };

    s.on("connect", async () => {
      setConnected(true);
      s.emit("init", {
        sender,
        receiver,
        publicKey: await exportPublicKey(await pair),
      });
      measurePing();
    });

    s.on("disconnect", () => {
      setConnected(false);
      setPeerOnline(false);
    });

    s.on("peerKey", (jwk: JsonWebKey) =>
      serial(async () => {
        keyRef.current = await deriveSharedKey(await pair, jwk);
        setReady(true);
      }),
    );

    s.on("previousMessages", (msgs: WireMessage[]) =>
      serial(async () =>
        setMessages(
          await Promise.all(msgs.map((m) => openMessage(keyRef.current, m))),
        ),
      ),
    );

    s.on("online", (status: boolean) => {
      if (!status && peerWasOnlineRef.current) {
        setPeerJustLeft(true);
      }
      peerWasOnlineRef.current = status;
      setPeerOnline(status);
    });

    s.on("message", (m: WireMessage) =>
      serial(async () => {
        const msg = await openMessage(keyRef.current, m);
        receiveTimeRef.current = performance.now();
        setMessages((prev) => [...prev, msg]);
        if (msg.sender !== sender) markTabUnread();
      }),
    );

    s.on("flushed", () => serial(() => setMessages([])));

    s.on("expired", (ids: string[]) =>
      serial(() =>
        setMessages((prev) => prev.filter((m) => !ids.includes(m.id))),
      ),
    );

    s.on("burnt", (id: string) => serial(() => setMessages(burn(id))));

    const pingInterval = setInterval(measurePing, 5000);

    return () => {
      clearInterval(pingInterval);
      s.disconnect();
    };
  }, []);

  const sendMessage = async (text: string, replyTo?: ReplyTo, file?: File) => {
    const key = keyRef.current;
    const sender = localStorage.getItem("name");
    const receiver = localStorage.getItem("peer");
    if (!socket || !key || !sender || !receiver || (!text.trim() && !file))
      return;
    const fileId = file && (await uploadFile(key, file, sender, receiver));
    const payload: Payload = {
      text: text.trim(),
      replyTo,
      file: file && { name: file.name, type: file.type, size: file.size },
    };
    socket.emit("message", {
      fileId,
      body: await encrypt(key, new TextEncoder().encode(JSON.stringify(payload))),
    });
  };

  const downloadFile = async (file: FileMeta) => {
    const key = keyRef.current;
    if (!key) return;
    const res = await fetch(`${API_URL}/files/${file.id}`);
    if (!res.ok) return setMessages(burn(file.id));
    const url = URL.createObjectURL(
      new Blob([await decrypt(key, await res.arrayBuffer())], {
        type: file.type,
      }),
    );
    Object.assign(document.createElement("a"), {
      href: url,
      download: file.name,
    }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const burnFile = (id: string) => socket?.emit("burn", id);

  const flushChat = () => socket?.emit("flush");

  const acknowledgePeerLeft = () => setPeerJustLeft(false);

  return (
    <SocketContext.Provider
      value={{
        connected,
        ready,
        peerOnline,
        peerJustLeft,
        acknowledgePeerLeft,
        messages,
        ping,
        renderTime,
        sendMessage,
        downloadFile,
        burnFile,
        flushChat,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocketContext = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketContext must be inside SocketProvider");
  return ctx;
};
