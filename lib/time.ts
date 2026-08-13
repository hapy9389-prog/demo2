import { ReminderExtraction } from "@/types";

// 리마인더는 "오늘" 범위만 지원하는 MVP이므로, 너무 먼 미래로 잘못 계산되는 걸 막기 위한 상한선.
const MAX_FUTURE_MS = 48 * 60 * 60 * 1000; // 48시간

/**
 * Claude가 schedule_reminder tool로 추출한 구조화된 시간 표현(kind + 필드)을
 * 서버가 결정적으로(deterministic) 절대 시각으로 변환한다.
 *
 * Claude는 이 계산에 전혀 관여하지 않는다 — "1분 뒤", "오후 2시" 같은 표현의
 * 실제 시:분 산술은 LLM이 아니라 여기서만 일어나므로 계산 오류 가능성이 없고,
 * 이 함수만 독립적으로 테스트할 수 있다.
 */
export function resolveTriggerTime(
  extraction: ReminderExtraction,
  now: Date = new Date()
): Date {
  if (extraction.kind === "relative_minutes") {
    return new Date(now.getTime() + extraction.relative_minutes * 60_000);
  }
  // time_of_day: 오늘 날짜에 hour:minute을 그대로 적용한다.
  // 서버가 실행되는 로컬 타임존(데모 전제상 KST)을 그대로 사용하며 별도 변환은 하지 않는다.
  const result = new Date(now);
  result.setHours(extraction.hour, extraction.minute, 0, 0);
  return result;
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: "past" | "too_far" | "invalid" };

/** 계산된 triggerAt이 실제로 리마인더로 등록할 만한 값인지 검증한다. */
export function validateTriggerTime(
  triggerAt: Date,
  now: Date = new Date()
): ValidationResult {
  if (Number.isNaN(triggerAt.getTime())) return { ok: false, reason: "invalid" };
  if (triggerAt.getTime() <= now.getTime()) return { ok: false, reason: "past" };
  if (triggerAt.getTime() - now.getTime() > MAX_FUTURE_MS) {
    return { ok: false, reason: "too_far" };
  }
  return { ok: true };
}

/** Claude tool_use의 raw input이 스키마상 유효한 값 범위인지 확인한다(자릿수/범위 sanity check). */
export function isValidExtractionShape(extraction: ReminderExtraction): boolean {
  if (extraction.kind === "relative_minutes") {
    return (
      Number.isFinite(extraction.relative_minutes) && extraction.relative_minutes > 0
    );
  }
  if (extraction.kind === "time_of_day") {
    return (
      Number.isInteger(extraction.hour) &&
      extraction.hour >= 0 &&
      extraction.hour <= 23 &&
      Number.isInteger(extraction.minute) &&
      extraction.minute >= 0 &&
      extraction.minute <= 59
    );
  }
  return false;
}

/** "오후 1:35" 같은 한글 시간 표기로 변환. 리마인더 등록 배너/패널 표시용. */
export function formatKoreanTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? "오전" : "오후";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${period} ${hour12}:${String(minutes).padStart(2, "0")}`;
}
