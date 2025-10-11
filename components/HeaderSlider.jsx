'use client'
import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useRouter } from "next/navigation";

const HeaderSlider = () => {
  const router = useRouter();
  const sliderData = [
    {
      id: 1,
      title: "Stock High-Quality Wires and Chargers for Your Store!",
      offer: "Limited Time Wholesale Offer",
      buttonText1: "Shop Now",
      buttonText2: "Explore More",
      imgSrc: assets.header_headphone_image,
    },
    {
      id: 2,
      title: "Upgrade Your Accessories Inventory with Earbuds & Headsets!",
      offer: "Bulk Deals Available",
      buttonText1: "Order Now",
      buttonText2: "View Collection",
      imgSrc: assets.header_playstation_image,
    },
    {
      id: 3,
      title: "Get Essential Office & Gaming Accessories in Bulk Today!",
      offer: "Exclusive Wholesale Discounts",
      buttonText1: "Buy in Bulk",
      buttonText2: "Learn More",
      imgSrc: assets.header_macbook_image,
    },
  ];

  // Your 10 categories with Pexels images
  const categories = [
    { id: 1, name: 'Handsfree', image: 'https://www.geeky-gadgets.com/wp-content/uploads/2014/05/earpods.jpg' },
    { id: 2, name: 'Earbuds', image: 'https://i.pinimg.com/736x/e2/7c/89/e27c89722b03c92d0e2fef16fbc29863.jpg' },
    { id: 3, name: 'Mix Items', image: 'https://img.freepik.com/free-photo/close-up-artist-making-music_23-2149199987.jpg?semt=ais_hybrid&w=740&q=80' },
    { id: 4, name: 'Cables and Chargers', image: 'https://chargingcable.in/cdn/shop/files/1_b5035f15-621e-49aa-843d-ae9ea35a5402_1.jpg?v=1748060807&width=1080' },
    { id: 5, name: 'Battery', image: 'https://www.popsci.com/wp-content/uploads/2020/03/23/hands-holding-phone-with-dead-battery-advisory.jpg?quality=85' },
    { id: 6, name: 'Selfie Sticks', image: 'https://cdn.sanity.io/images/3azemr64/production/0af7b94e8cea2b42968c16720a3ab9011c2d3f58-1024x768.jpg?auto=format&w=873&h=655&crop=center&fit=crop&q=90' },
    { id: 7, name: 'Gift and crockery item', image: 'https://images.pexels.com/photos/7764402/pexels-photo-7764402.jpeg' },
    { id: 8, name: 'Speaker', image: 'https://images.pexels.com/photos/4295360/pexels-photo-4295360.png' }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [sliderData.length]);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
  };

  const handleCategoryClick = (categoryName) => {
    router.push(`/all-products?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="w-full">
      {/* Banner Slider */}
      <div className="overflow-hidden relative w-full">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {sliderData.map((slide, index) => (
            <div
              key={slide.id}
              className="flex flex-col-reverse md:flex-row items-center justify-between bg-[#E6E9F2] py-8 md:px-14 px-5 mt-6 rounded-xl min-w-full"
            >
              <div className="md:pl-8 mt-10 md:mt-0">
                <p className="md:text-base text-[#54B1CE] pb-1 font-medium">{slide.offer}</p>
                <h1 className="max-w-lg md:text-[40px] md:leading-[48px] text-2xl font-semibold text-gray-800">
                  {slide.title}
                </h1>
                <div className="flex items-center mt-4 md:mt-6 gap-4">
                  <button 
                    onClick={() => router.push('/all-products')}
                    className="md:px-10 px-7 md:py-2.5 py-2 bg-[#54B1CE] rounded-full text-white font-medium hover:bg-[#3a9cb8] transition-colors"
                  >
                    {slide.buttonText1}
                  </button>
                  <button 
                    onClick={() => router.push('/all-products')}
                    className="group flex items-center gap-2 px-6 py-2.5 font-medium text-[#54B1CE] border border-[#54B1CE] rounded-full hover:bg-[#54B1CE] hover:text-white transition-colors"
                  >
                    {slide.buttonText2}
                    <Image
                      className="group-hover:translate-x-1 transition"
                      src={assets.arrow_icon}
                      alt="arrow_icon"
                    />
                  </button>
                </div>
              </div>
              <div className="flex items-center flex-1 justify-center">
                <Image
                  className="md:w-72 w-48"
                  src={slide.imgSrc}
                  alt={`Slide ${index + 1}`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          {sliderData.map((_, index) => (
            <div
              key={index}
              onClick={() => handleSlideChange(index)}
              className={`h-2 w-2 rounded-full cursor-pointer ${
                currentSlide === index ? "bg-[#54B1CE]" : "bg-gray-500/30"
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="mt-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Shop by Category</h2>
          <p className="text-gray-600 mt-2">Explore our wide range of electronic accessories</p>
          <div className="w-24 h-1 bg-[#54B1CE] rounded-full mt-2 mx-auto"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category.name)}
              className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-[#54B1CE] overflow-hidden"
            >
              <div className="p-4 text-center">
                <div className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 overflow-hidden border-2 border-gray-200 group-hover:border-[#54B1CE]">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-gray-800 group-hover:text-[#54B1CE] transition-colors">
                  {category.name}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 bg-gray-50 rounded-lg p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#54B1CE]">1000+</div>
            <div className="text-gray-600">Products Available</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#54B1CE]">50+</div>
            <div className="text-gray-600">Brands</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#54B1CE]">24/7</div>
            <div className="text-gray-600">Customer Support</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderSlider;