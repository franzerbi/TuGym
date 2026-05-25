"use client";

export type NotifState = NotificationPermission | "unsupported";

export function getNotifPermission(): NotifState {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestNotifPermission(): Promise<NotifState> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function getController(): ServiceWorker | null {
  if (typeof navigator === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.controller ?? null;
}

export interface ArmPayload {
  endsAt: number;
  exerciseName?: string;
  returnUrl?: string;
}

export function sendArmMessage(payload: ArmPayload): void {
  const controller = getController();
  if (!controller) return;
  controller.postMessage({
    type: "ARM_REST_NOTIF",
    endsAt: payload.endsAt,
    exerciseName: payload.exerciseName,
    returnUrl: payload.returnUrl,
  });
}

export function sendDisarmMessage(): void {
  const controller = getController();
  if (!controller) return;
  controller.postMessage({ type: "DISARM_REST_NOTIF" });
}
