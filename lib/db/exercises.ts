import { getDb } from "./index";
import type { Exercise, ID, MuscleGroup } from "@/types";

export type ExerciseInput = Pick<
  Exercise,
  "name" | "muscleGroup" | "restSeconds"
>;

const REST_MIN = 10;
const REST_MAX = 600;

function normalizeName(name: string): string {
  return name.trim();
}

function normalizeRestSeconds(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error("El descanso debe ser un número entero de segundos.");
  }
  if (value < REST_MIN || value > REST_MAX) {
    throw new Error(
      `El descanso debe estar entre ${REST_MIN} y ${REST_MAX} segundos.`,
    );
  }
  return value;
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

  const rest = normalizeRestSeconds(input.restSeconds);

  const row: Omit<Exercise, "id"> = {
    name,
    muscleGroup: input.muscleGroup,
    createdAt: Date.now(),
  };
  if (rest !== undefined) row.restSeconds = rest;

  return getDb().exercises.add(row);
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
  if ("restSeconds" in patch) {
    next.restSeconds = normalizeRestSeconds(patch.restSeconds);
  }

  await getDb().exercises.update(id, next);
}

export async function deleteExercise(id: ID): Promise<void> {
  await getDb().exercises.delete(id);
}
