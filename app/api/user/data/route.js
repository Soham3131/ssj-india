export const dynamic = 'force-dynamic';


import connectDB from "@/config/db";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        console.log("Clerk UserID:", userId) // Debug log

        if (!userId) {
            return NextResponse.json({ success: false, message: "User not authenticated" }, { status: 401 })
        }

        await connectDB()
        
        // Try multiple ways to find the user
        let user = await User.findOne({ _id: userId })
        
        if (!user) {
            // If still not found, create a new user
            user = await User.create({
                _id: userId,
                name: "User",
                email: `${userId}@temp.com`,
                imageUrl: "/default-avatar.png",
                cartItems: {}
            })
        }

        return NextResponse.json({ success: true, user })

    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}