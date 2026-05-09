export const metadata = {
  title: "Peso",
};

export default function PesoPage() {
  return (
    <div className="flex flex-1 flex-col gap-2 py-6">
      <h1 className="text-3xl font-bold tracking-tight">Peso corporal</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Próximamente vas a poder registrar tu peso y ver el gráfico de
        evolución.
      </p>
    </div>
  );
}
