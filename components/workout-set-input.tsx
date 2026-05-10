"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Minus, Plus } from "lucide-react";
import {
  addSet,
  getLastSetForExercise,
  getNextSetNumber,
} from "@/lib/db/workouts";
import {
  parseDecimal,
  sanitizeDecimalInput,
  sanitizeIntInput,
} from "@/lib/number";
import type { ID } from "@/types";

type Props = {
  workoutId: ID;
  exerciseId: ID;
};

const WEIGHT_STEP = 2.5;
const REPS_STEP = 1;

function formatWeight(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return String(rounded).replace(".", ",");
}

export function WorkoutSetInput({ workoutId, exerciseId }: Props) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const containerRef = useRef<HTMLFormElement>(null);
  const prefilled = useRef(false);

  useEffect(() => {
    if (prefilled.current) return;
    prefilled.current = true;
    let cancelled = false;
    (async () => {
      const last = await getLastSetForExercise(exerciseId, workoutId);
      if (cancelled || !last) return;
      setWeight((w) => (w === "" ? formatWeight(last.weightKg) : w));
      setReps((r) => (r === "" ? String(last.reps) : r));
    })();
    return () => {
      cancelled = true;
    };
  }, [exerciseId, workoutId]);

  const kg = parseDecimal(weight);
  const r = Number.parseInt(reps, 10);
  const weightValid = weight !== "" && !Number.isNaN(kg) && kg > 0;
  const repsValid = reps !== "" && !Number.isNaN(r) && r > 0;
  const valid = weightValid && repsValid;

  function handleWeightChange(value: string) {
    const sanitized = sanitizeDecimalInput(value);
    if (sanitized === null) return;
    setWeight(sanitized);
    if (error) setError(null);
  }

  function handleRepsChange(value: string) {
    const sanitized = sanitizeIntInput(value);
    if (sanitized === null) return;
    setReps(sanitized);
    if (error) setError(null);
  }

  function adjustWeight(delta: number) {
    const current = weight === "" ? 0 : parseDecimal(weight);
    const base = Number.isNaN(current) ? 0 : current;
    if (delta < 0 && base === 0) return;
    const next = Math.max(0, Math.round((base + delta) * 100) / 100);
    setWeight(formatWeight(next));
    if (error) setError(null);
  }

  function adjustReps(delta: number) {
    const current = reps === "" ? 0 : Number.parseInt(reps, 10);
    const base = Number.isNaN(current) ? 0 : current;
    if (delta < 0 && base === 0) return;
    const next = Math.max(0, base + delta);
    setReps(String(next));
    if (error) setError(null);
  }

  function handleFocus() {
    setTimeout(() => {
      containerRef.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }, 100);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);

    if (!weightValid) {
      setError("Ingresá un peso válido.");
      return;
    }
    if (!repsValid) {
      setError("Ingresá repeticiones válidas.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const setNumber = await getNextSetNumber(workoutId, exerciseId);
      await addSet({
        workoutId,
        exerciseId,
        weightKg: kg,
        reps: r,
        setNumber,
      });
      if (
        typeof navigator !== "undefined" &&
        "vibrate" in navigator
      ) {
        navigator.vibrate(20);
      }
      setTouched(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la serie.");
    } finally {
      setSubmitting(false);
    }
  }

  const showWeightError = touched && !weightValid;
  const showRepsError = touched && !repsValid;

  return (
    <form
      ref={containerRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Kg
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => adjustWeight(-WEIGHT_STEP)}
            aria-label="Disminuir peso"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 active:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            <Minus size={18} aria-hidden="true" />
          </button>
          <input
            type="text"
            inputMode="decimal"
            value={weight}
            onChange={(e) => handleWeightChange(e.target.value)}
            onFocus={handleFocus}
            placeholder="0"
            aria-invalid={showWeightError || undefined}
            aria-label="Peso en kilos"
            className={`h-12 w-full min-w-0 flex-1 rounded-lg border bg-white px-3 text-center text-lg font-medium outline-none transition-colors focus:border-zinc-900 dark:bg-zinc-950 dark:focus:border-zinc-100 ${
              showWeightError
                ? "border-red-500 ring-2 ring-red-500/40"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
          />
          <button
            type="button"
            onClick={() => adjustWeight(WEIGHT_STEP)}
            aria-label="Aumentar peso"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 active:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Reps
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => adjustReps(-REPS_STEP)}
            aria-label="Disminuir repeticiones"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 active:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            <Minus size={18} aria-hidden="true" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={reps}
            onChange={(e) => handleRepsChange(e.target.value)}
            onFocus={handleFocus}
            placeholder="0"
            aria-invalid={showRepsError || undefined}
            aria-label="Repeticiones"
            className={`h-12 w-full min-w-0 flex-1 rounded-lg border bg-white px-3 text-center text-lg font-medium outline-none transition-colors focus:border-zinc-900 dark:bg-zinc-950 dark:focus:border-zinc-100 ${
              showRepsError
                ? "border-red-500 ring-2 ring-red-500/40"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
          />
          <button
            type="button"
            onClick={() => adjustReps(REPS_STEP)}
            aria-label="Aumentar repeticiones"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 active:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!valid || submitting}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-base font-semibold text-zinc-50 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        <Check size={18} aria-hidden="true" />
        {submitting ? "Guardando..." : "Confirmar serie"}
      </button>
    </form>
  );
}
