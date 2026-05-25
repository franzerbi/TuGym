"use client";

import { useRestTimer } from "@/lib/hooks/use-rest-timer";

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatMmSs(ms: number): string {
  const totalSecs = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${pad(m)}:${pad(s)}`;
}

export function RestTimerBanner() {
  const { state, remainingMs, totalMs, skip, addSeconds } = useRestTimer();

  if (state === "idle") return null;

  const progress =
    totalMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / totalMs)) : 1;
  const isFinished = state === "finished";

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label="Descanso entre series"
      className={`fixed inset-x-0 z-30 mx-auto w-full max-w-3xl px-4`}
      style={{ bottom: "calc(7.5rem + env(safe-area-inset-bottom))" }}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border shadow-lg backdrop-blur ${
          isFinished
            ? "border-emerald-300 bg-emerald-100/95 supports-[backdrop-filter]:bg-emerald-100/80 dark:border-emerald-900 dark:bg-emerald-950/95 dark:supports-[backdrop-filter]:bg-emerald-950/80"
            : "border-zinc-200 bg-white/95 supports-[backdrop-filter]:bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/80"
        }`}
      >
        {!isFinished && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-0.5 bg-zinc-200 dark:bg-zinc-800"
          >
            <div
              className="h-full bg-zinc-900 transition-[width] duration-200 ease-linear dark:bg-zinc-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}

        <div className="flex flex-col gap-2 px-4 py-3">
          {isFinished ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                ¡Listo!
              </span>
              <button
                type="button"
                onClick={skip}
                className="text-xs font-medium text-emerald-900 underline underline-offset-2 dark:text-emerald-100"
              >
                Saltar descanso
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => addSeconds(-15)}
                  aria-label="Restar 15 segundos"
                  className="flex h-11 min-w-11 w-14 items-center justify-center rounded-lg border border-zinc-300 bg-white text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 active:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  −15s
                </button>
                <span
                  className="flex-1 text-center text-3xl font-bold tabular-nums"
                  aria-hidden="true"
                >
                  {formatMmSs(remainingMs)}
                </span>
                <span className="sr-only">
                  Quedan {Math.ceil(remainingMs / 1000)} segundos de descanso
                </span>
                <button
                  type="button"
                  onClick={() => addSeconds(15)}
                  aria-label="Sumar 15 segundos"
                  className="flex h-11 min-w-11 w-14 items-center justify-center rounded-lg border border-zinc-300 bg-white text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 active:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  +15s
                </button>
              </div>
              <button
                type="button"
                onClick={skip}
                className="self-center text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Saltar descanso
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
