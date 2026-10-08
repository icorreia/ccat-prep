export const formatClock = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** Countdown display; turns to a warning colour in the last minute. */
export function Timer({ remainingMs }: { remainingMs: number }) {
  return (
    <span className={`timer${remainingMs <= 60_000 ? ' warning' : ''}`} role="timer" aria-label={`${formatClock(remainingMs)} remaining`}>
      {formatClock(remainingMs)}
    </span>
  );
}
