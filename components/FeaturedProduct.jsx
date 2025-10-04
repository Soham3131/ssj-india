'use client'
import React from "react";

const useCases = [
  {
    id: 1,
    title: "Mobile Shops",
    description: "Bulk mobile accessories for retail shops",
    icon: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bW9iaWxlJTIwcGhvbmV8ZW58MHx8MHx8fDA%3D",
  },
  {
    id: 2,
    title: "Bike Accessories Retailers",
    description: "Wires, stands, and hands-free devices for bike shops",
    icon: "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?cs=srgb&dl=pexels-nicholas-dias-1119542-2116475.jpg&fm=jpg",
  },
  {
    id: 3,
    title: "Office Supplies",
    description: "Bulk keyboards, mice, and chargers for office setups",
    icon: "https://images.pexels.com/photos/265072/pexels-photo-265072.jpeg?cs=srgb&dl=pexels-pixabay-265072.jpg&fm=jpg",
  },
  {
    id: 4,
    title: "E-commerce Sellers",
    description: "Ready-to-ship accessories for online stores",
    icon: "https://images.pexels.com/photos/7974/pexels-photo.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500",
  },
];

const FlowDiagram = () => {
  return (
    <div className="bg-white py-16 px-6 md:px-16 lg:px-32 overflow-x-hidden">
      <h2 className="text-3xl font-bold text-center text-[#54B1CE]">
        How Our Accessories Can Help You
      </h2>
      <p className="text-center mt-2 text-gray-600">
        Explore use cases and find products suited for your business
      </p>

      {/* Flow Container */}
      <div className="flex flex-row md:flex-row justify-start items-center mt-12 gap-16 overflow-x-auto scrollbar-hide relative">
        {useCases.map((useCase, index) => (
          <div
            key={useCase.id}
            className="flex flex-col items-center relative group animate-fade-in"
            style={{ animationDelay: `${index * 0.3}s` }}
          >
            {/* Icon with bounce */}
            <div className="bg-[#54B1CE] w-20 h-20 rounded-full flex items-center justify-center mb-4 overflow-hidden transform transition-transform duration-500 group-hover:scale-110 group-hover:animate-bounce">
              <img
                src={useCase.icon}
                alt={useCase.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title */}
            <p className="font-semibold text-lg text-[#54B1CE] text-center">
              {useCase.title}
            </p>

            {/* Description */}
            <p className="text-center text-gray-600 mt-2 max-w-xs">
              {useCase.description}
            </p>

            {/* Animated Connector Arrow */}
            {index !== useCases.length - 1 && (
              <div className="absolute top-10 md:top-10 left-full md:left-auto md:right-[-90px] w-24 h-1 flex items-center justify-start">
                <div className="w-full h-1 relative overflow-hidden rounded">
                  <div className="h-1 w-full bg-gradient-to-r from-[#54B1CE] via-white to-[#54B1CE] animate-gradient-move absolute"></div>
                  <div className="w-4 h-4 rotate-45 border-t-2 border-r-2 border-[#54B1CE] absolute right-0 -top-1/2"></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tailwind Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease forwards;
        }

        @keyframes gradientMove {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-gradient-move {
          animation: gradientMove 1.5s linear infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce {
          animation: bounce 0.5s ease infinite;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default FlowDiagram;
