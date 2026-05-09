"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getRoutine, listRoutines } from "@/lib/db/routines";
import type { ID, Routine } from "@/types";

export function useRoutines(): Routine[] | undefined {
  return useLiveQuery(() => listRoutines());
}

export function useRoutine(id: ID): Routine | null | undefined {
  return useLiveQuery(
    async () => {
      if (Number.isNaN(id)) return null;
      return (await getRoutine(id)) ?? null;
    },
    [id],
  );
}
