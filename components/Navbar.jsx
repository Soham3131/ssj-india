"use client"
import React, { useState, useEffect } from "react";
import { BagIcon, BoxIcon, CartIcon, HomeIcon, SearchIcon } from "@/assets/assets";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useClerk, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const Navbar = () => {
    const { isSeller, user } = useAppContext();
    const { openSignIn } = useClerk();
    const router = useRouter();
    
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    // Mock products data - replace this with your actual products data from context
    const { products = [] } = useAppContext();

    // Filter suggestions based on search query
    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            const filtered = products.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
            ).slice(0, 5); // Limit to 5 suggestions
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    }, [searchQuery, products]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/all-products?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
            setShowSearch(false);
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (product) => {
        router.push(`/product/${product.id || product._id}`);
        setSearchQuery("");
        setShowSearch(false);
        setSuggestions([]);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch(e);
        } else if (e.key === 'Escape') {
            setShowSearch(false);
            setSearchQuery("");
            setSuggestions([]);
        }
    };

    // Close search when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showSearch && !event.target.closest('.search-container')) {
                setShowSearch(false);
                setSuggestions([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSearch]);

    return (
        <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-[#54B1CE]/30 text-slate-700 bg-white relative">
            {/* Logo */}
            <div
                onClick={() => router.push("/")}
                className="cursor-pointer flex items-center gap-2"
            >
                <div className="w-10 h-10 flex items-center justify-center rounded-md bg-[#54B1CE] text-white font-bold text-lg">
                    SSJ
                </div>
            </div>

            {/* Desktop Menu */}
            <div className="flex items-center gap-4 lg:gap-8 max-md:hidden">
                <Link href="/" className="hover:text-[#54B1CE] transition">
                    Home
                </Link>
                <Link href="/all-products" className="hover:text-[#54B1CE] transition">
                    Shop
                </Link>

                {isSeller && (
                    <button
                        onClick={() => router.push("/seller")}
                        className="text-xs border border-[#54B1CE] text-[#54B1CE] hover:bg-[#54B1CE] hover:text-white px-4 py-1.5 rounded-full transition"
                    >
                        Seller Dashboard
                    </button>
                )}
            </div>

            {/* Mobile Menu - Added Home and Shop links */}
            <div className="flex items-center gap-4 md:hidden">
                <Link href="/" className="hover:text-[#54B1CE] transition text-sm">
                    Home
                </Link>
                <Link href="/all-products" className="hover:text-[#54B1CE] transition text-sm">
                    Shop
                </Link>
            </div>

            {/* Desktop User Menu */}
            <ul className="hidden md:flex items-center gap-4">
                {/* Search Icon - Desktop */}
                <div className="relative search-container">
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className="w-5 h-5 text-slate-600 hover:text-[#54B1CE] transition"
                    >
                        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                        </svg>
                    </button>

                    {/* Search Bar - Desktop */}
                    {showSearch && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                            <form onSubmit={handleSearch} className="p-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Search products..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#54B1CE] focus:border-transparent"
                                        autoFocus
                                    />
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                                        </svg>
                                    </div>
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* Search Suggestions */}
                            {suggestions.length > 0 && (
                                <div className="border-t border-gray-200 max-h-60 overflow-y-auto">
                                    {suggestions.map((product, index) => (
                                        <div
                                            key={product.id || product._id || index}
                                            onClick={() => handleSuggestionClick(product)}
                                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                {product.image && (
                                                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                                        <Image
                                                            src={product.image}
                                                            alt={product.name}
                                                            width={40}
                                                            height={40}
                                                            className="rounded object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        ${product.price}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* View All Results */}
                            {searchQuery.trim() && (
                                <div className="p-2 border-t border-gray-200">
                                    <button
                                        onClick={handleSearch}
                                        className="w-full text-center text-sm text-[#54B1CE] hover:text-[#3a9cb8] font-medium py-2"
                                    >
                                        View all results for "{searchQuery}"
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {user ? (
                    <>
                        <UserButton>
                            <UserButton.MenuItems>
                                <UserButton.Action
                                    label="Cart"
                                    labelIcon={<CartIcon />}
                                    onClick={() => router.push("/cart")}
                                />
                            </UserButton.MenuItems>
                            <UserButton.MenuItems>
                                <UserButton.Action
                                    label="My Orders"
                                    labelIcon={<BagIcon />}
                                    onClick={() => router.push("/my-orders")}
                                />
                            </UserButton.MenuItems>
                        </UserButton>
                    </>
                ) : (
                    <button
                        onClick={openSignIn}
                        className="flex items-center gap-2 text-slate-700 hover:text-[#54B1CE] transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.79.758 6.879 2.047M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Account
                    </button>
                )}
            </ul>

            {/* Mobile User Menu */}
            <div className="flex items-center md:hidden gap-3">
                {/* Search Icon - Mobile */}
                <button
                    onClick={() => setShowSearch(!showSearch)}
                    className="text-slate-600 hover:text-[#54B1CE] transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                </button>

                {isSeller && (
                    <button
                        onClick={() => router.push("/seller")}
                        className="text-xs border border-[#54B1CE] text-[#54B1CE] hover:bg-[#54B1CE] hover:text-white px-3 py-1 rounded-full transition"
                    >
                        Seller
                    </button>
                )}
                {user ? (
                    <>
                        <UserButton>
                            <UserButton.MenuItems>
                                <UserButton.Action
                                    label="Cart"
                                    labelIcon={<CartIcon />}
                                    onClick={() => router.push("/cart")}
                                />
                            </UserButton.MenuItems>
                            <UserButton.MenuItems>
                                <UserButton.Action
                                    label="My Orders"
                                    labelIcon={<BagIcon />}
                                    onClick={() => router.push("/my-orders")}
                                />
                            </UserButton.MenuItems>
                        </UserButton>
                    </>
                ) : (
                    <button
                        onClick={openSignIn}
                        className="flex items-center gap-2 text-slate-700 hover:text-[#54B1CE] transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.79.758 6.879 2.047M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Mobile Search Overlay */}
            {showSearch && (
                <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-md mt-20 search-container">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Search Products</h3>
                                <button
                                    onClick={() => setShowSearch(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleSearch}>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Search products..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#54B1CE] focus:border-transparent"
                                        autoFocus
                                    />
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                                        </svg>
                                    </div>
                                </div>
                            </form>

                            {/* Mobile Search Suggestions */}
                            {suggestions.length > 0 && (
                                <div className="mt-4 border-t border-gray-200 max-h-60 overflow-y-auto">
                                    {suggestions.map((product, index) => (
                                        <div
                                            key={product.id || product._id || index}
                                            onClick={() => handleSuggestionClick(product)}
                                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                {product.image && (
                                                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                                        <Image
                                                            src={product.image}
                                                            alt={product.name}
                                                            width={48}
                                                            height={48}
                                                            className="rounded object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        ${product.price}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Mobile View All Results */}
                            {searchQuery.trim() && (
                                <div className="mt-4">
                                    <button
                                        onClick={handleSearch}
                                        className="w-full text-center text-[#54B1CE] hover:text-[#3a9cb8] font-medium py-3 border-t border-gray-200"
                                    >
                                        View all results for "{searchQuery}"
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;