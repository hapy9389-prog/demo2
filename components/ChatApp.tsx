"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHARACTERS, DEFAULT_CHARACTER_ID, getCharacterById } from "@/lib/characters";
import { formatKoreanTime } from "@/lib/time";
import { ChatResponse, Message, ReminderWithCharacter } from "@/types";
import { CharacterSwitcher } from "./CharacterSwitcher";
import { ChatWindow } from "./ChatWindow";
import { NewMessageToast } from "./NewMessageToast";
import { ReminderCreatedBanner } from "./ReminderCreatedBanner";
import { ReminderPanel } from "./ReminderPanel";

const POLL_INTERVAL_MS = 3000;
const DEFAULT_TITLE = "현실 시간과 연결되는 AI 캐릭터 채팅";
const TOAST_DURATION_MS = 3000;
const BANNER_DURATION_MS = 5000;

function mergeMessages(prev: Message[], incoming: Message[]): Message[] {
  if (incoming.length === 0) return prev;
  const map = new Map(prev.map((m) => [m.id, m]));
  for (const m of incoming) map.set(m.id, m);
  return Array.from(map.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function ChatApp() {
  const [activeCharacterId, setActiveCharacterId] = useState(DEFAULT_CHARACTER_ID);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [reminders, setReminders] = useState<ReminderWithCharacter[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ content: string; timeLabel: string } | null>(
    null
  );
  const [toast, setToast] = useState<string | null>(null);

  // 마지막으로 확인한 메시지의 서버 createdAt. 클라이언트 시계가 아니라 서버가 준
  // 값을 기준으로 폴링해야 서버-클라이언트 시계 오차에 영향을 받지 않는다.
  const lastSeenRef = useRef<string>(new Date(0).toISOString());
  const initializedRef = useRef(false);
  const titleTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const bannerTimerRef = useRef<number | null>(null);

  const refreshReminders = useCallback(async () => {
    try {
      const res = await fetch("/api/reminders");
      const data = await res.json();
      setReminders(data.reminders ?? []);
    } catch {
      // 폴링성 요청이므로 실패해도 조용히 다음 tick에서 재시도한다.
    }
  }, []);

  const flashTitleFor = useCallback((characterName: string) => {
    document.title = `🔔 ${characterName}에게서 메시지`;
    if (titleTimerRef.current) window.clearTimeout(titleTimerRef.current);
    titleTimerRef.current = window.setTimeout(() => {
      document.title = DEFAULT_TITLE;
    }, TOAST_DURATION_MS);
  }, []);

  const showToast = useCallback((text: string) => {
    setToast(text);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  const showBanner = useCallback((content: string, timeLabel: string) => {
    setBanner({ content, timeLabel });
    if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = window.setTimeout(() => setBanner(null), BANNER_DURATION_MS);
  }, []);

  // 최초 로드: 지금까지의 전체 대화 이력 + 리마인더 목록을 한 번에 가져온다.
  // 이후 캐릭터를 전환해도 재요청 없이 이 배열을 클라이언트에서 필터링만 하면 된다
  // (폴링이 모든 캐릭터의 신규 메시지를 계속 채워주기 때문).
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    (async () => {
      try {
        const res = await fetch("/api/messages");
        const data = await res.json();
        const messages: Message[] = data.messages ?? [];
        setAllMessages(messages);
        if (messages.length > 0) {
          lastSeenRef.current = messages[messages.length - 1].createdAt;
        }
      } catch {
        setError("초기 메시지를 불러오지 못했습니다.");
      }
      refreshReminders();
    })();
  }, [refreshReminders]);

  // 폴링: 활성 캐릭터와 무관하게 전체 신규 메시지를 감지한다.
  // 리마인더 발화 메시지는 등록 당시 캐릭터로 고정되어 오므로, 사용자가 다른
  // 캐릭터를 보고 있어도 토스트/탭 제목으로 알아챌 수 있다.
  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(
          `/api/messages?since=${encodeURIComponent(lastSeenRef.current)}`
        );
        const data = await res.json();
        const incoming: Message[] = data.messages ?? [];
        if (incoming.length > 0) {
          lastSeenRef.current = incoming[incoming.length - 1].createdAt;
          setAllMessages((prev) => mergeMessages(prev, incoming));

          const reminderMsg = incoming.find((m) => m.origin === "reminder");
          if (reminderMsg) {
            const character = getCharacterById(reminderMsg.characterId);
            const name = character?.name ?? "캐릭터";
            showToast(`${name}에게 새 메시지가 왔습니다`);
            flashTitleFor(name);
          }
          refreshReminders();
        }
      } catch {
        // 폴링 실패는 조용히 무시하고 다음 tick에서 재시도한다.
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [flashTitleFor, refreshReminders, showToast]);

  useEffect(() => {
    return () => {
      if (titleTimerRef.current) window.clearTimeout(titleTimerRef.current);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      setSending(true);
      setError(null);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId: activeCharacterId, message: text }),
        });
        const data: ChatResponse & { error?: string } = await res.json();
        if (!res.ok) throw new Error(data.error || "요청에 실패했습니다.");

        setAllMessages((prev) => mergeMessages(prev, [data.userMessage, data.reply]));
        if (data.reply.createdAt > lastSeenRef.current) {
          lastSeenRef.current = data.reply.createdAt;
        }

        if (data.reminderCreated) {
          showBanner(
            data.reminderCreated.content,
            formatKoreanTime(new Date(data.reminderCreated.triggerAt))
          );
          refreshReminders();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        setSending(false);
      }
    },
    [activeCharacterId, refreshReminders, showBanner]
  );

  const handleDeleteReminder = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "삭제에 실패했습니다.");
      }
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "리마인더 삭제에 실패했습니다.");
    }
  }, []);

  const activeCharacter = getCharacterById(activeCharacterId) ?? CHARACTERS[0];
  const activeMessages = allMessages.filter((m) => m.characterId === activeCharacterId);

  return (
    <div className="flex h-screen flex-col">
      <CharacterSwitcher
        characters={CHARACTERS}
        activeCharacterId={activeCharacterId}
        onSelect={(id) => {
          setActiveCharacterId(id);
          setError(null);
        }}
      />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 flex-1 flex-col">
          {banner && (
            <ReminderCreatedBanner
              content={banner.content}
              timeLabel={banner.timeLabel}
              onDismiss={() => setBanner(null)}
            />
          )}
          <ChatWindow
            character={activeCharacter}
            messages={activeMessages}
            onSend={handleSend}
            sending={sending}
            error={error}
          />
        </div>
        <ReminderPanel reminders={reminders} onDelete={handleDeleteReminder} />
      </div>
      {toast && <NewMessageToast text={toast} />}
    </div>
  );
}
