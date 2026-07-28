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

export type ReplyTo = {
  id: string;
  sender: string;
  text: string;
};

export type Message = {
  id: string;
  sender: string;
  receiver: string;
  text: string;
  date: string;
  replyTo?: ReplyTo;
};

type SocketContextType = {
  connected: boolean;
  peerOnline: boolean;
  peerJustLeft: boolean;
  acknowledgePeerLeft: () => void;
  messages: Message[];
  ping: number | null;
  renderTime: number | null;
  sendMessage: (text: string, replyTo?: ReplyTo) => void;
  flushChat: () => void;
};

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);
  const [peerJustLeft, setPeerJustLeft] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ping, setPing] = useState<number | null>(null);
  const [renderTime, setRenderTime] = useState<number | null>(null);
  const receiveTimeRef = useRef<number | null>(null);
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

    // For Vite:
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3005";

    const s = io(socketUrl, { path: "/ws/chat" });
    setSocket(s);

    const measurePing = () => {
      if (!s.connected) return;
      const t = performance.now();
      s.emit("latency_ping");
      s.once("latency_pong", () => setPing(Math.round(performance.now() - t)));
    };

    s.on("connect", () => {
      setConnected(true);
      s.emit("init", { sender, receiver });
      measurePing();
    });

    s.on("disconnect", () => {
      setConnected(false);
      setPeerOnline(false);
    });

    s.on("previousMessages", (msgs: Message[]) => setMessages(msgs));

    s.on("online", (status: boolean) => {
      if (!status && peerWasOnlineRef.current) {
        setPeerJustLeft(true);
      }
      peerWasOnlineRef.current = status;
      setPeerOnline(status);
    });

    s.on("message", (msg: Message) => {
      receiveTimeRef.current = performance.now();
      setMessages((prev) => [...prev, msg]);
      if (msg.sender !== sender) markTabUnread();
    });

    s.on("flushed", () => setMessages([]));

    const pingInterval = setInterval(measurePing, 5000);

    return () => {
      clearInterval(pingInterval);
      s.disconnect();
    };
  }, []);

  const sendMessage = (text: string, replyTo?: ReplyTo) => {
    const sender = localStorage.getItem("name");
    const receiver = localStorage.getItem("peer");
    if (!socket || !sender || !receiver || !text.trim()) return;
    socket.emit("message", {
      sender,
      receiver,
      text: text.trim(),
      ...(replyTo ? { replyTo } : {}),
    });
  };

  const flushChat = () => {
    const sender = localStorage.getItem("name");
    const receiver = localStorage.getItem("peer");
    if (!socket || !sender || !receiver) return;
    socket.emit("flush", { sender, receiver });
  };

  const acknowledgePeerLeft = () => setPeerJustLeft(false);

  return (
    <SocketContext.Provider
      value={{
        connected,
        peerOnline,
        peerJustLeft,
        acknowledgePeerLeft,
        messages,
        ping,
        renderTime,
        sendMessage,
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
