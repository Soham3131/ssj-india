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
import { useUser } from "@clerk/nextjs";

const Product = () => {
  const { id } = useParams();
  const { products, router, addToCart, cartItems } = useAppContext();
  const { isSignedIn } = useUser();
  const [mainImage, setMainImage] = useState(null);
  const [productData, setProductData] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [computedPrice, setComputedPrice] = useState(null);

  useEffect(() => {
    const product = products.find((p) => p._id === id);
    setProductData(product);
    if (product && product.image && product.image.length > 0) {
      setMainImage(product.image[0]);
    }
    // initialize variant selections when product loads
    // Do NOT auto-select first option — selection should be optional for the buyer
      if (product && Array.isArray(product.variants) && product.variants.length > 0) {
        // Auto-select first option for every variant group so variants are preselected and cannot be unselected
        const init = {};
        product.variants.forEach(group => {
          const firstOpt = (group.options && group.options.length > 0) ? group.options[0] : null;
          init[group.name] = firstOpt;
        });
        setSelectedOptions(init);
      } else {
        setSelectedOptions({});
      }
      // If product has product-level colors, auto-select the first color and set main image accordingly
      if (product && Array.isArray(product.colors) && product.colors.length > 0) {
        setSelectedOptions(prev => ({ ...prev, _productColor: product.colors[0] }));
        try {
          const c = product.colors[0];
          // color may reference an image index (1-based). Be defensive when computing index.
          let imgIdx = null;
          if (c && (c.imageIndex !== undefined && c.imageIndex !== null)) {
            imgIdx = Number(c.imageIndex);
          } else if (c && (c.imageSlot !== undefined && c.imageSlot !== null)) {
            imgIdx = Number(c.imageSlot);
          }
          if (!Number.isNaN(imgIdx) && product.image && product.image.length > 0) {
            // if imageIndex seems 1-based (common in uploader), subtract 1; otherwise ensure in-range
            const candidateIndex = imgIdx > 0 ? imgIdx - 1 : imgIdx;
            const idx = Math.max(0, Math.min(candidateIndex, product.image.length - 1));
            setMainImage(product.image[idx]);
          }
        } catch (e) {
          // ignore any parsing errors
        }
      }
  }, [id, products]);

  // compute price whenever selection changes
  useEffect(() => {
    if (!productData) return;
    // Pricing rules:
    // - If any selected option provides an absolute `price`, treat those as candidate bases and pick the highest absolute price as base.
    // - Otherwise use product.offerPrice as base.
    // - After choosing base, add any priceDelta values from selected options (additive adjustments).
    let base = Number(productData.offerPrice || productData.price || 0);
    const selected = selectedOptions && Object.keys(selectedOptions).length > 0 ? Object.values(selectedOptions) : [];
    const absolutePrices = selected.map(o => (o && o.price !== undefined && o.price !== null ? Number(o.price) : null)).filter(v => v !== null && !Number.isNaN(v));
    if (absolutePrices.length > 0) {
      base = Math.max(...absolutePrices);
    }
    // Add additive deltas
    selected.forEach((opt) => {
      if (!opt) return;
      const delta = Number(opt.priceDelta || 0) || 0;
      base += delta;
    });
    setComputedPrice(Math.floor(base * 100) / 100);
  }, [productData, selectedOptions]);

  // Determine out-of-stock: robustly resolve selected option per variant group. Treat missing option stock as unlimited.
  // Compare against required quantity (productData.minBuy or 1) so selections that need more than available are marked out.
  // Compute requiredQty in component scope so option rendering can use it
  let requiredQty = 1;
  if (productData) {
    requiredQty = productData.minBuy && Number(productData.minBuy) > 0 ? Number(productData.minBuy) : 1;
    try {
      const encoded = encodeURIComponent(JSON.stringify(selectedOptions || {}));
      const cartKey = `${productData._id}::${encoded}`;
      if (cartItems && cartItems[cartKey]) {
        requiredQty = Number(cartItems[cartKey]) || requiredQty;
      }
    } catch (e) {
      // ignore
    }
  }

  // isOutOfStock: decide availability based on option-level numeric stocks when present,
  // otherwise fall back to product-level stock. Missing/blank stocks are treated as unlimited.
  const isOutOfStock = (() => {
    if (!productData) return true;

    // If there are variants, try to resolve the selected option for each group and collect option-level stocks that are defined.
    if (productData.variants && productData.variants.length > 0) {
      const definedStocks = [];
      productData.variants.forEach((group) => {
        // First try direct key-based selection
        let selected = null;
        if (group.name && selectedOptions && selectedOptions[group.name]) {
          selected = selectedOptions[group.name];
        }

        // If not found, attempt to match by label among selectedOptions values (handles mismatched keys)
        if (!selected && selectedOptions) {
          const vals = Object.values(selectedOptions).filter(Boolean);
          for (const v of vals) {
            if (!v) continue;
            // match by label
            if (group.options && group.options.some(o => String(o.label) === String(v.label))) {
              selected = v;
              break;
            }
          }
        }

        // If we found a selected option and it has stock defined, record it
        if (selected && selected.stock !== undefined && selected.stock !== null && selected.stock !== '') {
          const s = Number(selected.stock);
          if (!Number.isNaN(s)) definedStocks.push(s);
        }
      });

      // If any option-level stocks were defined, product is out of stock when the smallest available stock is less than requiredQty
      if (definedStocks.length > 0) {
        return Math.min(...definedStocks) < requiredQty;
      }

      // If no option-level numeric stock was defined for selected options, treat the selection as unlimited.
      // Do NOT fall back to product-level stock when variants are selected but option stocks are intentionally left blank.
      return false;
    }

    // If product-level stockQuantity is undefined/null/empty, consider it as unlimited (not out of stock)
    if (productData.stockQuantity === undefined || productData.stockQuantity === null || productData.stockQuantity === '') {
      return false;
    }

    return Number(productData.stockQuantity) < requiredQty;
  })();

  // Color selection requirement: only require product-level color selection if product has colors
  const isColorSelectionSatisfied = () => {
    if (!productData) return true;
    if (productData.colors && productData.colors.length > 0) {
      // product-level selection is stored on selectedOptions._productColor
      return !!(selectedOptions && selectedOptions._productColor);
    }
    return true;
  }

  const canAddToCart = !isOutOfStock && isColorSelectionSatisfied();

  // Simple handlers - agar user login nahi hai toh show message
  const handleAddToCart = () => {
    if (!isSignedIn) {
      alert("Please login to add items to cart. Click on the account icon in navbar to login.");
      return;
    }
    if (!isColorSelectionSatisfied()) return;
    addToCart(productData._id, selectedOptions);
  };

  const handleBuyNow = () => {
    if (!isSignedIn) {
      alert("Please login to buy now. Click on the account icon in navbar to login.");
      return;
    }
    if (!isColorSelectionSatisfied()) return;
    addToCart(productData._id, selectedOptions);
    router.push("/cart");
  };

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
              ₹{computedPrice ?? productData.offerPrice}
            </p>

            {/* Variant selection UI */}
            {productData.variants && productData.variants.length > 0 && (
              <div className="space-y-4 mt-3">
                {productData.variants.map((group, gi) => (
                  <div key={gi} className="">
                    <div className="text-sm font-medium text-gray-700 mb-2">{group.name || `Option ${gi + 1}`}</div>
                    <div className="flex flex-wrap gap-2">
                      {(group.options || []).map((opt, oi) => {
                        const selected = selectedOptions[group.name] && selectedOptions[group.name].label === opt.label;
                        const hasFiniteStock = (opt.stock !== undefined && opt.stock !== null && opt.stock !== '' && Number.isFinite(Number(opt.stock)));
                        const disabled = hasFiniteStock ? (Number(opt.stock) < requiredQty) : false;
                        return (
                          <button
                            key={oi}
                            type="button"
                            onClick={() => {
                              // Require selection: selecting an option sets it; clicking the same option does NOT deselect
                              const copy = { ...selectedOptions };
                              copy[group.name] = opt;
                              setSelectedOptions(copy);
                            }}
                            disabled={disabled}
                            className={`px-3 py-2 border rounded ${selected ? 'border-[#54B1CE] bg-[#E6F7FB]' : 'bg-white'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow'} text-sm text-left flex flex-col items-start gap-1 w-44`}
                          >
                            <div className="font-medium">{opt.label}</div>
                            {opt.description ? <div className="text-xs text-gray-500">{opt.description}</div> : null}
                            <div className="text-xs text-gray-600">
                              {opt.priceDelta ? (Number(opt.priceDelta) >= 0 ? `+₹${opt.priceDelta}` : `-₹${Math.abs(opt.priceDelta)}`) : null}
                              {opt.price ? <span className="text-indigo-600 ml-1">{opt.price ? `(Price: ₹${opt.price})` : null}</span> : null}
                            </div>

                            {/* Show colors for this option if provided - render as a separate row */}
                            {/* Variant-level colors removed from buyer UI */}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

              {/* Product-level Colors (when product has colors array) */}
                    {productData.colors && productData.colors.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Colors</div>
                  <div className="flex flex-wrap gap-2">
                    {productData.colors.map((c, idx) => {
                      const active = selectedOptions._productColor && selectedOptions._productColor.label === c.label;
                      return (
                        <button key={idx} type="button" onClick={() => {
                          // Non-toggle: selecting a color always sets it (buyers cannot deselect) and swaps main image
                          setSelectedOptions(prev => ({ ...prev, _productColor: c }));
                          try {
                            let imgIdx = null;
                            if (c && (c.imageIndex !== undefined && c.imageIndex !== null)) imgIdx = Number(c.imageIndex);
                            else if (c && (c.imageSlot !== undefined && c.imageSlot !== null)) imgIdx = Number(c.imageSlot);
                            if (!Number.isNaN(imgIdx) && productData.image && productData.image.length > 0) {
                              const candidateIndex = imgIdx > 0 ? imgIdx - 1 : imgIdx;
                              const i = Math.max(0, Math.min(candidateIndex, productData.image.length - 1));
                              setMainImage(productData.image[i]);
                            }
                          } catch (e) {
                            // ignore
                          }
                        }} className={`px-3 py-1 border rounded ${active ? 'border-[#54B1CE] bg-[#E6F7FB]' : 'bg-white'} text-sm flex items-center gap-2`}>
                          <span className="inline-block w-5 h-5 rounded-full border" style={{ backgroundColor: c.color || c.label }} />
                          <span>{c.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

            {/* Minimum Buy Info */}
            {productData.minBuy && Number(productData.minBuy) > 1 && (
              <div className="text-sm text-gray-600 mt-1">
                Minimum order quantity for this product is <strong>{productData.minBuy}</strong> units.
              </div>
            )}

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
                    {!(productData.stockQuantity === undefined || productData.stockQuantity === null || productData.stockQuantity === '') && (
                      <tr>
                        <td className="text-gray-600 font-medium py-2">Stock Left</td>
                        <td className={`py-2 pl-4 font-medium ${Number(productData.stockQuantity) <= 5 ? "text-yellow-600" : "text-green-600"}`}>
                          {productData.stockQuantity}
                        </td>
                      </tr>
                    )}
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
                onClick={handleAddToCart}
                className={`flex-1 py-3.5 rounded-lg font-medium transition ${
                  (!canAddToCart || isOutOfStock) ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                }`}
                disabled={(!canAddToCart || isOutOfStock) && isSignedIn}
              >
                {!isSignedIn ? "Login to Add to Cart" : 
                 (!canAddToCart || isOutOfStock) ? "Cannot add to cart" : 
                 (productData.minBuy && Number(productData.minBuy) > 1 ? `Add to Cart (Min ${productData.minBuy})` : "Add to Cart")}
              </button>

              <button
                onClick={handleBuyNow}
                className={`flex-1 py-3.5 rounded-lg font-medium transition ${(!canAddToCart || isOutOfStock) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#54B1CE] text-white hover:bg-[#3b8bbd]'}`}
                disabled={(!canAddToCart || isOutOfStock) && isSignedIn}
              >
                {!isSignedIn ? "Login to Buy Now" : "Buy Now"}
              </button>
            </div>

            {/* Color requirement warning when selection not satisfied */}
            {!isColorSelectionSatisfied() && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-sm">Please select a color for all required groups before adding to cart.</p>
              </div>
            )}

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