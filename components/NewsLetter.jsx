import React from "react";

const NewsLetter = () => {
  return (
    <div className="relative flex flex-col items-center justify-center text-center py-20 bg-white overflow-hidden">
      {/* Subtle animated radial gradient behind the circle */}
      <div className="absolute w-80 h-80 md:w-96 md:h-96 rounded-full bg-gradient-to-r from-[#54B1CE]/20 via-white/0 to-[#54B1CE]/20 animate-pulse-slow z-0"></div>

      {/* Circular CTA */}
      <div className="relative flex flex-col items-center justify-center w-72 h-72 md:w-96 md:h-96 rounded-full bg-white border-2 border-[#54B1CE] shadow-xl z-10 p-6">
        <h1 className="text-2xl md:text-4xl font-bold text-[#054b6d] leading-snug">
          Subscribe now & get 20% off
        </h1>
        <p className="text-gray-500/80 mt-4 text-sm md:text-base max-w-xs">
          Join our newsletter to get exclusive offers on premium accessories — watches, earbuds, chargers, handsfree devices, and more.
        </p>
      </div>

      {/* Input + Button */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-10 w-full max-w-xl z-10">
        <input
          className="border border-gray-300 rounded-md md:rounded-r-none h-12 px-4 w-full outline-none focus:ring-2 focus:ring-[#54B1CE]"
          type="email"
          placeholder="Enter your email"
        />
        <button className="h-12 px-8 md:px-12 bg-[#54B1CE] text-white font-semibold rounded-md md:rounded-l-none hover:bg-[#3a8bbd] transition">
          Subscribe
        </button>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NewsLetter;
