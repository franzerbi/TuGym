"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ExerciseForm } from "@/components/exercise-form";
import { createExercise } from "@/lib/db/exercises";

export default function NuevoEjercicioPage() {
  const router = useRouter();

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
        <h1 className="text-2xl font-bold tracking-tight">Nuevo ejercicio</h1>
      </header>

      <ExerciseForm
        submitLabel="Crear ejercicio"
        onSubmit={async (values) => {
          await createExercise(values);
          router.push("/ejercicios");
        }}
        onCancel={() => router.push("/ejercicios")}
      />
    </div>
  );
}
