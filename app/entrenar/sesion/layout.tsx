"use client";

import type { ReactNode } from "react";
import { RestTimerProvider } from "@/components/rest-timer-provider";
import { RestTimerBanner } from "@/components/rest-timer-banner";

export default function SesionLayout({ children }: { children: ReactNode }) {
  return (
    <RestTimerProvider>
      {children}
      <RestTimerBanner />
    </RestTimerProvider>
  );
}
