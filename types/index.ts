export type ID = number;

export type MuscleGroup =
  | "pecho"
  | "espalda"
  | "hombros"
  | "biceps"
  | "triceps"
  | "piernas"
  | "gluteos"
  | "abdomen"
  | "antebrazo"
  | "pantorrilla"
  | "cardio"
  | "otros";

export const MUSCLE_GROUPS: readonly MuscleGroup[] = [
  "pecho",
  "espalda",
  "hombros",
  "biceps",
  "triceps",
  "piernas",
  "gluteos",
  "abdomen",
  "antebrazo",
  "pantorrilla",
  "cardio",
  "otros",
] as const;

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  hombros: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  piernas: "Piernas",
  gluteos: "Glúteos",
  abdomen: "Abdomen",
  antebrazo: "Antebrazo",
  pantorrilla: "Pantorrilla",
  cardio: "Cardio",
  otros: "Otros",
};

export interface Exercise {
  id?: ID;
  name: string;
  muscleGroup: MuscleGroup;
  createdAt: number;
}

export interface Workout {
  id?: ID;
  date: string;
  notes?: string;
  routineId?: ID;
  createdAt: number;
}

export interface WorkoutSet {
  id?: ID;
  workoutId: ID;
  exerciseId: ID;
  weightKg: number;
  reps: number;
  setNumber: number;
}

export interface Routine {
  id?: ID;
  name: string;
  exerciseIds: ID[];
  days?: number[]; // 0=dom, 1=lun, 2=mar, 3=mié, 4=jue, 5=vie, 6=sáb
  createdAt: number;
}

export const DAY_LABELS_SHORT = ["D", "L", "M", "M", "J", "V", "S"] as const;

export interface BodyWeight {
  id?: ID;
  date: string;
  weightKg: number;
  notes?: string;
}
