import type { Env } from './types';

export { DeviceDO } from './device-do';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ROUTES = new Set([
  '/api/push/subscribe',
  '/api/push/arm',
  '/api/push/disarm',
  '/api/push/unsubscribe',
]);

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') {
      return preflight(req, env);
    }

    if (!ROUTES.has(url.pathname)) {
      return withCors(jsonResponse({ error: 'not_found' }, 404), req, env);
    }

    if (req.method !== 'POST') {
      return withCors(jsonResponse({ error: 'method' }, 405), req, env);
    }

    if (req.headers.get('x-tugym-token') !== env.AUTH_TOKEN) {
      return withCors(jsonResponse({ error: 'unauthorized' }, 401), req, env);
    }

    let body: unknown;
    try {
      body = await req.clone().json();
    } catch {
      return withCors(jsonResponse({ error: 'invalid_json' }, 400), req, env);
    }

    const deviceId = (body as { deviceId?: unknown })?.deviceId;
    if (typeof deviceId !== 'string' || !UUID_V4.test(deviceId)) {
      return withCors(jsonResponse({ error: 'invalid_deviceId' }, 400), req, env);
    }

    const action = url.pathname.split('/').pop()!;
    const id = env.DEVICE.idFromName(deviceId);
    const stub = env.DEVICE.get(id);

    const doReq = new Request(`https://do/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    const res = await stub.fetch(doReq);
    return withCors(new Response(res.body, { status: res.status, headers: res.headers }), req, env);
  },
};

function preflight(req: Request, env: Env): Response {
  const origin = req.headers.get('origin');
  const allowed = isAllowedOrigin(origin, env);
  const headers: HeadersInit = {
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, x-tugym-token',
    'access-control-max-age': '86400',
  };
  if (allowed && origin) {
    (headers as Record<string, string>)['access-control-allow-origin'] = origin;
    (headers as Record<string, string>)['vary'] = 'origin';
  }
  return new Response(null, { status: 204, headers });
}

function withCors(res: Response, req: Request, env: Env): Response {
  const origin = req.headers.get('origin');
  if (!isAllowedOrigin(origin, env) || !origin) return res;
  const headers = new Headers(res.headers);
  headers.set('access-control-allow-origin', origin);
  headers.append('vary', 'origin');
  return new Response(res.body, { status: res.status, headers });
}

function isAllowedOrigin(origin: string | null, env: Env): boolean {
  if (!origin) return false;
  const allowed = env.ALLOWED_ORIGIN.split(',').map((o) => o.trim());
  return allowed.includes(origin);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
