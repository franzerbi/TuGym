import { DurableObject } from 'cloudflare:workers';
import type { Env, PushSubscriptionJSON, ArmBody, StoredPayload } from './types';
import { sendPush } from './webpush';

const MAX_ARM_FUTURE_MS = 10 * 60 * 1000;

export class DeviceDO extends DurableObject<Env> {
  override async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (req.method !== 'POST') return jsonResponse({ error: 'method' }, 405);

    try {
      switch (action) {
        case 'subscribe':
          return await this.handleSubscribe(req);
        case 'arm':
          return await this.handleArm(req);
        case 'disarm':
          return await this.handleDisarm();
        case 'unsubscribe':
          return await this.handleUnsubscribe();
        default:
          return jsonResponse({ error: 'not_found' }, 404);
      }
    } catch (err) {
      return jsonResponse({ error: 'bad_request', detail: String(err) }, 400);
    }
  }

  private async handleSubscribe(req: Request): Promise<Response> {
    const body = (await req.json()) as { subscription?: PushSubscriptionJSON };
    const sub = body?.subscription;
    if (!isValidSubscription(sub)) return jsonResponse({ error: 'invalid_subscription' }, 400);
    await this.ctx.storage.put('subscription', sub);
    return jsonResponse({ ok: true });
  }

  private async handleArm(req: Request): Promise<Response> {
    const body = (await req.json()) as ArmBody;
    const now = Date.now();
    if (typeof body.endsAt !== 'number' || body.endsAt <= now) {
      return jsonResponse({ error: 'endsAt_past' }, 400);
    }
    if (body.endsAt - now > MAX_ARM_FUTURE_MS) {
      return jsonResponse({ error: 'endsAt_too_far' }, 400);
    }
    const sub = await this.ctx.storage.get<PushSubscriptionJSON>('subscription');
    if (!sub) return jsonResponse({ error: 'no_subscription' }, 409);

    const payload: StoredPayload = {
      endsAt: body.endsAt,
      exerciseName: typeof body.exerciseName === 'string' ? body.exerciseName : undefined,
      url: typeof body.url === 'string' ? body.url : undefined,
    };
    await this.ctx.storage.put('payload', payload);
    await this.ctx.storage.setAlarm(body.endsAt);
    return jsonResponse({ ok: true, firesAt: body.endsAt });
  }

  private async handleDisarm(): Promise<Response> {
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.delete('payload');
    return jsonResponse({ ok: true });
  }

  private async handleUnsubscribe(): Promise<Response> {
    await this.ctx.storage.deleteAll();
    return jsonResponse({ ok: true });
  }

  override async alarm(): Promise<void> {
    const sub = await this.ctx.storage.get<PushSubscriptionJSON>('subscription');
    const payload = await this.ctx.storage.get<StoredPayload>('payload');
    await this.ctx.storage.delete('payload');

    if (!sub || !payload) return;

    const body = payload.exerciseName
      ? `${payload.exerciseName}: tiempo de descanso completado.`
      : 'Tiempo de descanso completado.';

    const data = {
      title: 'Descanso terminado',
      body,
      url: payload.url ?? '/',
      tag: 'rest-timer',
    };

    try {
      const result = await sendPush(sub, data, this.env);
      if (result.expired) {
        await this.ctx.storage.delete('subscription');
      }
    } catch (err) {
      console.error('push send failed', err);
    }
  }
}

function isValidSubscription(sub: unknown): sub is PushSubscriptionJSON {
  if (!sub || typeof sub !== 'object') return false;
  const s = sub as Record<string, unknown>;
  if (typeof s.endpoint !== 'string' || !s.endpoint.startsWith('https://')) return false;
  if (!s.keys || typeof s.keys !== 'object') return false;
  const k = s.keys as Record<string, unknown>;
  return typeof k.auth === 'string' && typeof k.p256dh === 'string';
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
