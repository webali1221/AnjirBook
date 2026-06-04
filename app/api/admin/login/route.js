import { NextResponse } from 'next/server';
import { verifyAdmin, generateAdminToken } from '@/lib/auth';

export async function POST(request) {
  const { login, password } = await request.json();

  if (!verifyAdmin(login, password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = generateAdminToken();

  return NextResponse.json({ token, message: 'Login successful' });
}
