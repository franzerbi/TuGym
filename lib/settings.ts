"use client";

import { useSyncExternalStore } from "react";

export interface Settings {
  restTimer: {
    autoStart: boolean;
    defaultSeconds: number;
    soundOn: boolean;
    notifHintDismissed: boolean;
  };
}

const STORAGE_KEY = "tugym:settings:v1";

const DEFAULTS: Settings = {
  restTimer: {
    autoStart: true,
    defaultSeconds: 90,
    soundOn: true,
    notifHintDismissed: false,
  },
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

function clone(s: Settings): Settings {
  return {
    restTimer: { ...s.restTimer },
  };
}

function merge(base: Settings, patch: DeepPartial<Settings>): Settings {
  const next = clone(base);
  if (patch.restTimer) {
    next.restTimer = { ...next.restTimer, ...patch.restTimer };
  }
  return next;
}

function isValidShape(value: unknown): value is Settings {
  if (!value || typeof value !== "object") return false;
  const rt = (value as { restTimer?: unknown }).restTimer;
  if (!rt || typeof rt !== "object") return false;
  const r = rt as Record<string, unknown>;
  return (
    typeof r.autoStart === "boolean" &&
    typeof r.defaultSeconds === "number" &&
    typeof r.soundOn === "boolean" &&
    typeof r.notifHintDismissed === "boolean"
  );
}

export function getSettings(): Settings {
  if (typeof window === "undefined") return clone(DEFAULTS);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(DEFAULTS);
    const parsed = JSON.parse(raw);
    if (!isValidShape(parsed)) return clone(DEFAULTS);
    // Backfill any future field by overlaying onto defaults
    return merge(DEFAULTS, parsed);
  } catch {
    return clone(DEFAULTS);
  }
}

export function setSettings(patch: DeepPartial<Settings>): Settings {
  const current = getSettings();
  const next = merge(current, patch);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    // Notify same-tab listeners; `storage` event only fires cross-tab.
    window.dispatchEvent(new CustomEvent("tugym:settings-change"));
  } catch {
    /* storage cuota / privacidad: dejamos el estado en memoria */
  }
  return next;
}

function subscribe(callback: () => void): () => void {
  function onStorage(e: StorageEvent) {
    if (e.key === STORAGE_KEY) callback();
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener("tugym:settings-change", callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("tugym:settings-change", callback);
  };
}

let cachedSnapshot: Settings | null = null;
let cachedRaw: string | null = null;

function getSnapshot(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw && cachedSnapshot !== null) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = getSettings();
  return cachedSnapshot;
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULTS);
}
