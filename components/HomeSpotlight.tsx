"use client";

import { ACCENT_CARD_STYLE } from "@/lib/accentColors";
import { calculateInteractionGap, formatElapsedKorean } from "@/lib/interactionTime";
import { SpotlightPick, describeCharacterStatus, getCharacterStatus } from "@/lib/homeStatus";
import { Avatar } from "./Avatar";

const REASON_LABEL: Record<SpotlightPick["reason"], string> = {
  long_absence: "오랜만이에요",
  recent: "이어서 대화해요",
  first_time: "새로운 만남",
};

/**
 * 홈 화면 최상단 히어로 카드. 어떤 캐릭터를 보여줄지는 lib/homeStatus.ts의
 * pickSpotlightCharacter()가 이미 결정해서 넘겨준다 — 이 컴포넌트는 그 결과를
 * 렌더링만 한다(선정 로직을 갖지 않음).
 */
export function HomeSpotlight({
  pick,
  onSelect,
}: {
  pick: SpotlightPick;
  onSelect: (characterId: string) => void;
}) {
  const { row, reason } = pick;
  const { character, lastUserMessageAt } = row;

  const status = getCharacterStatus(row);
  const statusText = status.kind === "new" ? character.tagline : describeCharacterStatus(status);

  const elapsedText = lastUserMessageAt
    ? `${formatElapsedKorean(calculateInteractionGap(new Date(lastUserMessageAt)))} 전 대화`
    : "아직 대화한 적 없어요";

  return (
    <div
      className={`flex items-center gap-4 rounded-3xl border p-4 shadow-md ${ACCENT_CARD_STYLE[character.accent]}`}
    >
      <Avatar character={character} size="xl" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">
          {REASON_LABEL[reason]}
        </p>
        <p className="mt-0.5 truncate text-lg font-bold text-neutral-900">{character.name}</p>
        <p className="truncate text-sm text-neutral-600">{statusText}</p>
        <p className="mt-0.5 text-xs text-neutral-400">{elapsedText}</p>
        <button
          onClick={() => onSelect(character.id)}
          className="mt-3 rounded-full bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-600"
        >
          대화하러 가기
        </button>
      </div>
    </div>
  );
}
