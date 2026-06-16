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
  const { months } = body;

  if (!months || ![1, 3, 9].includes(Number(months))) {
    return NextResponse.json({ error: 'Invalid subscription package' }, { status: 400 });
  }

  const user = await getUserById(decoded.userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let newExpiry;
  const now = new Date();

  if (user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) > now) {
    newExpiry = new Date(user.premiumExpiresAt);
    newExpiry.setMonth(newExpiry.getMonth() + Number(months));
  } else {
    newExpiry = new Date(now);
    newExpiry.setMonth(newExpiry.getMonth() + Number(months));
  }

  const updatedUser = await updateUser(decoded.userId, {
    isPremium: true,
    premiumExpiresAt: newExpiry.toISOString()
  });

  const { password: _, ...userWithoutPassword } = updatedUser;
  return NextResponse.json({ user: userWithoutPassword, message: 'Premium subscription active' });
}
