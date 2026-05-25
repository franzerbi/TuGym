"use client";

let ctx: AudioContext | null = null;

type WindowWithWebkit = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

function getCtor(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as WindowWithWebkit;
  return window.AudioContext ?? w.webkitAudioContext;
}

/**
 * Crea (o devuelve) el AudioContext singleton. Debe llamarse dentro de un
 * gesto del usuario la primera vez para no quedar "suspended" en iOS.
 */
export function initAudioContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = getCtor();
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  audioCtx: AudioContext,
  freq: number,
  startAt: number,
  durationMs: number,
  peakGain: number,
) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  // envelope para evitar click duro al inicio y al final
  const start = startAt;
  const end = start + durationMs / 1000;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.01);
  gain.gain.setValueAtTime(peakGain, end - 0.02);
  gain.gain.linearRampToValueAtTime(0, end);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(start);
  osc.stop(end + 0.02);
}

export function playRestEndBeep(): void {
  const audioCtx = ctx ?? initAudioContext();
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") {
    // resume es asíncrono pero los timings absolutos usan currentTime, así que
    // disparamos los tonos después del resume para no perderlos.
    audioCtx
      .resume()
      .then(() => scheduleBeep(audioCtx))
      .catch(() => {});
    return;
  }
  scheduleBeep(audioCtx);
}

function scheduleBeep(audioCtx: AudioContext) {
  const t0 = audioCtx.currentTime + 0.02;
  tone(audioCtx, 880, t0, 150, 0.18);
  tone(audioCtx, 1320, t0 + 0.18, 200, 0.18);
}
