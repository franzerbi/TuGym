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
  }
}
