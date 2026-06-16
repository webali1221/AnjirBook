import { NextResponse } from 'next/server';
import { getUsers, getOrders } from '@/lib/db';
import { verifyAdminToken, getTokenFromRequest } from '@/lib/auth';

export async function GET(request) {
  const token = getTokenFromRequest(request);
  const admin = verifyAdminToken(token);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await getUsers();
  const allOrders = await getOrders();

  const detailedUsers = users.map(user => {
    // Get orders for this user
    const userOrders = allOrders.filter(o => o.userId === user.id);
    return {
      ...user,
      orders: userOrders,
      ordersCount: userOrders.length,
      savedCount: user.savedBooks?.length || 0
    };
  });

  return NextResponse.json({ users: detailedUsers });
}
