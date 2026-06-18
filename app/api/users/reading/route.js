import { NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/lib/db';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

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
  const { bookId } = body;

  if (!bookId) {
    return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
  }

  const user = await getUserById(decoded.userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let readingBooks = user.readingBooks || [];
  if (!readingBooks.includes(bookId)) {
    readingBooks = [...readingBooks, bookId];
    await updateUser(decoded.userId, { readingBooks });
  }

  return NextResponse.json({ readingBooks, message: 'Added to reading list' });
}
