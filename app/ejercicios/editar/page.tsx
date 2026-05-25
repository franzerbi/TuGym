"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Trash2 } from "lucide-react";
import { ExerciseForm } from "@/components/exercise-form";
import {
  deleteExercise,
  getExercise,
  updateExercise,
} from "@/lib/db/exercises";

export default function EditarEjercicioPage() {
  return (
    <Suspense
      fallback={
        <p className="py-6 text-sm text-zinc-600 dark:text-zinc-400">
          Cargando...
        </p>
      }
    >
      <EditarContent />
    </Suspense>
  );
}

function EditarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const idParam = searchParams.get("id");
  const id = idParam ? Number.parseInt(idParam, 10) : Number.NaN;

  const exercise = useLiveQuery(
    async () => {
      if (Number.isNaN(id)) return null;
      return (await getExercise(id)) ?? null;
    },
    [id],
  );

  async function handleDelete() {
    if (exercise == null) return;
    const confirmed = window.confirm(
      `¿Eliminar "${exercise.name}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    await deleteExercise(id);
    router.push("/ejercicios");
  }

  if (Number.isNaN(id)) {
    return <NotFoundState />;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 py-6">
      <header className="flex items-center gap-3">
        <Link
          href="/ejercicios"
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Editar ejercicio</h1>
      </header>

      {exercise === undefined ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Cargando...</p>
      ) : exercise === null ? (
        <NotFoundState />
      ) : (
        <>
          <ExerciseForm
            initialValues={{
              name: exercise.name,
              muscleGroup: exercise.muscleGroup,
            }}
            submitLabel="Guardar cambios"
            onSubmit={async (values) => {
              await updateExercise(id, values);
              router.push("/ejercicios");
            }}
            onCancel={() => router.push("/ejercicios")}
          />

          <div className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleDelete}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-300 px-5 text-base font-semibold text-red-700 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
            >
              <Trash2 size={18} aria-hidden="true" />
              Eliminar ejercicio
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-base font-semibold">Ejercicio no encontrado</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Puede que lo hayas eliminado.
      </p>
      <Link
        href="/ejercicios"
        className="mt-2 text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
      >
        Volver a la lista
      </Link>
    </div>
  );
}
