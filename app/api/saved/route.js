import { NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/lib/db';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

export async function GET(request) {
  const token = getTokenFromRequest(request);
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserById(decoded.userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ savedBooks: user.savedBooks || [] });
}

export async function POST(request) {
  const token = getTokenFromRequest(request);
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookId } = await request.json();
  const user = await getUserById(decoded.userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const savedBooks = user.savedBooks || [];
  if (!savedBooks.includes(bookId)) {
    savedBooks.push(bookId);
    await updateUser(decoded.userId, { savedBooks });
  }

  return NextResponse.json({ savedBooks });
}

export async function DELETE(request) {
  const token = getTokenFromRequest(request);
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookId } = await request.json();
  const user = await getUserById(decoded.userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const savedBooks = (user.savedBooks || []).filter(id => id !== bookId);
  await updateUser(decoded.userId, { savedBooks });

  return NextResponse.json({ savedBooks });
}
