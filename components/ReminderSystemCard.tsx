/**
 * 리마인더 등록 확인을 위한 인라인 시스템 카드. 일반 대화 버블과 확연히 구분되는
 * 형태로, 채팅 스크롤 안에 영구히 남는다(임시 배너와 달리 사라지지 않음).
 * 클라이언트 state 기반이라 새로고침하면 사라진다 — MVP에서는 허용된 트레이드오프.
 */
export function ReminderSystemCard({
  content,
  timeLabel,
}: {
  content: string;
  timeLabel: string;
}) {
  return (
    <div className="flex animate-message-in justify-center px-4">
      <div className="flex max-w-[85%] items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 shadow-sm">
        <span className="text-base leading-none">🔔</span>
        <div>
          <p className="font-semibold">리마인더 등록됨</p>
          <p className="mt-0.5">내용: {content}</p>
          <p>예정 시간: {timeLabel}</p>
        </div>
      </div>
    </div>
  );
}
