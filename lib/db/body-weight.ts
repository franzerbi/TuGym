import { getDb } from "./index";
import type { BodyWeight, ID } from "@/types";

export type BodyWeightInput = Pick<BodyWeight, "date" | "weightKg" | "notes">;

export async function listBodyWeights(): Promise<BodyWeight[]> {
  const items = await getDb().bodyWeights.toArray();
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export async function createBodyWeight(input: BodyWeightInput): Promise<ID> {
  if (input.weightKg <= 0) throw new Error("El peso debe ser mayor a 0.");

  return getDb().bodyWeights.add({
    date: input.date,
    weightKg: input.weightKg,
    notes: input.notes?.trim() || undefined,
  });
}

export async function deleteBodyWeight(id: ID): Promise<void> {
  await getDb().bodyWeights.delete(id);
}
