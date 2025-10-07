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
    const minBuy = formData.get('minBuy');

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

        // Validate stock quantity only if provided
        if (stockQuantity !== null && stockQuantity !== undefined && stockQuantity !== '') {
            if (parseInt(stockQuantity) < 0) {
                return NextResponse.json({ success: false, message: 'Invalid stock quantity' }, { status: 400 })
            }
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
        
        // Generate a URL-friendly slug from name and ensure uniqueness
        const generateSlug = (str) => {
            return str
                .toString()
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
        }

        let slug = name ? generateSlug(name) : '';
        // Ensure slug is not empty; if empty use timestamp
        if (!slug) slug = `product-${Date.now()}`;

        // If slug already exists, append short random suffix until unique
        const makeUniqueSlug = async (base) => {
            let candidate = base;
            let exists = await Product.findOne({ slug: candidate }).lean();
            let tries = 0;
            while (exists && tries < 5) {
                const suffix = Math.random().toString(36).slice(2, 6);
                candidate = `${base}-${suffix}`;
                exists = await Product.findOne({ slug: candidate }).lean();
                tries++;
            }
            if (exists) {
                // fallback to timestamp based unique slug
                candidate = `${base}-${Date.now()}`;
            }
            return candidate;
        }

        slug = await makeUniqueSlug(slug);

        // Validate stockQuantity vs minBuy only when stock provided
        const numericMinBuy = parseInt(minBuy) || 1
        if (stockQuantity !== null && stockQuantity !== undefined && stockQuantity !== '') {
            const numericStock = parseInt(stockQuantity) || 0
            if (numericStock < numericMinBuy) {
                return NextResponse.json({ success: false, message: `Stock quantity (${numericStock}) cannot be less than minimum buy quantity (${numericMinBuy})` }, { status: 400 })
            }
        }

        // Parse variants if provided (expected as JSON string)
        let variants = []
        try {
            const variantsRaw = formData.get('variants')
            if (variantsRaw) {
                variants = JSON.parse(variantsRaw)
                // basic validation: should be array
                if (!Array.isArray(variants)) variants = []
            }
        } catch (err) {
            console.warn('Invalid variants JSON, ignoring', err.message)
            variants = []
        }

        // Normalize variant option fields: convert numeric strings to Number, parse colors, include description
        if (Array.isArray(variants) && variants.length > 0) {
            variants = variants.map(group => ({
                ...group,
                options: (group.options || []).map(opt => ({
                    label: opt.label,
                    description: opt.description || '',
                    price: opt.price !== undefined && opt.price !== null && opt.price !== '' ? Number(opt.price) : undefined,
                    priceDelta: opt.priceDelta !== undefined && opt.priceDelta !== null && opt.priceDelta !== '' ? Number(opt.priceDelta) : undefined,
                    // colors: allow comma-separated string -> array of labels
                    colors: typeof opt.colors === 'string' ? opt.colors.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(opt.colors) ? opt.colors : []),
                    color: (opt.colors && typeof opt.colors === 'string' ? (opt.colors.split(',')[0] || '') : (opt.color || ''))
                }))
            }))
        }

        // Parse product-level colors if provided (JSON or comma-separated)
        let colors = []
        try {
            const colorsRaw = formData.get('colors')
            if (colorsRaw) {
                // allow JSON array or comma-separated labels
                try {
                    colors = JSON.parse(colorsRaw)
                    if (!Array.isArray(colors)) colors = []
                } catch (e) {
                    // fallback: comma-separated labels
                    colors = colorsRaw.split(',').map(s => ({ label: s.trim(), color: '' })).filter(c => c.label)
                }
            }
        } catch (e) {
            colors = []
        }

        // Create product with all fields including stockQuantity and minBuy
        const productPayload = {
            userId,
            name,
            description,
            price: Number(price),
            offerPrice: Number(offerPrice),
            // stockQuantity is optional: only include when provided
            
            minBuy: parseInt(minBuy) || 1,
            variants,
            colors,
            image: imageUrls,
            videos: videoUrls,
            slug,
            date: Date.now()
        };
        if (stockQuantity !== null && stockQuantity !== undefined && stockQuantity !== '') {
            productPayload.stockQuantity = parseInt(stockQuantity) || 0;
        }
        if (brand) productPayload.brand = brand;
        if (category) productPayload.category = category;
        if (subcategory) productPayload.subcategory = subcategory;

        const newProduct = await Product.create(productPayload)

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