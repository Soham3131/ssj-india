'use client'
import React from "react";
import { useAppContext } from "@/context/AppContext";

const Banner = () => {
  const { router } = useAppContext();

  return (
    <div className="relative flex items-center justify-center py-16 px-6 md:px-16 bg-[#f5faff] my-12 rounded-xl overflow-hidden">

      {/* Subtle background glow */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-[#54B1CE]/20 rounded-full blur-3xl -translate-x-16 -translate-y-16"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#54B1CE]/10 rounded-full blur-3xl translate-x-16 translate-y-16"></div>

      {/* Glassmorphism card */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between backdrop-blur-md bg-white/20 border border-white/30 rounded-xl p-8 w-full max-w-5xl shadow-lg">

        {/* Text section */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3 md:w-1/2">
          <h2 className="text-2xl md:text-3xl font-bold text-[#054F77] drop-shadow-sm">
            Wholesale Products at Best Prices
          </h2>
          <p className="text-[#054F77]/80 md:text-base max-w-md drop-shadow-sm">
            Explore a wide range of quality products for your business. Fast delivery, bulk pricing, and trusted service.
          </p>
          <button
            onClick={() => router.push('/all-products')}
            className="mt-4 px-8 py-2 bg-[#54B1CE] rounded-lg text-white font-semibold hover:bg-[#3a8bb8] transition-all shadow-md"
          >
            Explore Now
          </button>
        </div>

        {/* Product image */}
        <div className="mt-6 md:mt-0 md:w-1/2 flex justify-center md:justify-end">
          <img
            src="https://e0.pxfuel.com/wallpapers/237/44/desktop-wallpaper-the-best-mouse-for-designers-9-fantastic-mice-for-design-pros-gaming-mouse.jpg"
            alt="Wholesale Product"
            className="w-40 md:w-56 rounded-lg drop-shadow-xl"
          />
        </div>

      </div>
    </div>
  );
};

export default Banner;
