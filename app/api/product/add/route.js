import { v2 as cloudinary } from "cloudinary";
import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request) {
    try {
        console.log("=== 🛜 API ROUTE HIT ===");
        
        const { userId } = getAuth(request)
        console.log("👤 User ID:", userId);

        const isSeller = await authSeller(userId)
        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'not authorized' }, { status: 401 })
        }

        const formData = await request.formData()
        
        // Debug received data
        console.log("📨 Received form data:");
        for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(key + ": ", value.name, value.type, value.size);
            } else {
                console.log(key + ": ", value);
            }
        }

        // Get all fields
        const name = formData.get('name');
        const description = formData.get('description');
        const category = formData.get('category');
        const brand = formData.get('brand');
        const subcategory = formData.get('subcategory');
        const price = formData.get('price');
        const offerPrice = formData.get('offerPrice');
        const stockQuantity = formData.get('stockQuantity'); // ADDED

        const files = formData.getAll('images');
        const videoFiles = formData.getAll('videos');

        console.log("🔍 Extracted values:");
        console.log("Name:", name);
        console.log("Brand:", brand);
        console.log("Category:", category);
        console.log("Subcategory:", subcategory);
        console.log("Price:", price);
        console.log("Offer Price:", offerPrice);
        console.log("Stock Quantity:", stockQuantity); // ADDED
        console.log("Image files:", files.length);
        console.log("Video files:", videoFiles.length);

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, message: 'no files uploaded' }, { status: 400 })
        }

        // Validate stock quantity
        if (!stockQuantity || parseInt(stockQuantity) < 0) {
            return NextResponse.json({ success: false, message: 'Invalid stock quantity' }, { status: 400 })
        }

        // Upload images
        const imageResults = await Promise.all(
            files.map(async (file) => {
                const arrayBuffer = await file.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)

                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { resource_type: 'image' },
                        (error, result) => {
                            if (error) {
                                reject(error)
                            } else {
                                resolve(result)
                            }
                        }
                    )
                    stream.end(buffer)
                })
            })
        )

        const imageUrls = imageResults.map(result => result.secure_url)
        console.log("📸 Uploaded images:", imageUrls);

        // Upload videos
        let videoUrls = [];
        if (videoFiles && videoFiles.length > 0) {
            const videoResults = await Promise.all(
                videoFiles.map(async (file) => {
                    const arrayBuffer = await file.arrayBuffer()
                    const buffer = Buffer.from(arrayBuffer)

                    return new Promise((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            { resource_type: 'video' },
                            (error, result) => {
                                if (error) {
                                    reject(error)
                                } else {
                                    resolve(result)
                                }
                            }
                        )
                        stream.end(buffer)
                    })
                })
            )
            videoUrls = videoResults.map(result => result.secure_url)
            console.log("🎥 Uploaded videos:", videoUrls);
        }

        await connectDB()
        
        // Create product with all fields including stockQuantity
        const newProduct = await Product.create({
            userId,
            name,
            description,
            category,
            brand,
            subcategory,
            price: Number(price),
            offerPrice: Number(offerPrice),
            stockQuantity: parseInt(stockQuantity) || 0, // ADDED
            image: imageUrls,
            videos: videoUrls,
            date: Date.now()
        })

        console.log("✅ Product created:", {
            id: newProduct._id,
            name: newProduct.name,
            brand: newProduct.brand,
            category: newProduct.category,
            subcategory: newProduct.subcategory,
            stockQuantity: newProduct.stockQuantity, // ADDED
            videos: newProduct.videos
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Product added successfully', 
            product: newProduct 
        }, { status: 201 })

    } catch (error) {
        console.error("❌ Product creation error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 })
}