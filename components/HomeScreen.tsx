"use client";

import { formatKoreanTime } from "@/lib/time";
import { Character, Message } from "@/types";
import { Avatar } from "./Avatar";

export interface HomeRow {
  character: Character;
  lastMessage?: Message;
  unread: boolean;
}

/** 캐릭터 목록을 메신저 채팅방 리스트처럼 보여주는 홈 화면. */
export function HomeScreen({
  rows,
  pendingReminderCount,
  onSelect,
  onOpenReminders,
}: {
  rows: HomeRow[];
  pendingReminderCount: number;
  onSelect: (characterId: string) => void;
  onOpenReminders: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
        <h1 className="text-lg font-bold text-neutral-900">AI 캐릭터 채팅</h1>
        <button
          onClick={onOpenReminders}
          aria-label="리마인더 목록 열기"
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-lg transition-colors hover:bg-neutral-200"
        >
          🔔
          {pendingReminderCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {pendingReminderCount}
            </span>
          )}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {rows.map(({ character, lastMessage, unread }) => (
          <button
            key={character.id}
            onClick={() => onSelect(character.id)}
            className="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100"
          >
            <Avatar character={character} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-neutral-900">{character.name}</span>
                {unread && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-hidden />
                )}
              </div>
              <p className="truncate text-sm text-neutral-500">
                {lastMessage ? lastMessage.content : character.tagline}
              </p>
            </div>
            {lastMessage && (
              <span className="shrink-0 text-xs text-neutral-400">
                {formatKoreanTime(new Date(lastMessage.createdAt))}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
