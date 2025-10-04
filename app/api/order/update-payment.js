import connectDB from "@/config/db";
import Order from "@/models/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const body = await request.json();
    const { orderId, paymentStatus, razorpayPaymentId } = body;

    await connectDB();

    // Update order payment status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: paymentStatus,
        razorpayPaymentId: razorpayPaymentId
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ 
        success: false, 
        message: 'Order not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment status updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}