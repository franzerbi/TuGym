import { getDb } from "./index";
import type { ID, Routine } from "@/types";

export type RoutineInput = Pick<Routine, "name" | "exerciseIds"> & {
  days?: number[];
};

export async function listRoutines(): Promise<Routine[]> {
  const items = await getDb().routines.toArray();
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getRoutine(id: ID): Promise<Routine | undefined> {
  return getDb().routines.get(id);
}

export async function createRoutine(input: RoutineInput): Promise<ID> {
  const name = input.name.trim();
  if (!name) throw new Error("El nombre no puede estar vacío.");
  if (input.exerciseIds.length === 0)
    throw new Error("Agregá al menos un ejercicio.");

  return getDb().routines.add({
    name,
    exerciseIds: input.exerciseIds,
    days: input.days?.length ? input.days : undefined,
    createdAt: Date.now(),
  });
}

export async function updateRoutine(
  id: ID,
  patch: Partial<RoutineInput>,
): Promise<void> {
  const next: Partial<Routine> = {};
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) throw new Error("El nombre no puede estar vacío.");
    next.name = name;
  }
  if (patch.exerciseIds !== undefined) {
    if (patch.exerciseIds.length === 0)
      throw new Error("Agregá al menos un ejercicio.");
    next.exerciseIds = patch.exerciseIds;
  }
  if (patch.days !== undefined) {
    next.days = patch.days.length ? patch.days : undefined;
  }

  await getDb().routines.update(id, next);
}

export async function deleteRoutine(id: ID): Promise<void> {
  await getDb().routines.delete(id);
}
