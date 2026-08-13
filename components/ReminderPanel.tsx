"use client";

import { ReminderStatus, ReminderWithCharacter } from "@/types";
import { formatKoreanTime } from "@/lib/time";

const STATUS_LABEL: Record<ReminderStatus, string> = {
  pending: "예정",
  processing: "처리중",
  fired: "완료",
  failed: "실패",
};

const STATUS_STYLE: Record<ReminderStatus, string> = {
  pending: "bg-blue-50 text-blue-600",
  processing: "bg-amber-50 text-amber-600",
  fired: "bg-emerald-50 text-emerald-600",
  failed: "bg-red-50 text-red-600",
};

export function ReminderPanel({
  reminders,
  onDelete,
}: {
  reminders: ReminderWithCharacter[];
  onDelete: (id: string) => void;
}) {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-neutral-700">🔔 등록된 리마인더</h2>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {reminders.length === 0 && (
          <p className="mt-6 text-center text-xs text-neutral-400">
            아직 등록된 리마인더가 없어요.
          </p>
        )}
        {reminders.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-neutral-200 p-3 text-xs animate-message-in"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-700">
                {r.characterEmoji} {r.characterName}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLE[r.status]}`}
              >
                {STATUS_LABEL[r.status]}
              </span>
            </div>
            <p className="mt-1.5 text-neutral-800">{r.content}</p>
            <p className="mt-0.5 text-neutral-400">
              {formatKoreanTime(new Date(r.triggerAt))} · &quot;{r.originalPhrase}&quot;
            </p>
            {r.status === "pending" && (
              <button
                onClick={() => onDelete(r.id)}
                className="mt-2 font-medium text-red-500 hover:text-red-700"
              >
                취소하기
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
