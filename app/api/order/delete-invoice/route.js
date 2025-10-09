export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Order from '@/models/Order';
import authSeller from '@/lib/authSeller';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request) {
    try {
        const user = await currentUser();
        if (!user) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        const isSeller = await authSeller(user.id);
        if (!isSeller) return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });

        await connectDB();
        const body = await request.json();
        const { orderId } = body;
        if (!orderId) return NextResponse.json({ success: false, message: 'orderId required' }, { status: 400 });

        // Configure cloudinary
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        // Delete by public_id (orderId) from invoices folder
        try {
            await cloudinary.uploader.destroy(`invoices/${orderId}`, { resource_type: 'image' });
        } catch (e) {
            console.error('Cloudinary delete failed for invoice', orderId, e);
            // proceed to clear DB fields anyway
        }

        await Order.updateOne({ _id: orderId }, { $set: { invoiceUrl: '', invoiceUrlCloud: '' } });

        return NextResponse.json({ success: true, message: 'Invoice deleted' });
    } catch (err) {
        console.error('delete invoice error', err);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
