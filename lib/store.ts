import fs from "node:fs";
import path from "node:path";
import { Message, MessageOrigin, Reminder, ReminderStatus } from "@/types";

interface StoreShape {
  messages: Message[];
  reminders: Reminder[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

// Next.js dev 서버의 Fast Refresh로 이 모듈이 여러 번 재평가되어도 데이터가 날아가지
// 않도록 globalThis에 싱글턴으로 보관한다(Prisma client 싱글턴과 동일한 이유의 패턴).
declare global {
  var __appStore: StoreShape | undefined;
}

function loadFromDisk(): StoreShape {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
    };
  } catch {
    // 파일이 없거나(첫 실행) 손상된 경우 빈 store로 시작한다.
    return { messages: [], reminders: [] };
  }
}

function saveToDisk(store: StoreShape) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    // 어디까지나 데모용 안전망 백업일 뿐이므로, 실패해도 서비스 자체는 계속 동작해야 한다.
    console.error("[store] JSON 백업 저장 실패:", err);
  }
}

function getStore(): StoreShape {
  if (!globalThis.__appStore) {
    globalThis.__appStore = loadFromDisk();
  }
  return globalThis.__appStore;
}

function persist() {
  saveToDisk(getStore());
}

// ---------- Messages ----------

export function addMessage(input: {
  characterId: string;
  role: "user" | "assistant";
  content: string;
  origin: MessageOrigin;
  reminderId?: string;
}): Message {
  const message: Message = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  getStore().messages.push(message);
  persist();
  return message;
}

/** 특정 캐릭터의 전체 대화 이력. 캐릭터 전환/최초 로드 시 채팅창을 채우는 데 쓴다. */
export function getMessagesForCharacter(characterId: string): Message[] {
  return getStore()
    .messages.filter((m) => m.characterId === characterId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** since(ISO)보다 뒤에 생성된, 캐릭터 무관 전체 메시지. 폴링(새 메시지 감지)용. */
export function getMessagesSince(sinceISO: string | null): Message[] {
  const all = getStore().messages;
  const filtered = sinceISO ? all.filter((m) => m.createdAt > sinceISO) : all;
  return [...filtered].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Claude 채팅 호출에 보낼 최근 N턴. 전체 이력을 매번 보내지 않기 위한 컨텍스트 트리밍. */
export function getRecentHistory(characterId: string, limit = 20): Message[] {
  return getMessagesForCharacter(characterId).slice(-limit);
}

// ---------- Reminders ----------

export function addReminder(input: {
  characterId: string;
  triggerAt: string;
  originalPhrase: string;
  content: string;
  sourceMessageId?: string;
}): Reminder {
  const reminder: Reminder = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
    ...input,
  };
  getStore().reminders.push(reminder);
  persist();
  return reminder;
}

export function listReminders(): Reminder[] {
  return [...getStore().reminders].sort((a, b) =>
    a.triggerAt.localeCompare(b.triggerAt)
  );
}

export function getReminder(id: string): Reminder | undefined {
  return getStore().reminders.find((r) => r.id === id);
}

/** 스케줄러 tick에서 발화 대상을 스캔할 때 사용. pending && 도래 시각 지남. */
export function getDueReminders(now: Date = new Date()): Reminder[] {
  const nowISO = now.toISOString();
  return getStore().reminders.filter(
    (r) => r.status === "pending" && r.triggerAt <= nowISO
  );
}

export function updateReminderStatus(
  id: string,
  status: ReminderStatus,
  extra?: Partial<Pick<Reminder, "firedAt">>
): Reminder | undefined {
  const reminder = getReminder(id);
  if (!reminder) return undefined;
  reminder.status = status;
  if (extra?.firedAt) reminder.firedAt = extra.firedAt;
  persist();
  return reminder;
}

export type DeleteReminderResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_pending" };

/**
 * pending 상태인 리마인더만 취소(삭제) 가능하다. 스케줄러가 이미 processing으로
 * 마킹한 뒤(=발화가 진행 중)라면 삭제 요청은 거부한다 — 좁은 race window지만
 * "이미 처리 중인 걸 취소했다고 착각하는" 상황을 막기 위한 최소한의 안전장치다.
 */
export function deleteReminder(id: string): DeleteReminderResult {
  const store = getStore();
  const idx = store.reminders.findIndex((r) => r.id === id);
  if (idx === -1) return { ok: false, reason: "not_found" };
  if (store.reminders[idx].status !== "pending") {
    return { ok: false, reason: "not_pending" };
  }
  store.reminders.splice(idx, 1);
  persist();
  return { ok: true };
}
