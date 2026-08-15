"use client";

export function NewMessageToast({ text }: { text: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <div className="animate-message-in flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2.5 text-xs font-medium text-white shadow-lg">
        <span>🔔</span>
        <span>{text}</span>
      </div>
    </div>
  );
}
