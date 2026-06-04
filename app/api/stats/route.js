import { NextResponse } from 'next/server';
import { getStats } from '@/lib/db';
import { verifyAdminToken, getTokenFromRequest } from '@/lib/auth';

export async function GET(request) {
  const token = getTokenFromRequest(request);
  const admin = verifyAdminToken(token);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = getStats();
  return NextResponse.json(stats);
}
