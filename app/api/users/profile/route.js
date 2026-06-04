import { NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/lib/db';
import { verifyToken, getTokenFromRequest, hashPassword } from '@/lib/auth';

export async function POST(request) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const body = await request.json();
  const { name, password } = body;

  const updates = {};
  if (name) updates.name = name;
  if (password) updates.password = hashPassword(password);

  const updatedUser = updateUser(decoded.userId, updates);
  if (!updatedUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { password: _, ...userWithoutPassword } = updatedUser;
  return NextResponse.json({ user: userWithoutPassword, message: 'Profile updated successfully' });
}
