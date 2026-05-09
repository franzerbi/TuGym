"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { listBodyWeights } from "@/lib/db/body-weight";
import type { BodyWeight } from "@/types";

export function useBodyWeights(): BodyWeight[] | undefined {
  return useLiveQuery(() => listBodyWeights());
}
