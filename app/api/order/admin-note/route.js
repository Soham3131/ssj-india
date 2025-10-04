export const runtime = "nodejs";
export const dynamic = 'force-dynamic';
import connectDB from '@/config/db';
import Order from '@/models/Order';
import { currentUser } from '@clerk/nextjs/server';
import authSeller from '@/lib/authSeller';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });

    const isSeller = await authSeller(user.id);
    if (!isSeller) return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });

    const body = await request.json();
    const { orderId, note } = body;
    if (!orderId) return NextResponse.json({ success: false, message: 'orderId required' }, { status: 400 });

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    // Upsert admin note for this seller
    const existingIndex = (order.adminNotes || []).findIndex(n => n.sellerId === user.id);
    const noteObj = { sellerId: user.id, note: note || '', updatedAt: new Date() };
    if (existingIndex === -1) {
      order.adminNotes = order.adminNotes || [];
      order.adminNotes.push(noteObj);
    } else {
      order.adminNotes[existingIndex].note = note || '';
      order.adminNotes[existingIndex].updatedAt = new Date();
    }

    await order.save();

    return NextResponse.json({ success: true, message: 'Note saved', note: noteObj });
  } catch (error) {
    console.error('admin-note error', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });

    const isSeller = await authSeller(user.id);
    if (!isSeller) return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    if (!orderId) return NextResponse.json({ success: false, message: 'orderId required' }, { status: 400 });

    await connectDB();
    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    order.adminNotes = (order.adminNotes || []).filter(n => n.sellerId !== user.id);
    await order.save();

    return NextResponse.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('admin-note delete error', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
