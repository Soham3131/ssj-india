import { inngest } from "@/config/inngest";
import axios from 'axios';
import Product from "@/models/Product";
import User from "@/models/User";
import Order from "@/models/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'zyu73F1RqsmsP7Z76tc0p3K7';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_RO8kaE9GNU9MPE';

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        // Read the request body once and reuse values (don't call request.json() multiple times)
        const body = await request.json();
    const { address, items, paymentMethod, specialRequest } = body;

        // Helper to extract real productId from composite cart key like "<productId>::<encodedSelection>"
        const extractProductId = (maybeComposite) => {
            if (!maybeComposite || typeof maybeComposite !== 'string') return maybeComposite;
            const parts = maybeComposite.split('::');
            return parts[0];
        };

        console.log("🔄 Creating order for user:", userId);
        console.log("📦 Order items:", items);

        if (!address || items.length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid data' });
        }

        // ✅ STOCK VALIDATION: enforce minBuy and treat blank/non-numeric option stock as unlimited
        for (const item of items) {
            const productId = extractProductId(item.product);
            const product = await Product.findById(productId);
            console.log("🔍 Checking product:", {
                productId: item.product,
                productName: product?.name,
                stockQuantity: product?.stockQuantity,
                requestedQuantity: item.quantity,
                minBuy: product?.minBuy
            });

            if (!product) {
                console.log("❌ Product not found");
                return NextResponse.json({ 
                    success: false, 
                    message: `Product not found` 
                });
            }

            // Enforce server-side minBuy
            const minBuy = product.minBuy && Number(product.minBuy) > 0 ? Number(product.minBuy) : 1;
            if (Number(item.quantity) < minBuy) {
                return NextResponse.json({ success: false, message: `Minimum purchase for ${product.name} is ${minBuy}` });
            }

            // We only track product-level stock now. Variant options do not have stock.
            const pStock = product.stockQuantity;
            const pStockNum = Number(pStock);
            if (pStock !== undefined && pStock !== null && pStock !== '' && Number.isFinite(pStockNum)) {
                if (pStockNum < Number(item.quantity)) {
                    console.log("❌ Not enough stock");
                    return NextResponse.json({ 
                        success: false, 
                        message: `Only ${pStock} left for ${product.name}` 
                    });
                }
            }
        }

        console.log("✅ Stock validation passed");

        // Calculate amount
        let totalAmount = 0;
        for (const item of items) {
            const productId = extractProductId(item.product);
            const product = await Product.findById(productId);
            if (product) {
                // Determine unit price: consider selected options sent by client (item.selectedOptions)
                let unitPrice = Number(product.offerPrice || product.price || 0);
                try {
                    const sel = item.selectedOptions || null;
                    const selected = Array.isArray(sel) ? sel : (sel && typeof sel === 'object' ? Object.values(sel) : []);
                    const absolutePrices = selected.map(o => (o && o.price !== undefined && o.price !== null ? Number(o.price) : null)).filter(v => v !== null && !Number.isNaN(v));
                    if (absolutePrices.length > 0) {
                        unitPrice = Math.max(...absolutePrices);
                    }
                    selected.forEach((opt) => {
                        if (!opt) return;
                        const delta = Number(opt.priceDelta || 0) || 0;
                        unitPrice += delta;
                    });
                } catch (e) {
                    // ignore
                }
                totalAmount += unitPrice * item.quantity;
            }
        }

    const finalAmount = totalAmount;

        // ✅ CREATE ORDER IN DATABASE
            // Ensure we store real product IDs (not composite cart keys) in the order items
            const itemsToStore = (items || []).map(it => {
                // If client didn't include selectedOptions but product was sent as a composite key
                // like "<productId>::<encodedSelection>", try to recover the selection here.
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
                    // ignore parse errors and leave sel as null
                    sel = sel || null;
                }

                return {
                    ...it,
                    product: extractProductId(it.product),
                    // persist selectedOptions if present so order keeps a snapshot of chosen variants
                    selectedOptions: sel || null
                };
            });

            console.log('📦 itemsToStore (saving):', JSON.stringify(itemsToStore, null, 2));

            const order = await Order.create({
                userId: userId,
                items: itemsToStore,
                amount: finalAmount,
                address: address,
                specialRequest: specialRequest || '',
                status: 'Order Placed',
                paymentStatus: 'pending',
                paymentMethod: 'cod',
                date: new Date()
            });

        console.log("✅ Order saved to DB with ID:", order._id);

        // ✅ UPDATE STOCK QUANTITIES
            for (const item of itemsToStore) {
                const product = await Product.findById(item.product);
                if (!product) continue;

                // We only track product-level stock now. Decrement product-level stock when present.
                if (product.stockQuantity !== undefined && product.stockQuantity !== null && product.stockQuantity !== '' && Number.isFinite(Number(product.stockQuantity))) {
                    const updatedProduct = await Product.findByIdAndUpdate(
                        item.product,
                        { $inc: { stockQuantity: -item.quantity } },
                        { new: true }
                    );
                    console.log('📦 Product-level stock updated for:', { product: item.product, newStock: updatedProduct.stockQuantity });
                } else {
                    console.log('ℹ️ Product-level stock not tracked or unlimited; no decrement performed');
                }
            }

        // Send to Inngest
        await inngest.send({
            name: 'order/created',
                data: {
                userId,
                address,
                items,
                amount: finalAmount,
                date: Date.now()
            }
        });

        // Clear user cart
        const user = await User.findOne({ _id: userId });
        if (user) {
            user.cartItems = {};
            await user.save();
            console.log("🛒 Cart cleared");
        }

                        // If client requested razorpay, create a Razorpay order and return its id
                        let razorpay_order_id = null;
                                try {
                                    if (paymentMethod === 'razorpay') {
                                        // Create Razorpay order via REST API using axios to avoid SDK body-read issues
                                        const rpResp = await axios.post(
                                            'https://api.razorpay.com/v1/orders',
                                            {
                                                amount: finalAmount * 100,
                                                currency: 'INR',
                                                receipt: order._id.toString(),
                                                payment_capture: 1
                                            },
                                            {
                                                auth: {
                                                    username: RAZORPAY_KEY_ID,
                                                    password: RAZORPAY_KEY_SECRET
                                                }
                                            }
                                        );
                                        if (rpResp && rpResp.data && rpResp.data.id) {
                                            razorpay_order_id = rpResp.data.id;
                                            order.paymentMethod = 'razorpay';
                                            await order.save();
                                        } else {
                                            console.log('⚠️ Razorpay response missing id', rpResp && rpResp.data);
                                        }
                                    }
                                } catch (e) {
                                    console.error('⚠️ Razorpay order creation failed', e && e.stack ? e.stack : e);
                                }

                return NextResponse.json({ 
                        success: true, 
                        message: 'Order Placed', 
                        orderId: order._id,
                        razorpay_order_id: razorpay_order_id
                });

    } catch (error) {
        console.log("❌ Order creation error:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}