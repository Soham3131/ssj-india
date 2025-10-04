"use client"
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const OrderSummary = () => {

  const { currency, router, getCartCount, getCartAmount, getToken, user , cartItems, setCartItems } = useAppContext();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [specialRequest, setSpecialRequest] = useState('');

  const fetchUserAddresses = async () => {
    try {
      const token = await getToken();
      const {data} = await axios.get('/api/user/get-address',{headers:{Authorization:`Bearer ${token}`}});
      if (data.success) {
        setUserAddresses(data.addresses);
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  const createOrder = async (paymentMethod = 'cod') => {
    try {
      if (!user) {
        return toast('Please login to place order',{
          icon: '⚠️',
        });
      }
      
      if (!selectedAddress) {
        return toast.error('Please select an address');
      }

      if (!cartItems || Object.keys(cartItems).length === 0) {
        return toast.error('Cart is empty');
      }

      let cartItemsArray = Object.keys(cartItems).map((key) => ({product:key, quantity:cartItems[key]}));
      cartItemsArray = cartItemsArray.filter(item => item.quantity > 0);

      if (cartItemsArray.length === 0) {
        return toast.error('Cart is empty');
      }

      const token = await getToken();

      if (paymentMethod === 'razorpay') {
        await createRazorpayOrder(token, cartItemsArray);
      } else {
        await createCODOrder(token, cartItemsArray);
      }

    } catch (error) {
      toast.error(error.message);
    }
  }

  const createCODOrder = async (token, cartItemsArray) => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/order/create',{
        address: selectedAddress._id,
        items: cartItemsArray,
        paymentMethod: 'cod',
        specialRequest: specialRequest,
        paymentStatus: 'pending'
      },{
        headers: {Authorization:`Bearer ${token}`}
      });

      if (data.success) {
        toast.success(data.message);
        if (setCartItems && typeof setCartItems === 'function') {
          setCartItems({});
        }
        router.push('/order-placed');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to create order');
    }
    setLoading(false);
  }

  const createRazorpayOrder = async (token, cartItemsArray) => {
    setLoading(true);
    try {
      const totalAmount = getCartAmount() + Math.floor(getCartAmount() * 0.02);
      
      const orderResponse = await axios.post('/api/order/create',{
        address: selectedAddress._id,
        items: cartItemsArray,
        paymentMethod: 'razorpay',
        specialRequest: specialRequest,
        paymentStatus: 'pending',
        amount: totalAmount
      },{
        headers: {Authorization:`Bearer ${token}`}
      });

      if (!orderResponse.data.success) {
        toast.error(orderResponse.data.message);
        setLoading(false);
        return;
      }

      const orderId = orderResponse.data.order?._id || orderResponse.data.orderId;
      
      if (!orderId) {
        toast.error('Failed to create order');
        setLoading(false);
        return;
      }

      const options = {
        // Use a public key injected at build time. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to your .env.
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_RO8kaE9GNU9MPE',
        amount: totalAmount * 100,
        currency: "INR",
        name: "Your Store",
        description: "Order Payment",
        image: "https://cdn.razorpay.com/logos/7K3b6d18wHwKzL_medium.png",
        handler: function (response) {
          // After successful checkout on client, call verify endpoint on server
          // which will verify the signature and mark the order as paid.
          axios.post('/api/order/verify-payment', {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            orderId: orderId
          }, {
            headers: { Authorization: `Bearer ${token}` }
          }).then((res) => {
            console.log('verify-payment response', res?.data);
            if (res.data && res.data.success) {
              toast.success('Payment verified and order placed.');
              if (setCartItems && typeof setCartItems === 'function') {
                setCartItems({});
              }
              router.push('/order-placed');
            } else {
              toast.error(res.data?.message || 'Payment verification failed');
            }
          }).catch((err) => {
            console.error('verify-payment error', err, err?.response?.status, err?.response?.data);
            const serverMessage = err?.response?.data?.message || err?.response?.data?.debug || err?.message;
            toast.error(serverMessage || 'Payment verification failed');
          }).finally(() => {
            setLoading(false);
          });
        },
        prefill: {
          name: user.fullName || 'Customer',
          email: user.primaryEmailAddress || 'customer@example.com',
          contact: selectedAddress?.phoneNumber || '9999999999'
        },
        theme: {
          color: "#54B1CE"
        }
      };

      // If server created a Razorpay order, pass its id to checkout options
      if (orderResponse.data.razorpay_order_id) {
        options.order_id = orderResponse.data.razorpay_order_id;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        console.log('Razorpay options', options, 'orderResponse', orderResponse.data);
        const rzp = new window.Razorpay(options);
        rzp.open();
        rzp.on('payment.failed', function () {
          toast.error('Payment failed. Please try again.');
          setLoading(false);
        });
      };
      script.onerror = () => {
        toast.error('Failed to load payment system');
        setLoading(false);
      };
      document.body.appendChild(script);

    } catch (error) {
      toast.error('Failed to create order');
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserAddresses();
    }
  }, [user]);

  return (
    <div className="w-full md:w-96 bg-white p-5 border border-[#54B1CE]/30 rounded-lg shadow-md">
      <h2 className="text-xl md:text-2xl font-semibold text-[#054b6d]">Order Summary</h2>
      <hr className="border-[#54B1CE]/30 my-5" />

      <div className="space-y-6">
        {/* Address Selector */}
        <div>
          <label className="text-base font-medium uppercase text-[#054b6d] block mb-2">Select Address</label>
          <div className="relative inline-block w-full text-sm border border-[#54B1CE]/30 rounded-md">
            <button
              className="peer w-full text-left px-4 pr-2 py-2 bg-white text-[#054b6d] focus:outline-none"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>
                {selectedAddress
                  ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}`
                  : "Select Address"}
              </span>
              <svg className={`w-5 h-5 inline float-right transition-transform duration-200 ${isDropdownOpen ? "rotate-0" : "-rotate-90"}`}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#54B1CE">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <ul className="absolute w-full bg-white border border-[#54B1CE]/30 shadow-md mt-1 z-10 py-1.5 rounded-md">
                {userAddresses.map((address, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-[#54B1CE]/10 cursor-pointer text-[#054b6d]"
                    onClick={() => handleAddressSelect(address)}
                  >
                    {address.fullName}, {address.area}, {address.city}, {address.state}
                  </li>
                ))}
                <li
                  onClick={() => router.push("/add-address")}
                  className="px-4 py-2 hover:bg-[#54B1CE]/10 cursor-pointer text-center text-[#054b6d] font-medium"
                >
                  + Add New Address
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Promo Code */}
        <div>
          <label className="text-base font-medium uppercase text-[#054b6d] block mb-2">Promo Code</label>
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <input
              type="text"
              placeholder="Enter promo code"
              className="flex-grow w-full outline-none p-2.5 text-[#054b6d] border border-[#54B1CE]/30 rounded-md"
            />
            <button className="bg-[#54B1CE] text-white px-8 py-2 hover:bg-[#3a8bbd] rounded-md transition">
              Apply
            </button>
          </div>
        </div>

        <div>
          <label className="text-base font-medium uppercase text-[#054b6d] block mb-2">Special Request (optional)</label>
          <textarea
            value={specialRequest}
            onChange={(e) => setSpecialRequest(e.target.value)}
            placeholder="Add any special instructions for your order"
            className="w-full p-2.5 text-[#054b1ce] border border-[#54B1CE]/30 rounded-md min-h-[80px]"
          />
        </div>

        <hr className="border-[#54B1CE]/30 my-5" />

        {/* Cart Summary */}
        <div className="space-y-4">
          <div className="flex justify-between text-base font-medium">
            <p className="uppercase text-[#054b6d]">Items {getCartCount()}</p>
            <p className="text-[#054b6d]">{currency}{getCartAmount()}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-[#054b6d]">Shipping Fee</p>
            <p className="font-medium text-[#054b6d]">Free</p>
          </div>
          <div className="flex justify-between">
            <p className="text-[#054b6d]">Tax (2%)</p>
            <p className="font-medium text-[#054b6d]">{currency}{Math.floor(getCartAmount() * 0.02)}</p>
          </div>
          <div className="flex justify-between text-lg md:text-xl font-semibold border-t border-[#54B1CE]/20 pt-3">
            <p>Total</p>
            <p>{currency}{getCartAmount() + Math.floor(getCartAmount() * 0.02)}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 mt-5">
        <button 
          onClick={() => createOrder('cod')} 
          disabled={loading}
          className="w-full bg-[#54B1CE] text-white py-3 hover:bg-[#3a8bbd] disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition"
        >
          {loading ? 'Placing Order...' : 'Place Order via COD'}
        </button>
        
        <button 
          onClick={() => createOrder('razorpay')} 
          disabled={loading}
          className="w-full bg-[#054b6d] text-white py-3 hover:bg-[#43667a] disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition"
        >
          {loading ? 'Processing...' : 'Pay Now with Razorpay'}
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;
