import { NextResponse } from 'next/server';
import { getOrders, addOrder } from '@/lib/db';
import { verifyAdminToken, getTokenFromRequest } from '@/lib/auth';

export async function GET(request) {
  const token = getTokenFromRequest(request);
  const admin = verifyAdminToken(token);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = getOrders();
  return NextResponse.json({ orders });
}

export async function POST(request) {
  const body = await request.json();
  const { userId, bookId, bookTitle, price, userName, userPhone } = body;

  const order = addOrder({ userId, bookId, bookTitle, price, userName, userPhone });
  return NextResponse.json({ order }, { status: 201 });
}
