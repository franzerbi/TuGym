"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { CheckCircle, ChevronRight, Pencil, PlayCircle, Plus } from "lucide-react";
import { getDb } from "@/lib/db/index";
import { createWorkout } from "@/lib/db/workouts";
import { useRoutines } from "@/lib/hooks/use-routines";
import { ActivityCalendar } from "@/components/activity-calendar";
import type { ID } from "@/types";

interface WorkoutSummary {
  id: number;
  date: string;
  exerciseCount: number;
  setCount: number;
  exerciseNames: string[];
}

function useWorkoutSummaries(): WorkoutSummary[] | undefined {
  return useLiveQuery(async () => {
    const db = getDb();
    const workouts = await db.workouts.toArray();
    const allSets = await db.sets.toArray();
    const exercises = await db.exercises.toArray();

    const exerciseMap = new Map(exercises.map((e) => [e.id!, e.name]));

    return workouts
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
      )
      .map((w) => {
        const sets = allSets.filter((s) => s.workoutId === w.id);
        const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
        return {
          id: w.id!,
          date: w.date,
          exerciseCount: exerciseIds.length,
          setCount: sets.length,
          exerciseNames: exerciseIds
            .map((id) => exerciseMap.get(id) ?? "Ejercicio eliminado")
            .slice(0, 3),
        };
      });
  });
}

function useWorkoutDates(): Set<string> | undefined {
  return useLiveQuery(async () => {
    const db = getDb();
    const workouts = await db.workouts.toArray();
    return new Set(workouts.map((w) => w.date));
  });
}

function useTodayRoutineIds(): Set<ID> | undefined {
  return useLiveQuery(async () => {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);
    const workouts = await db.workouts.toArray();
    const ids = new Set<ID>();
    for (const w of workouts) {
      if (w.date === today && w.routineId != null) {
        ids.add(w.routineId);
      }
    }
    return ids;
  });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function EntrenarPage() {
  const router = useRouter();
  const routines = useRoutines();
  const summaries = useWorkoutSummaries();
  const workoutDates = useWorkoutDates();
  const doneRoutineIds = useTodayRoutineIds();
  const [startingId, setStartingId] = useState<ID | "blank" | null>(null);

  const todayDay = new Date().getDay();
  const sortedRoutines = (routines ?? [])
    .map((routine) => ({
      routine,
      isToday: routine.days?.includes(todayDay) ?? false,
    }))
    .sort((a, b) => (a.isToday === b.isToday ? 0 : a.isToday ? -1 : 1));

  async function handleStartFromRoutine(routineId: ID) {
    setStartingId(routineId);
    try {
      const id = await createWorkout({ date: todayISO(), routineId });
      router.push(`/entrenar/sesion?id=${id}`);
    } catch {
      setStartingId(null);
    }
  }

  async function handleStartBlank() {
    setStartingId("blank");
    try {
      const id = await createWorkout({ date: todayISO() });
      router.push(`/entrenar/sesion?id=${id}`);
    } catch {
      setStartingId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Entrenar</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Elegí una rutina o empezá de cero.
        </p>
      </header>

      {/* Routines section */}
      {routines === undefined ? (
        <RoutinesSkeleton />
      ) : routines.length > 0 ? (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Mis rutinas</h2>
            <Link
              href="/entrenar/nueva-rutina"
              className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              + Nueva
            </Link>
          </div>
          {sortedRoutines.map(({ routine, isToday }) => {
            const isDone = doneRoutineIds?.has(routine.id!) ?? false;
            return (
            <div
              key={routine.id}
              className={`flex items-center gap-2 rounded-2xl border bg-white dark:bg-zinc-950 ${
                isDone
                  ? "border-emerald-400 dark:border-emerald-600"
                  : isToday
                    ? "border-zinc-900 dark:border-zinc-100"
                    : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <button
                type="button"
                onClick={() => handleStartFromRoutine(routine.id!)}
                disabled={startingId !== null}
                className="flex flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-l-2xl disabled:opacity-60"
              >
                {isDone ? (
                  <CheckCircle
                    size={20}
                    className="shrink-0 text-emerald-500 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                ) : (
                  <PlayCircle
                    size={20}
                    className="shrink-0 text-zinc-400 dark:text-zinc-500"
                    aria-hidden="true"
                  />
                )}
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-base font-semibold">
                    {routine.name}
                    {isToday && (
                      <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950">
                        HOY
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {routine.exerciseIds.length} ejercicio
                    {routine.exerciseIds.length !== 1 ? "s" : ""}
                  </span>
                </span>
              </button>
              <Link
                href={`/entrenar/editar-rutina?id=${routine.id}`}
                aria-label={`Editar ${routine.name}`}
                className="flex size-10 items-center justify-center text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <Pencil size={15} aria-hidden="true" />
              </Link>
            </div>
            );
          })}
        </section>
      ) : (
        <Link
          href="/entrenar/nueva-rutina"
          className="flex items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-4 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
        >
          <Plus size={18} aria-hidden="true" />
          Crear tu primera rutina
        </Link>
      )}

      {/* Blank workout */}
      <button
        type="button"
        onClick={handleStartBlank}
        disabled={startingId !== null}
        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
      >
        Empezar sin rutina
      </button>

      {/* Activity calendar */}
      {workoutDates && <ActivityCalendar workoutDates={workoutDates} />}

      {/* History */}
      {summaries === undefined ? (
        <ListSkeleton />
      ) : summaries.length === 0 ? (
        <EmptyState />
      ) : (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Historial</h2>
          <ul className="flex flex-col gap-2">
            {summaries.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/entrenar/sesion?id=${s.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-base font-semibold">
                      {formatDate(s.date)}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {s.setCount === 0
                        ? "Sin series"
                        : `${s.exerciseCount} ejercicio${s.exerciseCount !== 1 ? "s" : ""} · ${s.setCount} serie${s.setCount !== 1 ? "s" : ""}`}
                    </span>
                    {s.exerciseNames.length > 0 && (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {s.exerciseNames.join(", ")}
                      </span>
                    )}
                  </span>
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-zinc-400 dark:text-zinc-600"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-base font-semibold">Todavía no hay entrenamientos</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Creá una rutina o empezá un entrenamiento libre.
      </p>
    </div>
  );
}

function RoutinesSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-[68px] animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-[76px] animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
        />
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  const date = new Date(iso + "T12:00:00");
  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
