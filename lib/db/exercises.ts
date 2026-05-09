import { getDb } from "./index";
import type { Exercise, ID, MuscleGroup } from "@/types";

export type ExerciseInput = Pick<Exercise, "name" | "muscleGroup">;

function normalizeName(name: string): string {
  return name.trim();
}

export async function listExercises(filter?: {
  muscleGroup?: MuscleGroup;
}): Promise<Exercise[]> {
  const db = getDb();
  const collection = filter?.muscleGroup
    ? db.exercises.where("muscleGroup").equals(filter.muscleGroup)
    : db.exercises.toCollection();

  const items = await collection.toArray();
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getExercise(id: ID): Promise<Exercise | undefined> {
  return getDb().exercises.get(id);
}

export async function createExercise(input: ExerciseInput): Promise<ID> {
  const name = normalizeName(input.name);
  if (!name) throw new Error("El nombre no puede estar vacío.");

  return getDb().exercises.add({
    name,
    muscleGroup: input.muscleGroup,
    createdAt: Date.now(),
  });
}

export async function updateExercise(
  id: ID,
  patch: Partial<ExerciseInput>,
): Promise<void> {
  const next: Partial<Exercise> = {};
  if (patch.name !== undefined) {
    const name = normalizeName(patch.name);
    if (!name) throw new Error("El nombre no puede estar vacío.");
    next.name = name;
  }
  if (patch.muscleGroup !== undefined) next.muscleGroup = patch.muscleGroup;

  await getDb().exercises.update(id, next);
}

export async function deleteExercise(id: ID): Promise<void> {
  await getDb().exercises.delete(id);
}
