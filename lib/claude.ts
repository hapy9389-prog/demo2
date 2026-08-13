import Anthropic from "@anthropic-ai/sdk";
import { Character, Message, Reminder, ReminderExtraction } from "@/types";
import { isValidExtractionShape } from "./time";

// 두 호출 지점(일반 채팅 / 리마인더 발화) 모두 기본적으로 같은 모델을 쓴다.
// 캐릭터 간 personality 차이가 뚜렷하게 느껴져야 한다는 요구사항 때문에 품질을 우선했다.
// 모델 ID가 계정/시점에 따라 다르면 코드 수정 없이 .env.local에서 바로 교체할 수 있다.
const CHAT_MODEL = process.env.ANTHROPIC_CHAT_MODEL || "claude-sonnet-5";
const REMINDER_MODEL = process.env.ANTHROPIC_REMINDER_MODEL || "claude-sonnet-5";
const CHAT_MAX_TOKENS = 600;
const REMINDER_MAX_TOKENS = 300;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local에 키를 넣어주세요."
    );
  }
  client = new Anthropic({ apiKey });
  return client;
}

/**
 * 시간 계산은 절대 Claude에게 맡기지 않는다. Claude는 "언제(kind)"와
 * "얼마나/몇시몇분"에 해당하는 값, 그리고 원문/요약만 이 스키마로 추출한다.
 * 실제 절대 시각 계산은 lib/time.ts의 resolveTriggerTime()이 결정적으로 수행한다.
 */
const scheduleReminderTool: Anthropic.Tool = {
  name: "schedule_reminder",
  description: `사용자가 특정 미래 시점에 무언가를 알려달라고 요청했을 때 호출하세요.
시간 계산은 하지 마세요 - 사용자가 말한 시간 표현을 그대로 구조화된 필드로만 옮기면 됩니다.

가장 중요한 규칙 - 반드시 지키세요:
- 이 도구는 오직 "방금 사용자가 보낸 메시지" 자체가 새로운 리마인더 등록 요청을 명확히 담고 있을 때만 호출하세요.
- 대화 히스토리에 예전에 리마인더를 요청한 기록이 있다는 이유만으로 다시 호출하지 마세요. 이미 등록했거나 이미 발화(전달)된 리마인더를 재실행/재등록하지 마세요.
- "알려줘서 고마워", "이제 그만해", "다른 얘기하자", "아직 시간 안 지났거든" 같은, 과거 리마인더에 대한 반응/언급일 뿐 새로운 요청이 아닌 메시지에는 절대 호출하지 마세요.
- 단, 사용자가 "다시 알려줘"처럼 명시적으로 재요청하거나 새로운 시간을 지정하면 그건 진짜 새 요청이므로 정상적으로 호출하세요.

시간 표현 매핑:
- "1분 뒤", "10분 있다가"처럼 지금으로부터 상대적인 시간이면 kind="relative_minutes"와 relative_minutes를 채우세요.
- "오늘 오후 2시", "저녁 7시"처럼 오늘의 특정 시각이면 kind="time_of_day"와 hour(0-23)/minute(0-59)를 채우세요.
- 이미 지난 시각이거나, "내일"/"다음주"처럼 오늘이 아닌 날짜이거나, "나중에"처럼 특정할 수 없는 표현이면 이 도구를 호출하지 마세요.`,
  input_schema: {
    type: "object",
    properties: {
      kind: {
        type: "string",
        enum: ["relative_minutes", "time_of_day"],
        description: "시간 표현의 종류",
      },
      relative_minutes: {
        type: "number",
        description: "kind가 relative_minutes일 때만 채움: 지금으로부터 몇 분 뒤인지",
      },
      hour: {
        type: "integer",
        description: "kind가 time_of_day일 때만 채움: 0-23시",
      },
      minute: {
        type: "integer",
        description: "kind가 time_of_day일 때만 채움: 0-59분",
      },
      original_phrase: {
        type: "string",
        description: "사용자가 말한 시간 표현 원문. 예: '오늘 오후 2시', '1분 뒤'",
      },
      content: {
        type: "string",
        description: "무엇을 알려줘야 하는지 짧은 요약. 예: '물 마시기'",
      },
    },
    required: ["kind", "original_phrase", "content"],
  },
};

