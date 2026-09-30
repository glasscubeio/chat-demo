import { createContext, useContext, useState } from "react";

export type Lang = "ko" | "en" | "ru" | "uz";

export type Translations = {
  appName: string;
  appDesc: string;
  yourName: string;
  yourNameHint: string;
  chattingWith: string;
  peerNameHint: string;
  startChatting: string;
  howItWorks: string;
  viewOnGithub: string;
  visitSite: string;
  connected: string;
  disconnected: string;
  youLabel: string;
  peerLabel: string;
  online: string;
  offline: string;
  speedLabel: string;
  socketPing: string;
  renderTime: string;
  leave: string;
  noMessages: string;
  reconnecting: string;
  messagePH: string;
  peerLeftTitle: string;
  peerLeftDesc: string;
  waitForPeer: string;
  close: string;
  hiwTitle: string;
  hiwClientA: string;
  hiwServer: string;
  hiwClientB: string;
  hiwSteps: Array<{ label: string; desc: string }>;
  flushChat: string;
  flushConfirm: string;
  reply: string;
  copy: string;
  copied: string;
  replyingTo: string;
  cancelReply: string;
  attachFile: string;
  removeFile: string;
  fileTooLarge: string;
  uploadFailed: string;
  burnsIn: string;
  fileBurnt: string;
  burnNow: string;
  burnConfirm: string;
  download: string;
  locked: string;
  waitingForKey: string;
};

