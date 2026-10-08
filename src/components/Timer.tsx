export const formatClock = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** Countdown display; turns to a warning colour near the end (last minute by default). */
export function Timer({ remainingMs, warnBelowMs = 60_000 }: { remainingMs: number; warnBelowMs?: number }) {
  return (
    <span className={`timer${remainingMs <= warnBelowMs ? ' warning' : ''}`} role="timer" aria-label={`${formatClock(remainingMs)} remaining`}>
      {formatClock(remainingMs)}
    </span>
  );
}
