export const runtime = "nodejs";
export const dynamic = 'force-dynamic';
import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Address from "@/models/Address"; // Explicitly import Address
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from 'mongoose';

export async function GET(request) {
    try {
        const user = await currentUser();
        console.log("Fetching user from Clerk:", { userId: user?.id, timestamp: new Date().toISOString() });

        if (!user) {
            console.error("No user found in auth", { timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const isSeller = await authSeller(user.id);
        console.log("Seller check result:", { userId: user.id, isSeller, timestamp: new Date().toISOString() });
        if (!isSeller) {
            console.error("User is not a seller:", { userId: user.id, timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
        }

        await connectDB();

        // Log model registration
        console.log("Models registered:", {
            Order: !!mongoose.models.Order,
            Product: !!mongoose.models.Product,
            Address: !!mongoose.models.Address,
            timestamp: new Date().toISOString()
        });

        // Get seller's product IDs
        const sellerProductIds = await Product.find({ userId: user.id }).distinct('_id');
        console.log("Seller product IDs:", { count: sellerProductIds.length, timestamp: new Date().toISOString() });

        // Fetch orders containing seller's products
        const sellerOrders = await Order.find({ "items.product": { $in: sellerProductIds } })
            .populate({
                path: 'items.product',
                select: '_id name image offerPrice',
                match: { userId: user.id }
            })
            .populate({
                path: 'address',
                model: 'Address', // Explicitly specify model
                select: 'fullName phoneNumber pincode area city state'
            })
            .lean();

        console.log("Raw orders fetched:", { count: sellerOrders.length, timestamp: new Date().toISOString() });

        // Map orders to include customer object
        const ordersWithCustomer = sellerOrders.map(order => {
            console.log(`Order ${order._id} address:`, JSON.stringify(order.address || {}, null, 2));
            return {
                ...order,
                specialRequest: order.specialRequest || '',
                customer: {
                    fullName: order.address?.fullName || "N/A",
                    phoneNumber: order.address?.phoneNumber || "N/A",
                    shippingAddress: order.address ? {
                        addressLine1: order.address.area || "",
                        city: order.address.city || "",
                        state: order.address.state || "",
                        pincode: order.address.pincode || "",
                        country: ""
                    } : null
                }
            };
        });

        console.log("Orders with customer data:", { count: ordersWithCustomer.length, timestamp: new Date().toISOString() });

        return NextResponse.json({ success: true, orders: ordersWithCustomer });

    } catch (error) {
        console.error("Error fetching seller orders:", {
            message: error.message,
            name: error.name,
            code: error.code,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const user = await currentUser();
        console.log("Fetching user for PUT:", { userId: user?.id, timestamp: new Date().toISOString() });

        if (!user) {
            console.error("No user found in auth", { timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const isSeller = await authSeller(user.id);
        console.log("Seller check result for PUT:", { userId: user.id, isSeller, timestamp: new Date().toISOString() });
        if (!isSeller) {
            console.error("User is not a seller:", { userId: user.id, timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
    const { orderId, status, paymentStatus, cancellationReason, refundReason, trackingLink, productId } = body;

        if (!orderId) {
            console.error("Missing orderId in request body", { timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
        }

        const order = await Order.findById(orderId).populate('items.product').populate({
            path: 'address',
            model: 'Address',
            select: 'fullName phoneNumber pincode area city state'
        });
        if (!order) {
            console.error(`Order not found: ${orderId}`, { timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        const hasSellerProducts = order.items.some(item => 
            item.product && item.product.userId === user.id
        );
        console.log(`Order ${orderId} has seller products:`, { hasSellerProducts, timestamp: new Date().toISOString() });

        if (!hasSellerProducts) {
            console.error(`Not authorized to update order ${orderId}`, { timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Not authorized to update this order' }, { status: 403 });
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (cancellationReason) updateData.cancellationReason = cancellationReason;
        if (refundReason) updateData.refundReason = refundReason;

        // If tracking info provided, update the matching item for this seller
        if (trackingLink && productId) {
            // ensure the product belongs to this seller
            const sellerProduct = await Product.findOne({ _id: productId, userId: user.id });
            if (!sellerProduct) {
                return NextResponse.json({ success: false, message: 'Product not found or not owned by seller' }, { status: 403 });
            }

            // Find item index: support both populated product objects and raw ObjectId values
            const productIdStr = productId.toString();
            const itemIndex = order.items.findIndex(it => {
                if (!it) return false;
                const p = it.product;
                if (!p) return false;
                // If populated, p._id exists; otherwise p might be an ObjectId or string
                try {
                    const pid = p._id ? p._id.toString() : p.toString();
                    return pid === productIdStr;
                } catch (e) {
                    return false;
                }
            });
            if (itemIndex === -1) {
                console.warn('Product not found in order items', { orderId, productId: productIdStr, items: order.items.map(it => ({ product: it.product && (it.product._id ? it.product._id.toString() : it.product && it.product.toString()) })) });
                return NextResponse.json({ success: false, message: 'Product not part of the order' }, { status: 400 });
            }

            // Apply tracking update using positional operator for robustness
            // coerce to ObjectId for reliable matching
            let pidObj = productId;
            try {
                pidObj = mongoose.Types.ObjectId(productId);
            } catch (e) {
                // leave as-is if it can't be converted
            }

            const updateResult = await Order.updateOne(
                { _id: orderId, 'items.product': pidObj },
                { $set: { 'items.$.trackingLink': trackingLink, 'items.$.trackingUpdatedDate': new Date() } }
            );

            // If nothing matched/modified, return helpful debug
            if (!updateResult || (updateResult.matchedCount === 0 && updateResult.nMatched === 0)) {
                console.warn('Tracking update did not match any item', { orderId, productId, pidObj, updateResult, items: order.items.map(it => ({ product: it.product && (it.product._id ? it.product._id.toString() : it.product && it.product.toString()), trackingLink: it.trackingLink })) });
                return NextResponse.json({ success: false, message: 'Failed to update tracking: no matching item found', debug: { updateResult } }, { status: 400 });
            }
        }

        if (paymentStatus === 'refunded' && !order.refundDate) {
            updateData.refundDate = new Date();
        }

        // Re-fetch the order after any updates to ensure we return the latest state
        const reloaded = await Order.findById(orderId).populate({
            path: 'items.product',
            select: '_id name image offerPrice userId'
        }).populate({
            path: 'address',
            model: 'Address',
            select: 'fullName phoneNumber pincode area city state'
        }).lean();

        const responseOrder = {
            ...reloaded,
            specialRequest: reloaded.specialRequest || '',
            customer: {
                fullName: reloaded.address?.fullName || "N/A",
                phoneNumber: reloaded.address?.phoneNumber || "N/A",
                shippingAddress: reloaded.address ? {
                    addressLine1: reloaded.address.area || "",
                    city: reloaded.address.city || "",
                    state: reloaded.address.state || "",
                    pincode: reloaded.address.pincode || "",
                    country: ""
                } : null
            }
        };

        // Include updateResult if present for debugging (e.g., when trackingLink was updated above)
        console.log('Order update completed', { orderId, updateResult: typeof updateResult !== 'undefined' ? updateResult : null, timestamp: new Date().toISOString() });

        return NextResponse.json({ success: true, message: 'Order updated successfully', order: responseOrder, updateResult: typeof updateResult !== 'undefined' ? updateResult : null });

    } catch (error) {
        console.error("Error updating order:", {
            message: error.message,
            name: error.name,
            code: error.code,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}