"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Character, Message, ReminderCardItem } from "@/types";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { ReminderSystemCard } from "./ReminderSystemCard";

type TimelineItem =
  | { kind: "message"; key: string; createdAt: string; data: Message }
  | { kind: "reminderCard"; key: string; createdAt: string; data: ReminderCardItem };

export function ChatWindow({
  character,
  messages,
  reminderCards,
  bellPulseTick,
  onSend,
  sending,
  error,
  onBack,
  onOpenReminders,
}: {
  character: Character;
  messages: Message[];
  reminderCards: ReminderCardItem[];
  /** 리마인더/proactive 메시지가 도착할 때마다 증가 — ChatHeader의 bell 강조 애니메이션에 그대로 전달. */
  bellPulseTick: number;
  onSend: (text: string) => void;
  sending: boolean;
  error: string | null;
  onBack: () => void;
  onOpenReminders: () => void;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // 일반 대화 메시지와 리마인더 등록 시스템 카드를 시간순으로 병합해 한 스크롤에 보여준다.
  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...messages.map((m) => ({
        kind: "message" as const,
        key: m.id,
        createdAt: m.createdAt,
        data: m,
      })),
      ...reminderCards.map((c) => ({
        kind: "reminderCard" as const,
        key: `card-${c.id}`,
        createdAt: c.createdAt,
        data: c,
      })),
    ];
    return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [messages, reminderCards]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline.length]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    onSend(text);
    setInput("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-neutral-50">
      <ChatHeader
        character={character}
        bellPulseTick={bellPulseTick}
        onBack={onBack}
        onOpenReminders={onOpenReminders}
      />

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {timeline.length === 0 && (
          <p className="mt-10 text-center text-sm text-neutral-400">
            {character.emoji} {character.name}에게 말을 걸어보세요.
          </p>
        )}
        {timeline.map((item) =>
          item.kind === "message" ? (
            <MessageBubble key={item.key} message={item.data} character={character} />
          ) : (
            <ReminderSystemCard
              key={item.key}
              content={item.data.content}
              timeLabel={item.data.timeLabel}
            />
          )
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-neutral-200 bg-white p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`${character.name}에게 메시지 보내기...`}
          className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm outline-none focus:border-rose-400"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-full bg-rose-500 px-5 py-2 text-sm font-medium text-white transition-colors disabled:opacity-40"
        >
          {sending ? "..." : "전송"}
        </button>
      </form>
    </div>
  );
}
