import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';
import { verifyAdminToken, getTokenFromRequest } from '@/lib/auth';

export async function GET(request) {
  const token = getTokenFromRequest(request);
  const admin = verifyAdminToken(token);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = getUsers();
  // Remove passwords before sending
  const safeUsers = users.map(({ password, ...rest }) => rest);
  return NextResponse.json({ users: safeUsers });
}
