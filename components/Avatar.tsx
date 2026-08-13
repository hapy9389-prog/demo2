"use client";

import { useState } from "react";
import { Character, CharacterAccent } from "@/types";

const ACCENT_STYLE: Record<CharacterAccent, string> = {
  blue: "bg-sky-100 text-sky-700",
  rose: "bg-rose-100 text-rose-700",
};

const SIZE_CLASS = {
  sm: "h-8 w-8 text-base",
  md: "h-11 w-11 text-xl",
  lg: "h-14 w-14 text-2xl",
} as const;

type AvatarCharacter = Pick<Character, "name" | "emoji" | "image" | "accent">;

/**
 * 캐릭터 아바타 공용 컴포넌트. character.image가 있으면 이미지를 우선 표시하고,
 * 이미지가 없거나(필드 미지정) 로드에 실패하면(onError) emoji+accent 배경으로 자동 폴백한다.
 * 홈 화면 목록/채팅 헤더/메시지 버블 3곳에서 공용으로 쓴다.
 */
export function Avatar({
  character,
  size = "md",
  emphasize = false,
}: {
  character: AvatarCharacter;
  size?: keyof typeof SIZE_CLASS;
  /** 리마인더 발화처럼 "먼저 연락했다"는 느낌을 강조하고 싶을 때 은은한 링 효과 */
  emphasize?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(character.image) && !imageFailed;

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ${SIZE_CLASS[size]} ${
        showImage ? "bg-neutral-100" : ACCENT_STYLE[character.accent]
      } ${emphasize ? "ring-2 ring-amber-300 ring-offset-2" : ""}`}
    >
      {showImage ? (
        // 파일이 없을 수도 있는 로컬 정적 경로라 next/image보다 onError 폴백을
        // 다루기 쉬운 일반 img를 쓴다.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={character.image}
          alt={character.name}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center leading-none">
          {character.emoji}
        </span>
      )}
    </div>
  );
}
