import { buildPushPayload, type PushMessage, type PushSubscription } from '@block65/webcrypto-web-push';
import type { Env } from './types';

export interface PushResult {
  status: number;
  expired: boolean;
}

export async function sendPush(
  subscription: PushSubscription,
  data: unknown,
  env: Env,
): Promise<PushResult> {
  const message: PushMessage = {
    data: JSON.stringify(data),
    options: { ttl: 60, urgency: 'high' },
  };

  const vapid = {
    subject: env.VAPID_SUBJECT,
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
  };

  const payload = await buildPushPayload(message, subscription, vapid);

  const res = await fetch(subscription.endpoint, {
    method: payload.method,
    headers: payload.headers,
    body: payload.body,
  });

  return {
    status: res.status,
    expired: res.status === 404 || res.status === 410,
  };
}
