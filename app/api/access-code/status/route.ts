import { cookies } from 'next/headers';
import { apiSuccess } from '@/lib/server/api-response';
import { verifyAccessToken } from '@/lib/server/access-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const accessCode = process.env.ACCESS_CODE;
    const enabled = !!accessCode;

    let authenticated = false;
    if (enabled) {
      const cookieStore = await cookies();
      const token = cookieStore.get('openmaic_access')?.value;
      authenticated = !!token && verifyAccessToken(token, accessCode);
    }

    return apiSuccess({ enabled, authenticated });
  } catch (error) {
    console.warn('[access-code/status] failed; returning open access', error);
    return apiSuccess({ enabled: false, authenticated: false });
  }
}
