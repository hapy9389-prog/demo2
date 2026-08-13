"use client";

import { Character } from "@/types";
import { Avatar } from "./Avatar";

/** 채팅 화면 상단 헤더: 뒤로가기 + 캐릭터 아바타/이름/상태 문구 + 리마인더 버튼. */
export function ChatHeader({
  character,
  onBack,
  onOpenReminders,
}: {
  character: Character;
  onBack: () => void;
  onOpenReminders: () => void;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-neutral-200 bg-white px-3 py-3">
      <button
        onClick={onBack}
        aria-label="뒤로가기"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-neutral-600 hover:bg-neutral-100"
      >
        ‹
      </button>
      <Avatar character={character} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-neutral-900">{character.name}</p>
        <p className="truncate text-xs text-neutral-500">{character.tagline}</p>
      </div>
      <button
        onClick={onOpenReminders}
        aria-label="리마인더 목록 열기"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg hover:bg-neutral-100"
      >
        🔔
      </button>
    </header>
  );
}
