"use client";

const WEEKS = 13;
const DAYS = 7;
const DAY_LABELS = ["", "L", "", "M", "", "V", ""];

function getCalendarDates(): string[][] {
  const today = new Date();
  const todayDay = today.getDay(); // 0=dom
  // End of current week (Saturday)
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - todayDay));

  const grid: string[][] = [];

  for (let week = WEEKS - 1; week >= 0; week--) {
    const col: string[] = [];
    for (let day = 0; day < DAYS; day++) {
      const d = new Date(endDate);
      d.setDate(endDate.getDate() - week * 7 - (6 - day));
      col.push(d.toISOString().slice(0, 10));
    }
    grid.push(col);
  }

  return grid;
}

function getMonthLabels(grid: string[][]): { label: string; col: number }[] {
  const labels: { label: string; col: number }[] = [];
  let lastMonth = "";

  for (let col = 0; col < grid.length; col++) {
    // Use the Monday (index 1) of each week to determine month
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
  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-3 text-sm font-semibold">Actividad</h2>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-0.5" style={{ minWidth: "fit-content" }}>
          {/* Month labels */}
          <div className="flex gap-0.5 pl-6">
            {(() => {
              const cells: React.ReactNode[] = [];
              for (let col = 0; col < grid.length; col++) {
                const label = monthLabels.find((m) => m.col === col);
                cells.push(
                  <span
                    key={col}
                    className="size-3.5 text-center text-[9px] leading-[14px] text-zinc-400 dark:text-zinc-500"
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
              <span className="w-5 text-right text-[9px] text-zinc-400 dark:text-zinc-500 mr-1">
                {DAY_LABELS[dayIdx]}
              </span>
              {grid.map((week, colIdx) => {
                const date = week[dayIdx];
                const isActive = workoutDates.has(date);
                const isFuture = date > todayISO;

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
