"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Dumbbell, PlayCircle, Scale, ChevronRight, Settings } from "lucide-react";
import { getDb } from "@/lib/db/index";
import { createWorkout, findInProgressWorkout } from "@/lib/db/workouts";
import { useRoutines } from "@/lib/hooks/use-routines";
import { useBodyWeights } from "@/lib/hooks/use-body-weights";
import type { ID } from "@/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function useLastWorkout() {
  return useLiveQuery(async () => {
    const db = getDb();
    const workouts = await db.workouts.toArray();
    if (workouts.length === 0) return null;
    const sorted = workouts.sort(
      (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
    );
    const last = sorted[0];
    const sets = await db.sets.where("workoutId").equals(last.id!).toArray();
    const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
    const exercises = await db.exercises.bulkGet(exerciseIds);
    return {
      date: last.date,
      setCount: sets.length,
      exerciseCount: exerciseIds.length,
      exerciseNames: exercises
        .filter(Boolean)
        .map((e) => e!.name)
        .slice(0, 3),
    };
  });
}

export default function Home() {
  const router = useRouter();
  const routines = useRoutines();
  const bodyWeights = useBodyWeights();
  const lastWorkout = useLastWorkout();
  const [startingId, setStartingId] = useState<ID | null>(null);

  const [todayDay, setTodayDay] = useState(() => new Date().getDay());

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setTodayDay(new Date().getDay());
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const todayRoutine = (routines ?? []).find((r) =>
    r.days?.includes(todayDay),
  );

  const lastWeight =
    bodyWeights && bodyWeights.length > 0 ? bodyWeights[0] : null;

  async function handleStartRoutine(routineId: ID) {
    setStartingId(routineId);
    try {
      const today = todayISO();
      const existing = await findInProgressWorkout(today, routineId);
      const id =
        existing?.id ?? (await createWorkout({ date: today, routineId }));
      router.push(`/entrenar/sesion?id=${id}`);
    } catch {
      setStartingId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 py-6">
      {/* Greeting */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {formatGreeting()}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Hola, Fran</h1>
        </div>
        <Link
          href="/settings"
          aria-label="Ajustes"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600"
        >
          <Settings size={20} aria-hidden="true" />
        </Link>
      </header>

      {/* Today's routine */}
      {routines === undefined ? (
        <div className="h-[100px] animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
      ) : todayRoutine ? (
        <button
          type="button"
          onClick={() => handleStartRoutine(todayRoutine.id!)}
          disabled={startingId !== null}
          className="flex flex-col gap-2 rounded-2xl border border-zinc-900 bg-white p-5 text-left transition-all hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-60 dark:border-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          <span className="flex items-center gap-2">
            <PlayCircle
              size={20}
              className="text-zinc-700 dark:text-zinc-300"
              aria-hidden="true"
            />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Rutina de hoy
            </span>
          </span>
          <span className="text-xl font-bold">{todayRoutine.name}</span>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {todayRoutine.exerciseIds.length} ejercicio
            {todayRoutine.exerciseIds.length !== 1 ? "s" : ""} — Toca para
            empezar
          </span>
        </button>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Hoy no tenés rutina asignada — descansá o{" "}
            <Link
              href="/entrenar"
              className="font-semibold text-zinc-900 underline dark:text-zinc-100"
            >
              entrená libre
            </Link>
            .
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Last workout */}
        <Link
          href="/entrenar"
          className="flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:active:bg-zinc-900"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
            Último entreno
          </span>
          {lastWorkout === undefined ? (
            <span className="h-5 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          ) : lastWorkout ? (
            <>
              <span className="text-base font-bold">
                {formatRelativeDate(lastWorkout.date)}
              </span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                {lastWorkout.exerciseCount} ej · {lastWorkout.setCount} series
              </span>
            </>
          ) : (
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Sin datos</span>
          )}
        </Link>

        {/* Last weight */}
        <Link
          href="/peso"
          className="flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:active:bg-zinc-900"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
            Último peso
          </span>
          {bodyWeights === undefined ? (
            <span className="h-5 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          ) : lastWeight ? (
            <>
              <span className="text-base font-bold">
                {lastWeight.weightKg} kg
              </span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                {formatRelativeDate(lastWeight.date)}
              </span>
            </>
          ) : (
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Sin datos</span>
          )}
        </Link>
      </div>

      {/* Quick links */}
      <section className="grid gap-2">
        {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-zinc-300 active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:active:bg-zinc-900"
          >
            <Icon
              size={18}
              className="text-zinc-500 dark:text-zinc-500"
              aria-hidden="true"
            />
            <span className="flex-1 text-sm font-semibold">{label}</span>
            <ChevronRight
              size={16}
              className="text-zinc-300 dark:text-zinc-700"
              aria-hidden="true"
            />
          </Link>
        ))}
      </section>
    </div>
  );
}

const QUICK_LINKS = [
  { href: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { href: "/entrenar", label: "Entrenar", icon: PlayCircle },
  { href: "/peso", label: "Peso corporal", icon: Scale },
];

function formatGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

function formatRelativeDate(iso: string) {
  const today = todayISO();
  if (iso === today) return "Hoy";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (iso === yesterday.toISOString().slice(0, 10)) return "Ayer";

  const date = new Date(iso + "T12:00:00");
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}
