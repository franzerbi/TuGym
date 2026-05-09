"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  getWorkout,
  listHistoryByExercise,
  listSetsByWorkout,
  listWorkouts,
  type ExerciseHistoryEntry,
} from "@/lib/db/workouts";
import type { ID, Workout, WorkoutSet } from "@/types";

export function useWorkouts(): Workout[] | undefined {
  return useLiveQuery(() => listWorkouts());
}

export function useWorkout(id: ID): Workout | null | undefined {
  return useLiveQuery(
    async () => {
      if (Number.isNaN(id)) return null;
      return (await getWorkout(id)) ?? null;
    },
    [id],
  );
}

export function useExerciseHistory(
  exerciseId: ID,
): ExerciseHistoryEntry[] | undefined {
  return useLiveQuery(
    () =>
      Number.isNaN(exerciseId)
        ? Promise.resolve([])
        : listHistoryByExercise(exerciseId),
    [exerciseId],
  );
}

export function useWorkoutSets(workoutId: ID): WorkoutSet[] | undefined {
  return useLiveQuery(
    () => (Number.isNaN(workoutId) ? Promise.resolve([]) : listSetsByWorkout(workoutId)),
    [workoutId],
  );
}
