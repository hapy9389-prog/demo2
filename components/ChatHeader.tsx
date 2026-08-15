"use client";

import { Character } from "@/types";
import { Avatar } from "./Avatar";

/** 채팅 화면 상단 헤더: 뒤로가기 + 캐릭터 아바타/이름/상태 문구 + 리마인더 버튼. */
export function ChatHeader({
  character,
  bellPulseTick,
  onBack,
  onOpenReminders,
}: {
  character: Character;
  /** 리마인더/proactive 메시지가 도착할 때마다 증가 — bell 아이콘 강조 애니메이션 재생용. */
  bellPulseTick: number;
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
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-lg text-amber-600 transition-colors hover:bg-amber-100"
      >
        <span
          key={bellPulseTick}
          className={bellPulseTick > 0 ? "inline-block animate-bell-ring" : "inline-block"}
        >
          🔔
        </span>
      </button>
    </header>
  );
}
