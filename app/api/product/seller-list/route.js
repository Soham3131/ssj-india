import connectDB from '@/config/db'
import authSeller from '@/lib/authSeller'
import Product from '@/models/Product'
import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// Helper function to upload file to Cloudinary
const uploadToCloudinary = async (file, folder) => {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                resource_type: file.type.startsWith('video') ? 'video' : 'image',
                folder: folder
            },
            (error, result) => {
                if (error) reject(error)
                else resolve(result)
            }
        ).end(buffer)
    })
}

// Helper function to delete from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, 
            { resource_type: resourceType }, 
            (error, result) => {
                if (error) reject(error)
                else resolve(result)
            }
        )
    })
}

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
    const matches = url.match(/\/([^\/]+)\.[^\/]+$/)
    return matches ? matches[1].split('.')[0] : null
}

// GET - List seller's products with search
export async function GET(request) {
    try {
        const { userId } = getAuth(request)

        const isSeller = await authSeller(userId)
        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 })
        }

        await connectDB()

        // Get search query from URL parameters
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''

        // Build query - only get products belonging to this seller
        let query = { userId: userId }
        
        // Add search functionality
        if (search.trim()) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { subcategory: { $regex: search, $options: 'i' } }
            ]
        }

        const products = await Product.find(query).sort({ date: -1 })
        
        return NextResponse.json({ 
            success: true, 
            products,
            total: products.length
        })

    } catch (error) {
        console.error('Seller products error:', error)
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}

