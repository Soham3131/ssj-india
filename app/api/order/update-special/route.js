export const runtime = "nodejs";
export const dynamic = 'force-dynamic';
import connectDB from '@/config/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Address from '@/models/Address';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, specialRequest } = body;
    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId is required' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(orderId).lean();
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Only the owner can update their special request
    if (order.userId !== userId) {
      return NextResponse.json({ success: false, message: 'Not authorized to update this order' }, { status: 403 });
    }

    const updated = await Order.findByIdAndUpdate(orderId, { specialRequest: specialRequest || '' }, { new: true }).lean();

    // Populate address and items minimally to match list response shape
    const address = updated.address ? await Address.findById(updated.address).lean() : null;
    // Helper to extract productId from composite cart key
    const extractProductId = (maybeComposite) => {
      if (!maybeComposite || typeof maybeComposite !== 'string') return maybeComposite;
      const parts = maybeComposite.split('::');
      return parts[0];
    };

    const populatedItems = await Promise.all((updated.items || []).map(async (item) => {
      const pid = item.product ? extractProductId(item.product) : null;
      const product = pid ? await Product.findById(pid).lean() : null;
      return {
        ...item,
        product: product ? { _id: product._id, name: product.name, image: product.image, offerPrice: product.offerPrice } : null
      };
    }));

    const responseOrder = {
      ...updated,
      address: address ? {
        _id: address._id,
        fullName: address.fullName,
        phoneNumber: address.phoneNumber,
        pincode: address.pincode,
        area: address.area,
        city: address.city,
        state: address.state
      } : null,
      items: populatedItems
    };

    return NextResponse.json({ success: true, message: 'Special request saved', order: responseOrder });
  } catch (error) {
    console.error('update-special error', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
