"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RoutineForm } from "@/components/routine-form";
import { createRoutine } from "@/lib/db/routines";

export default function NuevaRutinaPage() {
  const router = useRouter();

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
        <h1 className="text-2xl font-bold tracking-tight">Nueva rutina</h1>
      </header>

      <RoutineForm
        submitLabel="Crear rutina"
        onSubmit={async (values) => {
          await createRoutine(values);
          router.push("/entrenar");
        }}
        onCancel={() => router.push("/entrenar")}
      />
    </div>
  );
}