// PUT - Update a product with image/video handling
export async function PUT(request) {
    try {
        const { userId } = getAuth(request)

        const isSeller = await authSeller(userId)
        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const productId = formData.get('productId')

        if (!productId) {
            return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 })
        }

        await connectDB()

        // Check if product belongs to this seller
        const existingProduct = await Product.findOne({ _id: productId, userId: userId })
        if (!existingProduct) {
            return NextResponse.json({ success: false, message: 'Product not found or not authorized' }, { status: 404 })
        }

        // Prepare updates - start with existing product data
        const updates = {
            name: existingProduct.name,
            description: existingProduct.description,
            price: existingProduct.price,
            offerPrice: existingProduct.offerPrice,
            category: existingProduct.category,
            brand: existingProduct.brand,
            subcategory: existingProduct.subcategory,
            image: [...existingProduct.image], // Copy existing images
            video: existingProduct.video
        }

        // Update basic fields. For category/brand/subcategory only overwrite when a non-empty value is provided
    // Note: handle stockQuantity separately so an empty string doesn't overwrite existing stock with 0
    const fields = ['name', 'description', 'price', 'offerPrice', 'category', 'brand', 'subcategory']
        const optionalTextFields = ['category', 'brand', 'subcategory']
        fields.forEach(field => {
            const value = formData.get(field)
            if (value !== null) {
                // For category/brand/subcategory: only set when non-empty (trimmed)
                if (optionalTextFields.includes(field)) {
                    if (typeof value === 'string' && value.trim() !== '') {
                        updates[field] = value
                    }
                    // if empty string or whitespace, leave existing value unchanged
                } else {
                    updates[field] = field.includes('price') ? Number(value) : value
                }
            }
        })
        // Handle minBuy
        const minBuyValue = formData.get('minBuy')
        if (minBuyValue !== null) {
            updates.minBuy = Number(minBuyValue) || 1
        }

        // If seller provided a number for stockQuantity, validate and update; if they provided clearStock flag, unset stockQuantity (make unlimited)
        const stockValue = formData.get('stockQuantity')
        const clearStock = formData.get('clearStock')
        if (clearStock === 'true') {
            // mark to remove stockQuantity from document
            updates._unsetStock = true
        } else if (stockValue !== null && stockValue !== '') {
            const numericStock = Number(stockValue)
            const numericMin = updates.minBuy || existingProduct.minBuy || 1
            if (isNaN(numericStock) || numericStock < numericMin) {
                return NextResponse.json({ success: false, message: `Stock quantity (${numericStock}) cannot be less than minimum buy quantity (${numericMin})` }, { status: 400 })
            }
            updates.stockQuantity = numericStock
        }

        // If name changed or slug missing, generate a new slug and ensure uniqueness
        const generateSlug = (str) => {
            return str
                .toString()
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
        }

        if (formData.get('name') !== null) {
            const base = generateSlug(formData.get('name')) || `product-${Date.now()}`
            let candidate = base
            let exists = await Product.findOne({ slug: candidate, _id: { $ne: productId } }).lean()
            let tries = 0
            while (exists && tries < 5) {
                const suffix = Math.random().toString(36).slice(2, 6)
                candidate = `${base}-${suffix}`
                exists = await Product.findOne({ slug: candidate, _id: { $ne: productId } }).lean()
                tries++
            }
            if (exists) candidate = `${base}-${Date.now()}`
            updates.slug = candidate
        } else if (!existingProduct.slug) {
            // Ensure existing products without slug get one
            const base = generateSlug(existingProduct.name) || `product-${Date.now()}`
            updates.slug = await (async (b) => {
                let c = b
                let e = await Product.findOne({ slug: c, _id: { $ne: productId } }).lean()
                let t = 0
                while (e && t < 5) {
                    const s = Math.random().toString(36).slice(2, 6)
                    c = `${b}-${s}`
                    e = await Product.findOne({ slug: c, _id: { $ne: productId } }).lean()
                    t++
                }
                if (e) c = `${b}-${Date.now()}`
                return c
            })(base)
        }

        // Handle image deletions
        const imagesToDelete = formData.getAll('imagesToDelete')
        if (imagesToDelete.length > 0) {
            // Remove deleted images from the updates array
            updates.image = updates.image.filter(img => !imagesToDelete.includes(img))
            
            // Delete images from Cloudinary
            for (const imageUrl of imagesToDelete) {
                try {
                    const publicId = getPublicIdFromUrl(imageUrl)
                    if (publicId) {
                        await deleteFromCloudinary(publicId, 'image')
                    }
                } catch (error) {
                    console.error('Error deleting image from Cloudinary:', error)
                    // Continue with update even if Cloudinary deletion fails
                }
            }
        }

        // Handle video deletion
        const deleteVideo = formData.get('deleteVideo')
        if (deleteVideo === 'true' && updates.video) {
            try {
                const publicId = getPublicIdFromUrl(updates.video)
                if (publicId) {
                    await deleteFromCloudinary(publicId, 'video')
                }
            } catch (error) {
                console.error('Error deleting video from Cloudinary:', error)
                // Continue with update even if Cloudinary deletion fails
            }
            updates.video = null
        }

        // Handle new image uploads
        const newImages = formData.getAll('images')
        if (newImages.length > 0) {
            const uploadedImages = []
            
            for (const imageFile of newImages) {
                if (imageFile instanceof File) {
                    try {
                        const result = await uploadToCloudinary(imageFile, 'products/images')
                        uploadedImages.push(result.secure_url)
                    } catch (error) {
                        console.error('Error uploading image to Cloudinary:', error)
                        throw new Error(`Failed to upload image: ${error.message}`)
                    }
                }
            }
            
            // Add new images to existing ones
            updates.image = [...updates.image, ...uploadedImages]
        }

        // Handle new video upload
        const newVideo = formData.get('video')
        if (newVideo instanceof File) {
            // Delete old video if exists
            if (updates.video) {
                try {
                    const publicId = getPublicIdFromUrl(updates.video)
                    if (publicId) {
                        await deleteFromCloudinary(publicId, 'video')
                    }
                } catch (error) {
                    console.error('Error deleting old video from Cloudinary:', error)
                    // Continue with new video upload
                }
            }
            
            try {
                const result = await uploadToCloudinary(newVideo, 'products/videos')
                updates.video = result.secure_url
            } catch (error) {
                console.error('Error uploading video to Cloudinary:', error)
                throw new Error(`Failed to upload video: ${error.message}`)
            }
        }

        // Validate that we have at least one image
        if (updates.image.length === 0) {
            return NextResponse.json({ 
                success: false, 
                message: 'At least one product image is required' 
            }, { status: 400 })
        }

        // Parse variants/colors from formData if provided
        try {
            const variantsRaw = formData.get('variants')
            if (variantsRaw) {
                try {
                    const parsed = JSON.parse(variantsRaw)
                    if (Array.isArray(parsed)) {
                        // normalize options
                        updates.variants = parsed.map(group => ({
                            ...group,
                            options: (group.options || []).map(opt => ({
                                label: opt.label,
                                description: opt.description || '',
                                price: opt.price !== undefined && opt.price !== null && opt.price !== '' ? Number(opt.price) : undefined,
                                priceDelta: opt.priceDelta !== undefined && opt.priceDelta !== null && opt.priceDelta !== '' ? Number(opt.priceDelta) : undefined,
                                colors: typeof opt.colors === 'string' ? opt.colors.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(opt.colors) ? opt.colors : []),
                                color: (opt.colors && typeof opt.colors === 'string' ? (opt.colors.split(',')[0] || '') : (opt.color || ''))
                            }))
                        }))
                    }
                } catch (err) {
                    // ignore invalid variants
                }
            }
        } catch (e) {
            // ignore invalid variants
        }

        try {
            const colorsRaw = formData.get('colors')
            if (colorsRaw) {
                try {
                    const parsedColors = JSON.parse(colorsRaw)
                    if (Array.isArray(parsedColors)) updates.colors = parsedColors
                } catch (e) {
                    // fallback comma-separated
                    updates.colors = colorsRaw.split(',').map(s => ({ label: s.trim(), color: '' })).filter(c => c.label)
                }
            }
        } catch (e) {
            // ignore
        }

        // Update the product in database
        // Apply update: if _unsetStock marker present, unset stockQuantity explicitly
        const updateOps = { ...updates }
        let finalOptions = { new: true, runValidators: true }
        if (updateOps._unsetStock) {
            delete updateOps._unsetStock
            // Build a $unset update combined with other fields
            const setFields = { ...updateOps }
            const unsetFields = { stockQuantity: "" }
            const mongoUpdate = { $set: setFields, $unset: unsetFields }
            const updatedProduct = await Product.findByIdAndUpdate(productId, mongoUpdate, finalOptions)
            return NextResponse.json({ 
                success: true, 
                message: 'Product updated successfully', 
                product: updatedProduct 
            })
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            updates,
            finalOptions
        )

        return NextResponse.json({ 
            success: true, 
            message: 'Product updated successfully', 
            product: updatedProduct 
        })

    } catch (error) {
        console.error('Update product error:', error)
        return NextResponse.json({ 
            success: false, 
            message: error.message || 'Failed to update product' 
        }, { status: 500 })
    }
}

