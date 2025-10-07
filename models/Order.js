// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true, 
        ref: 'User' // Consistent naming
    },
    items: [{
        product: { 
            type: mongoose.Schema.Types.ObjectId,
            required: true, 
            ref: 'Product' // Capitalize to match model name
        },
        quantity: { 
            type: Number, 
            required: true 
        }
        ,
        // Persist a snapshot of selected options (variant choices) for each item
        selectedOptions: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        }
        ,
        // Per-item tracking info (optional)
        trackingLink: {
            type: String,
            default: ''
        },
        trackingUpdatedDate: {
            type: Date
        }
    }],

    amount: { 
        type: Number, 
        required: true 
    },
    address: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address', // Capitalize to match model name
        required: true 
    },
    // New: allow storing an optional special request from the customer
    specialRequest: {
        type: String,
        default: ''
    },
    // Extend status enum to include return/replace lifecycle statuses
    status: { 
        type: String, 
        required: true, 
        default: 'Order Placed',
        enum: [
            'Order Placed',
            'pending',
            'confirmed',
            'shipped',
            'delivered',
            'cancelled',
            'return_assigned',
            'returned_completed',
            'replace_assigned',
            'replace_completed'
        ]
    },
    paymentStatus: {
        type: String,
        required: true,
        default: 'pending',
        enum: ['pending', 'paid', 'failed', 'refunded']
    },
    cancellationReason: {
        type: String
    },
    refundDate: {
        type: Date
    },
    refundReason: {
        type: String
    },
    // Optional invoice/bill URL provided by seller/admin (relative path under /public)
    invoiceUrl: {
        type: String,
        default: ''
    },
    // Admin notes: allow multiple sellers to keep a private note per order
    adminNotes: [{
        sellerId: { type: String },
        note: { type: String, default: '' },
        updatedAt: { type: Date }
    }],
    date: { 
        type: Date,
        default: Date.now 
    },
});

// Use consistent naming - capitalize model names
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;