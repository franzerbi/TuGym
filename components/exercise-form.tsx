"use client";

import { useState, type FormEvent } from "react";
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from "@/types";
import type { MuscleGroup } from "@/types";

export type ExerciseFormValues = {
  name: string;
  muscleGroup: MuscleGroup;
};

type Props = {
  initialValues?: Partial<ExerciseFormValues>;
  submitLabel: string;
  onSubmit: (values: ExerciseFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

export function ExerciseForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(
    initialValues?.muscleGroup ?? "pecho",
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("El nombre es obligatorio.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ name: trimmed, muscleGroup });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Nombre</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          autoComplete="off"
          maxLength={80}
          placeholder="Ej: Press de banca"
          className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Grupo muscular</legend>
        <div className="grid grid-cols-3 gap-2">
          {MUSCLE_GROUPS.map((group) => {
            const selected = muscleGroup === group;
            return (
              <button
                key={group}
                type="button"
                onClick={() => setMuscleGroup(group)}
                aria-pressed={selected}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  selected
                    ? "border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600"
                }`}
              >
                {MUSCLE_GROUP_LABELS[group]}
              </button>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
        <button
          type="submit"
          disabled={submitting}
          className="flex h-12 items-center justify-center rounded-xl bg-zinc-900 px-6 text-base font-semibold text-zinc-50 transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 sm:flex-1"
        >
          {submitting ? "Guardando..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex h-12 items-center justify-center rounded-xl border border-zinc-300 px-6 text-base font-medium text-zinc-700 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 sm:flex-1"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
