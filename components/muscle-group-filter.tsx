"use client";

import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from "@/types";
import type { MuscleGroup } from "@/types";

export type MuscleGroupFilterValue = MuscleGroup | "all";

type Props = {
  value: MuscleGroupFilterValue;
  onChange: (value: MuscleGroupFilterValue) => void;
};

const OPTIONS: { value: MuscleGroupFilterValue; label: string }[] = [
  { value: "all", label: "Todos" },
  ...MUSCLE_GROUPS.map((g) => ({ value: g, label: MUSCLE_GROUP_LABELS[g] })),
];

export function MuscleGroupFilter({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Filtrar por grupo muscular"
      className="flex flex-wrap gap-2"
    >
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              selected
                ? "border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
