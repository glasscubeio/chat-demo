import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Flame } from "lucide-react";
import { useI18n } from "@/context/i18n";
import type { FileMeta } from "@/context/socket";
import { cn, formatSize } from "@/lib/utils";

const TTL = 15 * 60_000;
const R = 17;
const C = 2 * Math.PI * R;

const formatLeft = (ms: number) =>
  `${Math.floor(ms / 60_000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;

export function FileBubble({
  file,
  onDownload,
  onBurn,
}: {
  file: FileMeta;
  onDownload: () => void;
  onBurn: () => void;
}) {
  const { t } = useI18n();
  const gradientId = useId();
  const [now, setNow] = useState(Date.now);
  const left = Math.max(0, file.expiresAt - now);
  const burnt = file.burnt || left === 0;

  useEffect(() => {
    if (burnt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [burnt]);

  return (
    <div className="flex items-center gap-3 pl-2.5 pr-2 py-2 rounded-2xl border bg-card min-w-52 max-w-full">
      <AnimatePresence mode="wait" initial={false}>
        {burnt ? (
          <motion.div
            key="ash"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-10 h-10 shrink-0 grid place-items-center rounded-full bg-muted"
          >
            <Flame className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        ) : (
          <motion.button
            key="ring"
            onClick={onDownload}
            title={t.download}
            aria-label={t.download}
            exit={{
              scale: 1.5,
              opacity: 0,
              filter: "blur(6px)",
              transition: { duration: 0.4 },
            }}
            animate={{
              filter: [
                "drop-shadow(0 0 1px #f97316)",
                "drop-shadow(0 0 5px #ef4444)",
              ],
            }}
            transition={{
              filter: { duration: 1.2, repeat: Infinity, repeatType: "mirror" },
            }}
            className="relative w-10 h-10 shrink-0 grid place-items-center rounded-full hover:bg-accent transition-colors"
          >
            <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <circle
                cx="20"
                cy="20"
                r={R}
                fill="none"
                strokeWidth="3"
                className="stroke-muted"
              />
              <circle
                cx="20"
                cy="20"
                r={R}
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                stroke={`url(#${gradientId})`}
                strokeDasharray={C}
                strokeDashoffset={C * (1 - left / TTL)}
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>
            <Download className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium truncate",
            burnt && "line-through text-muted-foreground",
          )}
        >
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {burnt
            ? t.fileBurnt
            : `${formatSize(file.size)} · ${t.burnsIn} ${formatLeft(left)}`}
        </p>
      </div>
      {!burnt && (
        <button
          onClick={onBurn}
          title={t.burnNow}
          aria-label={t.burnNow}
          className="p-1.5 rounded-md shrink-0 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 transition-colors"
        >
          <Flame className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
