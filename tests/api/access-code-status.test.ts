import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createAccessToken } from '@/lib/server/access-token';

const cookiesImpl = vi.fn();

vi.mock('next/headers', () => ({
  cookies: () => cookiesImpl(),
}));

describe('GET /api/access-code/status', () => {
  const originalAccessCode = process.env.ACCESS_CODE;

  beforeEach(() => {
    cookiesImpl.mockReset();
    cookiesImpl.mockResolvedValue({ get: () => undefined });
    delete process.env.ACCESS_CODE;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalAccessCode === undefined) delete process.env.ACCESS_CODE;
    else process.env.ACCESS_CODE = originalAccessCode;
  });

  it('returns JSON { enabled: false } when ACCESS_CODE is unset', async () => {
    const { GET } = await import('@/app/api/access-code/status/route');
    const res = await GET();
    expect(res.headers.get('content-type')).toMatch(/json/);
    expect(await res.json()).toMatchObject({
      success: true,
      enabled: false,
      authenticated: false,
    });
  });

  it('returns enabled: true when ACCESS_CODE is set and the cookie is missing', async () => {
    process.env.ACCESS_CODE = 'secret';
    const { GET } = await import('@/app/api/access-code/status/route');
    const res = await GET();
    expect(await res.json()).toMatchObject({
      success: true,
      enabled: true,
      authenticated: false,
    });
  });

  it('returns authenticated: true for a valid access cookie', async () => {
    process.env.ACCESS_CODE = 'secret';
    cookiesImpl.mockResolvedValue({
      get: () => ({ value: createAccessToken('secret') }),
    });
    const { GET } = await import('@/app/api/access-code/status/route');
    expect(await (await GET()).json()).toMatchObject({
      success: true,
      enabled: true,
      authenticated: true,
    });
  });

  it('fails open to JSON when cookie inspection throws', async () => {
    process.env.ACCESS_CODE = 'secret';
    cookiesImpl.mockRejectedValue(new Error('cookies unavailable'));
    const { GET } = await import('@/app/api/access-code/status/route');
    const res = await GET();
    expect(res.headers.get('content-type')).toMatch(/json/);
    expect(await res.json()).toMatchObject({
      success: true,
      enabled: false,
      authenticated: false,
    });
  });
});
