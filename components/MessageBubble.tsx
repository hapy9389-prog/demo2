import { formatKoreanTime } from "@/lib/time";
import { Character, Message } from "@/types";
import { Avatar } from "./Avatar";

export function MessageBubble({
  message,
  character,
}: {
  message: Message;
  character: Character;
}) {
  const isUser = message.role === "user";
  const isReminder = message.origin === "reminder";
  const time = formatKoreanTime(new Date(message.createdAt));

  return (
    <div
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"} ${
        isReminder ? "animate-message-in-strong" : "animate-message-in"
      }`}
    >
      {!isUser && <Avatar character={character} size="sm" emphasize={isReminder} />}
      <div className={`flex max-w-[75%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
            isUser
              ? "rounded-br-sm bg-rose-500 text-white"
              : "rounded-bl-sm border border-neutral-200 bg-white text-neutral-900"
          }`}
        >
          {!isUser && isReminder && (
            <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-amber-600">
              <span>🔔</span>
              <span>먼저 말을 걸었어요</span>
            </div>
          )}
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="mt-1 px-1 text-[10px] text-neutral-400">{time}</span>
      </div>
    </div>
  );
}