// DELETE - Delete a product and its media
export async function DELETE(request) {
    try {
        const { userId } = getAuth(request)

        const isSeller = await authSeller(userId)
        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('id')

        if (!productId) {
            return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 })
        }

        await connectDB()

        // Check if product belongs to this seller
        const existingProduct = await Product.findOne({ _id: productId, userId: userId })
        if (!existingProduct) {
            return NextResponse.json({ success: false, message: 'Product not found or not authorized' }, { status: 404 })
        }

        // Delete media from Cloudinary
        try {
            // Delete all images
            for (const imageUrl of existingProduct.image) {
                const publicId = getPublicIdFromUrl(imageUrl)
                if (publicId) {
                    await deleteFromCloudinary(publicId, 'image')
                }
            }
            
            // Delete video if exists
            if (existingProduct.video) {
                const publicId = getPublicIdFromUrl(existingProduct.video)
                if (publicId) {
                    await deleteFromCloudinary(publicId, 'video')
                }
            }
        } catch (error) {
            console.error('Error deleting media from Cloudinary:', error)
            // Continue with database deletion even if Cloudinary deletion fails
        }

        // Delete the product from database
        await Product.findByIdAndDelete(productId)

        return NextResponse.json({ 
            success: true, 
            message: 'Product deleted successfully' 
        })

    } catch (error) {
        console.error('Delete product error:', error)
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}