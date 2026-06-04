import { NextResponse } from 'next/server';
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
  const { months, bookId, amount, distance } = body;

  const serviceId = process.env.CLICK_SERVICE_ID || '54321';
  const merchantId = process.env.CLICK_MERCHANT_ID || '12345';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000';
  const returnUrl = `${siteUrl}/profile`;

  let transactionParam = '';
  let finalAmount = 0;

  if (bookId) {
    // Book purchase checkout
    finalAmount = Number(amount);
    transactionParam = `book_u${decoded.userId}_b${bookId}_d${distance || 0}_t${Date.now()}`;
  } else {
    // Premium checkout
    if (!months || ![1, 3, 9].includes(Number(months))) {
      return NextResponse.json({ error: 'Invalid package selection' }, { status: 400 });
    }
    const prices = {
      1: 20000,
      3: 80000,
      9: 200000
    };
    finalAmount = prices[months];
    transactionParam = `premium_u${decoded.userId}_m${months}_t${Date.now()}`;
  }

  const clickUrl = `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${finalAmount}&transaction_param=${transactionParam}&return_url=${returnUrl}`;

  return NextResponse.json({ url: clickUrl });
}
