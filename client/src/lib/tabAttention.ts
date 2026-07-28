// Badges the browser tab (favicon dot + title prefix) when something happens
// while the tab is hidden/unfocused — mirrors the Teams "unread" indicator.

const originalTitle = document.title;
let isMarked = false;
let faviconLink: HTMLLinkElement | null = null;
let originalFaviconHref = "";
let badgedFaviconHref: string | null = null;

function getFaviconLink(): HTMLLinkElement {
  if (!faviconLink) {
    faviconLink =
      document.querySelector<HTMLLinkElement>("link[rel~='icon']") ??
      (() => {
        const link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
        return link;
      })();
    originalFaviconHref = faviconLink.href;
  }
  return faviconLink;
}

function buildBadgedFavicon(): Promise<string> {
  if (badgedFaviconHref) return Promise.resolve(badgedFaviconHref);

  return new Promise((resolve, reject) => {
    const link = getFaviconLink();
    const img = new Image();
    img.onload = () => {
      const size = 64;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas unsupported"));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);

      const r = size * 0.19;
      const cx = size - r - 3;
      const cy = size - r - 3;

      ctx.beginPath();
      ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "#22c55e";
      ctx.fill();

      badgedFaviconHref = canvas.toDataURL("image/png");
      resolve(badgedFaviconHref);
    };
    img.onerror = () => reject(new Error("favicon failed to load"));
    img.src = originalFaviconHref || link.href;
  });
}

export async function markTabUnread() {
  if (isMarked) return;
  if (document.visibilityState === "visible" && document.hasFocus()) return;

  isMarked = true;
  document.title = `● ${originalTitle}`;
  try {
    const href = await buildBadgedFavicon();
    if (isMarked) getFaviconLink().href = href;
  } catch {
    // favicon badge is best-effort; title prefix still applies
  }
}

export function clearTabUnread() {
  if (!isMarked) return;
  isMarked = false;
  document.title = originalTitle;
  getFaviconLink().href = originalFaviconHref;
}

function handleActive() {
  if (document.visibilityState === "visible" && document.hasFocus()) {
    clearTabUnread();
  }
}

document.addEventListener("visibilitychange", handleActive);
window.addEventListener("focus", handleActive);
