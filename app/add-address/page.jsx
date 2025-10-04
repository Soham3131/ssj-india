'use client'
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";

const AddAddress = () => {
    const { getToken, router } = useAppContext();

    const [address, setAddress] = useState({
        fullName: '',
        phoneNumber: '',
        pincode: '',
        area: '',
        city: '',
        state: '',
    });

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        try {
            const token = await getToken();
            const { data } = await axios.post(
                '/api/user/add-address',
                { address },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success(data.message);
                router.push('/cart');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <>
            <Navbar />
            <div className="px-6 md:px-16 lg:px-32 py-16 flex flex-col md:flex-row justify-between items-center bg-white gap-10">
                {/* Address Form */}
                <form onSubmit={onSubmitHandler} className="w-full md:w-1/2">
                    <p className="text-2xl md:text-3xl text-slate-700">
                        Add Shipping <span className="font-semibold text-[#54B1CE]">Address</span>
                    </p>
                    <div className="space-y-3 max-w-sm mt-10">
                        <input
                            className="px-3 py-2.5 border border-[#54B1CE]/50 rounded-md outline-none w-full text-slate-700 focus:ring-2 focus:ring-[#54B1CE] transition"
                            type="text"
                            placeholder="Full name"
                            onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                            value={address.fullName}
                        />
                        <input
                            className="px-3 py-2.5 border border-[#54B1CE]/50 rounded-md outline-none w-full text-slate-700 focus:ring-2 focus:ring-[#54B1CE] transition"
                            type="text"
                            placeholder="Phone number"
                            onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })}
                            value={address.phoneNumber}
                        />
                        <input
                            className="px-3 py-2.5 border border-[#54B1CE]/50 rounded-md outline-none w-full text-slate-700 focus:ring-2 focus:ring-[#54B1CE] transition"
                            type="text"
                            placeholder="Pin code"
                            onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                            value={address.pincode}
                        />
                        <textarea
                            className="px-3 py-2.5 border border-[#54B1CE]/50 rounded-md outline-none w-full text-slate-700 resize-none focus:ring-2 focus:ring-[#54B1CE] transition"
                            rows={4}
                            placeholder="Address (Area and Street)"
                            onChange={(e) => setAddress({ ...address, area: e.target.value })}
                            value={address.area}
                        ></textarea>
                        <div className="flex space-x-3">
                            <input
                                className="px-3 py-2.5 border border-[#54B1CE]/50 rounded-md outline-none w-full text-slate-700 focus:ring-2 focus:ring-[#54B1CE] transition"
                                type="text"
                                placeholder="City/District/Town"
                                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                value={address.city}
                            />
                            <input
                                className="px-3 py-2.5 border border-[#54B1CE]/50 rounded-md outline-none w-full text-slate-700 focus:ring-2 focus:ring-[#54B1CE] transition"
                                type="text"
                                placeholder="State"
                                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                value={address.state}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="max-w-sm w-full mt-6 bg-[#54B1CE] text-white py-3 rounded-md hover:bg-[#3a8bb8] uppercase transition"
                    >
                        Save address
                    </button>
                </form>

                {/* Large Pexels Image */}
                <div className="flex-1 mt-10 md:mt-0">
                    <img
                        src="https://images.pexels.com/photos/7706449/pexels-photo-7706449.jpeg"
                        alt="location illustration"
                        className="w-full h-full rounded-md shadow-lg object-cover"
                    />
                </div>
            </div>
            <Footer />
        </>
    );
};

export default AddAddress;
