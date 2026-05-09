"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { addSet, getNextSetNumber } from "@/lib/db/workouts";
import type { ID } from "@/types";

type Props = {
  workoutId: ID;
  exerciseId: ID;
};

export function WorkoutSetInput({ workoutId, exerciseId }: Props) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const kg = Number.parseFloat(weight);
    const r = Number.parseInt(reps, 10);
    if (!weight || Number.isNaN(kg) || kg <= 0) return;
    if (!reps || Number.isNaN(r) || r <= 0) return;

    setSubmitting(true);
    try {
      const setNumber = await getNextSetNumber(workoutId, exerciseId);
      await addSet({ workoutId, exerciseId, weightKg: kg, reps: r, setNumber });
      setReps("");
    } catch {
      // silently fail — validation already handled
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <label className="flex flex-1 flex-col gap-1">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Kg</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="0"
          className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
        />
      </label>
      <label className="flex flex-1 flex-col gap-1">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Reps</span>
        <input
          type="number"
          inputMode="numeric"
          min="1"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="0"
          className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        aria-label="Agregar serie"
        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        <Plus size={18} aria-hidden="true" />
      </button>
    </form>
  );
}
