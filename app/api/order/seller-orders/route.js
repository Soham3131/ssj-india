export const runtime = "nodejs";
export const dynamic = 'force-dynamic';
import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Address from "@/models/Address"; // Explicitly import Address
import User from '@/models/User';
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
        // Use lean() + a safe address resolution to avoid Mongoose trying to cast invalid address values to ObjectId
        const rawOrders = await Order.find({}).lean();

        // Build an address map only for valid ObjectId values to avoid CastError when some orders store non-ObjectId values
        const addressIds = rawOrders.map(o => o.address).filter(Boolean).filter(id => mongoose.isValidObjectId(id)).map(id => id.toString());
        const uniqueAddressIds = [...new Set(addressIds)];
        let addressMap = {};
        if (uniqueAddressIds.length > 0) {
            const addresses = await Address.find({ _id: { $in: uniqueAddressIds } }).select('fullName phoneNumber pincode area city state').lean();
            addressMap = addresses.reduce((acc, a) => { acc[a._id.toString()] = a; return acc; }, {});
        }

        // Prefetch users (for fallback when address is missing or non-standard) to provide at least a customer name
        const userIds = rawOrders.map(o => o.userId).filter(Boolean).map(id => id.toString());
        const uniqueUserIds = [...new Set(userIds)];
        let usersMap = {};
        if (uniqueUserIds.length > 0) {
            const users = await User.find({ _id: { $in: uniqueUserIds } }).select('name').lean();
            usersMap = users.reduce((acc, u) => { acc[u._id.toString()] = u; return acc; }, {});
        }

        // Attach address object when resolvable, otherwise keep existing value (could be inline object or a string)
        const allOrders = rawOrders.map(o => {
            let addr = null;
            if (o.address) {
                // If address is an ObjectId or string that looks like one, prefer the pre-fetched addressMap
                try {
                    if (mongoose.isValidObjectId(o.address)) {
                        const key = String(o.address);
                        if (addressMap[key]) {
                            addr = addressMap[key];
                        } else {
                            // leave as null so fallback to user name or parsing occurs below
                            addr = null;
                        }
                    } else if (typeof o.address === 'string') {
                        // Try to parse JSON-encoded address strings (legacy behaviour)
                        try {
                            const parsed = JSON.parse(o.address);
                            if (parsed && typeof parsed === 'object') {
                                addr = parsed;
                            } else {
                                // fallback: store raw string as addressLine1
                                addr = { fullName: '', phoneNumber: '', pincode: '', area: String(o.address), city: '', state: '' };
                            }
                        } catch (e) {
                            // Not JSON, keep raw string as area/address line
                            addr = { fullName: '', phoneNumber: '', pincode: '', area: String(o.address), city: '', state: '' };
                        }
                    } else if (typeof o.address === 'object') {
                        // Embedded address object
                        addr = o.address;
                    } else {
                        addr = null;
                    }
                } catch (e) {
                    // Defensive: if mongoose.isValidObjectId throws, fall back to previous behaviour
                    if (typeof o.address === 'object') addr = o.address;
                    else if (typeof o.address === 'string') {
                        try { addr = JSON.parse(o.address); } catch (e2) { addr = { area: String(o.address) }; }
                    }
                }
            }

            // If still no resolved address, fall back to user name (if available)
            if (!addr && o.userId && usersMap) {
                const key = String(o.userId);
                if (usersMap[key]) {
                    const u = usersMap[key];
                    addr = { fullName: u.name || '', phoneNumber: '', pincode: '', area: '', city: '', state: '' };
                }
            }
            return { ...o, address: addr };
        });

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

        // Map orders to include a robust customer object
        const ordersWithCustomer = await Promise.all(sellerOrders.map(async (order) => {
            // Ensure address is fully resolved; if not, attempt a direct DB lookup as a fallback
            try {
                if (order.address && typeof order.address !== 'object' && mongoose.isValidObjectId(order.address)) {
                    const a = await Address.findById(order.address).select('fullName phoneNumber pincode area city state').lean();
                    if (a) order.address = a;
                }
            } catch (e) {
                // ignore lookup errors - we'll continue with existing value
            }

            console.log(`Order ${order._id} address:`, JSON.stringify(order.address || {}, null, 2));

            // Priority for customer info:
            // 1) order.customer (if provided by other parts of system)
            // 2) resolved order.address (Address doc or embedded object)
            // 3) parsed legacy address string
            // 4) fallback to User.name when available

            let fullName = null;
            let phoneNumber = null;
            let shippingAddress = null;

            // 1) try order.customer first
            if (order.customer && (order.customer.fullName || order.customer.phoneNumber || order.customer.shippingAddress)) {
                fullName = order.customer.fullName || null;
                phoneNumber = order.customer.phoneNumber || null;
                if (order.customer.shippingAddress) {
                    shippingAddress = {
                        addressLine1: order.customer.shippingAddress.addressLine1 || '',
                        city: order.customer.shippingAddress.city || '',
                        state: order.customer.shippingAddress.state || '',
                        pincode: order.customer.shippingAddress.pincode || '',
                        country: order.customer.shippingAddress.country || ''
                    };
                }
            }

            // 2) if missing, use resolved order.address
            if ((!fullName || !phoneNumber) && order.address) {
                const a = order.address;
                if (!fullName && a.fullName) fullName = a.fullName;
                if (!phoneNumber && a.phoneNumber) phoneNumber = a.phoneNumber;
                if (!shippingAddress) {
                    shippingAddress = {
                        addressLine1: a.area || a.addressLine1 || '',
                        city: a.city || '',
                        state: a.state || '',
                        pincode: a.pincode || a.pin || '',
                        country: a.country || ''
                    };
                }
            }

            // 3) Try parse legacy string address stored directly on order.address
            if ((!fullName || !phoneNumber) && order.address && typeof order.address === 'string') {
                try {
                    const parsed = JSON.parse(order.address);
                    if (parsed && typeof parsed === 'object') {
                        if (!fullName && parsed.fullName) fullName = parsed.fullName;
                        if (!phoneNumber && parsed.phoneNumber) phoneNumber = parsed.phoneNumber;
                        if (!shippingAddress) {
                            shippingAddress = {
                                addressLine1: parsed.area || parsed.addressLine1 || '',
                                city: parsed.city || '',
                                state: parsed.state || '',
                                pincode: parsed.pincode || parsed.pin || '',
                                country: parsed.country || ''
                            };
                        }
                    }
                } catch (e) {
                    // not JSON - leave for fallback
                }
            }

            // 4) fallback: use User.name (from prefetched usersMap) if we have a userId and no fullName yet
            if (!fullName && order.userId && usersMap) {
                const key = String(order.userId);
                if (usersMap[key]) fullName = usersMap[key].name || null;
            }

            // 5) as a last resort, attempt a direct DB lookup for the user and use name or email
            if (!fullName && order.userId) {
                try {
                    const u = await User.findById(order.userId).select('name email').lean();
                    if (u) {
                        fullName = u.name || u.email || null;
                    }
                } catch (e) {
                    // ignore lookup errors
                }
            }

            // Final defensive defaults
            const customerObj = {
                // prefer null for missing values so client fallbacks (getDisplayCustomer) can decide
                fullName: fullName || null,
                phoneNumber: phoneNumber || null,
                shippingAddress: shippingAddress || null
            };

            console.log(`Computed customer for order ${order._id}:`, customerObj);

            return {
                ...order,
                specialRequest: order.specialRequest || '',
                customer: customerObj
            };
        }));

        console.log("Orders with customer data:", { count: ordersWithCustomer.length, sample: ordersWithCustomer[0] || null, timestamp: new Date().toISOString() });

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
    const { orderId, status, paymentStatus, cancellationReason, refundReason, trackingLink, productId, orderTrackingLink } = body;

        // Ensure we have seller product ids available in PUT as well
        const sellerProductIdStrs = await getSellerProductIdStrs(user.id);

        if (!orderId) {
            console.error("Missing orderId in request body", { timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
        }

        // Load order with populated product info (items.product). Don't populate address here to avoid casting errors;
        // we'll resolve address safely after fetching the order.
        let order = await Order.findById(orderId).populate('items.product').lean();
        if (!order) {
            console.error(`Order not found: ${orderId}`, { timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        // Safely resolve address if it's a valid ObjectId
        if (order.address && typeof order.address === 'string' && mongoose.isValidObjectId(order.address)) {
            const addr = await Address.findById(order.address).select('fullName phoneNumber pincode area city state').lean();
            order.address = addr || null;
        } else if (order.address && typeof order.address === 'object') {
            // already embedded/address object, keep as-is
        } else {
            order.address = null;
        }
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
    // Per-item tracking (existing behavior)
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

        // If an order-level tracking link was provided, save it
        if (orderTrackingLink) {
            try {
                const r = await Order.updateOne({ _id: orderId }, { $set: { trackingLink: orderTrackingLink } });
                updateResult = updateResult || r;
            } catch (e) {
                console.error('Failed to save order-level tracking link', { error: e, orderId, orderTrackingLink });
                return NextResponse.json({ success: false, message: 'Failed to save order tracking link' }, { status: 500 });
            }
        }

        // Re-fetch the order after any updates to ensure we return the latest state
        // Re-fetch order products (populated) and safely resolve address like above
        const reloadedProducts = await Order.findById(orderId).populate({ path: 'items.product', select: '_id name image offerPrice userId' }).lean();
        let reloaded = reloadedProducts || null;
        if (reloaded) {
            if (reloaded.address && typeof reloaded.address === 'string') {
                if (mongoose.isValidObjectId(reloaded.address)) {
                    const addr = await Address.findById(reloaded.address).select('fullName phoneNumber pincode area city state').lean();
                    reloaded.address = addr || null;
                } else {
                    // Try parse JSON-encoded address or keep raw string
                    try {
                        const parsed = JSON.parse(reloaded.address);
                        reloaded.address = parsed && typeof parsed === 'object' ? parsed : { fullName: '', phoneNumber: '', pincode: '', area: String(reloaded.address), city: '', state: '' };
                    } catch (e) {
                        reloaded.address = { fullName: '', phoneNumber: '', pincode: '', area: String(reloaded.address), city: '', state: '' };
                    }
                }
            } else if (reloaded.address && typeof reloaded.address === 'object') {
                // keep
            } else {
                // fallback to user name if possible
                if (reloaded.userId) {
                    try {
                        const u = await User.findById(reloaded.userId).select('name').lean();
                        reloaded.address = u ? { fullName: u.name || '', phoneNumber: '', pincode: '', area: '', city: '', state: '' } : null;
                    } catch (e) {
                        reloaded.address = null;
                    }
                } else {
                    reloaded.address = null;
                }
            }
        }

        // Build a robust customer object for the returned order
        let responseOrder = null;
        if (reloaded) {
            let fullName = null;
            let phoneNumber = null;
            let shippingAddress = null;

            if (reloaded.customer && (reloaded.customer.fullName || reloaded.customer.phoneNumber || reloaded.customer.shippingAddress)) {
                fullName = reloaded.customer.fullName || null;
                phoneNumber = reloaded.customer.phoneNumber || null;
                if (reloaded.customer.shippingAddress) {
                    shippingAddress = {
                        addressLine1: reloaded.customer.shippingAddress.addressLine1 || '',
                        city: reloaded.customer.shippingAddress.city || '',
                        state: reloaded.customer.shippingAddress.state || '',
                        pincode: reloaded.customer.shippingAddress.pincode || '',
                        country: reloaded.customer.shippingAddress.country || ''
                    };
                }
            }

            if ((!fullName || !phoneNumber) && reloaded.address) {
                const a = reloaded.address;
                if (!fullName && a.fullName) fullName = a.fullName;
                if (!phoneNumber && a.phoneNumber) phoneNumber = a.phoneNumber;
                if (!shippingAddress) {
                    shippingAddress = {
                        addressLine1: a.area || a.addressLine1 || '',
                        city: a.city || '',
                        state: a.state || '',
                        pincode: a.pincode || a.pin || '',
                        country: a.country || ''
                    };
                }
            }

            if ((!fullName || !phoneNumber) && reloaded.address && typeof reloaded.address === 'string') {
                try {
                    const parsed = JSON.parse(reloaded.address);
                    if (parsed && typeof parsed === 'object') {
                        if (!fullName && parsed.fullName) fullName = parsed.fullName;
                        if (!phoneNumber && parsed.phoneNumber) phoneNumber = parsed.phoneNumber;
                        if (!shippingAddress) {
                            shippingAddress = {
                                addressLine1: parsed.area || parsed.addressLine1 || '',
                                city: parsed.city || '',
                                state: parsed.state || '',
                                pincode: parsed.pincode || parsed.pin || '',
                                country: parsed.country || ''
                            };
                        }
                    }
                } catch (e) {
                    // ignore
                }
            }

            if (!fullName && reloaded.userId) {
                try {
                    const key = String(reloaded.userId);
                    if (usersMap && usersMap[key] && usersMap[key].name) {
                        fullName = usersMap[key].name;
                    } else {
                        const u = await User.findById(reloaded.userId).select('name').lean();
                        if (u && u.name) fullName = u.name;
                    }
                } catch (e) {
                    // ignore
                }
            }

            const customerObj = {
                fullName: fullName || null,
                phoneNumber: phoneNumber || null,
                shippingAddress: shippingAddress || null
            };

            responseOrder = {
                ...reloaded,
                specialRequest: reloaded.specialRequest || '',
                customer: customerObj
            };
        }

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