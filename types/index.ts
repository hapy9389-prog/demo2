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
 */
export type ReminderExtraction =
  | {
      kind: "relative_minutes";
      relative_minutes: number;
      original_phrase: string;
      content: string;
    }
  | {
      kind: "time_of_day";
      hour: number;
      minute: number;
      original_phrase: string;
      content: string;
    };

export interface Character {
  id: string;
  name: string;
  emoji: string;
  /** 한 줄 소개 - UI의 캐릭터 전환 버튼 등에 사용 */
  tagline: string;
  systemPrompt: string;
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
