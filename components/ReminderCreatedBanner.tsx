"use client";

export function ReminderCreatedBanner({
  content,
  timeLabel,
  onDismiss,
}: {
  content: string;
  timeLabel: string;
  onDismiss: () => void;
}) {
  return (
    <div className="mx-4 mt-3 flex animate-message-in items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <div>
        <p className="font-semibold">🔔 리마인더 등록됨</p>
        <p className="mt-0.5">내용: {content}</p>
        <p>예정 시간: {timeLabel}</p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="닫기"
        className="text-amber-500 hover:text-amber-700"
      >
        ✕
      </button>
    </div>
  );
}