const T: Record<Lang, Translations> = {
  ko: {
    appName: "소켓 채팅 데모",
    appDesc: "Socket.io + Bun · 실시간 데모",
    yourName: "내 이름",
    yourNameHint: "짧고 기억하기 쉽게 — 상대방이 이 이름을 정확히 입력해야 합니다",
    chattingWith: "상대방 이름...",
    peerNameHint: "상대방이 사용한 정확한 이름을 입력하세요",
    startChatting: "채팅 시작하기 →",
    howItWorks: "작동 원리",
    viewOnGithub: "GitHub",
    visitSite: "glasscube.uz",
    connected: "연결됨",
    disconnected: "연결 끊김",
    youLabel: "나",
    peerLabel: "상대방",
    online: "온라인",
    offline: "오프라인",
    speedLabel: "속도",
    socketPing: "소켓 핑",
    renderTime: "렌더 시간",
    leave: "나가기",
    noMessages: "메시지가 없습니다. 인사해보세요!",
    reconnecting: "재연결 중...",
    messagePH: "{peer}에게 메시지...",
    peerLeftTitle: "상대방이 나갔습니다",
    peerLeftDesc: "상대방이 채팅을 떠났습니다. 계속 기다리시겠습니까?",
    waitForPeer: "기다리기",
    close: "닫기",
    hiwTitle: "작동 원리",
    hiwClientA: "클라이언트 A",
    hiwServer: "Bun 서버",
    hiwClientB: "클라이언트 B",
    hiwSteps: [
      {
        label: "연결 및 등록",
        desc: "클라이언트가 Socket.io로 연결하고 init 이벤트로 sender/receiver를 서버에 등록합니다.",
      },
      {
        label: "기록 로드",
        desc: "서버가 인메모리 Map에서 대화 기록을 가져와 previousMessages로 전송합니다.",
      },
      {
        label: "상대방 참여",
        desc: "상대방이 연결되면 서버가 양쪽에 online: true 이벤트를 전송합니다.",
      },
      {
        label: "실시간 메시지",
        desc: "메시지는 브라우저에서 암호화된 뒤 서버를 경유해 전달되므로 서버는 내용을 읽을 수 없습니다. 파일은 조각으로 나뉘어 빠르게 업로드됩니다.",
      },
      {
        label: "자동 정리",
        desc: "파일은 15분 후, 메시지는 24시간 후 소각되며, 두 사용자 모두 나가면 모든 것이 즉시 삭제됩니다.",
      },
    ],
    flushChat: "채팅 비우기",
    flushConfirm: "전체 대화 내용을 삭제할까요? 되돌릴 수 없습니다.",
    reply: "답장",
    copy: "복사",
    copied: "복사됨",
    replyingTo: "답장 대상",
    cancelReply: "답장 취소",
    attachFile: "파일 첨부",
    removeFile: "파일 제거",
    fileTooLarge: "파일은 최대 100MB까지 가능합니다",
    uploadFailed: "업로드 실패, 다시 시도하세요",
    burnsIn: "소각까지",
    fileBurnt: "파일이 소각되었습니다",
    burnNow: "지금 소각",
    burnConfirm: "이 파일을 두 사람 모두에게서 지금 소각할까요? 되돌릴 수 없습니다.",
    download: "다운로드",
    locked: "이 메시지를 복호화할 수 없습니다",
    waitingForKey: "암호화 설정을 위해 {peer}의 접속을 기다리는 중...",
  },
  en: {
    appName: "Socket Chat Demo",
    appDesc: "Socket.io + Bun · Real-time demo",
    yourName: "Your name",
    yourNameHint: "Short & memorable — your peer must type this exactly to find you",
    chattingWith: "Peer's username...",
    peerNameHint: "The exact username your peer registered with",
    startChatting: "Start Chatting →",
    howItWorks: "How it works",
    viewOnGithub: "GitHub",
    visitSite: "glasscube.uz",
    connected: "Connected",
    disconnected: "Disconnected",
    youLabel: "You",
    peerLabel: "Peer",
    online: "Online",
    offline: "Offline",
    speedLabel: "Speed",
    socketPing: "Socket ping",
    renderTime: "Render time",
    leave: "Leave",
    noMessages: "No messages yet. Say hi!",
    reconnecting: "Reconnecting...",
    messagePH: "Message {peer}...",
    peerLeftTitle: "Peer left the chat",
    peerLeftDesc:
      "Your chat partner has disconnected. Would you like to wait for them?",
    waitForPeer: "Wait for peer",
    close: "Close",
    hiwTitle: "How it works",
    hiwClientA: "Client A",
    hiwServer: "Bun Server",
    hiwClientB: "Client B",
    hiwSteps: [
      {
        label: "Connect & Register",
        desc: "Client connects via Socket.io and sends the init event with sender/receiver names to register on the server.",
      },
      {
        label: "Load History",
        desc: "Server fetches conversation history from in-memory Maps and sends previousMessages back to the client.",
      },
      {
        label: "Peer Joins",
        desc: "When the other user connects, server broadcasts online: true to both clients in real time.",
      },
      {
        label: "Real-time Messages",
        desc: "Messages are encrypted in the browser and relayed through the server, which can't read them. Files upload in fast parallel chunks.",
      },
      {
        label: "Auto Cleanup",
        desc: "Files burn after 15 minutes, messages after 24 hours, and everything is wiped as soon as both users leave.",
      },
    ],
    flushChat: "Flush!",
    flushConfirm: "Clear the entire conversation for both of you? This can't be undone.",
    reply: "Reply",
    copy: "Copy",
    copied: "Copied",
    replyingTo: "Replying to",
    cancelReply: "Cancel reply",
    attachFile: "Attach file",
    removeFile: "Remove file",
    fileTooLarge: "Files can be up to 100 MB",
    uploadFailed: "Upload failed, try again",
    burnsIn: "burns in",
    fileBurnt: "File burnt",
    burnNow: "Burn now",
    burnConfirm: "Burn this file for both of you now? This can't be undone.",
    download: "Download",
    locked: "Can't decrypt this message",
    waitingForKey: "Waiting for {peer} to connect to set up encryption...",
  },
  ru: {
    appName: "Socket Чат Демо",
    appDesc: "Socket.io + Bun · Демо реального времени",
    yourName: "Ваше имя",
    yourNameHint: "Коротко — собеседник должен ввести это имя точно",
    chattingWith: "Имя собеседника...",
    peerNameHint: "Точное имя, которое использует собеседник",
    startChatting: "Начать чат →",
    howItWorks: "Как это работает",
    viewOnGithub: "GitHub",
    visitSite: "glasscube.uz",
    connected: "Подключено",
    disconnected: "Отключено",
    youLabel: "Вы",
    peerLabel: "Собеседник",
    online: "Онлайн",
    offline: "Оффлайн",
    speedLabel: "Скорость",
    socketPing: "Пинг сокета",
    renderTime: "Время рендера",
    leave: "Выйти",
    noMessages: "Нет сообщений. Поздоровайтесь!",
    reconnecting: "Переподключение...",
    messagePH: "Сообщение для {peer}...",
    peerLeftTitle: "Собеседник вышел",
    peerLeftDesc:
      "Ваш собеседник отключился. Хотите подождать его возвращения?",
    waitForPeer: "Подождать",
    close: "Закрыть",
    hiwTitle: "Как это работает",
    hiwClientA: "Клиент A",
    hiwServer: "Bun Сервер",
    hiwClientB: "Клиент B",
    hiwSteps: [
      {
        label: "Подключение",
        desc: "Клиент подключается через Socket.io и регистрирует sender/receiver через событие init.",
      },
      {
        label: "Загрузка истории",
        desc: "Сервер извлекает историю из памяти и отправляет её через событие previousMessages.",
      },
      {
        label: "Собеседник входит",
        desc: "Когда второй пользователь подключается, сервер рассылает online: true обоим клиентам.",
      },
      {
        label: "Обмен сообщениями",
        desc: "Сообщения шифруются в браузере и проходят через сервер, который не может их прочитать. Файлы загружаются быстрыми параллельными частями.",
      },
      {
        label: "Автоочистка",
        desc: "Файлы сгорают через 15 минут, сообщения через 24 часа, а когда оба выходят, всё удаляется сразу.",
      },
    ],
    flushChat: "Очистить чат",
    flushConfirm: "Очистить всю переписку у обоих собеседников? Это необратимо.",
    reply: "Ответить",
    copy: "Копировать",
    copied: "Скопировано",
    replyingTo: "Ответ на",
    cancelReply: "Отменить ответ",
    attachFile: "Прикрепить файл",
    removeFile: "Убрать файл",
    fileTooLarge: "Файл может быть до 100 МБ",
    uploadFailed: "Ошибка загрузки, попробуйте снова",
    burnsIn: "сгорит через",
    fileBurnt: "Файл сгорел",
    burnNow: "Сжечь сейчас",
    burnConfirm: "Сжечь этот файл у обоих прямо сейчас? Это необратимо.",
    download: "Скачать",
    locked: "Не удалось расшифровать сообщение",
    waitingForKey: "Ожидание {peer} для настройки шифрования...",
  },
  uz: {
    appName: "Socket Chat Demo",
    appDesc: "Socket.io + Bun · Real-time demo",
    yourName: "Ismingiz",
    yourNameHint: "Qisqa — suhbatdosh bu ismni aynan shu ko'rinishda kiritishi kerak",
    chattingWith: "Suhbatdosh ismi...",
    peerNameHint: "Suhbatdosh ro'yxatdan o'tgan ismni aynan kiriting",
    startChatting: "Chatni boshlash →",
    howItWorks: "Qanday ishlaydi",
    viewOnGithub: "GitHub",
    visitSite: "glasscube.uz",
    connected: "Ulangan",
    disconnected: "Uzilgan",
    youLabel: "Siz",
    peerLabel: "Suhbatdosh",
    online: "Onlayn",
    offline: "Oflayn",
    speedLabel: "Tezlik",
    socketPing: "Socket ping",
    renderTime: "Render vaqti",
    leave: "Chiqish",
    noMessages: "Hali xabar yo'q. Salom deng!",
    reconnecting: "Qayta ulanmoqda...",
    messagePH: "{peer}ga xabar...",
    peerLeftTitle: "Suhbatdosh chiqib ketdi",
    peerLeftDesc: "Suhbatdoshingiz chatni tark etdi. Uni kutishni xohlaysizmi?",
    waitForPeer: "Kutish",
    close: "Yopish",
    hiwTitle: "Qanday ishlaydi",
    hiwClientA: "Mijoz A",
    hiwServer: "Bun Server",
    hiwClientB: "Mijoz B",
    hiwSteps: [
      {
        label: "Ulanish va ro'yxat",
        desc: "Mijoz Socket.io orqali ulanadi va init hodisasi bilan sender/receiver ni serverga ro'yxatdan o'tkazadi.",
      },
      {
        label: "Tarix yuklash",
        desc: "Server xotiradan suhbat tarixini o'qib previousMessages hodisasi orqali yuboradi.",
      },
      {
        label: "Suhbatdosh qo'shilishi",
        desc: "Ikkinchi foydalanuvchi ulanganda server ikkala mijozga online: true hodisasini yuboradi.",
      },
      {
        label: "Real-time xabarlar",
        desc: "Xabarlar brauzerda shifrlanadi va server orqali yetkaziladi, server ularni o'qiy olmaydi. Fayllar tez parallel bo'laklarda yuklanadi.",
      },
      {
        label: "Avtomatik tozalash",
        desc: "Fayllar 15 daqiqadan so'ng, xabarlar 24 soatdan so'ng yonadi, ikkala foydalanuvchi chiqsa hammasi darhol o'chiriladi.",
      },
    ],
    flushChat: "Chatni tozalash",
    flushConfirm:
      "Butun suhbat ikkala tomon uchun ham o'chirilsinmi? Buni qaytarib bo'lmaydi.",
    reply: "Javob",
    copy: "Nusxalash",
    copied: "Nusxalandi",
    replyingTo: "Javob berilmoqda",
    cancelReply: "Javobni bekor qilish",
    attachFile: "Fayl biriktirish",
    removeFile: "Faylni olib tashlash",
    fileTooLarge: "Fayl hajmi 100 MB gacha bo'lishi mumkin",
    uploadFailed: "Yuklashda xato, qayta urinib ko'ring",
    burnsIn: "yonib ketadi",
    fileBurnt: "Fayl yonib ketdi",
    burnNow: "Hozir yoqish",
    burnConfirm: "Bu fayl ikkala tomon uchun ham hozir yoqilsinmi? Buni qaytarib bo'lmaydi.",
    download: "Yuklab olish",
    locked: "Bu xabarni ochib bo'lmadi",
    waitingForKey: "Shifrlashni sozlash uchun {peer} ulanishi kutilmoqda...",
  },
};

type I18nCtx = { lang: Lang; setLang: (l: Lang) => void; t: Translations };
const I18nContext = createContext<I18nCtx | null>(null);
const LANG_KEY = "chat-lang";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const s = localStorage.getItem(LANG_KEY) as Lang | null;
    return s && s in T ? s : "ko";
  });

  const setLang = (l: Lang) => {
    localStorage.setItem(LANG_KEY, l);
    setLangState(l);
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t: T[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be inside I18nProvider");
  return ctx;
}
