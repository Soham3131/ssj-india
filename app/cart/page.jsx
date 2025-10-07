'use client'
import React from "react";
import { assets } from "@/assets/assets";
import OrderSummary from "@/components/OrderSummary";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { useAppContext } from "@/context/AppContext";

const Cart = () => {
  const { products, router, cartItems, addToCart, updateCartQuantity, getCartCount } = useAppContext();

  return (
    <>
      <Navbar />
      <div className="flex flex-col md:flex-row gap-10 px-6 md:px-16 lg:px-32 pt-14 mb-20">
        
        {/* Cart Items Section */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8 border-b border-gray-300 pb-6">
            <p className="text-2xl md:text-3xl text-gray-700">
              Your <span className="font-medium text-[#54B1CE]">Cart</span>
            </p>
            <p className="text-lg md:text-xl text-gray-500/80">{getCartCount()} Items</p>
          </div>

          <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full table-auto">
              <thead className="bg-[#54B1CE]/10 text-left">
                <tr>
                  <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">Product Details</th>
                  <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">Price</th>
                  <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">Quantity</th>
                  <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(cartItems).map((rawKey) => {
                  // rawKey may be 'productId' or 'productId::encodedSelection'
                  const parts = rawKey.split('::');
                  const productId = parts[0];
                  const selectionEncoded = parts.length > 1 ? parts.slice(1).join('::') : null;
                  const product = products.find(p => p._id === productId);
                  if (!product || cartItems[rawKey] <= 0) return null;

                  // Parse selection for display (best-effort)
                  let selection = null;
                  if (selectionEncoded) {
                    try {
                      selection = JSON.parse(decodeURIComponent(selectionEncoded));
                    } catch (e) {
                      selection = null;
                    }
                  }

                  // Compute unit price using selectedOptions semantics
                  const computeUnitPrice = (product, sel) => {
                    let unit = Number(product?.offerPrice || product?.price || 0);
                    try {
                      const selected = Array.isArray(sel) ? sel : (sel && typeof sel === 'object' ? Object.values(sel) : []);
                      const absolutePrices = selected.map(o => (o && o.price !== undefined && o.price !== null ? Number(o.price) : null)).filter(v => v !== null && !Number.isNaN(v));
                      if (absolutePrices.length > 0) {
                        unit = Math.max(...absolutePrices);
                      }
                      selected.forEach((opt) => {
                        if (!opt) return;
                        const delta = Number(opt.priceDelta || 0) || 0;
                        unit += delta;
                      });
                    } catch (e) {
                      // ignore and fallback to product price
                    }
                    return Math.floor(unit * 100) / 100;
                  };
                  const unitPrice = computeUnitPrice(product, selection);
                  const formatPrice = (v) => {
                    if (v === null || v === undefined) return '0';
                    const n = Number(v);
                    if (Number.isInteger(n)) return n.toString();
                    return n.toFixed(2);
                  };

                  return (
                    <tr key={rawKey} className="hover:bg-gray-50 transition">
                      <td className="flex items-center gap-4 py-4 md:px-4 px-1">
                        <div>
                          <div className="rounded-lg overflow-hidden bg-gray-100 p-2">
                            <Image
                              src={product.image[0]}
                              alt={product.name}
                              className="w-16 h-16 object-cover"
                              width={1280}
                              height={720}
                            />
                          </div>
                          <button
                            className="md:hidden text-xs text-[#54B1CE] mt-1"
                            onClick={() => updateCartQuantity(rawKey, 0)}
                          >
                            Remove
                          </button>
                        </div>
                        <div className="text-sm hidden md:block">
                          <p className="text-gray-700 font-medium">{product.name}</p>
                          {selection ? (
                            <div className="text-xs text-gray-500 mt-1">
                              {Array.isArray(selection) ? (
                                selection.map((s, idx) => (
                                  <span key={idx} className="mr-2">{s.label || (s.option && s.option.label) || JSON.stringify(s)}</span>
                                ))
                              ) : (
                                Object.entries(selection).map(([k, v]) => (
                                  <span key={k} className="mr-2">{k}: {v.label || v}</span>
                                ))
                              )}
                            </div>
                          ) : null}
                          <button
                            className="text-xs text-[#54B1CE] mt-1 hover:underline"
                            onClick={() => updateCartQuantity(rawKey, 0)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>

                      <td className="py-4 md:px-4 px-1 text-gray-700 font-medium">₹{formatPrice(unitPrice)}</td>

                      <td className="py-4 md:px-4 px-1">
                        <div className="flex items-center md:gap-2 gap-1">
                          <button
                            onClick={() => updateCartQuantity(rawKey, cartItems[rawKey] - 1)}
                            className="bg-gray-100 p-1 rounded hover:bg-gray-200 transition"
                          >
                            <Image src={assets.decrease_arrow} alt="decrease_arrow" className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={cartItems[rawKey]}
                            onChange={e => updateCartQuantity(rawKey, Number(e.target.value))}
                            className="w-12 border rounded text-center appearance-none focus:outline-none focus:ring-1 focus:ring-[#54B1CE]"
                          />
                          <button
                            onClick={() => addToCart(rawKey)}
                            className="bg-gray-100 p-1 rounded hover:bg-gray-200 transition"
                          >
                            <Image src={assets.increase_arrow} alt="increase_arrow" className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      <td className="py-4 md:px-4 px-1 text-gray-700 font-medium">
                        ₹{(unitPrice * cartItems[rawKey]).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => router.push('/all-products')}
            className="group flex items-center mt-6 gap-2 text-[#54B1CE] font-medium hover:underline"
          >
            <Image
              className="group-hover:-translate-x-1 transition-transform"
              src={assets.arrow_right_icon_colored}
              alt="arrow_right_icon_colored"
            />
            Continue Shopping
          </button>
        </div>

        {/* Order Summary Section */}
        <OrderSummary />
      </div>
    </>
  );
};

export default Cart;
