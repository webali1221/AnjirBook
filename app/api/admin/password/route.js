import { NextResponse } from 'next/server';
import { verifyAdminToken, getTokenFromRequest, updateAdminPassword } from '@/lib/auth';

export async function POST(request) {
  const token = getTokenFromRequest(request);
  const admin = verifyAdminToken(token);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { newPassword } = body;

  if (!newPassword || newPassword.length < 4) {
    return NextResponse.json({ error: 'Password must be at least 4 characters long' }, { status: 400 });
  }

  const success = updateAdminPassword(newPassword);
  if (!success) {
    return NextResponse.json({ error: 'Failed to update admin password' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Admin password updated successfully' });
}
