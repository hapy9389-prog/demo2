import { Message } from "@/types";

export function MessageBubble({
  message,
  characterEmoji,
}: {
  message: Message;
  characterEmoji: string;
}) {
  const isUser = message.role === "user";
  const isReminder = message.origin === "reminder";

  return (
    <div className={`flex animate-message-in ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-sm bg-neutral-900 text-white"
            : "rounded-bl-sm border border-neutral-200 bg-white text-neutral-900"
        }`}
      >
        {!isUser && isReminder && (
          <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-amber-600">
            <span>{characterEmoji}</span>
            <span>먼저 말을 걸었어요</span>
          </div>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
