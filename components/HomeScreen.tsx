"use client";

import { ReminderWithCharacter } from "@/types";
import { HomeRow, SpotlightPick } from "@/lib/homeStatus";
import { CharacterCard } from "./CharacterCard";
import { HomeReminderSummary } from "./HomeReminderSummary";
import { HomeSpotlight } from "./HomeSpotlight";

export type { HomeRow };

/**
 * 홈 화면. 헤더(고정) + 스크롤 영역(Spotlight 히어로 → 리마인더 요약 → 캐릭터 그리드)로
 * 구성된 오케스트레이터. 캐릭터 "상태" 판단은 여기서 하지 않고 lib/homeStatus.ts에 맡긴다.
 */
export function HomeScreen({
  rows,
  spotlight,
  reminders,
  pendingReminderCount,
  bellPulseTick,
  onSelect,
  onOpenReminders,
}: {
  rows: HomeRow[];
  /** 히어로에 띄울 캐릭터. 캐릭터가 하나도 없을 때만 null(현재 앱에서는 발생하지 않음). */
  spotlight: SpotlightPick | null;
  reminders: ReminderWithCharacter[];
  pendingReminderCount: number;
  /** 리마인더/proactive 메시지가 도착할 때마다 증가 — bell 아이콘 강조 애니메이션 재생용. */
  bellPulseTick: number;
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
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-lg text-amber-600 transition-colors hover:bg-amber-100"
        >
          <span
            key={bellPulseTick}
            className={bellPulseTick > 0 ? "inline-block animate-bell-ring" : "inline-block"}
          >
            🔔
          </span>
          {pendingReminderCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
              {pendingReminderCount}
            </span>
          )}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-4">
        {spotlight && (
          <div className="px-4 pt-4">
            <HomeSpotlight pick={spotlight} onSelect={onSelect} />
          </div>
        )}

        <HomeReminderSummary reminders={reminders} onOpenReminders={onOpenReminders} />

        <p className="px-4 pb-2 pt-5 text-xs font-medium uppercase tracking-wide text-neutral-400">
          캐릭터
        </p>
        <div className="grid grid-cols-2 gap-3 px-4">
          {rows.map((row) => (
            <CharacterCard key={row.character.id} row={row} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}
