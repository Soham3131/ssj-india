export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Order from '@/models/Order';
import fs from 'fs';
import path from 'path';
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
        const { orderId, fileBase64 } = body;
        if (!orderId || !fileBase64) return NextResponse.json({ success: false, message: 'orderId and fileBase64 required' }, { status: 400 });

        // strip data: prefix if present and prepare base64 payload
        const header = fileBase64.slice(0, 200);
        const cleaned = fileBase64.replace(/^data:.*;base64,/, '');

        // Determine MIME type from the data URL prefix if provided
        const mimeMatch = fileBase64.match(/^data:(image\/[^;]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : null;
        // Accept only image types for invoices (jpg/png/webp)
        if (!mimeType || !/^image\//.test(mimeType)) {
            return NextResponse.json({ success: false, message: 'Only image uploads allowed for invoices (jpg/png/webp)' }, { status: 400 });
        }

        // Configure cloudinary from env (works if env vars are set in hosting)
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        // Upload directly to Cloudinary (no local copy). Use resource_type 'image' for images.
        let cloudUrl = '';
        try {
            const uploadRes = await cloudinary.uploader.upload(
                `data:${mimeType};base64,${cleaned}`,
                { resource_type: 'image', folder: 'invoices', public_id: `${orderId}`, overwrite: true }
            );

            cloudUrl = uploadRes.secure_url || uploadRes.url || '';
            if (!cloudUrl) {
                console.error('Cloudinary returned no URL for invoice', orderId, uploadRes);
                return NextResponse.json({ success: false, message: 'Cloudinary upload failed (no url returned)' }, { status: 500 });
            }
        } catch (uploadErr) {
            console.error('Cloudinary upload failed for invoice', orderId, uploadErr);
            return NextResponse.json({ success: false, message: 'Cloudinary upload failed' }, { status: 500 });
        }

        // Persist cloud URL only (keeps backward compatibility by setting invoiceUrl to cloud URL)
        const update = { invoiceUrl: cloudUrl, invoiceUrlCloud: cloudUrl };
        await Order.updateOne({ _id: orderId }, { $set: update });

        return NextResponse.json({ success: true, message: 'Invoice uploaded to Cloudinary', cloudUrl });
    } catch (err) {
        console.error('upload invoice error', err);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
