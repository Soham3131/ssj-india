"use client";
import { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";
import React from "react";

const Product = () => {
  const { id } = useParams();
  const { products, router, addToCart, user } = useAppContext();
  const [mainImage, setMainImage] = useState(null);
  const [productData, setProductData] = useState(null);

  useEffect(() => {
    const product = products.find((p) => p._id === id);
    setProductData(product);
    if (product && product.image && product.image.length > 0) {
      setMainImage(product.image[0]);
    }
  }, [id, products]);

  const isOutOfStock = productData?.stockQuantity <= 0;

  if (!productData) return <Loading />;

  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 pt-14 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Left Section: Images & Videos */}
          <div className="px-5 lg:px-16 xl:px-20 space-y-6">
            <div className="rounded-xl overflow-hidden shadow-lg bg-gray-50">
              <Image
                src={mainImage || (productData.image && productData.image[0]) || assets.upload_area}
                alt={productData.name}
                className="w-full h-96 object-contain"
                width={1280}
                height={720}
              />
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-4">
              {productData.image?.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setMainImage(image)}
                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-transform transform hover:scale-105 ${
                    mainImage === image ? "border-[#54B1CE]" : "border-transparent"
                  }`}
                >
                  <Image
                    src={image}
                    alt={productData.name}
                    className="w-full h-20 object-cover"
                    width={200}
                    height={80}
                  />
                </div>
              ))}
            </div>

            {/* Product Videos */}
            {productData.videos && productData.videos.length > 0 ? (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Product Videos</h3>
                {productData.videos.map((video, index) => (
                  <div key={index} className="rounded-lg overflow-hidden bg-gray-100 p-2 shadow-sm">
                    <video controls className="w-full h-64 rounded-lg" preload="metadata">
                      <source src={video} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    <p className="text-center text-sm text-gray-600 mt-2">Video {index + 1}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-center text-gray-500 italic"></div>
            )}
          </div>

          {/* Right Section: Details & Actions */}
          <div className="flex flex-col space-y-6">
            <h1 className="text-4xl font-bold text-gray-800">{productData.name}</h1>

            <p className="text-gray-600 text-sm leading-relaxed">{productData.description}</p>

            <p className="text-3xl font-semibold text-[#54B1CE]">
            ₹{productData.offerPrice}
  {productData.price > productData.offerPrice && (
    <span className="text-gray-400 line-through text-base font-normal ml-3">
      ₹{productData.price}
    </span>
  )}
</p>

            <hr className="border-gray-200" />

            {/* Product Details Table */}
            <div className="overflow-x-auto">
              <table className="table-auto border-collapse w-full text-sm">
                <tbody>
                  <tr>
                    <td className="text-gray-600 font-medium py-2 w-32">Brand</td>
                    <td className="text-gray-800 py-2 pl-4 capitalize">{productData.brand || "Not specified"}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 font-medium py-2">Category</td>
                    <td className="text-gray-800 py-2 pl-4 capitalize">{productData.category || "Not specified"}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 font-medium py-2">Subcategory</td>
                    <td className="text-gray-800 py-2 pl-4 capitalize">{productData.subcategory || "Not specified"}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 font-medium py-2">Availability</td>
                    <td className={`py-2 pl-4 font-medium ${isOutOfStock ? "text-red-600" : "text-green-600"}`}>
                      {isOutOfStock ? "Out of Stock" : "In Stock"}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 font-medium py-2">Stock Left</td>
                    <td className={`py-2 pl-4 font-medium ${productData.stockQuantity <= 5 ? "text-yellow-600" : "text-green-600"}`}>
                      {productData.stockQuantity} units
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Stock Alerts */}
            {productData.stockQuantity <= 5 && productData.stockQuantity > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm font-medium">
                  ⚠️ Only {productData.stockQuantity} left in stock - Order soon!
                </p>
              </div>
            )}
            {isOutOfStock && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm font-medium">❌ This product is currently out of stock</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <button
                onClick={() => addToCart(productData._id)}
                className={`flex-1 py-3.5 rounded-lg font-medium transition ${
                  isOutOfStock ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                }`}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>

              {!isOutOfStock && (
                <button
                  onClick={() => {
                    addToCart(productData._id);
                    user ? router.push("/cart") : router.push("/sign-in");
                  }}
                  className="flex-1 py-3.5 rounded-lg font-medium bg-[#54B1CE] text-white hover:bg-[#3b8bbd] transition"
                >
                  Buy Now
                </button>
              )}
            </div>

            {/* Additional Info */}
            {/* <div className="space-y-3 mt-6">
              <h3 className="text-gray-700 font-semibold">Product Specifications</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Brand:</strong> {productData.brand || "Generic"}
                </p>
                <p>
                  <strong>Category:</strong> {productData.category || "Not categorized"}
                </p>
                <p>
                  <strong>Subcategory:</strong> {productData.subcategory || "Not specified"}
                </p>
                <p>
                  <strong>Stock Status:</strong>{" "}
                  {isOutOfStock ? "Out of Stock" : `${productData.stockQuantity} units available`}
                </p>
                {productData.videos && productData.videos.length > 0 && (
                  <p>
                    <strong>Videos:</strong> {productData.videos.length} available
                  </p>
                )}
              </div>
            </div> */}
          </div>
        </div>

        {/* Related Products */}
        <div className="flex flex-col items-center mt-16 space-y-4">
          <h2 className="text-3xl font-bold text-gray-800">You May Also Like</h2>
          <div className="w-28 h-1 bg-[#54B1CE] mt-1 rounded"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 w-full">
            {products
              .filter((p) => p._id !== id && p.stockQuantity > 0)
              .slice(0, 5)
              .map((product, index) => (
                <ProductCard key={index} product={product} />
              ))}
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 mt-6 border-2 border-[#54B1CE] text-[#54B1CE] rounded-lg hover:bg-[#54B1CE] hover:text-white transition font-medium"
          >
            Browse All Products
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Product;
