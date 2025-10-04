import connectDB from '@/config/db'
import Product from '@/models/Product'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB()

        const products = await Product.find({})
        
        // Simple headers - remove CDN headers
        const response = NextResponse.json({ success: true, products });
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        
        return response;

    } catch (error) {
        const response = NextResponse.json({ success: false, message: error.message });
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        return response;
    }
}