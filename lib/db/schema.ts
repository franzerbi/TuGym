import Dexie, { type Table } from "dexie";
import type {
  BodyWeight,
  Exercise,
  Routine,
  Workout,
  WorkoutSet,
} from "@/types";

export class TuGymDB extends Dexie {
  exercises!: Table<Exercise, number>;
  workouts!: Table<Workout, number>;
  sets!: Table<WorkoutSet, number>;
  bodyWeights!: Table<BodyWeight, number>;
  routines!: Table<Routine, number>;

  constructor() {
    super("tugym");

    this.version(1).stores({
      exercises: "++id, muscleGroup, name, createdAt",
      workouts: "++id, date, createdAt",
      sets: "++id, workoutId, exerciseId, [workoutId+exerciseId]",
      bodyWeights: "++id, date",
    });

    this.version(2).stores({
      routines: "++id, name, createdAt",
    });

    // v3: added days field to routines (no index change needed)
    this.version(3).stores({});

    // v4: workouts gain `completedAt`. Existing rows predate the in-progress
    // concept, so backfill them as completed to preserve user history.
    this.version(4)
      .stores({ workouts: "++id, date, createdAt, completedAt" })
      .upgrade((tx) =>
        tx
          .table<Workout, number>("workouts")
          .toCollection()
          .modify((w) => {
            if (w.completedAt == null) w.completedAt = w.createdAt;
          }),
      );

    // v5: exercises gain optional `restSeconds`. No index change, no backfill
    // (undefined falls back to the global default at runtime).
    this.version(5).stores({});
  }
}
