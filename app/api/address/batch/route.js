export const runtime = 'nodejs';
import connectDB from '@/config/db';
import Address from '@/models/Address';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const ids = Array.isArray(body.ids) ? body.ids.map(id => String(id)) : [];
        if (ids.length === 0) return NextResponse.json({ success: true, addresses: {} });
        await connectDB();
        const validIds = ids.filter(id => mongoose.isValidObjectId(id));
        if (validIds.length === 0) return NextResponse.json({ success: true, addresses: {} });
        const docs = await Address.find({ _id: { $in: validIds } }).select('fullName phoneNumber pincode area city state email').lean();
        const map = docs.reduce((acc, d) => { acc[String(d._id)] = d; return acc; }, {});
        return NextResponse.json({ success: true, addresses: map });
    } catch (err) {
        console.error('address batch error', err);
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}
