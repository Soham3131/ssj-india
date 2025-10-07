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

// Helper to extract product id from composite keys (works for both GET and PUT)
const extractProductId = (maybeComposite) => {
    if (!maybeComposite || typeof maybeComposite !== 'string') return maybeComposite;
    const parts = maybeComposite.split('::');
    return parts[0];
};

// Helper to fetch seller product id strings for a given user
async function getSellerProductIdStrs(userId) {
    const ids = await Product.find({ userId }).distinct('_id');
    return ids.map(id => id.toString());
}

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
        await connectDB();

        // Get seller's product IDs (normalize to string array for reliable comparisons)
        const sellerProductIdStrs = await getSellerProductIdStrs(user.id);
        console.log("Seller product IDs:", { count: sellerProductIdStrs.length, timestamp: new Date().toISOString() });

        // Fetch all orders (we'll filter/transform to seller items manually to handle composite keys)
        const allOrders = await Order.find({}).populate({ path: 'address', model: 'Address', select: 'fullName phoneNumber pincode area city state' }).lean();

        // Filter orders to those containing at least one item belonging to this seller (by product id)
        const sellerOrders = allOrders.filter(order => {
            return (order.items || []).some(it => {
                const pid = extractProductId(it.product);
                return pid && sellerProductIdStrs.includes(pid.toString());
            });
        });

        console.log("Raw orders fetched (post-filter):", { count: sellerOrders.length, timestamp: new Date().toISOString() });

        // Collect all product ids from sellerOrders' items to populate product data
        const allProductIds = new Set();
        sellerOrders.forEach(o => {
            (o.items || []).forEach(it => {
                const pid = extractProductId(it.product);
                if (pid) allProductIds.add(pid.toString());
            });
        });

        const productIdArray = Array.from(allProductIds);
        let productsMap = {};
        if (productIdArray.length > 0) {
            const products = await Product.find({ _id: { $in: productIdArray } }).lean();
            productsMap = products.reduce((acc, p) => {
                acc[p._id.toString()] = p;
                return acc;
            }, {});
        }

        // Replace item.product ids with product objects when available
        sellerOrders.forEach(o => {
            o.items = (o.items || []).map(it => {
                const pid = extractProductId(it.product);
                const prod = pid ? productsMap[pid.toString()] : null;
                // Recover selectedOptions for legacy orders where product may have encoded selection
                let sel = it.selectedOptions || null;
                try {
                    if (!sel && it.product && typeof it.product === 'string' && it.product.includes('::')) {
                        const parts = it.product.split('::');
                        if (parts.length > 1) {
                            const encoded = parts.slice(1).join('::');
                            const decoded = decodeURIComponent(encoded);
                            sel = JSON.parse(decoded);
                        }
                    }
                } catch (e) {
                    sel = sel || null;
                }

                return {
                    ...it,
                    product: prod ? prod : null,
                    selectedOptions: sel || it.selectedOptions || null
                };
            });
        });

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

        // Ensure we have seller product ids available in PUT as well
        const sellerProductIdStrs = await getSellerProductIdStrs(user.id);

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

        const hasSellerProducts = order.items.some(item => {
            // item.product may be populated object or raw id/composite string
            const pid = item.product && item.product._id ? item.product._id.toString() : (typeof item.product === 'string' ? extractProductId(item.product) : null);
            return pid && sellerProductIdStrs.includes(pid.toString());
        });
        console.log(`Order ${orderId} has seller products:`, { hasSellerProducts, timestamp: new Date().toISOString() });

        if (!hasSellerProducts) {
            console.error(`Not authorized to update order ${orderId}`, { timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Not authorized to update this order' }, { status: 403 });
        }

    const updateData = {};
    // Will hold results from any update operations (tracking or general updates)
    let updateResult = null;
        if (status) updateData.status = status;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (cancellationReason) updateData.cancellationReason = cancellationReason;
        if (refundReason) updateData.refundReason = refundReason;

        // If tracking info provided, update the matching item for this seller
        if (trackingLink && productId) {
            // accept composite productId (from client) and extract real id
            const cleanedProductId = extractProductId(productId);
            // ensure the product belongs to this seller
            const sellerProduct = await Product.findOne({ _id: cleanedProductId, userId: user.id });
            if (!sellerProduct) {
                return NextResponse.json({ success: false, message: 'Product not found or not owned by seller' }, { status: 403 });
            }

            // Find item index: support both populated product objects and raw ObjectId values
            const productIdStr = cleanedProductId.toString();
            const itemIndex = order.items.findIndex(it => {
                if (!it) return false;
                const p = it.product;
                if (!p) return false;
                // If populated, p._id exists; otherwise p might be an ObjectId or string
                try {
                    const pid = p._id ? p._id.toString() : (typeof p === 'string' ? extractProductId(p) : p.toString());
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
            let pidObj = cleanedProductId;
            try {
                pidObj = mongoose.Types.ObjectId(cleanedProductId);
            } catch (e) {
                // leave as-is if it can't be converted
            }

            // Try a direct update first
            updateResult = await Order.updateOne(
                { _id: orderId, 'items.product': pidObj },
                { $set: { 'items.$.trackingLink': trackingLink, 'items.$.trackingUpdatedDate': new Date() } }
            );

            // If that didn't match (legacy composite keys stored), try regex match on items.product
            if (!updateResult || (updateResult.matchedCount === 0 && updateResult.nMatched === 0)) {
                const regex = new RegExp(`^${cleanedProductId}::`);
                updateResult = await Order.updateOne(
                    { _id: orderId, 'items.product': { $regex: regex } },
                    { $set: { 'items.$.trackingLink': trackingLink, 'items.$.trackingUpdatedDate': new Date() } }
                );
            }

            // If nothing matched/modified, return helpful debug
            if (!updateResult || (updateResult.matchedCount === 0 && updateResult.nMatched === 0)) {
                console.warn('Tracking update did not match any item', { orderId, productId, pidObj, updateResult, items: order.items.map(it => ({ product: it.product && (it.product._id ? it.product._id.toString() : it.product && it.product.toString()), trackingLink: it.trackingLink })) });
                return NextResponse.json({ success: false, message: 'Failed to update tracking: no matching item found', debug: { updateResult } }, { status: 400 });
            }
        }

        if (paymentStatus === 'refunded' && !order.refundDate) {
            updateData.refundDate = new Date();
        }

        // Persist any top-level order updates (status/payment/cancellation/refund)
        try {
            if (Object.keys(updateData).length > 0) {
                const u = await Order.updateOne({ _id: orderId }, { $set: updateData });
                // If tracking update also ran, keep that result, otherwise use this
                updateResult = updateResult || u;
            }
        } catch (e) {
            console.error('Failed to apply order-level updates', { error: e, orderId, updateData, timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Failed to apply updates' }, { status: 500 });
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