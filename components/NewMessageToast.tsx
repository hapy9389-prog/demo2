"use client";

export function NewMessageToast({ text }: { text: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-message-in rounded-full bg-neutral-900 px-5 py-2.5 text-sm text-white shadow-lg">
      {text}
    </div>
  );
}
