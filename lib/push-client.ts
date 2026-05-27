"use client";

const DEVICE_ID_KEY = "tugym:deviceId";
const FETCH_TIMEOUT_MS = 5000;

export interface EnsureSubscribedResult {
  deviceId: string;
  subscribed: boolean;
  reason?: "unavailable" | "no_permission" | "server_error" | "subscribe_failed";
}

export interface ArmPushArgs {
  endsAt: number;
  exerciseName?: string;
  returnUrl?: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function uuidV4Fallback(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

export function getDeviceId(): string {
  if (!isBrowser()) return "";
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
  } catch {
    /* localStorage no disponible */
  }
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : uuidV4Fallback();
  try {
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    /* noop */
  }
  return id;
}

export function getPushApiUrl(): string | null {
  const v = process.env.NEXT_PUBLIC_PUSH_API_URL;
  return v && v.length > 0 ? v.replace(/\/$/, "") : null;
}

export function getVapidPublicKey(): string | null {
  const v = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  return v && v.length > 0 ? v : null;
}

export function getPushToken(): string | null {
  const v = process.env.NEXT_PUBLIC_PUSH_TOKEN;
  return v && v.length > 0 ? v : null;
}

export function isPushAvailable(): boolean {
  if (!isBrowser()) return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("PushManager" in window)) return false;
  if (!("Notification" in window)) return false;
  return Boolean(getPushApiUrl() && getVapidPublicKey() && getPushToken());
}

export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  const buf = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(id);
  }
}

function postJson(path: string, body: unknown): Promise<Response> {
  const apiUrl = getPushApiUrl();
  const token = getPushToken();
  if (!apiUrl || !token) {
    return Promise.reject(new Error("push api not configured"));
  }
  return fetchWithTimeout(`${apiUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TuGym-Token": token,
    },
    body: JSON.stringify(body),
  });
}

async function subscribeOnServer(
  deviceId: string,
  subscription: PushSubscription,
): Promise<boolean> {
  try {
    const res = await postJson("/api/push/subscribe", {
      deviceId,
      subscription: subscription.toJSON(),
    });
    if (!res.ok) {
      console.warn("[push] subscribe server respondió", res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[push] subscribe network error", err);
    return false;
  }
}

export async function ensureSubscribed(): Promise<EnsureSubscribedResult> {
  const deviceId = getDeviceId();
  if (!isPushAvailable()) {
    return { deviceId, subscribed: false, reason: "unavailable" };
  }
  if (Notification.permission !== "granted") {
    return { deviceId, subscribed: false, reason: "no_permission" };
  }
  const vapid = getVapidPublicKey();
  if (!vapid) {
    return { deviceId, subscribed: false, reason: "unavailable" };
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
    }
    const ok = await subscribeOnServer(deviceId, sub);
    return ok
      ? { deviceId, subscribed: true }
      : { deviceId, subscribed: false, reason: "server_error" };
  } catch (err) {
    console.warn("[push] ensureSubscribed falló", err);
    return { deviceId, subscribed: false, reason: "subscribe_failed" };
  }
}

async function postArm(args: ArmPushArgs, deviceId: string): Promise<Response> {
  return postJson("/api/push/arm", {
    deviceId,
    endsAt: args.endsAt,
    exerciseName: args.exerciseName,
    url: args.returnUrl,
  });
}

export async function armPush(args: ArmPushArgs): Promise<boolean> {
  if (!isPushAvailable()) return false;
  const deviceId = getDeviceId();
  try {
    const res = await postArm(args, deviceId);
    if (res.ok) return true;
    if (res.status === 409) {
      const re = await ensureSubscribed();
      if (!re.subscribed) {
        console.warn("[push] arm 409 y re-subscribe falló:", re.reason);
        return false;
      }
      const res2 = await postArm(args, deviceId);
      return res2.ok;
    }
    console.warn("[push] arm respondió", res.status);
    return false;
  } catch (err) {
    console.warn("[push] arm network error", err);
    return false;
  }
}

export async function disarmPush(): Promise<void> {
  if (!isPushAvailable()) return;
  const deviceId = getDeviceId();
  try {
    await postJson("/api/push/disarm", { deviceId });
  } catch {
    /* best-effort */
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isBrowser()) return;
  const deviceId = getDeviceId();
  try {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        try {
          await sub.unsubscribe();
        } catch {
          /* noop */
        }
      }
    }
  } catch {
    /* noop */
  }
  if (!getPushApiUrl() || !getPushToken()) return;
  try {
    await postJson("/api/push/unsubscribe", { deviceId });
  } catch {
    /* best-effort */
  }
}
