"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useBodyWeights } from "@/lib/hooks/use-body-weights";
import { createBodyWeight, deleteBodyWeight } from "@/lib/db/body-weight";
import { parseDecimal, sanitizeDecimalInput } from "@/lib/number";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type RangeKey = "7d" | "30d" | "90d" | "all";
const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: "7d", label: "7d", days: 7 },
  { key: "30d", label: "30d", days: 30 },
  { key: "90d", label: "90d", days: 90 },
  { key: "all", label: "Todo", days: null },
];

export default function PesoPage() {
  const entries = useBodyWeights();
  const [range, setRange] = useState<RangeKey>("30d");

  const filteredEntries = entries
    ? filterByRange(entries, range)
    : undefined;

  return (
    <div className="flex flex-1 flex-col gap-6 py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Peso corporal</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Registrá tu peso y seguí la evolución.
        </p>
      </header>

      <WeightForm />

      {entries === undefined ? (
        <ChartSkeleton />
      ) : entries.length >= 2 ? (
        <>
          <div className="flex gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  range === r.key
                    ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950"
                    : "border border-zinc-300 text-zinc-500 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <WeightChart entries={filteredEntries!} />
        </>
      ) : entries.length === 1 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Agregá al menos 2 registros para ver el gráfico.
        </p>
      ) : null}

      {entries === undefined ? (
        <ListSkeleton />
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : (
        <WeightList entries={entries} />
      )}
    </div>
  );
}

function WeightForm() {
  const [date, setDate] = useState(todayISO);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const weightValue = parseDecimal(weight);
  const isWeightValid = weight !== "" && !Number.isNaN(weightValue) && weightValue > 0;
  const canSubmit = isWeightValid && !!date && !submitting;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const kg = parseDecimal(weight);
    if (!weight || Number.isNaN(kg) || kg <= 0) {
      setError("Ingresá un peso válido.");
      return;
    }
    if (!date) {
      setError("Seleccioná una fecha.");
      return;
    }

    setSubmitting(true);
    try {
      await createBodyWeight({ date, weightKg: kg, notes: notes || undefined });
      setWeight("");
      setNotes("");
      setDate(todayISO());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Peso (kg)</span>
          <input
            type="text"
            inputMode="decimal"
            value={weight}
            onChange={(e) => {
              const sanitized = sanitizeDecimalInput(e.target.value);
              if (sanitized === null) return;
              setWeight(sanitized);
            }}
            placeholder="Ej: 75,5"
            aria-invalid={weight !== "" && !isWeightValid}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-900 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Fecha</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">
          Notas <span className="text-zinc-400">(opcional)</span>
        </span>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={120}
          placeholder="Ej: Post desayuno"
          className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
        />
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex h-12 items-center justify-center rounded-xl bg-zinc-900 px-6 text-base font-semibold text-zinc-50 transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        {submitting ? "Guardando..." : "Registrar peso"}
      </button>
    </form>
  );
}

function WeightChart({ entries }: { entries: { date: string; weightKg: number }[] }) {
  const data = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: formatShortDate(e.date),
      kg: e.weightKg,
    }));

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-3 text-sm font-semibold">Evolución</h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            stroke="#a1a1aa"
          />
          <YAxis
            domain={["dataMin - 1", "dataMax + 1"]}
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
  );
}

function WeightList({ entries }: { entries: { id?: number; date: string; weightKg: number; notes?: string }[] }) {
  async function handleDelete(id: number | undefined, weight: number) {
    if (id == null) return;
    const confirmed = window.confirm(
      `¿Eliminar registro de ${weight} kg? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    await deleteBodyWeight(id);
  }

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">Historial</h2>
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-base font-semibold">
                {entry.weightKg} kg
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatLongDate(entry.date)}
                {entry.notes ? ` · ${entry.notes}` : ""}
              </span>
            </span>
            <button
              type="button"
              onClick={() => handleDelete(entry.id, entry.weightKg)}
              aria-label={`Eliminar registro de ${entry.weightKg} kg`}
              className="flex size-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-base font-semibold">Sin registros de peso</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Usá el formulario de arriba para agregar tu primer registro.
      </p>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div
      className="h-[280px] animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      aria-hidden="true"
    />
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-[60px] animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
        />
      ))}
    </div>
  );
}

function filterByRange(
  entries: { date: string; weightKg: number }[],
  range: RangeKey,
) {
  const r = RANGES.find((r) => r.key === range)!;
  if (!r.days) return entries;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - r.days);
  const cutoffISO = cutoff.toISOString().slice(0, 10);
  return entries.filter((e) => e.date >= cutoffISO);
}

function formatShortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function formatLongDate(iso: string) {
  const date = new Date(iso + "T12:00:00");
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
