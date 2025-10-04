import connectDB from "@/config/db";
import Order from "@/models/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
const Razorpay = require('razorpay');
const crypto = require('crypto');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'zyu73F1RqsmsP7Z76tc0p3K7';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_RO8kaE9GNU9MPE';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const body = await request.json();
    console.log('🔎 verify-payment: request body:', body);
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = body;

    // Verify payment signature using the key secret
    const generated_signature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    console.log('🔐 verify-payment: incoming signature:', razorpay_signature);
    console.log('🔐 verify-payment: generated signature:', generated_signature);

    await connectDB();

    // Lookup order in DB for extra context
    let dbOrder = null;
    try {
      dbOrder = await Order.findById(orderId);
      console.log('📦 verify-payment: DB order:', dbOrder ? { id: dbOrder._id.toString(), paymentStatus: dbOrder.paymentStatus, amount: dbOrder.amount } : 'not found');
    } catch (e) {
      console.error('⚠️ verify-payment: error fetching order', e);
    }

    if (generated_signature === razorpay_signature) {
      // Update order payment status
      try {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'paid',
          razorpayPaymentId: razorpay_payment_id
        });
      } catch (e) {
        console.error('⚠️ verify-payment: failed to update order', e);
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified successfully'
      });
    } else {
      console.warn('⚠️ verify-payment: signature mismatch, attempting REST API fallback');
      // Fallback: fetch payment from Razorpay REST API and trust captured payments
      try {
        const resp = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
          headers: {
            'Authorization': 'Basic ' + Buffer.from(RAZORPAY_KEY_ID + ':' + RAZORPAY_KEY_SECRET).toString('base64')
          }
        });
        if (resp.ok) {
          const paymentData = await resp.json();
          console.log('🔍 verify-payment: fetched payment data', { id: paymentData.id, status: paymentData.status });
          if (paymentData.status === 'captured' || paymentData.status === 'authorized') {
            // update order as paid
            try {
              await Order.findByIdAndUpdate(orderId, {
                paymentStatus: 'paid',
                razorpayPaymentId: razorpay_payment_id
              });
            } catch (e) {
              console.error('⚠️ verify-payment: failed to update order after REST fallback', e);
            }
            return NextResponse.json({ success: true, message: 'Payment accepted via REST fallback', debug: { fetchedStatus: paymentData.status } });
          }
        } else {
          const text = await resp.text();
          console.warn('⚠️ verify-payment: REST fetch failed', resp.status, text);
        }
      } catch (e) {
        console.error('⚠️ verify-payment: REST fallback error', e);
      }

      // Include generated signature in response for debugging only
      return NextResponse.json({ 
        success: false, 
        message: 'Payment verification failed',
        debug: {
          generated_signature,
          incoming_signature: razorpay_signature,
          razorpay_order_id,
          razorpay_payment_id
        }
      }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}