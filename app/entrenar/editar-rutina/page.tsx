"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { RoutineForm } from "@/components/routine-form";
import { useRoutine } from "@/lib/hooks/use-routines";
import { deleteRoutine, updateRoutine } from "@/lib/db/routines";

export default function EditarRutinaPage() {
  return (
    <Suspense
      fallback={
        <p className="py-6 text-sm text-zinc-500 dark:text-zinc-400">
          Cargando...
        </p>
      }
    >
      <EditarRutinaContent />
    </Suspense>
  );
}

function EditarRutinaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const idParam = searchParams.get("id");
  const id = idParam ? Number.parseInt(idParam, 10) : Number.NaN;

  const routine = useRoutine(id);

  async function handleDelete() {
    if (routine == null) return;
    const confirmed = window.confirm(
      `¿Eliminar "${routine.name}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    await deleteRoutine(id);
    router.push("/entrenar");
  }

  if (Number.isNaN(id)) {
    return <NotFoundState />;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 py-6">
      <header className="flex items-center gap-3">
        <Link
          href="/entrenar"
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Editar rutina</h1>
      </header>

      {routine === undefined ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando...</p>
      ) : routine === null ? (
        <NotFoundState />
      ) : (
        <>
          <RoutineForm
            initialValues={{
              name: routine.name,
              exerciseIds: routine.exerciseIds,
              days: routine.days ?? [],
            }}
            submitLabel="Guardar cambios"
            onSubmit={async (values) => {
              await updateRoutine(id, values);
              router.push("/entrenar");
            }}
            onCancel={() => router.push("/entrenar")}
          />

          <div className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleDelete}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-300 px-5 text-base font-semibold text-red-700 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
            >
              <Trash2 size={18} aria-hidden="true" />
              Eliminar rutina
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
      <p className="text-base font-semibold">Rutina no encontrada</p>
      <Link
        href="/entrenar"
        className="mt-2 text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
      >
        Volver
      </Link>
    </div>
  );
}
