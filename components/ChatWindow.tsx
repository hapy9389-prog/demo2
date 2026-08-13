"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Character, Message } from "@/types";
import { MessageBubble } from "./MessageBubble";

export function ChatWindow({
  character,
  messages,
  onSend,
  sending,
  error,
}: {
  character: Character;
  messages: Message[];
  onSend: (text: string) => void;
  sending: boolean;
  error: string | null;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    onSend(text);
    setInput("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-neutral-400">
            {character.emoji} {character.name}에게 말을 걸어보세요.
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} characterEmoji={character.emoji} />
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-neutral-200 bg-white p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`${character.name}에게 메시지 보내기...`}
          className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm outline-none focus:border-neutral-500"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {sending ? "..." : "전송"}
        </button>
      </form>
    </div>
  );
}
