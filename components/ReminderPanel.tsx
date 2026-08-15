"use client";

import { ReminderStatus, ReminderWithCharacter } from "@/types";
import { formatReminderTime } from "@/lib/time";

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

/**
 * 리마인더 목록 바텀시트. 부모(폰 프레임 body)가 `relative`여야 이 안에서
 * `absolute inset-0`이 브라우저 전체가 아니라 폰 화면 안에서만 덮인다.
 */
export function ReminderPanel({
  open,
  reminders,
  onClose,
  onDelete,
}: {
  open: boolean;
  reminders: ReminderWithCharacter[];
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-black/30"
      />
      <div className="relative z-10 flex max-h-[70%] animate-sheet-up flex-col rounded-t-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/40 px-4 py-3">
          <h2 className="text-sm font-semibold text-amber-700">🔔 등록된 리마인더</h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="text-neutral-400 hover:text-neutral-600"
          >
            ✕
          </button>
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
              className="animate-message-in rounded-xl border border-neutral-200 p-3 text-xs"
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
                {formatReminderTime(new Date(r.triggerAt))} · &quot;{r.originalPhrase}&quot;
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
      </div>
    </div>
  );
}
