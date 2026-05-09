import Link from "next/link";
import { Dumbbell, PlayCircle, Scale } from "lucide-react";

const QUICK_ACTIONS = [
  {
    href: "/ejercicios",
    label: "Ejercicios",
    description: "Armá tu catálogo por grupo muscular.",
    icon: Dumbbell,
  },
  {
    href: "/entrenar",
    label: "Entrenar",
    description: "Registrá series y revisá tu historial.",
    icon: PlayCircle,
  },
  {
    href: "/peso",
    label: "Peso corporal",
    description: "Llevá el seguimiento de tu peso en el tiempo.",
    icon: Scale,
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col gap-8 py-6">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          TuGym
        </span>
        <h1 className="text-3xl font-bold tracking-tight">Hola</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Listo para registrar tu próximo entrenamiento.
        </p>
      </header>

      <section className="grid gap-3">
        {QUICK_ACTIONS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
              <Icon size={22} aria-hidden="true" />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-base font-semibold">{label}</span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {description}
              </span>
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
