"use client";

import { useEffect, useRef } from "react";
import { localDateISO, todayISO } from "@/lib/date";

const WEEKS = 53;
const DAYS = 7;
const DAY_LABELS = ["", "L", "", "M", "", "V", ""];

function getCalendarDates(): string[][] {
  const today = new Date();
  const todayDay = today.getDay(); // 0=dom
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - todayDay));

  const grid: string[][] = [];

  for (let week = WEEKS - 1; week >= 0; week--) {
    const col: string[] = [];
    for (let day = 0; day < DAYS; day++) {
      const d = new Date(endDate);
      d.setDate(endDate.getDate() - week * 7 - (6 - day));
      col.push(localDateISO(d));
    }
    grid.push(col);
  }

  return grid;
}

function getMonthLabels(grid: string[][]): { label: string; col: number }[] {
  const labels: { label: string; col: number }[] = [];
  let lastMonth = "";

  for (let col = 0; col < grid.length; col++) {
    const date = grid[col][1] ?? grid[col][0];
    const month = new Date(date + "T12:00:00").toLocaleDateString("es-AR", {
      month: "short",
    });

    if (month !== lastMonth) {
      labels.push({ label: month.charAt(0).toUpperCase() + month.slice(1), col });
      lastMonth = month;
    }
  }

  return labels;
}

interface ActivityCalendarProps {
  workoutDates: Set<string>;
}

export function ActivityCalendar({ workoutDates }: ActivityCalendarProps) {
  const grid = getCalendarDates();
  const monthLabels = getMonthLabels(grid);
  const today = todayISO();
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-3 text-sm font-semibold">Actividad</h2>

      <div ref={scrollerRef} className="overflow-x-auto">
        <div className="mx-auto flex w-fit flex-col gap-0.5">
          {/* Month labels */}
          <div className="flex gap-0.5 pl-6">
            {(() => {
              const cells: React.ReactNode[] = [];
              for (let col = 0; col < grid.length; col++) {
                const label = monthLabels.find((m) => m.col === col);
                cells.push(
                  <span
                    key={col}
                    className="size-3.5 text-center text-[9px] leading-[14px] text-zinc-600 dark:text-zinc-500"
                  >
                    {label ? label.label.slice(0, 3) : ""}
                  </span>,
                );
              }
              return cells;
            })()}
          </div>

          {/* Grid rows */}
          {Array.from({ length: DAYS }).map((_, dayIdx) => (
            <div key={dayIdx} className="flex items-center gap-0.5">
              <span className="w-5 text-right text-[9px] text-zinc-600 dark:text-zinc-500 mr-1">
                {DAY_LABELS[dayIdx]}
              </span>
              {grid.map((week, colIdx) => {
                const date = week[dayIdx];
                const isActive = workoutDates.has(date);
                const isFuture = date > today;

                return (
                  <span
                    key={colIdx}
                    title={isFuture ? undefined : `${date}${isActive ? " — Entrenamiento" : ""}`}
                    className={`size-3.5 rounded-sm ${
                      isFuture
                        ? "bg-transparent"
                        : isActive
                          ? "bg-emerald-500 dark:bg-emerald-400"
                          : "bg-zinc-100 dark:bg-zinc-800"
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
