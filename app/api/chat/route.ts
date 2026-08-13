import { NextRequest, NextResponse } from "next/server";
import { getCharacterById } from "@/lib/characters";
import { chatWithCharacter } from "@/lib/claude";
import { addMessage, addReminder, getRecentHistory } from "@/lib/store";
import { resolveTriggerTime, validateTriggerTime } from "@/lib/time";
import { ChatResponse } from "@/types";

// Claude 호출 지점 #1: 일반 채팅 응답 생성 + (있다면) 리마인더 intent 추출을
// 한 번의 호출로 처리한다. 시간 계산은 여기서 하지 않고 서버의 결정적 함수에 위임한다.
export async function POST(req: NextRequest) {
  let body: { characterId?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const { characterId, message } = body;
  if (!characterId || !message || !message.trim()) {
    return NextResponse.json(
      { error: "characterId와 message는 필수입니다." },
      { status: 400 }
    );
  }

  const character = getCharacterById(characterId);
  if (!character) {
    return NextResponse.json({ error: "존재하지 않는 캐릭터입니다." }, { status: 404 });
  }

  const trimmedMessage = message.trim();
  const history = getRecentHistory(characterId);

  const userMsg = addMessage({
    characterId,
    role: "user",
    content: trimmedMessage,
    origin: "chat",
  });

  let chatResult;
  try {
    chatResult = await chatWithCharacter(character, history, trimmedMessage);
  } catch (err) {
    console.error("[api/chat] Claude 호출 실패:", err);
    return NextResponse.json(
      { error: "캐릭터 응답 생성에 실패했습니다. API 키/네트워크를 확인해주세요." },
      { status: 502 }
    );
  }

  const assistantMsg = addMessage({
    characterId,
    role: "assistant",
    content: chatResult.replyText,
    origin: "chat",
  });

  const responseBody: ChatResponse = { userMessage: userMsg, reply: assistantMsg };

  if (chatResult.extraction) {
    const now = new Date();
    const triggerAt = resolveTriggerTime(chatResult.extraction, now);
    const validation = validateTriggerTime(triggerAt, now);

    if (validation.ok) {
      const reminder = addReminder({
        characterId,
        triggerAt: triggerAt.toISOString(),
        originalPhrase: chatResult.extraction.original_phrase,
        content: chatResult.extraction.content,
        sourceMessageId: userMsg.id,
      });
      responseBody.reminderCreated = {
        id: reminder.id,
        content: reminder.content,
        triggerAt: reminder.triggerAt,
        originalPhrase: reminder.originalPhrase,
      };
    } else {
      // 검증 실패(과거 시각/48시간 초과/형식 이상)면 조용히 리마인더를 만들지 않는다.
      // 캐릭터의 채팅 답변 자체는 이미 자연스럽게 나갔으므로 사용자 경험이 완전히 끊기진 않는다.
      console.warn(
        "[api/chat] 리마인더 시간 검증 실패:",
        validation.reason,
        chatResult.extraction
      );
    }
  }

  return NextResponse.json(responseBody);
}
