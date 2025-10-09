export const runtime = 'nodejs';
import connectDB from '@/config/db';
import Order from '@/models/Order';
import Address from '@/models/Address';
import User from '@/models/User';
import Product from '@/models/Product';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await connectDB();
        const order = await Order.findOne({}).lean();
        if (!order) return NextResponse.json({ success: false, message: 'No orders found' }, { status: 404 });

        // Resolve address safely
        let addr = null;
        if (order.address) {
            if (typeof order.address === 'string') {
                if (mongoose.isValidObjectId(order.address)) {
                    const a = await Address.findById(order.address).select('fullName phoneNumber pincode area city state').lean();
                    addr = a || null;
                } else {
                    try {
                        const parsed = JSON.parse(order.address);
                        addr = parsed && typeof parsed === 'object' ? parsed : { area: String(order.address) };
                    } catch (e) {
                        addr = { area: String(order.address) };
                    }
                }
            } else if (typeof order.address === 'object') {
                addr = order.address;
            }
        }

        // Resolve user fallback
        let userObj = null;
        if (order.userId) {
            try { userObj = await User.findById(order.userId).select('name').lean(); } catch (e) { userObj = null; }
        }

        // Build customer
        const customer = {
            fullName: (addr && addr.fullName) || (userObj && userObj.name) || 'N/A',
            phoneNumber: (addr && addr.phoneNumber) || 'N/A',
            shippingAddress: addr ? {
                addressLine1: addr.area || '',
                city: addr.city || '',
                state: addr.state || '',
                pincode: addr.pincode || ''
            } : null
        };

        // Populate product details for items (best-effort)
        const ids = [];
        (order.items || []).forEach(it => {
            const maybe = typeof it.product === 'string' ? it.product.split('::')[0] : (it.product && it.product._id ? it.product._id : it.product);
            if (maybe) ids.push(maybe.toString());
        });
        const uniqueIds = [...new Set(ids)].filter(id => mongoose.isValidObjectId(id));
        let productsMap = {};
        if (uniqueIds.length > 0) {
            const products = await Product.find({ _id: { $in: uniqueIds } }).select('_id name').lean();
            productsMap = products.reduce((acc, p) => { acc[p._id.toString()] = p; return acc; }, {});
        }

        const sample = {
            ...order,
            address: addr,
            customer,
            items: (order.items || []).map(it => ({ ...it, product: (it.product && it.product._id) ? productsMap[it.product._id.toString()] || it.product : (typeof it.product === 'string' ? (productsMap[it.product.split('::')[0]] || it.product) : it.product) }))
        };

        console.log('Debug sample-order returning', { id: sample._id, customer });
        return NextResponse.json({ success: true, order: sample });
    } catch (err) {
        console.error('Debug sample-order error', err);
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}
