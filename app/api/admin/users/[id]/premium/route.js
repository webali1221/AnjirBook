import { NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/lib/db';
import { verifyAdminToken, getTokenFromRequest } from '@/lib/auth';

export async function POST(request, { params }) {
  const token = getTokenFromRequest(request);
  const admin = verifyAdminToken(token);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, duration } = body; // action: 'enable' or 'disable', duration in months

  const user = getUserById(id);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (action === 'disable') {
    const updated = updateUser(id, {
      isPremium: false,
      premiumExpiresAt: null
    });
    return NextResponse.json({ success: true, user: updated });
  }

  if (action === 'enable') {
    const months = Number(duration) || 1;
    const now = new Date();
    let newExpiry;

    if (user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) > now) {
      newExpiry = new Date(user.premiumExpiresAt);
    } else {
      newExpiry = new Date(now);
    }
    
    newExpiry.setMonth(newExpiry.getMonth() + months);

    const updated = updateUser(id, {
      isPremium: true,
      premiumExpiresAt: newExpiry.toISOString()
    });
    
    return NextResponse.json({ success: true, user: updated });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
