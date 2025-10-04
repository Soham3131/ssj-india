import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="w-full bg-white border-t border-gray-200 px-6 md:px-16 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
      
      {/* Left Section: Logo + Copyright */}
      <div className="flex items-center gap-4">
        {/* SSJ Logo */}
        <div className="w-10 h-10 flex items-center justify-center rounded-md bg-[#54B1CE] text-white font-bold text-lg cursor-pointer">
          SSJ
        </div>
        <div className="hidden md:block h-7 w-px bg-gray-300"></div>
        <p className="text-xs md:text-sm text-gray-500">
          © 2025 SSJ. All Rights Reserved.
        </p>
      </div>

      {/* Right Section: Social Icons */}
      <div className="flex items-center gap-3">
        <a href="#" className="hover:opacity-80 transition">
          <Image src={assets.facebook_icon} alt="facebook_icon" width={24} height={24} />
        </a>
        <a href="#" className="hover:opacity-80 transition">
          <Image src={assets.twitter_icon} alt="twitter_icon" width={24} height={24} />
        </a>
        <a href="#" className="hover:opacity-80 transition">
          <Image src={assets.instagram_icon} alt="instagram_icon" width={24} height={24} />
        </a>
      </div>

    </footer>
  );
};

export default Footer;
