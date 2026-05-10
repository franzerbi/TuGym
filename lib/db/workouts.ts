import { getDb } from "./index";
import type { ID, Workout, WorkoutSet } from "@/types";

export type WorkoutInput = Pick<Workout, "date"> & {
  notes?: string;
  routineId?: ID;
};
export type WorkoutSetInput = Pick<
  WorkoutSet,
  "workoutId" | "exerciseId" | "weightKg" | "reps" | "setNumber"
>;

export async function listWorkouts(): Promise<Workout[]> {
  const items = await getDb().workouts.toArray();
  return items.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

export async function getWorkout(id: ID): Promise<Workout | undefined> {
  return getDb().workouts.get(id);
}

export async function createWorkout(input: WorkoutInput): Promise<ID> {
  return getDb().workouts.add({
    date: input.date,
    notes: input.notes?.trim() || undefined,
    routineId: input.routineId,
    createdAt: Date.now(),
  });
}

export async function completeWorkout(id: ID): Promise<void> {
  await getDb().workouts.update(id, { completedAt: Date.now() });
}

export async function findInProgressWorkout(
  date: string,
  routineId?: ID,
): Promise<Workout | undefined> {
  const candidates = await getDb()
    .workouts.where("date")
    .equals(date)
    .toArray();
  return candidates.find(
    (w) => w.completedAt == null && w.routineId === routineId,
  );
}

export async function deleteWorkout(id: ID): Promise<void> {
  const db = getDb();
  await db.transaction("rw", [db.workouts, db.sets], async () => {
    await db.sets.where("workoutId").equals(id).delete();
    await db.workouts.delete(id);
  });
}

export async function listSetsByWorkout(workoutId: ID): Promise<WorkoutSet[]> {
  const sets = await getDb()
    .sets.where("workoutId")
    .equals(workoutId)
    .toArray();
  return sets.sort(
    (a, b) => a.exerciseId - b.exerciseId || a.setNumber - b.setNumber,
  );
}

export async function addSet(input: WorkoutSetInput): Promise<ID> {
  if (input.weightKg <= 0) throw new Error("El peso debe ser mayor a 0.");
  if (input.reps <= 0) throw new Error("Las repeticiones deben ser mayor a 0.");

  return getDb().sets.add({
    workoutId: input.workoutId,
    exerciseId: input.exerciseId,
    weightKg: input.weightKg,
    reps: input.reps,
    setNumber: input.setNumber,
  });
}

export async function deleteSet(id: ID): Promise<void> {
  await getDb().sets.delete(id);
}

export interface ExerciseHistoryEntry {
  workoutDate: string;
  sets: WorkoutSet[];
}

export async function listHistoryByExercise(
  exerciseId: ID,
): Promise<ExerciseHistoryEntry[]> {
  const db = getDb();
  const sets = await db.sets.where("exerciseId").equals(exerciseId).toArray();
  if (sets.length === 0) return [];

  const workoutIds = [...new Set(sets.map((s) => s.workoutId))];
  const workouts = await db.workouts.bulkGet(workoutIds);
  const dateMap = new Map<number, string>();
  for (const w of workouts) {
    if (w) dateMap.set(w.id!, w.date);
  }

  const grouped = new Map<number, WorkoutSet[]>();
  for (const s of sets) {
    const arr = grouped.get(s.workoutId) ?? [];
    arr.push(s);
    grouped.set(s.workoutId, arr);
  }

  return [...grouped.entries()]
    .map(([wId, wSets]) => ({
      workoutDate: dateMap.get(wId) ?? "",
      sets: wSets.sort((a, b) => a.setNumber - b.setNumber),
    }))
    .filter((e) => e.workoutDate)
    .sort((a, b) => b.workoutDate.localeCompare(a.workoutDate));
}

export async function getNextSetNumber(
  workoutId: ID,
  exerciseId: ID,
): Promise<number> {
  const count = await getDb()
    .sets.where("[workoutId+exerciseId]")
    .equals([workoutId, exerciseId])
    .count();
  return count + 1;
}
