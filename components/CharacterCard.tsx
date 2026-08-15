"use client";

import { ACCENT_CARD_STYLE } from "@/lib/accentColors";
import { HomeRow, describeCharacterStatus, getCharacterStatus } from "@/lib/homeStatus";
import { Avatar } from "./Avatar";

/** 홈 화면 캐릭터 그리드의 한 셀. 상태 판단은 lib/homeStatus.ts에 맡기고 렌더링만 한다. */
export function CharacterCard({
  row,
  onSelect,
}: {
  row: HomeRow;
  onSelect: (characterId: string) => void;
}) {
  const { character, lastMessage, unread, nearestPendingReminder } = row;
  const status = getCharacterStatus(row);
  // "new"(대화 이력 없음)는 표시할 상태 문구가 없다는 뜻 — 이 경우 상태 줄 자체를 생략해서
  // preview 줄(태그라인)과 문구가 중복되지 않게 한다.
  const statusText = status.kind === "new" ? "" : describeCharacterStatus(status);
  const statusToneClass =
    status.kind === "unread" || status.kind === "reminder"
      ? "font-medium text-amber-700"
      : "text-neutral-400";

  return (
    <button
      onClick={() => onSelect(character.id)}
      className={`flex flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition-transform active:scale-[0.98] ${ACCENT_CARD_STYLE[character.accent]}`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl">
        <Avatar character={character} size="fill" shape="square" />
        {nearestPendingReminder && (
          <span
            className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] shadow"
            aria-hidden
          >
            🔔
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 p-2.5">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-neutral-900">
            {character.name}
          </span>
          {unread && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 ring-2 ring-amber-200"
              aria-hidden
            />
          )}
        </div>
        <p className="truncate text-xs text-neutral-500">
          {lastMessage ? lastMessage.content : character.tagline}
        </p>
        {statusText && (
          <p className={`truncate text-[11px] ${statusToneClass}`}>{statusText}</p>
        )}
      </div>
    </button>
  );
}
