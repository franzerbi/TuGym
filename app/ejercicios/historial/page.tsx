"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ArrowLeft, Pencil } from "lucide-react";
import { getExercise } from "@/lib/db/exercises";
import { useExerciseHistory } from "@/lib/hooks/use-workouts";
import { MUSCLE_GROUP_LABELS } from "@/types";
import type { Exercise } from "@/types";

export default function HistorialPage() {
  return (
    <Suspense
      fallback={
        <p className="py-6 text-sm text-zinc-500 dark:text-zinc-400">
          Cargando...
        </p>
      }
    >
      <HistorialContent />
    </Suspense>
  );
}

function HistorialContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const id = idParam ? Number.parseInt(idParam, 10) : Number.NaN;

  const exercise = useLiveQuery(
    async () => {
      if (Number.isNaN(id)) return null;
      return (await getExercise(id)) ?? null;
    },
    [id],
  );

  const history = useExerciseHistory(id);

  if (Number.isNaN(id)) return <NotFoundState />;

  if (exercise === undefined || history === undefined) {
    return (
      <p className="py-6 text-sm text-zinc-500 dark:text-zinc-400">
        Cargando...
      </p>
    );
  }

  if (exercise === null) return <NotFoundState />;

  // Chart data: max weight per session
  const chartData = [...history]
    .sort((a, b) => a.workoutDate.localeCompare(b.workoutDate))
    .map((entry) => ({
      date: formatShortDate(entry.workoutDate),
      kg: Math.max(...entry.sets.map((s) => s.weightKg)),
    }));

  return (
    <div className="flex flex-1 flex-col gap-5 py-6">
      <header className="flex items-center gap-3">
        <Link
          href="/ejercicios"
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{exercise.name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
          </p>
        </div>
        <Link
          href={`/ejercicios/editar?id=${id}`}
          aria-label="Editar ejercicio"
          className="flex size-10 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
        >
          <Pencil size={18} aria-hidden="true" />
        </Link>
      </header>

      {history.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Weight chart */}
          {chartData.length >= 2 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-3 text-sm font-semibold">
                Peso máximo por sesión
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#27272a"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke="#a1a1aa"
                  />
                  <YAxis
                    domain={["dataMin - 2", "dataMax + 2"]}
                    tick={{ fontSize: 11 }}
                    stroke="#a1a1aa"
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                    labelStyle={{ color: "#a1a1aa" }}
                    itemStyle={{ color: "#fafafa" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="kg"
                    name="Peso"
                    stroke="#f4f4f5"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#f4f4f5", stroke: "#f4f4f5" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Session history */}
          <section>
            <h2 className="mb-2 text-sm font-semibold">Historial</h2>
            <ul className="flex flex-col gap-2">
              {history.map((entry) => (
                <li
                  key={entry.workoutDate}
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <p className="mb-2 text-sm font-semibold">
                    {formatLongDate(entry.workoutDate)}
                  </p>
                  <div className="flex flex-col gap-1">
                    {entry.sets.map((s) => (
                      <div
                        key={s.id}
                        className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400"
                      >
                        <span className="w-8 text-zinc-400 dark:text-zinc-500">
                          #{s.setNumber}
                        </span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {s.weightKg} kg
                        </span>
                        <span>× {s.reps} reps</span>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-base font-semibold">Sin historial</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Este ejercicio todavía no tiene series registradas.
      </p>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6">
      <p className="text-base font-semibold">Ejercicio no encontrado</p>
      <Link
        href="/ejercicios"
        className="mt-2 text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
      >
        Volver a la lista
      </Link>
    </div>
  );
}

function formatShortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function formatLongDate(iso: string) {
  const date = new Date(iso + "T12:00:00");
  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
