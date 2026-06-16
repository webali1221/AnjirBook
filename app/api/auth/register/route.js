import { NextResponse } from 'next/server';
import { getUserByPhone, createUser } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request) {
  const { name, phone, password } = await request.json();

  if (!name || !phone || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const existing = await getUserByPhone(phone);
  if (existing) {
    return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
  }

  const hashedPassword = hashPassword(password);
  const user = await createUser({ name, phone, password: hashedPassword });

  const token = generateToken({ userId: user.id, phone: user.phone });

  const { password: _, ...userWithoutPassword } = user;

  return NextResponse.json({ user: userWithoutPassword, token }, { status: 201 });
}
