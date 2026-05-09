import { TuGymDB } from "./schema";

let dbInstance: TuGymDB | null = null;

export function getDb(): TuGymDB {
  if (typeof window === "undefined") {
    throw new Error(
      "TuGym DB only runs in the browser (IndexedDB). Call getDb() from a Client Component."
    );
  }
  if (!dbInstance) {
    dbInstance = new TuGymDB();
  }
  return dbInstance;
}

export type { TuGymDB } from "./schema";