function parseExtraction(raw: unknown): ReminderExtraction | null {
  if (typeof raw !== "object" || raw === null) return null;
  const input = raw as Record<string, unknown>;

  const original_phrase =
    typeof input.original_phrase === "string" ? input.original_phrase : "";
  const content = typeof input.content === "string" ? input.content : "";
  if (!original_phrase || !content) return null;

  if (input.kind === "relative_minutes") {
    const extraction: ReminderExtraction = {
      kind: "relative_minutes",
      relative_minutes: Number(input.relative_minutes),
      original_phrase,
      content,
    };
    return isValidExtractionShape(extraction) ? extraction : null;
  }

  if (input.kind === "time_of_day") {
    const extraction: ReminderExtraction = {
      kind: "time_of_day",
      hour: Number(input.hour),
      minute: Number(input.minute),
      original_phrase,
      content,
    };
    return isValidExtractionShape(extraction) ? extraction : null;
  }

  return null;
}

export interface ChatResult {
  replyText: string;
  extraction: ReminderExtraction | null;
}

/**
 * Claude API 호출 #1 — 일반 채팅 응답과 리마인더 intent 추출을 한 번의 호출로 합친다.
 * 별도의 "분류용 호출"을 두면 지연/비용이 배로 들기 때문.
 *
 * 히스토리는 우리 store의 Message{role, content} 텍스트만 재구성해서 보낸다 — 과거
 * tool_use/tool_result 블록은 재전송하지 않는다. Claude는 이번 턴의 사용자 메시지만
 * 보고 리마인더 여부를 판단하면 되므로 기능상 문제가 없고, tool_use/tool_result
 * 페어링을 관리해야 하는 복잡도를 통째로 없앨 수 있다.
 */
export async function chatWithCharacter(
  character: Character,
  history: Message[],
  userMessage: string
): Promise<ChatResult> {
  const anthropic = getClient();

  const messages: Anthropic.MessageParam[] = [
    ...history.map(
      (m): Anthropic.MessageParam => ({ role: m.role, content: m.content })
    ),
    { role: "user", content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model: CHAT_MODEL,
    max_tokens: CHAT_MAX_TOKENS,
    system: character.systemPrompt,
    tools: [scheduleReminderTool],
    messages,
  });

  let replyText = "";
  let extraction: ReminderExtraction | null = null;

  for (const block of response.content) {
    if (block.type === "text") {
      replyText += block.text;
    } else if (
      block.type === "tool_use" &&
      block.name === "schedule_reminder" &&
      !extraction // 한 턴당 하나만 처리(중복 리마인더 방지)
    ) {
      extraction = parseExtraction(block.input);
    }
  }

  if (!replyText.trim()) {
    // 텍스트 없이 tool_use만 오는 드문 경우를 대비한 최소 fallback
    replyText = "응, 알겠어.";
  }

  return { replyText: replyText.trim(), extraction };
}

/**
 * Claude API 호출 #2 — 스케줄러가 due 리마인더를 발견했을 때, 사용자 요청과 무관하게
 * 서버가 스스로 트리거하는 호출. tool은 필요 없다(이미 시간은 정해졌으므로).
 */
export async function fireReminderMessage(
  character: Character,
  reminder: Reminder
): Promise<string> {
  const anthropic = getClient();

  const instruction = `[상황] 지금은 사용자가 예전에 부탁한 리마인더가 울리는 시점입니다.
사용자가 요청한 원래 시간 표현: "${reminder.originalPhrase}"
알려줘야 할 내용: "${reminder.content}"

사용자는 지금 아무 말도 하지 않았습니다. 당신이 캐릭터 성격에 맞게 먼저 말을 거는
상황입니다. 실제로 캐릭터가 할 법한 대사만 답하세요(설명이나 메타 코멘트 없이).`;

  try {
    const response = await anthropic.messages.create({
      model: REMINDER_MODEL,
      max_tokens: REMINDER_MAX_TOKENS,
      system: character.systemPrompt,
      messages: [{ role: "user", content: instruction }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join(" ")
      .trim();

    return text || fallbackReminderMessage(character, reminder);
  } catch (err) {
    console.error("[claude] 리마인더 발화 호출 실패:", err);
    throw err;
  }
}

function fallbackReminderMessage(character: Character, reminder: Reminder): string {
  return `(${character.name}) ${reminder.content} 시간이야!`;
}
