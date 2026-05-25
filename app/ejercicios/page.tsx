"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { useExercises } from "@/lib/hooks/use-exercises";
import {
  MuscleGroupFilter,
  type MuscleGroupFilterValue,
} from "@/components/muscle-group-filter";
import { MUSCLE_GROUP_LABELS } from "@/types";

export default function EjerciciosPage() {
  const [filter, setFilter] = useState<MuscleGroupFilterValue>("all");
  const exercises = useExercises(filter);

  return (
    <div className="flex flex-1 flex-col gap-5 py-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Ejercicios</h1>
        <Link
          href="/ejercicios/nuevo"
          aria-label="Crear ejercicio"
          className="flex size-11 items-center justify-center rounded-full bg-zinc-900 text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          <Plus size={20} aria-hidden="true" />
        </Link>
      </header>

      <MuscleGroupFilter value={filter} onChange={setFilter} />

      {exercises === undefined ? (
        <ListSkeleton />
      ) : exercises.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <ul className="flex flex-col gap-2">
          {exercises.map((ex) => (
            <li key={ex.id}>
              <Link
                href={`/ejercicios/historial?id=${ex.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-zinc-300 active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:active:bg-zinc-900"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-base font-semibold">{ex.name}</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">
                    {MUSCLE_GROUP_LABELS[ex.muscleGroup]}
                  </span>
                </span>
                <ChevronRight
                  size={18}
                  className="text-zinc-400 dark:text-zinc-600"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="h-[68px] animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
        />
      ))}
    </ul>
  );
}

function EmptyState({ filter }: { filter: MuscleGroupFilterValue }) {
  const isFiltered = filter !== "all";
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-base font-semibold">
        {isFiltered
          ? `Sin ejercicios en ${MUSCLE_GROUP_LABELS[filter]}`
          : "Todavía no hay ejercicios"}
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {isFiltered
          ? "Cambiá de grupo o creá uno nuevo."
          : "Creá tu primer ejercicio para empezar."}
      </p>
      <Link
        href="/ejercicios/nuevo"
        className="mt-2 flex h-11 items-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        <Plus size={16} aria-hidden="true" />
        Crear ejercicio
      </Link>
    </div>
  );
}
