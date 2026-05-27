import type { DurableObjectNamespace } from '@cloudflare/workers-types';

export interface Env {
  DEVICE: DurableObjectNamespace;
  ALLOWED_ORIGIN: string;
  VAPID_SUBJECT: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  AUTH_TOKEN: string;
}

export interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export interface SubscribeBody {
  deviceId: string;
  subscription: PushSubscriptionJSON;
}

export interface ArmBody {
  deviceId: string;
  endsAt: number;
  exerciseName?: string;
  url?: string;
}

export interface DisarmBody {
  deviceId: string;
}

export interface UnsubscribeBody {
  deviceId: string;
}

export interface StoredPayload {
  endsAt: number;
  exerciseName?: string;
  url?: string;
}
