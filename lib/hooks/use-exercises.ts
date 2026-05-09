"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { listExercises } from "@/lib/db/exercises";
import type { Exercise, MuscleGroup } from "@/types";

export function useExercises(
  muscleGroup?: MuscleGroup | "all",
): Exercise[] | undefined {
  return useLiveQuery(
    () =>
      listExercises({
        muscleGroup: muscleGroup && muscleGroup !== "all" ? muscleGroup : undefined,
      }),
    [muscleGroup],
  );
}
