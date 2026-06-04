import { NextResponse } from 'next/server';
import { getUserByPhone } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(request) {
  const { phone, password } = await request.json();

  if (!phone || !password) {
    return NextResponse.json({ error: 'Phone and password are required' }, { status: 400 });
  }

  const user = getUserByPhone(phone);
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const valid = comparePassword(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = generateToken({ userId: user.id, phone: user.phone });

  const { password: _, ...userWithoutPassword } = user;

  return NextResponse.json({ user: userWithoutPassword, token });
}
