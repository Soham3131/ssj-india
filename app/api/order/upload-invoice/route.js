export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Order from '@/models/Order';
import fs from 'fs';
import path from 'path';
import authSeller from '@/lib/authSeller';

export async function POST(request) {
    try {
        const user = await currentUser();
        if (!user) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        const isSeller = await authSeller(user.id);
        if (!isSeller) return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });

        await connectDB();
        const body = await request.json();
        const { orderId, fileBase64 } = body;
        if (!orderId || !fileBase64) return NextResponse.json({ success: false, message: 'orderId and fileBase64 required' }, { status: 400 });

        // simple validation: ensure PDF header
        const header = fileBase64.slice(0, 200);
        if (!header.includes('%PDF') && !header.startsWith('JVBER')) {
            // base64 of %PDF often starts with JVBER
            // but some clients might include data:application/pdf;base64,
        }

        const invoicesDir = path.join(process.cwd(), 'public', 'invoices');
        if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });
        const filePath = path.join(invoicesDir, `${orderId}.pdf`);

        // strip data: prefix if present
        const cleaned = fileBase64.replace(/^data:.*;base64,/, '');
        const buffer = Buffer.from(cleaned, 'base64');
        fs.writeFileSync(filePath, buffer);

        // Update order
        const relUrl = `/invoices/${orderId}.pdf`;
        await Order.updateOne({ _id: orderId }, { $set: { invoiceUrl: relUrl } });

        return NextResponse.json({ success: true, message: 'Invoice uploaded', url: relUrl });
    } catch (err) {
        console.error('upload invoice error', err);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
