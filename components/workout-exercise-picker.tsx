"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useExercises } from "@/lib/hooks/use-exercises";
import {
  MuscleGroupFilter,
  type MuscleGroupFilterValue,
} from "@/components/muscle-group-filter";
import { MUSCLE_GROUP_LABELS } from "@/types";
import type { ID } from "@/types";

type Props = {
  onSelect: (exerciseId: ID) => void;
  selectedIds?: ID[];
};

export function WorkoutExercisePicker({ onSelect, selectedIds = [] }: Props) {
  const [filter, setFilter] = useState<MuscleGroupFilterValue>("all");
  const exercises = useExercises(filter);

  return (
    <div className="flex flex-col gap-3">
      <MuscleGroupFilter value={filter} onChange={setFilter} />

      {exercises === undefined ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Cargando...</p>
      ) : exercises.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No hay ejercicios en este grupo.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {exercises.map((ex) => {
            const alreadyAdded = selectedIds.includes(ex.id!);
            return (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (!alreadyAdded) onSelect(ex.id!);
                  }}
                  disabled={alreadyAdded}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
                    alreadyAdded
                      ? "border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600"
                      : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
                  }`}
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      {MUSCLE_GROUP_LABELS[ex.muscleGroup]}
                    </span>
                  </span>
                  {alreadyAdded && (
                    <Check
                      size={16}
                      className="text-zinc-400 dark:text-zinc-600"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
