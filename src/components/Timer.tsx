export const formatClock = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** Count-up display for untimed drills: time spent so far, without any warning. */
export function Stopwatch({ elapsedMs }: { elapsedMs: number }) {
  const shown = Math.floor(elapsedMs / 1000) * 1000; // whole seconds, counting up from 0:00
  return (
    <span className="timer elapsed" role="timer" aria-label={`${formatClock(shown)} elapsed`}>
      {formatClock(shown)}
    </span>
  );
}

/** Countdown display; turns to a warning colour near the end (last minute by default). */
export function Timer({ remainingMs, warnBelowMs = 60_000 }: { remainingMs: number; warnBelowMs?: number }) {
  return (
    <span className={`timer${remainingMs <= warnBelowMs ? ' warning' : ''}`} role="timer" aria-label={`${formatClock(remainingMs)} remaining`}>
      {formatClock(remainingMs)}
    </span>
  );
}
