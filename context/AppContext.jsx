// context/AppContext.js
'use client';
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppContextProvider = (props) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY;
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [products, setProducts] = useState([]);
  const [userData, setUserData] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [cartItems, setCartItems] = useState({});

  const fetchProductData = async () => {
    try {
      console.log("⏳ Fetching products:", new Date().toISOString());
      const { data } = await axios.get('/api/product/list', {
        headers: { "Cache-Control": "no-store" },
        cache: 'no-store'
      });
      if (data.success) {
        setProducts([...data.products]); // ✅ FIXED: Added spread operator
        console.log("✅ Products updated:", data.products.length);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Product fetch error:", error.message);
      toast.error(error.message);
    }
  };

  const orderPlaced = async (orderData) => {
    try {
      console.log("⏳ Placing order:", new Date().toISOString());
      const token = await getToken();
      const { data } = await axios.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        toast.success('Order placed successfully');
        await fetchProductData(); // Refetch products
        window.dispatchEvent(new Event("orderPlaced")); // Trigger HomeProducts
        return data;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Order creation error:", error.message);
      toast.error(error.message);
      throw error;
    }
  };

  const fetchUserData = async () => {
    try {
      if (user?.publicMetadata.role === 'seller') {
        setIsSeller(true);
      }
      const token = await getToken();
      const { data } = await axios.get('/api/user/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setUserData(data.user);
        setCartItems(data.user.cartItems || {});
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // New signature: addToCart(itemId, variantSelection)
  const addToCart = async (itemId, variantSelection = null) => {
    if (!user) {
      return toast('Please login', { icon: '⚠️' });
    }
    let cartData = structuredClone(cartItems);
    // Respect product's minimum buy quantity (minBuy)
    const product = products.find(p => p._id === itemId);
    const min = product && product.minBuy ? Number(product.minBuy) : 1;
    // If variantSelection is provided, ensure any required colors are present
    if (variantSelection && product) {
      // product-level colors required
      if (product.colors && product.colors.length > 0) {
        if (!variantSelection._productColor && !(variantSelection._productColor && variantSelection._productColor.label)) {
          return toast('Please select a product color before adding to cart', { icon: '⚠️' });
        }
      }
      // variant-level colors: for each group that has color options, ensure selection contains a color
      if (product.variants && product.variants.length > 0) {
        for (const group of product.variants) {
          const sel = variantSelection[group.name];
          if (sel && sel.colors && Array.isArray(sel.colors) && sel.colors.length > 0) {
            // expect variantSelection to include a color under the same group key or in a separate selectedColors merge
            if (!sel.color && !variantSelection[group.name]?.color) {
              return toast(`Please select a color for ${group.name}`, { icon: '⚠️' });
            }
          }
        }
      }
    }
    // Build cart key: if variantSelection provided, include encoded JSON
    let cartKey = itemId;
    if (variantSelection) {
      try {
        const encoded = encodeURIComponent(JSON.stringify(variantSelection));
        cartKey = `${itemId}::${encoded}`;
      } catch (e) {
        cartKey = itemId;
      }
    }
    if (cartData[cartKey]) {
      cartData[cartKey] += min;
    } else {
      cartData[cartKey] = min;
    }
    setCartItems(cartData);
    if (user) {
      try {
        const token = await getToken();
        await axios.post('/api/cart/update', { cartData }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Inform user if minimum quantity was enforced
        if (min > 1) {
          toast.success(`Minimum order quantity is ${min}. ${min} units added to cart.`);
        } else {
          toast.success('Item added to cart');
        }
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const updateCartQuantity = async (itemId, quantity) => {
    let cartData = structuredClone(cartItems);
    // itemId may be a composite key 'productId::encodedSelection'
    const rawKey = itemId;
    const parts = rawKey.split('::');
    const productId = parts[0];
    const product = products.find(p => p._id === productId);
    const min = product && product.minBuy ? Number(product.minBuy) : 1;
    if (quantity === 0) {
      delete cartData[rawKey];
    } else {
      if (quantity < min) {
        // If user tries to set below minimum, snap to minimum and inform
        cartData[rawKey] = min;
        toast(`Minimum order quantity is ${min}. Quantity set to minimum.`);
      } else {
        cartData[rawKey] = quantity;
      }
    }
    setCartItems(cartData);
    if (user) {
      try {
        const token = await getToken();
        await axios.post('/api/cart/update', { cartData }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Cart Updated');
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      if (cartItems[items] > 0) {
        totalCount += cartItems[items];
      }
    }
    return totalCount;
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      // Handle composite keys like productId::encodedSelection
      const parts = items.split('::');
      const productId = parts[0];
      const itemInfo = products.find((product) => product._id === productId);
      if (cartItems[items] > 0 && itemInfo) {
        // Pricing: if any selected option has absolute `price`, use the highest absolute price as base;
        // otherwise use itemInfo.offerPrice. Then add any priceDelta values.
        let unitPrice = Number(itemInfo.offerPrice || itemInfo.price || 0);
        if (parts.length > 1) {
          try {
            const sel = JSON.parse(decodeURIComponent(parts.slice(1).join('::')));
            const selected = Array.isArray(sel) ? sel : (sel && typeof sel === 'object' ? Object.values(sel) : []);
            const absolutePrices = selected
              .map(o => (o && o.price !== undefined && o.price !== null ? Number(o.price) : null))
              .filter(v => v !== null && !Number.isNaN(v));
            if (absolutePrices.length > 0) {
              unitPrice = Math.max(...absolutePrices);
            }
            selected.forEach((opt) => {
              if (!opt) return;
              const delta = Number(opt.priceDelta || 0) || 0;
              unitPrice += delta;
            });
          } catch (e) {
            // ignore parse errors
          }
        }
        totalAmount += unitPrice * cartItems[items];
      }
    }
    return Math.floor(totalAmount * 100) / 100;
  };

  useEffect(() => {
    fetchProductData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const value = {
    user,
    getToken,
    currency,
    router,
    isSeller,
    setIsSeller,
    userData,
    fetchUserData,
    products,
    fetchProductData,
    cartItems,
    setCartItems,
    addToCart,
    updateCartQuantity,
    getCartCount,
    getCartAmount,
    orderPlaced
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};