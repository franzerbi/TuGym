import Dexie, { type Table } from "dexie";
import type {
  BodyWeight,
  Exercise,
  Workout,
  WorkoutSet,
} from "@/types";

export class TuGymDB extends Dexie {
  exercises!: Table<Exercise, number>;
  workouts!: Table<Workout, number>;
  sets!: Table<WorkoutSet, number>;
  bodyWeights!: Table<BodyWeight, number>;

  constructor() {
    super("tugym");

    this.version(1).stores({
      exercises: "++id, muscleGroup, name, createdAt",
      workouts: "++id, date, createdAt",
      sets: "++id, workoutId, exerciseId, [workoutId+exerciseId]",
      bodyWeights: "++id, date",
    });
  }
}
