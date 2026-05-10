"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Dumbbell, Plus, Trash2, X } from "lucide-react";
import { useWorkout, useWorkoutSets } from "@/lib/hooks/use-workouts";
import { useExercises } from "@/lib/hooks/use-exercises";
import { useRoutine } from "@/lib/hooks/use-routines";
import { completeWorkout, deleteSet, deleteWorkout } from "@/lib/db/workouts";
import { WorkoutSetInput } from "@/components/workout-set-input";
import { WorkoutExercisePicker } from "@/components/workout-exercise-picker";
import { MUSCLE_GROUP_LABELS } from "@/types";
import type { Exercise, ID, WorkoutSet } from "@/types";

export default function SesionPage() {
  return (
    <Suspense
      fallback={
        <p className="py-6 text-sm text-zinc-500 dark:text-zinc-400">
          Cargando...
        </p>
      }
    >
      <SesionContent />
    </Suspense>
  );
}

function SesionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const idParam = searchParams.get("id");
  const id = idParam ? Number.parseInt(idParam, 10) : Number.NaN;

  const workout = useWorkout(id);
  const sets = useWorkoutSets(id);
  const allExercises = useExercises("all");
  const routine = useRoutine(workout?.routineId ?? Number.NaN);

  const [showPicker, setShowPicker] = useState(false);
  const [pendingExerciseIds, setPendingExerciseIds] = useState<ID[]>([]);
  const [finishing, setFinishing] = useState(false);
  const routineLoaded = useRef(false);

  // Pre-populate exercises from routine (once)
  useEffect(() => {
    if (routineLoaded.current) return;
    if (routine && routine.exerciseIds.length > 0) {
      setPendingExerciseIds(routine.exerciseIds);
      routineLoaded.current = true;
    }
  }, [routine]);

  if (Number.isNaN(id)) {
    return <NotFoundState />;
  }

  if (workout === undefined || sets === undefined || allExercises === undefined) {
    return (
      <p className="py-6 text-sm text-zinc-500 dark:text-zinc-400">
        Cargando...
      </p>
    );
  }

  if (workout === null) {
    return <NotFoundState />;
  }

  const exerciseMap = new Map<ID, Exercise>(
    allExercises.map((e) => [e.id!, e]),
  );

  // Group sets by exerciseId
  const exerciseIdsFromSets = [
    ...new Set(sets.map((s) => s.exerciseId)),
  ];
  const allExerciseIds = [
    ...new Set([...exerciseIdsFromSets, ...pendingExerciseIds]),
  ];

  function handleSelectExercise(exerciseId: ID) {
    setPendingExerciseIds((prev) =>
      prev.includes(exerciseId) ? prev : [...prev, exerciseId],
    );
    setShowPicker(false);
  }

  async function handleDeleteWorkout() {
    const confirmed = window.confirm(
      "¿Eliminar este entrenamiento y todas sus series? Esta acción no se puede deshacer.",
    );
    if (!confirmed) return;
    await deleteWorkout(id);
    router.push("/entrenar");
  }

  async function handleDeleteSet(setId: ID) {
    await deleteSet(setId);
  }

  async function handleFinish() {
    if (!sets || sets.length === 0) return;
    setFinishing(true);
    try {
      await completeWorkout(id);
      router.push("/entrenar");
    } catch {
      setFinishing(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 py-6">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Link
          href="/entrenar"
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Entrenamiento</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatDate(workout.date)}
          </p>
        </div>
      </header>

      {/* Exercise groups */}
      {allExerciseIds.length === 0 && !showPicker && <EmptySessionState />}

      {allExerciseIds.map((exerciseId) => {
        const exercise = exerciseMap.get(exerciseId);
        const exerciseSets = sets.filter((s) => s.exerciseId === exerciseId);

        return (
          <ExerciseGroup
            key={exerciseId}
            name={exercise?.name ?? "Ejercicio eliminado"}
            muscleGroup={
              exercise
                ? MUSCLE_GROUP_LABELS[exercise.muscleGroup]
                : undefined
            }
            sets={exerciseSets}
            workoutId={id}
            exerciseId={exerciseId}
            onDeleteSet={handleDeleteSet}
          />
        );
      })}

      {/* Exercise picker */}
      {showPicker ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Elegir ejercicio</h2>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              aria-label="Cerrar"
              className="flex size-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          {allExercises.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No tenés ejercicios creados.
              </p>
              <Link
                href="/ejercicios/nuevo"
                className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
              >
                Crear uno
              </Link>
            </div>
          ) : (
            <WorkoutExercisePicker
              onSelect={handleSelectExercise}
              selectedIds={allExerciseIds}
            />
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="flex items-center justify-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
        >
          <Plus size={16} aria-hidden="true" />
          Agregar ejercicio
        </button>
      )}

      {/* Delete (secondary, in flow) */}
      <button
        type="button"
        onClick={handleDeleteWorkout}
        className="flex h-12 items-center justify-center gap-2 rounded-xl border border-red-300 px-5 text-base font-semibold text-red-700 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
      >
        <Trash2 size={18} aria-hidden="true" />
        Eliminar entrenamiento
      </button>

      {/* Sticky finish CTA — sits above the BottomNav */}
      <div
        className="sticky z-30 -mx-4 mt-2 border-t border-zinc-200 bg-zinc-50/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-zinc-50/75 dark:border-zinc-800 dark:bg-black/95 dark:supports-[backdrop-filter]:bg-black/75"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={handleFinish}
          disabled={sets.length === 0 || finishing}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-zinc-900 px-6 text-base font-semibold text-zinc-50 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {finishing ? "Finalizando..." : "Finalizar entrenamiento"}
        </button>
        {sets.length === 0 && (
          <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Agregá al menos una serie para finalizar.
          </p>
        )}
      </div>
    </div>
  );
}

