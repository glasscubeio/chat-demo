import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { HowItWorks } from "@/components/HowItWorks";
import { I18nProvider, useI18n, type Lang } from "@/context/i18n";
import { SocketProvider, useSocketContext } from "@/context/socket";
import {
  Check,
  Circle,
  Copy,
  Eraser,
  ExternalLink,
  GitBranch,
  Info,
  LogOut,
  MessageCircleMore,
  Reply,
  Send,
  Timer,
  User,
  UserX,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReplyTo } from "@/context/socket";

// ─── Language selector ─────────────────────────────────────────────────────────

const LANGS: Array<{ code: Lang; label: string }> = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "EN" },
  { code: "ru", label: "РУС" },
  { code: "uz", label: "UZ" },
];

function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex gap-1">
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={cn(
            "rounded-full border text-[10px] font-semibold transition-all leading-none",
            compact ? "px-1.5 py-0.5" : "px-2 py-1",
            lang === code
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────────────

type View = "login" | "chat";

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="chat-theme">
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const [view, setView] = useState<View>(() =>
    localStorage.getItem("name") && localStorage.getItem("peer")
      ? "chat"
      : "login",
  );

  const handleLogin = (name: string, peer: string) => {
    localStorage.setItem("name", name.trim());
    localStorage.setItem("peer", peer.trim());
    setView("chat");
  };

  const handleLeave = () => {
    localStorage.removeItem("name");
    localStorage.removeItem("peer");
    setView("login");
  };

  return (
    <AnimatePresence mode="wait">
      {view === "login" ? (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <LoginView onLogin={handleLogin} />
        </motion.div>
      ) : (
        <motion.div
          key="chat"
          className="h-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <SocketProvider>
            <ChatView onLeave={handleLeave} />
          </SocketProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Login ─────────────────────────────────────────────────────────────────────

interface FloatingHintProps {
  message: string;
  side: "left" | "right";
}

function FloatingHint({ message, side }: FloatingHintProps) {
  // Determine positioning and flip the arrow depending on the side
  const isLeft = side === "left";

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? 20 : -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: isLeft ? 10 : -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
      className={cn(
        "absolute hidden lg:flex items-center gap-2 w-72 pointer-events-none z-50 top-1/2 -translate-y-1/2",
        isLeft
          ? "right-full mr-6 flex-row-reverse text-right"
          : "left-full ml-6 flex-row text-left",
      )}
    >
      {/* Pen Arrow with dynamic flip pointing toward the input */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className={cn(
          "text-amber-500 dark:text-amber-400 shrink-0",
          isLeft ? "scale-x-[-1] rotate-22" : "-rotate-22",
        )}
      >
        <path
          d="M 20 20 C 15 15, 10 8, 4 4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 4 4 L 4 10 M 4 4 L 10 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>

      <p className="text-md font-medium text-amber-600 dark:text-amber-400 leading-snug italic drop-shadow-sm">
        {message}
      </p>
    </motion.div>
  );
}

function LoginView({
  onLogin,
}: {
  onLogin: (name: string, peer: string) => void;
}) {
  const [name, setName] = useState("");
  const [peer, setPeer] = useState("");
  const [showHIW, setShowHIW] = useState(false);
  const { t } = useI18n();

  const submit = () => {
    if (name.trim() && peer.trim()) onLogin(name, peer);
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background dot-grid">
        {/* ── Top navbar ── */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-background/90 backdrop-blur-sm border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Chat Demo"
              className="h-6 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="font-semibold text-sm">Chat Demo</span>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Links — hidden on mobile, visible on sm+ */}
            <div className="hidden sm:flex items-center gap-0.5">
              <button
                onClick={() => setShowHIW(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.howItWorks}</span>
              </button>
              <a
                href="https://github.com/glasscubeio/chat-demo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <a
                href="https://glasscube.uz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">glasscube.uz</span>
              </a>
              <div className="w-px h-4 bg-border mx-1" />
            </div>
            <LanguageSelector />
            <div className="ml-1">
              <ModeToggle />
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-visible">
          <div className="w-full max-w-sm relative">
            <Card className="w-full shadow-2xl border-border/80 bg-card">
              <CardHeader className="flex flex-col items-center text-center gap-2 pb-2">
                <img
                  src="/logo.png"
                  alt="Chat Demo"
                  className="h-11 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
                <CardTitle className="text-xl">{t.appName}</CardTitle>
                <CardDescription className="text-xs">
                  {t.appDesc}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-2">
                <AnimatePresence>
                  {/* My Name Input Wrapper Container */}
                  <div className="relative group">
                    <Input
                      placeholder={t.yourName}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submit()}
                      autoFocus
                      className="relative z-10"
                    />
                    {/* Desktop: floating hint outside the card */}
                    <FloatingHint message={t.yourNameHint} side="left" />
                    {/* Mobile: simple inline hint */}
                    <p className="lg:hidden text-[11px] text-muted-foreground mt-1.5 px-1">
                      {t.yourNameHint}
                    </p>
                  </div>

                  {/* Peer Name Input Wrapper Container */}
                  <div className="relative group">
                    <Input
                      placeholder={t.chattingWith}
                      value={peer}
                      onChange={(e) => setPeer(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submit()}
                      className="relative z-10"
                    />
                    {/* Desktop: floating hint outside the card */}
                    <FloatingHint message={t.peerNameHint} side="right" />
                    {/* Mobile: simple inline hint */}
                    <p className="lg:hidden text-[11px] text-muted-foreground mt-1.5 px-1">
                      {t.peerNameHint}
                    </p>
                  </div>
                </AnimatePresence>

                <div className="pt-2">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={submit}
                    disabled={!name.trim() || !peer.trim()}
                  >
                    {t.startChatting}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="flex items-center justify-center gap-3 px-6 py-3.5 border-t border-border/60 text-[11px] text-muted-foreground bg-background/80">
          <a
            href="https://github.com/glasscubeio/chat-demo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <GitBranch className="w-3 h-3" />
            Source
          </a>
          <span className="opacity-30">·</span>
          <a
            href="https://glasscube.uz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            glasscube.uz
          </a>
          <span className="opacity-30">·</span>
          <span>Socket.io + Bun</span>
        </footer>
      </div>

      <AnimatePresence>
        {showHIW && <HowItWorks onClose={() => setShowHIW(false)} />}
      </AnimatePresence>
    </>
  );
}

// ─── Peer-left modal ───────────────────────────────────────────────────────────

function PeerLeftModal({
  onWait,
  onLeave,
}: {
  onWait: () => void;
  onLeave: () => void;
}) {
  const { t } = useI18n();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[6px]"
        onClick={onWait}
      />
      <motion.div
        className="relative z-10 w-full max-w-xs overflow-hidden rounded-2xl border border-white/20 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
        initial={{ scale: 0.92, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 16, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
      >
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="p-3 rounded-full bg-destructive/10">
            <UserX className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{t.peerLeftTitle}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {t.peerLeftDesc}
            </p>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1 h-8 text-xs"
              onClick={onWait}
            >
              {t.waitForPeer}
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-8 text-xs"
              onClick={onLeave}
            >
              {t.leave}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Chat ──────────────────────────────────────────────────────────────────────

function ChatView({ onLeave }: { onLeave: () => void }) {
  const {
    connected,
    peerOnline,
    peerJustLeft,
    acknowledgePeerLeft,
    messages,
    ping,
    renderTime,
    sendMessage,
    flushChat,
  } = useSocketContext();
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [showHIW, setShowHIW] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyTo | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const name = localStorage.getItem("name") ?? "";
  const peer = localStorage.getItem("peer") ?? "";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text, replyingTo ?? undefined);
    setText("");
    setReplyingTo(null);
  };

  const handleCopy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    } catch {
      // clipboard access denied — nothing we can do
    }
  };

  const handleFlush = () => {
    if (messages.length === 0) return;
    if (!window.confirm(t.flushConfirm)) return;
    flushChat();
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const pingColor =
    ping === null
      ? "text-muted-foreground"
      : ping < 50
        ? "text-green-500"
        : ping < 150
          ? "text-yellow-500"
          : "text-red-500";

  const renderColor =
    renderTime === null
      ? "text-muted-foreground"
      : renderTime < 16
        ? "text-green-500"
        : renderTime < 50
          ? "text-yellow-500"
          : "text-red-500";

  return (
    <>
      <div className="flex h-screen">
        {/* ── Sidebar (desktop only) ── */}
        <Sidebar className="hidden md:flex">
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Chat Demo"
                className="h-5 object-contain"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = "none";
                }}
              />
              <span className="font-semibold text-sm">Chat Demo</span>
              <div
                className={cn(
                  "ml-auto w-2 h-2 rounded-full transition-colors",
                  connected ? "bg-green-500" : "bg-red-500",
                )}
              />
            </div>
            <p className="text-xs text-sidebar-foreground/60">
              {connected ? t.connected : t.disconnected}
            </p>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{t.youLabel}</SidebarGroupLabel>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <User className="w-4 h-4 text-sidebar-foreground/60" />
                <span className="text-sm font-medium truncate">{name}</span>
              </div>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
              <SidebarGroupLabel>{t.peerLabel}</SidebarGroupLabel>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <User className="w-4 h-4 text-sidebar-foreground/60" />
                <span className="text-sm font-medium truncate">{peer}</span>
                <Circle
                  className={cn(
                    "ml-auto w-2 h-2 shrink-0 fill-current transition-colors",
                    peerOnline ? "text-green-500" : "text-muted-foreground/40",
                  )}
                />
              </div>
              <p className="px-2 text-xs text-sidebar-foreground/50">
                {peerOnline ? t.online : t.offline}
              </p>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
              <SidebarGroupLabel>{t.speedLabel}</SidebarGroupLabel>
              <div className="space-y-2 px-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
                    <Wifi className="w-3.5 h-3.5" />
                    {t.socketPing}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-mono font-semibold tabular-nums",
                      pingColor,
                    )}
                  >
                    {ping !== null ? `${ping}ms` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
                    <Timer className="w-3.5 h-3.5" />
                    {t.renderTime}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-mono font-semibold tabular-nums",
                      renderColor,
                    )}
                  >
                    {renderTime !== null ? `${renderTime}ms` : "—"}
                  </span>
                </div>
              </div>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
              <button
                onClick={() => setShowHIW(true)}
                className="flex items-center gap-2 px-2 py-1.5 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground rounded-md hover:bg-sidebar-accent transition-colors w-full"
              >
                <Info className="w-3.5 h-3.5" />
                {t.howItWorks}
              </button>
              <button
                onClick={handleFlush}
                disabled={messages.length === 0}
                className="flex items-center gap-2 px-2 py-1.5 text-xs text-sidebar-foreground/60 hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors w-full disabled:opacity-40 disabled:pointer-events-none"
              >
                <Eraser className="w-3.5 h-3.5" />
                {t.flushChat}
              </button>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div className="flex items-center justify-between mb-1">
              <LanguageSelector compact />
              <ModeToggle />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-sidebar-foreground/40">
                <a
                  href="https://github.com/glasscubeio/chat-demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sidebar-foreground/70 flex items-center gap-0.5 transition-colors"
                >
                  <GitBranch className="w-3 h-3" />
                  Source
                </a>
                <span>·</span>
                <a
                  href="https://glasscube.uz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sidebar-foreground/70 transition-colors"
                >
                  glasscube.uz
                </a>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLeave}
                className="gap-1.5 h-7 text-xs text-muted-foreground hover:text-destructive px-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t.leave}
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* ── Chat Area ── */}
        <div className="flex flex-1 flex-col min-h-0 min-w-0">
          {/* Mobile header (hidden on desktop) */}
          <div className="flex md:hidden items-center gap-2 px-4 py-3 border-b bg-background/95 backdrop-blur-sm shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onLeave}
            >
              <LogOut className="w-4 h-4" />
            </Button>

            <div className="flex-1 min-w-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-none truncate">
                  {peer}
                </p>
                <p
                  className={cn(
                    "text-xs mt-0.5 transition-colors",
                    peerOnline ? "text-green-500" : "text-muted-foreground",
                  )}
                >
                  {peerOnline ? t.online : t.offline}
                </p>
              </div>
            </div>

            {!connected && (
              <div className="flex items-center gap-1 text-xs text-destructive shrink-0">
                <WifiOff className="w-4 h-4" />
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground"
              onClick={() => setShowMobileInfo(true)}
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>

          {/* Desktop header (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-3 px-6 py-4 border-b bg-background/95 backdrop-blur-sm shrink-0">
            <User className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm leading-none">{peer}</p>
              <p
                className={cn(
                  "text-xs mt-0.5 transition-colors",
                  peerOnline ? "text-green-500" : "text-muted-foreground",
                )}
              >
                {peerOnline ? t.online : t.offline}
              </p>
            </div>
            {!connected && (
              <div className="ml-auto flex items-center gap-1.5 text-xs text-destructive">
                <WifiOff className="w-3.5 h-3.5" />
                {t.reconnecting}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-6 py-3 sm:py-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground select-none">
                <MessageCircleMore className="w-10 h-10 opacity-20" />
                <p className="text-sm">{t.noMessages}</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender === name;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "group/msg flex flex-col gap-0.5 max-w-[82%] sm:max-w-[70%] min-w-0",
                    isMe ? "ml-auto items-end" : "items-start",
                  )}
                >
                  {msg.replyTo && (
                    <div
                      className={cn(
                        "min-w-0 max-w-full px-2.5 py-1.5 rounded-lg text-xs border-l-2 opacity-80",
                        isMe
                          ? "border-primary-foreground/40 bg-primary/10"
                          : "border-foreground/25 bg-muted/60",
                      )}
                    >
                      <p className="font-medium truncate">
                        {msg.replyTo.sender}
                      </p>
                      <p className="line-clamp-2 whitespace-pre-wrap wrap-anywhere text-muted-foreground">
                        {msg.replyTo.text}
                      </p>
                    </div>
                  )}
                  <div
                    className={cn(
                      "min-w-0 max-w-full px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap wrap-anywhere",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted rounded-tl-sm",
                    )}
                  >
                    {msg.text}
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1",
                      isMe ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    <span className="text-[10px] text-muted-foreground px-1">
                      {formatTime(msg.date)}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-60 group-hover/msg:opacity-100 transition-opacity">
                      <button
                        onClick={() =>
                          setReplyingTo({
                            id: msg.id,
                            sender: msg.sender,
                            text: msg.text,
                          })
                        }
                        title={t.reply}
                        aria-label={t.reply}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Reply className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title={t.copy}
                        aria-label={t.copy}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="flex flex-col gap-2 px-3 sm:px-6 py-3 sm:py-4 border-t bg-background shrink-0">
            {replyingTo && (
              <div className="flex items-start gap-2 pl-2.5 pr-1.5 py-1.5 rounded-lg bg-muted border-l-2 border-primary min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground/80">
                    {t.replyingTo} {replyingTo.sender}
                  </p>
                  <p className="text-xs text-muted-foreground truncate wrap-anywhere">
                    {replyingTo.text}
                  </p>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  aria-label={t.cancelReply}
                  title={t.cancelReply}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                placeholder={t.messagePH.replace("{peer}", peer)}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={!connected}
                rows={1}
                className="flex-1 min-h-10 sm:min-h-9 max-h-40 py-2 text-base sm:text-sm"
              />
              <Button
                onClick={handleSend}
                disabled={!connected || !text.trim()}
                size="icon"
                className="h-10 w-10 sm:h-9 sm:w-9 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile info bottom sheet ── */}
      <AnimatePresence>
        {showMobileInfo && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
              onClick={() => setShowMobileInfo(false)}
            />
            <motion.div
              className="relative z-10 w-full bg-background rounded-t-2xl border-t border-border shadow-2xl max-h-[85vh] overflow-y-auto"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
            >
              {/* Pull handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
              </div>

              <div className="px-5 pb-8 space-y-5">
                {/* Connection status */}
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      connected ? "bg-green-500" : "bg-red-500",
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {connected ? t.connected : t.reconnecting}
                  </span>
                </div>

                <div className="h-px bg-border" />

                {/* You */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    {t.youLabel}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="font-semibold text-sm">{name}</span>
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Peer */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    {t.peerLabel}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{peer}</p>
                      <p
                        className={cn(
                          "text-xs",
                          peerOnline
                            ? "text-green-500"
                            : "text-muted-foreground",
                        )}
                      >
                        {peerOnline ? t.online : t.offline}
                      </p>
                    </div>
                    <Circle
                      className={cn(
                        "w-2.5 h-2.5 fill-current shrink-0",
                        peerOnline
                          ? "text-green-500"
                          : "text-muted-foreground/30",
                      )}
                    />
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Speed */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    {t.speedLabel}
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wifi className="w-4 h-4" />
                        {t.socketPing}
                      </div>
                      <span
                        className={cn(
                          "text-sm font-mono font-semibold tabular-nums",
                          pingColor,
                        )}
                      >
                        {ping !== null ? `${ping}ms` : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Timer className="w-4 h-4" />
                        {t.renderTime}
                      </div>
                      <span
                        className={cn(
                          "text-sm font-mono font-semibold tabular-nums",
                          renderColor,
                        )}
                      >
                        {renderTime !== null ? `${renderTime}ms` : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* How it works */}
                <button
                  onClick={() => {
                    setShowMobileInfo(false);
                    setShowHIW(true);
                  }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Info className="w-4 h-4" />
                  {t.howItWorks}
                </button>

                <button
                  onClick={() => {
                    setShowMobileInfo(false);
                    handleFlush();
                  }}
                  disabled={messages.length === 0}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Eraser className="w-4 h-4" />
                  {t.flushChat}
                </button>

                <div className="h-px bg-border" />

                {/* Language + Theme */}
                <div className="flex items-center justify-between">
                  <LanguageSelector />
                  <ModeToggle />
                </div>

                <div className="h-px bg-border" />

                {/* Leave */}
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={onLeave}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t.leave}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Peer-left modal */}
      <AnimatePresence>
        {peerJustLeft && (
          <PeerLeftModal
            key="peer-left"
            onWait={acknowledgePeerLeft}
            onLeave={onLeave}
          />
        )}
      </AnimatePresence>

      {/* How it works modal */}
      <AnimatePresence>
        {showHIW && <HowItWorks key="hiw" onClose={() => setShowHIW(false)} />}
      </AnimatePresence>
    </>
  );
}
