"use client";

import { useContext } from "react";
import {
  RestTimerContext,
  type RestTimerContextValue,
} from "@/components/rest-timer-provider";

export function useRestTimer(): RestTimerContextValue {
  const ctx = useContext(RestTimerContext);
  if (!ctx) {
    throw new Error(
      "useRestTimer debe usarse dentro de un <RestTimerProvider>.",
    );
  }
  return ctx;
}
