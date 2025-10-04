// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: "User" }, // Capitalize ref
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    offerPrice: { type: Number, required: true },
    image: { type: Array, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    subcategory: { type: String, required: false },
    videos: [{ type: String }],
    stockQuantity: { type: Number, required: true, default: 0 },
    date: { type: Number, required: true }
})

// Change to capitalized model name
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;

