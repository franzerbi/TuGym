"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { playRestEndBeep } from "@/lib/audio/beep";
import {
  sendArmMessage,
  sendDisarmMessage,
  type ArmPayload,
} from "@/lib/notifications";
import { getSettings } from "@/lib/settings";

export type RestTimerState = "idle" | "running" | "finished";

interface StartArgs {
  restSeconds: number;
  exerciseName?: string;
}

export interface RestTimerContextValue {
  state: RestTimerState;
  remainingMs: number;
  totalMs: number;
  exerciseName: string | undefined;
  start: (args: StartArgs) => void;
  skip: () => void;
  addSeconds: (n: number) => void;
}

export const RestTimerContext = createContext<RestTimerContextValue | null>(
  null,
);

const SESSION_KEY = "tugym:rest-timer:active";
const RETURN_URL = "/entrenar/sesion";
const FINISHED_AUTO_DISMISS_MS = 5000;
const TICK_MS = 250;

interface PersistedTimer {
  endsAt: number;
  totalMs: number;
  exerciseName?: string;
}

function readPersisted(): PersistedTimer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedTimer;
    if (
      typeof parsed?.endsAt !== "number" ||
      typeof parsed?.totalMs !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writePersisted(p: PersistedTimer): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(p));
  } catch {
    /* sessionStorage no disponible: el timer sigue en memoria */
  }
}

function clearPersisted(): void {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

function readInitial(): PersistedTimer | null {
  const persisted = readPersisted();
  if (!persisted) return null;
  if (persisted.endsAt <= Date.now()) {
    clearPersisted();
    return null;
  }
  return persisted;
}

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RestTimerState>(() =>
    readInitial() ? "running" : "idle",
  );
  const [endsAt, setEndsAt] = useState<number | null>(
    () => readInitial()?.endsAt ?? null,
  );
  const [totalMs, setTotalMs] = useState(() => readInitial()?.totalMs ?? 0);
  const [exerciseName, setExerciseName] = useState<string | undefined>(
    () => readInitial()?.exerciseName,
  );
  const [now, setNow] = useState<number>(() => Date.now());

  const finishHandledRef = useRef(false);
  const finishedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFinishedTimeout = useCallback(() => {
    if (finishedTimeoutRef.current !== null) {
      clearTimeout(finishedTimeoutRef.current);
      finishedTimeoutRef.current = null;
    }
  }, []);

  const transitionToFinished = useCallback(
    (opts: { announce: boolean }) => {
      if (finishHandledRef.current) return;
      finishHandledRef.current = true;
      setState("finished");
      clearPersisted();
      sendDisarmMessage();
      if (opts.announce) {
        if (
          typeof navigator !== "undefined" &&
          typeof navigator.vibrate === "function"
        ) {
          try {
            navigator.vibrate([300, 100, 300]);
          } catch {
            /* algunos navegadores tiran si está bloqueado */
          }
        }
        const settings = getSettings();
        if (settings.restTimer.soundOn) {
          playRestEndBeep();
        }
      }
      clearFinishedTimeout();
      finishedTimeoutRef.current = setTimeout(() => {
        finishedTimeoutRef.current = null;
        setState("idle");
        setEndsAt(null);
        setTotalMs(0);
        setExerciseName(undefined);
      }, FINISHED_AUTO_DISMISS_MS);
    },
    [clearFinishedTimeout],
  );

  const start = useCallback(
    ({ restSeconds, exerciseName: name }: StartArgs) => {
      if (
        !Number.isFinite(restSeconds) ||
        restSeconds <= 0 ||
        typeof window === "undefined"
      ) {
        return;
      }
      clearFinishedTimeout();
      const total = Math.round(restSeconds * 1000);
      const target = Date.now() + total;
      finishHandledRef.current = false;
      setState("running");
      setEndsAt(target);
      setTotalMs(total);
      setExerciseName(name);
      setNow(Date.now());
      writePersisted({ endsAt: target, totalMs: total, exerciseName: name });
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        const payload: ArmPayload = {
          endsAt: target,
          exerciseName: name,
          returnUrl: RETURN_URL,
        };
        sendArmMessage(payload);
      }
    },
    [clearFinishedTimeout],
  );

  const skip = useCallback(() => {
    clearFinishedTimeout();
    finishHandledRef.current = false;
    setState("idle");
    setEndsAt(null);
    setTotalMs(0);
    setExerciseName(undefined);
    clearPersisted();
    sendDisarmMessage();
  }, [clearFinishedTimeout]);

  const addSeconds = useCallback(
    (n: number) => {
      if (!Number.isFinite(n) || n === 0) return;
      if (endsAt === null) return;
      const nextEndsAt = Math.max(Date.now() + 1000, endsAt + n * 1000);
      const nextTotalMs = Math.max(totalMs + n * 1000, 1000);
      setEndsAt(nextEndsAt);
      setTotalMs(nextTotalMs);
      writePersisted({
        endsAt: nextEndsAt,
        totalMs: nextTotalMs,
        exerciseName,
      });
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        sendArmMessage({
          endsAt: nextEndsAt,
          exerciseName,
          returnUrl: RETURN_URL,
        });
      }
    },
    [endsAt, totalMs, exerciseName],
  );

  // Tick
  useEffect(() => {
    if (state !== "running") return;
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [state]);

  // Detectar fin del descanso vía tick
  useEffect(() => {
    if (state !== "running" || endsAt === null) return;
    if (finishHandledRef.current) return;
    if (now >= endsAt) {
      transitionToFinished({ announce: true });
    }
  }, [now, endsAt, state, transitionToFinished]);

  // visibilitychange: armar/desarmar notif + recalcular al volver
  useEffect(() => {
    function onVisibility() {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "hidden") {
        if (state === "running" && endsAt !== null) {
          sendArmMessage({
            endsAt,
            exerciseName,
            returnUrl: RETURN_URL,
          });
        }
      } else {
        sendDisarmMessage();
        if (state === "running" && endsAt !== null) {
          const t = Date.now();
          setNow(t);
          if (t >= endsAt) {
            // La notif del SW ya sonó (si había permiso). No re-anunciar.
            transitionToFinished({ announce: false });
          }
        }
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [state, endsAt, exerciseName, transitionToFinished]);

  // cleanup global
  useEffect(() => {
    return () => {
      clearFinishedTimeout();
    };
  }, [clearFinishedTimeout]);

  const remainingMs = useMemo(() => {
    if (state === "idle") return 0;
    if (state === "finished") return 0;
    if (endsAt === null) return 0;
    return Math.max(0, endsAt - now);
  }, [state, endsAt, now]);

  const value = useMemo<RestTimerContextValue>(
    () => ({
      state,
      remainingMs,
      totalMs,
      exerciseName,
      start,
      skip,
      addSeconds,
    }),
    [state, remainingMs, totalMs, exerciseName, start, skip, addSeconds],
  );

  return (
    <RestTimerContext.Provider value={value}>
      {children}
    </RestTimerContext.Provider>
  );
}
