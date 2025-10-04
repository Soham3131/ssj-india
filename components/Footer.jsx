import React from "react";

const products = [
  { name: "Watches", img: "https://5.imimg.com/data5/SELLER/Default/2024/10/460314639/OL/KI/DV/2895636/nervfit-absolute-2-1-hd-display-bt-smartwatch.jpg" },
  { name: "Earbuds", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfpWkWtAWxuYaxlzLHe2Ecm9FUwwkD2nRZ_zaWQivY_yDqn3mLRPm1Tt3PNBi9CPVxqkY&usqp=CAU" },
  { name: "Chargers", img: "https://rukminim2.flixcart.com/image/260/260/xif0q/battery-charger/1/j/a/adapto-one-por-1103-portronics-original-imaggsg6avxsh5qh.jpeg?q=90&crop=false" },
  { name: "Handsfree", img: "https://i.ebayimg.com/images/g/R90AAOSw53xhj9nT/s-l400.jpg" },
  { name: "Smart Bands", img: "https://images.indianexpress.com/2025/05/Tech-feature-images225.jpg" },
  { name: "Phone Cases", img: "https://i.ebayimg.com/images/g/ik0AAOSwg7Bma752/s-l1200.jpg" },
];

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 text-gray-700 relative py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-32 flex flex-col gap-16">
        {/* Horizontal product scroll */}
        <div className="overflow-hidden">
          <div className="flex gap-8 animate-marquee">
            {[...products, ...products].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center flex-shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden shadow-md border border-gray-200">
                  <img src={item.img} alt={item.name} className="object-cover w-full h-full" />
                </div>
                <span className="mt-2 text-sm font-medium text-gray-800">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About SSJ</h3>
            <p className="text-sm text-gray-600">
              SSJ Wholesalers is a premium supplier of high-quality accessories including watches, earbuds, chargers, handsfree devices, smart bands, and phone cases. Reliable, scalable, and professional service for your business needs.
            </p>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Products</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              {products.map((item, idx) => (
                <li key={idx}>{item.name}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact</h3>
            <p className="text-sm text-gray-600">📞 +91-9289838929</p>
            <p className="text-sm text-gray-600">✉️ business.ssjindia@gmail.com</p>
            <p className="text-sm text-gray-600">📍 Delhi ,India</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 text-center text-xs text-gray-500 border-t border-gray-200">
          © 2025 SSJ India. All Rights Reserved.
        </div>
      </div>

      {/* CSS marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: flex;
          min-width: 200%;
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
