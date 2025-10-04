// components/HomeProducts.js
'use client';
import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";

const HomeProducts = ({ searchKeyword = "" }) => {
  const { products, fetchProductData, router } = useAppContext();
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  console.log("📦 HomeProducts rendering - products count:", products.length);
  console.log("📦 Products data:", products);

  // Refetch on mount and order events
  useEffect(() => {
    console.log("🏠 HomeProducts mounted - fetching products");
    fetchProductData();

    const handleOrderPlaced = () => {
      console.log("🎯 Order placed event received - refetching");
      fetchProductData();
      setLastUpdate(Date.now()); // Force re-render
    };

    const handleProductsUpdated = () => {
      console.log("🔄 Products updated event received");
      fetchProductData();
      setLastUpdate(Date.now());
    };

    window.addEventListener("orderPlaced", handleOrderPlaced);
    window.addEventListener("productsUpdated", handleProductsUpdated);
    
    return () => {
      window.removeEventListener("orderPlaced", handleOrderPlaced);
      window.removeEventListener("productsUpdated", handleProductsUpdated);
    };
  }, [fetchProductData]);

  // Add a manual refresh function
  const handleManualRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    fetchProductData();
    setLastUpdate(Date.now());
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  console.log("🔍 Filtered products:", filteredProducts.length);

  return (
    <div className="flex flex-col items-center pt-14 w-full">
      <div className="flex justify-between items-center w-full mb-4">
        <p className="text-2xl font-medium">Popular products</p>
        <button 
          onClick={handleManualRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Products
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 pb-14 w-full">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard key={`${product._id}-${lastUpdate}`} product={product} />
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center mt-8">
            {products.length === 0 ? "Loading products..." : "No products found."}
          </p>
        )}
      </div>

      <button
        onClick={() => router.push("/all-products")}
        className="px-12 py-2.5 border rounded text-gray-500/70 hover:bg-slate-50/90 transition"
      >
        See more
      </button>
    </div>
  );
};

export default HomeProducts;