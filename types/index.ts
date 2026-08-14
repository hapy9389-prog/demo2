// 앱 전역에서 쓰는 핵심 데이터 타입.
// Reminder/Message는 lib/store.ts가 관리하는 인메모리(+JSON 백업) 저장소의 레코드 모양이다.

export type ReminderStatus = "pending" | "processing" | "fired" | "failed";

export interface Reminder {
  id: string;
  /** 리마인더를 등록할 당시 활성 캐릭터. 이후 사용자가 다른 캐릭터로 전환해도 바뀌지 않는다. */
  characterId: string;
  createdAt: string; // ISO
  /** 실제 발화되어야 할 절대 시각 (ISO). 서버의 resolveTriggerTime()이 계산한다. */
  triggerAt: string;
  /** 사용자가 말한 원문 시간 표현. 예: "오늘 오후 2시", "1분 뒤" */
  originalPhrase: string;
  /** 무엇을 알려줘야 하는지 요약. 예: "물 마시기" */
  content: string;
  status: ReminderStatus;
  firedAt?: string;
  /** 이 리마인더를 만든 원본 사용자 채팅 메시지 id */
  sourceMessageId?: string;
}

export type MessageOrigin = "chat" | "reminder";

export interface Message {
  id: string;
  characterId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string; // ISO
  /** 'chat' = 일반 대화 응답, 'reminder' = 스케줄러가 발화시킨 proactive 메시지 */
  origin: MessageOrigin;
  reminderId?: string;
}

/**
 * Claude가 schedule_reminder tool 호출로 반환하는 "구조화된 의도"다.
 * 실제 절대 시각 계산은 하지 않는다 — lib/time.ts의 resolveTriggerTime()이 담당.
 *
 * - relative_minutes: "1분 뒤" 같은 상대 분
 * - time_of_day: "오늘 오후 2시" 같은 오늘 특정 시각
 * - relative_days: "내일"/"모레"/"3일 뒤" 같은 상대 일수(+선택적 시각, 또는 "이 시간에")
 * - date_time: "8월 20일 오후 2시" 같은 특정 날짜(+선택적 연도) + 시각
 *
 * 모든 kind는 공통으로 source_text를 갖는다 — 이 리마인더 요청의 근거가 된, 현재 사용자
 * 메시지에서 그대로 복사한 원문(의역 금지)이다. 서버가 lib/reminderGuard.ts의
 * isSourceTextFromCurrentMessage()로 실제 현재 메시지에 포함되는지 재검증한다. Claude가
 * conversation history 속 과거 요청을 근거로 삼았다면(=source_text가 현재 메시지에 없다면)
 * 리마인더 생성을 차단하기 위한 서버 측 hard guard용 필드다.
 */
export type ReminderExtraction =
  | {
      kind: "relative_minutes";
      relative_minutes: number;
      original_phrase: string;
      content: string;
      source_text: string;
    }
  | {
      kind: "time_of_day";
      hour: number;
      minute: number;
      original_phrase: string;
      content: string;
      source_text: string;
    }
  | {
      kind: "relative_days";
      /** 오늘로부터 며칠 뒤인지. 내일=1, 모레=2, "3일 뒤"=3, "일주일 뒤"=7 */
      relative_days: number;
      /** "내일 이 시간에"처럼 시각 언급 없이 지금 시:분을 그대로 쓰고 싶다는 뜻이면 true */
      use_current_time: boolean;
      /** use_current_time이 false일 때만 필수 */
      hour?: number;
      minute?: number;
      original_phrase: string;
      content: string;
      source_text: string;
    }
  | {
      kind: "date_time";
      /** 사용자가 연도를 명시했을 때만 존재. 없으면 서버가 가장 가까운 미래 연도를 선택한다. */
      year?: number;
      month: number;
      day: number;
      hour: number;
      minute: number;
      original_phrase: string;
      content: string;
      source_text: string;
    };

export type CharacterAccent = "blue" | "rose" | "amber" | "slate" | "zinc" | "violet";

export interface Character {
  id: string;
  name: string;
  /** 이미지가 없거나 로드 실패 시 Avatar가 자동으로 폴백하는 이모지 */
  emoji: string;
  /**
   * 실제 캐릭터 이미지 경로(예: "/characters/rei.png", public/characters/ 아래).
   * 지정돼 있어도 파일이 없으면 Avatar 컴포넌트가 onError로 감지해 emoji로 폴백한다.
   */
  image?: string;
  /** 아바타 폴백(이모지) 배경색 테마 - 캐릭터별 방 구분용 */
  accent: CharacterAccent;
  /** 한 줄 소개 - 채팅 헤더의 상태 문구 등에 사용 */
  tagline: string;
  systemPrompt: string;
}

/**
 * 리마인더 등록 확인 카드(ReminderSystemCard)를 채팅 스크롤에 렌더링하기 위한
 * 클라이언트 전용 항목. 서버에 저장되지 않으므로 새로고침하면 사라진다 — MVP 트레이드오프.
 */
export interface ReminderCardItem {
  id: string;
  characterId: string;
  content: string;
  timeLabel: string;
  originalPhrase: string;
  createdAt: string;
}

/** GET /api/reminders 응답 항목 - 표시용으로 캐릭터 이름/이모지를 덧붙인 형태 */
export interface ReminderWithCharacter extends Reminder {
  characterName: string;
  characterEmoji: string;
}

/** POST /api/chat 응답 모양 */
export interface ChatResponse {
  userMessage: Message;
  reply: Message;
  reminderCreated?: {
    id: string;
    content: string;
    triggerAt: string;
    originalPhrase: string;
  };
}
