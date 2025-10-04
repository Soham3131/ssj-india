"use client";
import React from "react";
import { useAppContext } from "@/context/AppContext";

const Navbar = () => {
  const { router } = useAppContext();

  return (
    <div className="flex items-center px-4 md:px-8 py-3 justify-between border-b bg-white">
      {/* SSJ Logo */}
      <div
        onClick={() => router.push("/")}
        className="cursor-pointer flex items-center gap-2"
      >
        <div className="w-10 h-10 flex items-center justify-center rounded-md bg-[#54B1CE] text-white font-bold text-lg">
          SSJ
        </div>
      </div>

      {/* Right side can be empty or add buttons later */}
      <div></div>
    </div>
  );
};

export default Navbar;
