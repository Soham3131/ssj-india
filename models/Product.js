// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: "User" }, // Capitalize ref
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    offerPrice: { type: Number, required: true },
    image: { type: Array, required: true },
    brand: { type: String, required: false },
    category: { type: String, required: false },
    subcategory: { type: String, required: false },
    videos: [{ type: String }],
    // stockQuantity is optional: when omitted it means 'unlimited' / not tracked
    stockQuantity: { type: Number, required: false },
    minBuy: { type: Number, required: true, default: 1 },
    // Optional URL-friendly identifier. Use sparse unique index so products without slug don't conflict.
    slug: { type: String, required: false, unique: true, sparse: true },
    // Variants: array of variant groups. Each group has a name and options with optional price and stock.
    variants: { type: Array, required: false, default: [] },
    // Product-level colors (array of { label, color }) to allow colors without variants
    colors: { type: Array, required: false, default: [] },
    date: { type: Number, required: true }
})

// Change to capitalized model name
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;

