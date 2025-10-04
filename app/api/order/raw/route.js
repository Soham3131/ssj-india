export const runtime = "nodejs";
export const dynamic = 'force-dynamic';
import connectDB from '@/config/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import authSeller from '@/lib/authSeller';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });

    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    if (!orderId) return NextResponse.json({ success: false, message: 'orderId required' }, { status: 400 });

    await connectDB();
    const order = await Order.findById(orderId).lean();
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    // allow owner or seller
    if (order.userId === user.id) {
      return NextResponse.json({ success: true, order });
    }

    const isSeller = await authSeller(user.id);
    if (isSeller) {
      // optionally ensure seller owns at least one product in the order
      return NextResponse.json({ success: true, order });
    }

    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  } catch (error) {
    console.error('raw order error', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
