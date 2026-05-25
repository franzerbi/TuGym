"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useExercises } from "@/lib/hooks/use-exercises";
import { WorkoutExercisePicker } from "@/components/workout-exercise-picker";
import { DAY_LABELS_SHORT, MUSCLE_GROUP_LABELS } from "@/types";
import type { ID } from "@/types";

export type RoutineFormValues = {
  name: string;
  exerciseIds: ID[];
  days: number[];
};

type Props = {
  initialValues?: Partial<RoutineFormValues>;
  submitLabel: string;
  onSubmit: (values: RoutineFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

export function RoutineForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [exerciseIds, setExerciseIds] = useState<ID[]>(
    initialValues?.exerciseIds ?? [],
  );
  const [days, setDays] = useState<number[]>(initialValues?.days ?? []);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allExercises = useExercises("all");
  const exerciseMap = new Map(
    allExercises?.map((e) => [e.id!, e]) ?? [],
  );

  function handleAddExercise(exerciseId: ID) {
    setExerciseIds((prev) =>
      prev.includes(exerciseId) ? prev : [...prev, exerciseId],
    );
    setShowPicker(false);
  }

  function handleRemoveExercise(exerciseId: ID) {
    setExerciseIds((prev) => prev.filter((id) => id !== exerciseId));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (exerciseIds.length === 0) {
      setError("Agregá al menos un ejercicio.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ name: trimmed, exerciseIds, days });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Nombre de la rutina</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          maxLength={60}
          placeholder="Ej: Pecho y Hombros"
          className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Días de la semana</legend>
        <div className="flex gap-1.5">
          {DAY_LABELS_SHORT.map((label, dayIndex) => {
            const selected = days.includes(dayIndex);
            return (
              <button
                key={dayIndex}
                type="button"
                onClick={() =>
                  setDays((prev) =>
                    selected
                      ? prev.filter((d) => d !== dayIndex)
                      : [...prev, dayIndex],
                  )
                }
                aria-pressed={selected}
                className={`flex size-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  selected
                    ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950"
                    : "border border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Ejercicios</span>

        {exerciseIds.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {exerciseIds.map((id, index) => {
              const exercise = exerciseMap.get(id);
              return (
                <li
                  key={id}
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <span className="flex flex-1 flex-col">
                    <span className="text-sm font-medium">
                      {exercise?.name ?? "Ejercicio eliminado"}
                    </span>
                    {exercise && (
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(id)}
                    aria-label={`Quitar ${exercise?.name ?? "ejercicio"}`}
                    className="flex size-7 items-center justify-center rounded text-zinc-500 transition-colors hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {showPicker ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Elegir ejercicio</span>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                aria-label="Cerrar"
                className="flex size-7 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            <WorkoutExercisePicker
              onSelect={handleAddExercise}
              selectedIds={exerciseIds}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
          >
            <Plus size={14} aria-hidden="true" />
            Agregar ejercicio
          </button>
        )}
      </div>

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
