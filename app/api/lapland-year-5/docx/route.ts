import { readFileSync } from 'node:fs';
import { NextResponse } from 'next/server';

import { docxContentType, resolvePracticeDocx } from '@/lib/lapland-year-5/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const file = new URL(request.url).searchParams.get('file');
  const resolved = resolvePracticeDocx(file);
  if (!resolved) {
    return NextResponse.json(
      { success: false, error: 'Practice Word doc not found' },
      { status: 404 },
    );
  }

  const bytes = readFileSync(resolved.absolutePath);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': docxContentType(),
      'Content-Disposition': `attachment; filename="${resolved.fileName}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
