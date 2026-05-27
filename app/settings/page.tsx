"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSettings, setSettings, useSettings } from "@/lib/settings";
import {
  getNotifPermission,
  requestNotifPermission,
  type NotifState,
} from "@/lib/notifications";
import {
  ensureSubscribed,
  isPushAvailable,
  unsubscribeFromPush,
  type EnsureSubscribedResult,
} from "@/lib/push-client";

const REST_PRESETS = [60, 90, 120, 180] as const;
const REST_MIN = 10;
const REST_MAX = 600;
const PUSH_OPT_OUT_KEY = "tugym:push-opted-out";

function isPushOptedOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PUSH_OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

function setPushOptedOut(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(PUSH_OPT_OUT_KEY, "1");
    else window.localStorage.removeItem(PUSH_OPT_OUT_KEY);
  } catch {
    /* storage unavailable */
  }
}

function sanitizeIntInput(value: string): string | null {
  if (value === "") return "";
  if (!/^[0-9]+$/.test(value)) return null;
  return value.replace(/^0+(?=\d)/, "");
}

export default function SettingsPage() {
  const settings = useSettings();
  const { autoStart, defaultSeconds, soundOn } = settings.restTimer;

  const [restInput, setRestInput] = useState<string>(() =>
    String(getSettings().restTimer.defaultSeconds),
  );
  const [restError, setRestError] = useState<string | null>(null);
  const [notifState, setNotifState] = useState<NotifState>(() =>
    getNotifPermission(),
  );
  const [pushStatus, setPushStatus] = useState<
    "idle" | "working" | "subscribed" | "local_only"
  >(() => {
    if (getNotifPermission() !== "granted") return "idle";
    if (isPushOptedOut()) return "local_only";
    return isPushAvailable() ? "working" : "local_only";
  });

  useEffect(() => {
    if (notifState !== "granted") return;
    if (!isPushAvailable()) return;
    if (isPushOptedOut()) return;
    let cancelled = false;
    void ensureSubscribed().then((res) => {
      if (cancelled) return;
      setPushStatus(res.subscribed ? "subscribed" : "local_only");
    });
    return () => {
      cancelled = true;
    };
  }, [notifState]);

  function commitRest(raw: string) {
    if (raw === "") {
      setRestError("Ingresá un valor.");
      setRestInput(String(defaultSeconds));
      return;
    }
    const parsed = Number.parseInt(raw, 10);
    if (
      !Number.isInteger(parsed) ||
      parsed < REST_MIN ||
      parsed > REST_MAX
    ) {
      setRestError(`Debe estar entre ${REST_MIN} y ${REST_MAX} segundos.`);
      setRestInput(String(defaultSeconds));
      return;
    }
    setRestError(null);
    if (parsed !== defaultSeconds) {
      setSettings({ restTimer: { defaultSeconds: parsed } });
    }
  }

  function handleRestChange(value: string) {
    const sanitized = sanitizeIntInput(value);
    if (sanitized === null) return;
    setRestInput(sanitized);
    if (restError) setRestError(null);
  }

  function applyPreset(p: number) {
    setRestInput(String(p));
    setRestError(null);
    setSettings({ restTimer: { defaultSeconds: p } });
  }

  function toggleAutoStart() {
    setSettings({ restTimer: { autoStart: !autoStart } });
  }

  function toggleSound() {
    setSettings({ restTimer: { soundOn: !soundOn } });
  }

  async function handleRequestNotif() {
    const result = await requestNotifPermission();
    setNotifState(result);
    if (result === "granted") {
      setPushOptedOut(false);
      if (!isPushAvailable()) {
        setPushStatus("local_only");
        return;
      }
      setPushStatus("working");
      const res: EnsureSubscribedResult = await ensureSubscribed();
      setPushStatus(res.subscribed ? "subscribed" : "local_only");
    }
  }

  async function handleDisablePush() {
    setPushStatus("working");
    setPushOptedOut(true);
    await unsubscribeFromPush();
    setPushStatus("local_only");
  }

  return (
    <div className="flex flex-1 flex-col gap-5 py-6">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Volver"
          className="flex size-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          Cronómetro de descanso
        </h2>

        <div className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <Toggle
            label="Iniciar automáticamente al confirmar serie"
            description="El cronómetro arranca solo cuando marcás una serie como hecha."
            checked={autoStart}
            onChange={toggleAutoStart}
          />

          <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

          <div className="flex flex-col gap-2">
            <label
              htmlFor="default-rest-input"
              className="text-sm font-medium"
            >
              Tiempo de descanso por defecto
            </label>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Se usa cuando un ejercicio no tiene descanso propio.
            </p>
            <div className="flex items-center gap-2">
              <input
                id="default-rest-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={restInput}
                onChange={(e) => handleRestChange(e.target.value)}
                onBlur={(e) => commitRest(e.target.value)}
                aria-label="Tiempo de descanso por defecto en segundos"
                aria-invalid={restError !== null}
                className="h-11 w-32 rounded-xl border border-zinc-300 bg-white px-3 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                segundos
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {REST_PRESETS.map((p) => {
                const selected = restInput === String(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => applyPreset(p)}
                    aria-pressed={selected}
                    className={`h-11 min-w-11 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                      selected
                        ? "border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                        : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    {p}s
                  </button>
                );
              })}
            </div>
            {restError && (
              <p
                role="alert"
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
              >
                {restError}
              </p>
            )}
          </div>

          <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

          <Toggle
            label="Sonido al terminar"
            description="Reproduce un beep cuando se acaba el descanso."
            checked={soundOn}
            onChange={toggleSound}
          />

          <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">
              Notificaciones en background
            </span>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Para que te avisemos cuando termine el descanso si tenés la app
              en segundo plano.
            </p>
            <NotifControl
              state={notifState}
              pushStatus={pushStatus}
              onRequest={handleRequestNotif}
              onDisablePush={handleDisablePush}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            {description}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
          checked
            ? "border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100"
            : "border-zinc-300 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
        }`}
      >
        <span
          className={`inline-block size-5 rounded-full bg-white shadow transition-transform dark:bg-zinc-950 ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}

function NotifControl({
  state,
  pushStatus,
  onRequest,
  onDisablePush,
}: {
  state: NotifState;
  pushStatus: "idle" | "working" | "subscribed" | "local_only";
  onRequest: () => void;
  onDisablePush: () => void;
}) {
  if (state === "granted") {
    const label =
      pushStatus === "subscribed"
        ? "Activadas y conectadas al servidor"
        : pushStatus === "working"
          ? "Conectando con el servidor..."
          : "Activadas (solo local)";
    const helper =
      pushStatus === "local_only"
        ? "El server no respondió. Los avisos en background pueden no llegar si la app se cierra."
        : null;
    return (
      <div className="flex flex-col gap-2">
        <div
          className="flex h-11 w-fit items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
        >
          <span aria-hidden="true">✓</span>
          {label}
        </div>
        {helper && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400">{helper}</p>
        )}
        {pushStatus === "subscribed" && (
          <button
            type="button"
            onClick={onDisablePush}
            className="flex h-11 w-fit items-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600"
          >
            Desactivar notificaciones
          </button>
        )}
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Denegadas. Reactivá desde la configuración del navegador.
        </p>
        <button
          type="button"
          disabled
          className="flex h-11 w-fit items-center rounded-xl border border-zinc-300 bg-zinc-100 px-4 text-sm font-semibold text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600"
        >
          Activar notificaciones
        </button>
      </div>
    );
  }

  if (state === "unsupported") {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No disponible. Instalá la app en tu home (PWA) para activar.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={onRequest}
      className="flex h-11 w-fit items-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
    >
      Activar notificaciones
    </button>
  );
}
