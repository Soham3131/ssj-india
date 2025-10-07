// api/orders/list/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import connectDB from "@/config/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Address from "@/models/Address";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    console.log("⏳ Order fetch start:", new Date().toISOString());
    const { userId } = getAuth(request);

    if (!userId) {
      console.log("❌ User not authenticated");
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    await connectDB();

    // Find orders with string userId
    const orders = await Order.find({ userId }).sort({ date: -1 }).lean();
    console.log("📋 Orders found:", orders.length);

    // Populate related data
    // Helper to extract real product id from composite keys
    const extractProductId = (maybeComposite) => {
      if (!maybeComposite || typeof maybeComposite !== 'string') return maybeComposite;
      const parts = maybeComposite.split('::');
      return parts[0];
    };

    const populatedOrders = await Promise.all(
      orders.map(async (order) => {
        const address = await Address.findOne({ _id: order.address }).lean();
            const populatedItems = await Promise.all(
          order.items.map(async (item) => {
            const pid = extractProductId(item.product);
            const product = await Product.findOne({ _id: pid }).lean();

            // Recover selectedOptions when missing from legacy orders where product field encoded the selection
            let sel = item.selectedOptions || null;
            try {
              if (!sel && item.product && typeof item.product === 'string' && item.product.includes('::')) {
                const parts = item.product.split('::');
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
              // ensure tracking fields are included even when item is returned as plain object
              product: product
                ? {
                    _id: product._id,
                    name: product.name,
                    image: product.image,
                    offerPrice: product.offerPrice,
                  }
                : null,
              quantity: item.quantity,
              trackingLink: item.trackingLink || '',
              trackingUpdatedDate: item.trackingUpdatedDate || null,
              selectedOptions: sel || null
            };
          })
        );
        return {
          ...order,
          address: address
            ? {
                _id: address._id,
                fullName: address.fullName,
                phoneNumber: address.phoneNumber,
                pincode: address.pincode,
                area: address.area,
                city: address.city,
                state: address.state,
              }
            : null,
          items: populatedItems,
        };
      })
    );

    console.log("⏳ Orders fetched:", new Date().toISOString());
    return NextResponse.json(
      { success: true, orders: populatedOrders },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Order fetch error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}