function ExerciseGroup({
  name,
  muscleGroup,
  sets,
  workoutId,
  exerciseId,
  onDeleteSet,
}: {
  name: string;
  muscleGroup?: string;
  sets: WorkoutSet[];
  workoutId: ID;
  exerciseId: ID;
  onDeleteSet: (id: ID) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      {/* Exercise header */}
      <div className="flex items-center gap-2">
        <Dumbbell
          size={16}
          className="text-zinc-400 dark:text-zinc-500"
          aria-hidden="true"
        />
        <span className="font-semibold">{name}</span>
        {muscleGroup && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            · {muscleGroup}
          </span>
        )}
      </div>

      {/* Sets table */}
      {sets.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 px-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            <span>#</span>
            <span>Kg</span>
            <span>Reps</span>
            <span />
          </div>
          {sets.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2 rounded-lg px-1 py-1.5 text-sm"
            >
              <span className="text-zinc-400 dark:text-zinc-500">
                {s.setNumber}
              </span>
              <span className="font-medium">{s.weightKg}</span>
              <span className="font-medium">{s.reps}</span>
              <button
                type="button"
                onClick={() => onDeleteSet(s.id!)}
                aria-label={`Eliminar serie ${s.setNumber}`}
                className="flex size-6 items-center justify-center rounded text-zinc-300 transition-colors hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400"
              >
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add set input */}
      <WorkoutSetInput workoutId={workoutId} exerciseId={exerciseId} />
    </div>
  );
}

function EmptySessionState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <Dumbbell
        size={28}
        className="text-zinc-300 dark:text-zinc-600"
        aria-hidden="true"
      />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Agregá un ejercicio para empezar a registrar series.
      </p>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6">
      <p className="text-base font-semibold">Entrenamiento no encontrado</p>
      <Link
        href="/entrenar"
        className="mt-2 text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
      >
        Volver al historial
      </Link>
    </div>
  );
}

function formatDate(iso: string) {
  const date = new Date(iso + "T12:00:00");
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
