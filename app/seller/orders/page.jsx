'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const Orders = () => {
    const { currency, getToken, user } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [lastFetch, setLastFetch] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [cancellingOrder, setCancellingOrder] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [refundingOrder, setRefundingOrder] = useState(null);
    const [refundReason, setRefundReason] = useState("");
    
    // Sales report states
    const [salesReport, setSalesReport] = useState({
        totalSales: 0,
        paidOrders: 0,
        pendingOrders: 0,
        monthlyData: [],
        dailyData: []
    });
    const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month, custom
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [showSalesReport, setShowSalesReport] = useState(false);
    // Admin-only notes (now stored server-side per seller)
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [noteInput, setNoteInput] = useState("");
    const [trackingModalOrder, setTrackingModalOrder] = useState(null);
    const [trackingModalProduct, setTrackingModalProduct] = useState(null);
    const [trackingInput, setTrackingInput] = useState('');
    // Invoice modal state (used when seller uploads a PDF invoice for an order)
    const [invoiceModalOrder, setInvoiceModalOrder] = useState(null);
    const [invoiceFile, setInvoiceFile] = useState(null);

    // helper to read this seller's note from an order object
    const getSellerNoteForOrder = (order, sellerId) => {
        if (!order || !order.adminNotes) return '';
        const found = order.adminNotes.find(n => n.sellerId === sellerId);
        return found ? found.note : '';
    };

    const statusOptions = [
        { value: "Order Placed", label: "Order Placed", color: "bg-yellow-100 text-yellow-800" },
        { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
        { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800" },
        { value: "shipped", label: "Shipped", color: "bg-purple-100 text-purple-800" },
        { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
        { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
        // new return/replace workflow statuses
        { value: "return_assigned", label: "Return Assigned", color: "bg-indigo-100 text-indigo-800" },
        { value: "returned_completed", label: "Returned Completed", color: "bg-indigo-50 text-indigo-700" },
        { value: "replace_assigned", label: "Replace Assigned", color: "bg-teal-100 text-teal-800" },
        { value: "replace_completed", label: "Replace Completed", color: "bg-teal-50 text-teal-700" }
    ];

    const paymentOptions = [
        { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
        { value: "paid", label: "Paid", color: "bg-green-100 text-green-800" },
        { value: "failed", label: "Failed", color: "bg-red-100 text-red-800" },
        { value: "refunded", label: "Refunded", color: "bg-orange-100 text-orange-800" }
    ];

    const dateFilterOptions = [
        { value: "all", label: "All Time" },
        { value: "today", label: "Today" },
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
        { value: "custom", label: "Custom Date Range" }
    ];

    const fetchSellerOrders = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            console.log("Fetching orders with token");
            setFetchError(null);

            const { data } = await axios.get('/api/order/seller-orders', {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 15000
            });

                if (data.success) {
                const ordersData = Array.isArray(data.orders) ? data.orders : [];
                setOrders(ordersData);
                generateSalesReport(ordersData);
                setLastFetch(new Date().toISOString());
            } else {
                const msg = data.message || "Failed to fetch orders";
                setFetchError(msg);
                toast.error(msg);
                setOrders([]);
                setSalesReport({
                    totalSales: 0,
                    paidOrders: 0,
                    pendingOrders: 0,
                    monthlyData: [],
                    dailyData: []
                });
            }
        } catch (error) {
            console.error("Fetch error:", {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            const msg = error.response?.data?.message || "Failed to fetch orders";
            setFetchError(msg);
            toast.error(msg);
            setOrders([]);
            setSalesReport({
                totalSales: 0,
                paidOrders: 0,
                pendingOrders: 0,
                monthlyData: [],
                dailyData: []
            });
        } finally {
            setLoading(false);
        }
    };

    // Replace or insert a full order object into local state (used after server updates)
    // If the server didn't return the updated order, fallback to a full re-fetch.
    const replaceOrderInState = async (returnedOrder) => {
        if (!returnedOrder || !returnedOrder._id) {
            await fetchSellerOrders();
            return;
        }
        setOrders(prev => {
            const oid = String(returnedOrder._id);
            const found = prev.some(o => String(o._id) === oid);
            const next = found ? prev.map(o => String(o._id) === oid ? returnedOrder : o) : [returnedOrder, ...prev];
            try {
                generateSalesReport(next);
            } catch (e) {
                // ignore errors in report generation
            }
            return next;
        });
    };

    // Generate sales report from orders data
    const generateSalesReport = (ordersData) => {
        if (!ordersData || ordersData.length === 0) {
            setSalesReport({
                totalSales: 0,
                paidOrders: 0,
                pendingOrders: 0,
                monthlyData: [],
                dailyData: []
            });
            return;
        }

        const now = new Date();
        const filteredOrders = filterOrdersByDate(ordersData, dateFilter, customStartDate, customEndDate);

        // Basic statistics
        const totalSales = filteredOrders
            // Only include completed (paid) sales in total — exclude refunded amounts
            .filter(order => order.paymentStatus === 'paid')
            .reduce((sum, order) => sum + (order.amount || 0), 0);

        const paidOrders = filteredOrders.filter(order => order.paymentStatus === 'paid').length;
        const pendingOrders = filteredOrders.filter(order => order.paymentStatus === 'pending').length;
        const refundedAmount = filteredOrders
            .filter(order => order.paymentStatus === 'refunded')
            .reduce((sum, o) => sum + (o.amount || 0), 0);

        // counts for new statuses
        const returnAssignedCount = filteredOrders.filter(o => o.status === 'return_assigned').length;
        const returnedCompletedCount = filteredOrders.filter(o => o.status === 'returned_completed').length;
        const replaceAssignedCount = filteredOrders.filter(o => o.status === 'replace_assigned').length;
        const replaceCompletedCount = filteredOrders.filter(o => o.status === 'replace_completed').length;

        // Monthly data
        const monthlyData = generateMonthlyData(filteredOrders);
        
        // Daily data (last 30 days)
        const dailyData = generateDailyData(filteredOrders);

        setSalesReport({
            totalSales,
            paidOrders,
            pendingOrders,
            monthlyData,
            dailyData,
            refundedAmount,
            returnAssignedCount,
            returnedCompletedCount,
            replaceAssignedCount,
            replaceCompletedCount
        });
    };

    // Filter orders based on date filter
    const filterOrdersByDate = (ordersData, filter, startDate, endDate) => {
        const now = new Date();
        
        switch (filter) {
            case 'today':
                return ordersData.filter(order => {
                    const orderDate = new Date(order.date);
                    return orderDate.toDateString() === now.toDateString();
                });
                
            case 'week':
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                return ordersData.filter(order => new Date(order.date) >= startOfWeek);
                
            case 'month':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return ordersData.filter(order => new Date(order.date) >= startOfMonth);
                
            case 'custom':
                if (!startDate || !endDate) return ordersData;
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return ordersData.filter(order => {
                    const orderDate = new Date(order.date);
                    return orderDate >= start && orderDate <= end;
                });
                
            default:
                return ordersData;
        }
    };

    // Generate monthly sales data
    const generateMonthlyData = (ordersData) => {
        const monthlySales = {};
        
        ordersData.forEach(order => {
        if (order.paymentStatus === 'paid') {
                const date = new Date(order.date);
                const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                
                if (!monthlySales[monthYear]) {
                    monthlySales[monthYear] = 0;
                }
                monthlySales[monthYear] += order.amount || 0;
            }
        });

        return Object.entries(monthlySales)
            .map(([month, sales]) => ({ month, sales }))
            .sort((a, b) => a.month.localeCompare(b.month));
    };

    // Generate daily sales data for last 30 days
    const generateDailyData = (ordersData) => {
        const dailySales = {};
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        ordersData.forEach(order => {
            if (order.paymentStatus === 'paid') {
                const orderDate = new Date(order.date);
                if (orderDate >= thirtyDaysAgo) {
                    const dateStr = orderDate.toISOString().split('T')[0];
                    
                    if (!dailySales[dateStr]) {
                        dailySales[dateStr] = 0;
                    }
                    dailySales[dateStr] += order.amount || 0;
                }
            }
        });

        // Fill in missing days with 0 sales
        const result = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            result.push({
                date: dateStr,
                sales: dailySales[dateStr] || 0
            });
        }

        return result;
    };

    // Apply date filter
    const applyDateFilter = () => {
        generateSalesReport(orders);
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const token = await getToken();
            
            const { data } = await axios.put('/api/order/seller-orders', {
                orderId: orderId,
                status: newStatus
            }, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                }
            });

            console.debug('updateOrderStatus response', data);
            if (data.success) {
                if (data.order && data.order._id) {
                    await replaceOrderInState(data.order);
                } else {
                    await fetchSellerOrders();
                }
                toast.success(`Order status updated to ${newStatus}`);
            } else {
                toast.error(data.message || "Failed to update status");
            }
        } catch (error) {
            console.error("Error updating order status:", error);
            toast.error(error.response?.data?.message || "Failed to update order status");
        }
    };

    const updatePaymentStatus = async (orderId, newPaymentStatus) => {
        try {
            const token = await getToken();
            
            const { data } = await axios.put('/api/order/seller-orders', {
                orderId: orderId,
                paymentStatus: newPaymentStatus
            }, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                }
            });

            console.debug('updatePaymentStatus response', data);
            if (data.success) {
                if (data.order && data.order._id) {
                    await replaceOrderInState(data.order);
                } else {
                    await fetchSellerOrders();
                }
                toast.success(`Payment status updated to ${newPaymentStatus}`);
            } else {
                toast.error(data.message || "Failed to update payment status");
            }
        } catch (error) {
            console.error("Error updating payment status:", error);
            toast.error(error.response?.data?.message || "Failed to update payment status");
        }
    };

    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            toast.error("Please select a cancellation reason");
            return;
        }

        try {
            const token = await getToken();
            
            const { data } = await axios.put('/api/order/seller-orders', {
                orderId: cancellingOrder,
                status: "cancelled",
                cancellationReason: cancelReason
            }, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                }
            });

                console.debug('handleCancelOrder response', data);
                if (data.success) {
                    if (data.order && data.order._id) {
                        await replaceOrderInState(data.order);
                    } else {
                        await fetchSellerOrders();
                    }
                    toast.success("Order cancelled successfully!");
                    setCancellingOrder(null);
                    setCancelReason("");
                } else {
                    toast.error(data.message || "Failed to cancel order");
                }
        } catch (error) {
            console.error("Error cancelling order:", error);
            toast.error(error.response?.data?.message || "Failed to cancel order");
        }
    };

    const handleRefund = async () => {
        if (!refundReason.trim()) {
            toast.error("Please select a refund reason");
            return;
        }

        try {
            const token = await getToken();
            
            const { data } = await axios.put('/api/order/seller-orders', {
                orderId: refundingOrder,
                paymentStatus: "refunded",
                refundReason: refundReason
            }, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                }
            });

                console.debug('handleRefund response', data);
                if (data.success) {
                    if (data.order && data.order._id) {
                        await replaceOrderInState(data.order);
                    } else {
                        await fetchSellerOrders();
                    }
                    toast.success("Order refunded successfully!");
                    setRefundingOrder(null);
                    setRefundReason("");
                } else {
                    toast.error(data.message || "Failed to refund order");
                }
        } catch (error) {
            console.error("Error refunding order:", error);
            toast.error(error.response?.data?.message || "Failed to refund order");
        }
    };

    const filteredOrders = orders
        .filter(order => {
        if (!order) return false;
        
        const matchesSearch = searchTerm ? 
            (order.items?.some(item => 
                item?.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            ) || 
            order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer?.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
            : true;
        
        const matchesStatus = filterStatus === "all" || order.status === filterStatus;
        return matchesSearch && matchesStatus;
    })
    // sort newest first
    .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Ensure we attempt to load seller orders on mount. fetchSellerOrders handles auth errors
    // gracefully (it will toast and leave `orders` empty if no token is available).
    useEffect(() => {
        fetchSellerOrders();
        // Note: we intentionally do not add `user` to deps so this runs once on mount.
    }, []);

    // No local load/persist; admin notes are fetched as part of orders and saved via API

    useEffect(() => {
        if (orders.length > 0) {
            generateSalesReport(orders);
        }
    }, [dateFilter, customStartDate, customEndDate]);

    const formatOrderId = (order) => {
        if (!order?._id) return "N/A";
        return `#${order._id.slice(-8).toUpperCase()}`;
    };

    // Helper to detect color-like strings (hex, rgb(), or simple names)
    const looksLikeColor = (v) => {
        if (!v || typeof v !== 'string') return false;
        const isHex = /^#([0-9A-F]{3}){1,2}$/i.test(v.trim());
        const isRgb = /^rgb\(/i.test(v.trim());
        const isName = /^[a-zA-Z]+$/.test(v.trim());
        return isHex || isRgb || isName;
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        try {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return "Invalid date";
        }
    };

    const formatTime = (date) => {
        if (!date) return "";
        try {
            return new Date(date).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return "";
        }
    };

    const getTotalItems = (order) => {
        if (!order?.items) return 0;
        return order.items.reduce((total, item) => total + (item.quantity || 0), 0);
    };

    const getImageSrc = (item) => {
        if (!item?.product?.image?.[0]) return assets.box_icon;
        return item.product.image[0];
    };

    // Resolve selectedOptions from item. Handles direct `item.selectedOptions` or legacy composite
    // product identifiers like "<id>::<encodedSelectedOptions>" stored in item.product (string) or item.product._id
    const resolveSelectedOptions = (item) => {
        if (!item) return null;
        if (item.selectedOptions) return item.selectedOptions;
        const prod = item.product;
        // If product field is a string like "id::%7B...%7D" or similar
        const maybe = (typeof prod === 'string') ? prod : (prod && (prod._id || prod.id) ? String(prod._id || prod.id) : null);
        if (maybe && typeof maybe === 'string' && maybe.includes('::')) {
            try {
                const parts = maybe.split('::');
                const encoded = parts.slice(1).join('::');
                const decoded = decodeURIComponent(encoded);
                return JSON.parse(decoded);
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    // Safe price calculation using selectedOptions semantics (reused in seller view)
    const calculateItemUnitPrice = (item) => {
        const product = item.product || {};
        let unit = Number(product.offerPrice || product.price || 0);
        try {
            const sel = resolveSelectedOptions(item);
            const selected = Array.isArray(sel) ? sel : (sel && typeof sel === 'object' ? Object.values(sel) : (sel ? [sel] : []));
            const absolutePrices = selected.map(o => (o && o.price !== undefined && o.price !== null ? Number(o.price) : null)).filter(v => v !== null && !Number.isNaN(v));
            if (absolutePrices.length > 0) {
                unit = Math.max(...absolutePrices);
            } else {
                unit = Number(product.offerPrice || product.price || 0);
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

    const calculateItemTotal = (item) => {
        const qty = item.quantity || 0;
        const unit = calculateItemUnitPrice(item);
        return (qty * unit).toFixed(2);
    };

    const formatPrice = (v) => {
        if (v === null || v === undefined) return '0';
        const n = Number(v);
        if (Number.isInteger(n)) return n.toString();
        return n.toFixed(2);
    };

    const hasSelection = (sel) => {
        if (!sel && sel !== 0) return false;
        if (Array.isArray(sel)) return sel.length > 0;
        if (typeof sel === 'object') return Object.keys(sel).length > 0;
        // string/number -> considered a selection (e.g., color string)
        return true;
    }

    const formatShippingAddress = (address) => {
        if (!address) return "N/A";
        const { addressLine1, city, state, pincode, country } = address;
        const formattedAddress = `${addressLine1 || ""}, ${city || ""}, ${state || ""} ${pincode || ""}${country ? ", " + country : ""}`.trim();
        return formattedAddress || "N/A";
    };

    // Helper: when server returns a full order object after an update, merge it into client state
    const upsertOrderFromServer = async (returnedOrder) => {
        // delegate to the newer replaceOrderInState helper
        await replaceOrderInState(returnedOrder);
    };

    return (
        <div className="flex-1 min-h-screen flex flex-col justify-between">
            {loading ? <Loading /> : (
                <div className="md:p-10 p-4 space-y-5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-2xl font-bold">Order Management</h2>
                        <button
                            onClick={() => setShowSalesReport(!showSalesReport)}
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                        >
                            {showSalesReport ? "Hide Sales Report" : "Show Sales Report"}
                        </button>
                    </div>
                    
                    {/* Sales Report Section */}
                    {showSalesReport && (
                        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
                            <h3 className="text-xl font-bold mb-4">Sales Analytics Report</h3>
                            
                            {/* Date Filter */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg"
                                >
                                    {dateFilterOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                
                                {dateFilter === 'custom' && (
                                    <>
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                        <button
                                            onClick={applyDateFilter}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                        >
                                            Apply Filter
                                        </button>
                                    </>
                                )}
                            </div>
                            
                            {/* Sales Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-blue-600 font-semibold">Total Sales</p>
                                    <p className="text-2xl font-bold">{currency}{salesReport.totalSales.toFixed(2)}</p>
                                    <p className="text-sm text-gray-600">Completed orders</p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-lg">
                                    <p className="text-orange-600 font-semibold">Refunded Amount</p>
                                    <p className="text-2xl font-bold">{currency}{(salesReport.refundedAmount || 0).toFixed(2)}</p>
                                    <p className="text-sm text-gray-600">Total refunded</p>
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-lg">
                                    <p className="text-indigo-600 font-semibold">Returns</p>
                                    <p className="text-2xl font-bold">{salesReport.returnAssignedCount || 0}</p>
                                    <p className="text-sm text-gray-600">Return assigned</p>
                                </div>
                                <div className="bg-teal-50 p-4 rounded-lg">
                                    <p className="text-teal-600 font-semibold">Replacements</p>
                                    <p className="text-2xl font-bold">{salesReport.replaceAssignedCount || 0}</p>
                                    <p className="text-sm text-gray-600">Replace assigned</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-green-600 font-semibold">Paid Orders</p>
                                    <p className="text-2xl font-bold">{salesReport.paidOrders}</p>
                                    <p className="text-sm text-gray-600">Successful payments</p>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <p className="text-yellow-600 font-semibold">Pending Payments</p>
                                    <p className="text-2xl font-bold">{salesReport.pendingOrders}</p>
                                    <p className="text-sm text-gray-600">Awaiting payment</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <p className="text-purple-600 font-semibold">Total Orders</p>
                                    <p className="text-2xl font-bold">
                                        {filterOrdersByDate(orders, dateFilter, customStartDate, customEndDate).length}
                                    </p>
                                    <p className="text-sm text-gray-600">All orders</p>
                                </div>
                            </div>
                            
                            {/* Monthly Report */}
                            <div className="mb-6">
                                <h4 className="font-semibold mb-3">Monthly Sales</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {salesReport.monthlyData.slice(-6).map((monthData, index) => (
                                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                            <p className="font-medium">{monthData.month}</p>
                                            <p className="text-lg font-bold text-green-600">
                                                {currency}{monthData.sales.toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Recent Daily Sales */}
                            <div>
                                <h4 className="font-semibold mb-3">Recent Daily Sales (Last 7 Days)</h4>
                                <div className="space-y-2">
                                    {salesReport.dailyData.slice(-7).map((dayData, index) => (
                                        <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                            <span>{formatDate(dayData.date)}</span>
                                            <span className="font-semibold">{currency}{dayData.sales.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Search and Filter */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search by order ID, product name, customer name, or phone number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg"
                            />
                            <Image
                                src={assets.search_icon}
                                alt="Search"
                                className="absolute left-3 top-2.5 h-5 w-5"
                                width={20}
                                height={20}
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="all">All Status</option>
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Orders Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-blue-600 font-semibold">Total Orders</p>
                            <p className="text-2xl font-bold">{orders.length}</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <p className="text-yellow-600 font-semibold">Pending</p>
                            <p className="text-2xl font-bold">
                                {orders.filter(order => order?.status === 'Order Placed' || order?.status === 'pending').length}
                            </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-green-600 font-semibold">Delivered</p>
                            <p className="text-2xl font-bold">
                                {orders.filter(order => order?.status === 'delivered').length}
                            </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <p className="text-red-600 font-semibold">Cancelled</p>
                            <p className="text-2xl font-bold">
                                {orders.filter(order => order?.status === 'cancelled').length}
                            </p>
                        </div>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-4">
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-12">
                                {fetchError ? (
                                    <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded p-6">
                                        <p className="text-red-800 font-semibold mb-2">Unable to load orders</p>
                                        <p className="text-sm text-red-700 mb-3">{fetchError}</p>
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => fetchSellerOrders()} className="bg-blue-600 text-white px-4 py-2 rounded">Retry</button>
                                            <button onClick={() => window.location.reload()} className="bg-gray-200 px-4 py-2 rounded">Reload Page</button>
                                        </div>
                                        {lastFetch && <p className="text-xs text-gray-500 mt-3">Last successful fetch: {lastFetch}</p>}
                                        <p className="text-xs text-gray-500 mt-2">If you're not signed in, please sign in and retry.</p>
                                    </div>
                                ) : (
                                    <div className="max-w-xl mx-auto bg-gray-50 border border-gray-200 rounded p-6">
                                        <p className="text-gray-700 font-semibold mb-2">No orders found</p>
                                        <p className="text-sm text-gray-600 mb-3">There are no orders for your store yet, or the server couldn't be reached.</p>
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => fetchSellerOrders()} className="bg-blue-600 text-white px-4 py-2 rounded">Retry</button>
                                            <button onClick={() => window.location.reload()} className="bg-gray-200 px-4 py-2 rounded">Reload Page</button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-3">Tip: Check browser console and Network tab for failing API requests to <code>/api/order/seller-orders</code>.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            filteredOrders.map((order) => (
                                <div key={order._id} className="rounded-lg p-4 border border-gray-300">
                                    {/* Order Header */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                                        <div>
                                            <p className="font-semibold">Order {formatOrderId(order)}</p>
                                            <p className="text-sm text-gray-600">
                                                {formatDate(order.date)}
                                            </p>
                                            <p className="text-sm text-gray-600">Customer ID: {order.userId?.slice(-8) || "N/A"}</p>
                                        </div>
                                        <div className="flex gap-2 mt-2 md:mt-0 items-center">
                                            <span className={`px-3 py-1 rounded-full text-sm ${
                                                statusOptions.find(s => s.value === order.status)?.color || 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {statusOptions.find(s => s.value === order.status)?.label || order.status}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-sm ${
                                                paymentOptions.find(s => s.value === order.paymentStatus)?.color || 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {paymentOptions.find(s => s.value === order.paymentStatus)?.label || order.paymentStatus}
                                            </span>
                                            {/* Upload/View invoice action */}
                                            {!order.invoiceUrl ? (
                                                <button onClick={() => setInvoiceModalOrder(order)} className="text-sm bg-[#54B1CE] text-white px-3 py-1 rounded">Upload Bill</button>
                                            ) : (
                                                <a href={order.invoiceUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">View invoice</a>
                                            )}
                                            {order?.specialRequest && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Special Request</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Update Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Order Status</label>
                                            <div className="flex flex-wrap gap-2">
                                                {statusOptions.map((status) => {
                                                    return (
                                                        <button
                                                            key={status.value}
                                                            onClick={() => {
                                                                if (status.value === "cancelled") {
                                                                    setCancellingOrder(order._id);
                                                                } else {
                                                                    updateOrderStatus(order._id, status.value);
                                                                }
                                                            }}
                                                            disabled={order.status === status.value}
                                                            className={`px-3 py-2 rounded text-sm border ${
                                                                order.status === status.value 
                                                                    ? `${status.color} border-current font-bold` 
                                                                    : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            {status.label}
                                                        </button>
                                                    );
                                                })}
                                                <button
                                                    onClick={() => setCancellingOrder(order._id)}
                                                    disabled={order.status === "cancelled"}
                                                    className={`px-3 py-2 rounded text-sm border ${
                                                        order.status === "cancelled"
                                                            ? 'bg-red-100 text-red-800 border-current font-bold'
                                                            : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                                                    }`}
                                                >
                                                    Cancel Order
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Payment Status</label>
                                            <div className="flex flex-wrap gap-2">
                                                {paymentOptions.map((payment) => (
                                                    <button
                                                        key={payment.value}
                                                        onClick={() => {
                                                            if (payment.value === "refunded") {
                                                                setRefundingOrder(order._id);
                                                            } else {
                                                                updatePaymentStatus(order._id, payment.value);
                                                            }
                                                        }}
                                                        disabled={order.paymentStatus === payment.value}
                                                        className={`px-3 py-2 rounded text-sm border ${
                                                            order.paymentStatus === payment.value 
                                                                ? `${payment.color} border-current font-bold` 
                                                                : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {payment.label}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => setRefundingOrder(order._id)}
                                                    disabled={order.paymentStatus === "refunded"}
                                                    className={`px-3 py-2 rounded text-sm border ${
                                                        order.paymentStatus === "refunded"
                                                            ? 'bg-orange-100 text-orange-800 border-current font-bold'
                                                            : 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100'
                                                    }`}
                                                >
                                                    Refund Payment
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {order.specialRequest && (
                                        <div className="bg-yellow-50 border border-yellow-100 rounded p-3 mt-3">
                                            <p className="text-sm font-medium text-yellow-800">Special Request</p>
                                            <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap break-all max-h-40 overflow-auto">{order.specialRequest}</p>
                                        </div>
                                    )}

                                    {/* Order Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <h4 className="font-medium mb-2">Products ({order.items?.length || 0})</h4>
                                            {order.items && order.items.length > 0 ? (
                                                order.items.map((item, index) => {
                                                    const sel = resolveSelectedOptions(item);
                                                    return (
                                                        <div key={index} className="flex flex-col sm:flex-row items-start gap-2 mb-3 p-2 bg-gray-50 rounded">
                                                            <div className="w-full sm:w-16 sm:h-16 flex-shrink-0">
                                                                <Image
                                                                    src={getImageSrc(item)}
                                                                    alt={item.product?.name || "Product"}
                                                                    width={400}
                                                                    height={400}
                                                                    className="rounded object-contain w-full h-48 sm:h-16"
                                                                    onError={(e) => { e.target.src = assets.box_icon; }}
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-medium">{item.product?.name || "Product"}</p>
                                                                <p className="text-gray-600">Qty: {item.quantity || 0}</p>
                                                                <p className="text-gray-600">Price: {currency}{formatPrice(calculateItemUnitPrice(item))}</p>
                                                                <p className="font-semibold">Subtotal: {currency}{calculateItemTotal(item)}</p>
                                                                {hasSelection(sel) ? (
                                                                    <div className="mt-2 flex flex-col gap-2 text-sm">
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {Array.isArray(sel) ? (
                                                                                sel.map((s, si) => {
                                                                                    const color = (s && s.color) || (typeof s === 'string' && looksLikeColor(s) ? s : null);
                                                                                    const label = typeof s === 'string' ? s : (s?.label || s?.option || s?.value || JSON.stringify(s));
                                                                                    return (
                                                                                        <div key={si} className="flex items-center gap-3 text-gray-700 bg-white/0 p-1 rounded">
                                                                                            {color ? (
                                                                                                <span className="inline-block w-6 h-6 rounded-full border" style={{ backgroundColor: color }} title={(s && (s.colorLabel || s.color)) || (typeof s === 'string' ? s : '')} />
                                                                                            ) : null}
                                                                                            <div className="flex flex-col">
                                                                                                <span className="font-medium text-sm">{label}</span>
                                                                                                <div className="text-xs text-gray-500">
                                                                                                    {s && s.price !== undefined && s.price !== null ? <span>Price: {currency}{Number(s.price).toFixed(2)}</span> : null}
                                                                                                    {s && s.priceDelta ? <span className="ml-2">Δ {currency}{Number(s.priceDelta).toFixed(2)}</span> : null}
                                                                                                </div>
                                                                                                {s && s.description ? <div className="text-xs text-gray-500 mt-1">{s.description}</div> : null}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })
                                                                            ) : (typeof sel === 'string' || typeof sel === 'number') ? (
                                                                                (() => {
                                                                                    const s = sel;
                                                                                    const color = (typeof s === 'string' && looksLikeColor(s)) ? s : null;
                                                                                    const label = String(s);
                                                                                    return (
                                                                                        <div key={`scalar-${index}`} className="flex items-center gap-3 text-gray-700 bg-white/0 p-1 rounded w-full">
                                                                                            {color ? (
                                                                                                <span className="inline-block w-6 h-6 rounded-full border" style={{ backgroundColor: color }} title={label} />
                                                                                            ) : null}
                                                                                            <div className="flex flex-col">
                                                                                                <span className="font-medium text-sm">{label}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })()
                                                                            ) : (
                                                                                Object.entries(sel || {}).map(([group, s], si) => {
                                                                                    const color = (s && s.color) || (typeof s === 'string' && looksLikeColor(s) ? s : null);
                                                                                    const label = typeof s === 'string' ? s : (s?.label || s?.option || s?.value || JSON.stringify(s));
                                                                                    return (
                                                                                        <div key={si} className="flex items-center gap-3 text-gray-700 bg-white/0 p-1 rounded w-full">
                                                                                            <div className="flex items-center gap-2 mr-2">
                                                                                                <span className="text-xs text-gray-500 mr-1">{group === '_productColor' ? 'Color' : group}</span>
                                                                                                {color ? (
                                                                                                    <span className="inline-block w-6 h-6 rounded-full border" style={{ backgroundColor: color }} title={(s && (s.colorLabel || s.color)) || (typeof s === 'string' ? s : '')} />
                                                                                                ) : null}
                                                                                            </div>
                                                                                            <div className="flex flex-col">
                                                                                                <span className="font-medium text-sm">{label}</span>
                                                                                                <div className="text-xs text-gray-500">
                                                                                                    {s && s.price !== undefined && s.price !== null ? <span>Price: {currency}{Number(s.price).toFixed(2)}</span> : null}
                                                                                                    {s && s.priceDelta ? <span className="ml-2">Δ {currency}{Number(s.priceDelta).toFixed(2)}</span> : null}
                                                                                                </div>
                                                                                                {s && s.description ? <div className="text-xs text-gray-500 mt-1">{s.description}</div> : null}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                        })
                                                                    )}
                                                                        </div>
                                                                        <details className="mt-2 text-xs text-gray-500">
                                                                            <summary className="cursor-pointer">View raw selection</summary>
                                                                            <pre className="whitespace-pre-wrap break-words bg-gray-100 p-2 rounded mt-2 text-xs">{JSON.stringify(sel, null, 2)}</pre>
                                                                        </details>
                                                                    </div>
                                                                ) : (
                                                                    <div className="mt-2 text-sm text-gray-500">No variants selected for this item</div>
                                                                )}
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    {item.trackingLink ? (
                                                                        <a href={item.trackingLink} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">View tracking</a>
                                                                    ) : (
                                                                        <span className="text-sm text-gray-500"> <strong></strong></span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <p className="text-gray-500">No items</p>
                                            )}
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Order Information</h4>
                                            <div className="space-y-2 p-2 bg-gray-50 rounded">
                                                <p><strong>Order Total:</strong> {currency}{order.amount || 0}</p>
                                                <p><strong>Total Items:</strong> {getTotalItems(order)}</p>
                                                <p><strong>Order Date:</strong> {formatDate(order.date)}</p>
                                                <p><strong>Customer ID:</strong> {order.userId?.slice(-8) || "N/A"}</p>
                                                    {/* {order.specialRequest && (
                                                        <p><strong>Special Request:</strong> <span className="whitespace-pre-line">{order.specialRequest}</span></p>
                                                    )} */}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Customer Information</h4>
                                            <div className="space-y-2 p-2 bg-gray-50 rounded">
                                                <p><strong>Name:</strong> {order.customer?.fullName || "N/A"}</p>
                                                <p><strong>Phone Number:</strong> {order.customer?.phoneNumber || "N/A"}</p>
                                                <p><strong>Shipping Address:</strong> {formatShippingAddress(order.customer?.shippingAddress)}</p>
                                                {order.customer?.fullName === "N/A" && order.customer?.phoneNumber === "N/A" && formatShippingAddress(order.customer?.shippingAddress) === "N/A" && (
                                                    <p className="text-red-600 text-xs">Customer data unavailable. Contact support.</p>
                                                )}
                                            </div>
                                            {/* Invoice area */}
                                            <div className="mt-3">
                                                {order.invoiceUrl ? (
                                                    <a href={order.invoiceUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">View invoice</a>
                                                ) : (
                                                    <button onClick={() => setInvoiceModalOrder(order)} className="text-sm bg-gray-100 px-3 py-1 rounded">Upload invoice (PDF)</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {order.cancellationReason && (
                                        <div className="mt-3 p-3 bg-red-50 rounded text-sm">
                                            <strong>Cancellation Reason:</strong> {order.cancellationReason}
                                        </div>
                                    )}

                                    {order.refundReason && (
                                        <div className="mt-3 p-3 bg-orange-50 rounded text-sm">
                                            <strong>Refund Reason:</strong> {order.refundReason}<br />
                                            <strong>Refunded on:</strong> {formatDate(order.refundDate)} at {formatTime(order.refundDate)}
                                        </div>
                                    )}
                                    {/* Admin-only note for this order (stored server-side per seller) */}
                                    <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                                        <strong>Admin Note (private):</strong>
                                        <div className="mt-2">
                                            {editingNoteId === order._id ? (
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={noteInput}
                                                        onChange={(e) => setNoteInput(e.target.value)}
                                                        className="w-full border rounded p-2"
                                                        rows={3}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button onClick={async () => {
                                                            try {
                                                                setLoading(true);
                                                                const token = await getToken();
                                                                const { data } = await axios.post('/api/order/admin-note', { orderId: order._id, note: noteInput }, { headers: { Authorization: `Bearer ${token}` } });
                                                                if (data.success) {
                                                                    // update order in state with new admin note
                                                                    setOrders(prev => prev.map(o => o._id === order._id ? { ...o, adminNotes: [...(o.adminNotes || []).filter(n => n.sellerId !== data.note.sellerId), data.note] } : o));
                                                                    toast.success('Note saved');
                                                                } else {
                                                                    toast.error(data.message || 'Failed to save note');
                                                                }
                                                            } catch (err) {
                                                                console.error('save admin note error', err);
                                                                toast.error(err?.response?.data?.message || 'Failed to save note');
                                                            } finally {
                                                                setEditingNoteId(null);
                                                                setNoteInput('');
                                                                setLoading(false);
                                                            }
                                                        }} className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
                                                        <button onClick={() => setEditingNoteId(null)} className="bg-gray-300 px-3 py-1 rounded">Cancel</button>
                                                        <button onClick={async () => {
                                                            try {
                                                                setLoading(true);
                                                                const token = await getToken();
                                                                const { data } = await axios.delete(`/api/order/admin-note?orderId=${order._id}`, { headers: { Authorization: `Bearer ${token}` } });
                                                                if (data.success) {
                                                                    // remove current seller's note from order in state
                                                                    setOrders(prev => prev.map(o => o._id === order._id ? { ...o, adminNotes: (o.adminNotes || []).filter(n => n.sellerId !== user?.id) } : o));
                                                                    toast.success('Note deleted');
                                                                } else {
                                                                    toast.error(data.message || 'Failed to delete note');
                                                                }
                                                            } catch (err) {
                                                                console.error('delete admin note error', err);
                                                                toast.error(err?.response?.data?.message || 'Failed to delete note');
                                                            } finally {
                                                                setEditingNoteId(null);
                                                                setNoteInput('');
                                                                setLoading(false);
                                                            }
                                                        }} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start justify-between">
                                                    <div className="whitespace-pre-line">{getSellerNoteForOrder(order, user?.id) || <span className="text-gray-500">No note</span>}</div>
                                                    <div className="ml-4">
                                                        <button onClick={() => { setEditingNoteId(order._id); setNoteInput(getSellerNoteForOrder(order, user?.id) || ""); }} className="text-sm text-blue-600">Edit</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Cancel Order Modal */}
            {cancellingOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">Cancel Order</h3>
                        <div className="space-y-2 mb-4">
                            {["Product unavailable", "Customer request", "Address issue", "Other"].map((reason) => (
                                <label key={reason} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="cancelReason"
                                        value={reason}
                                        checked={cancelReason === reason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        className="text-orange-600"
                                    />
                                    <span>{reason}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelOrder}
                                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => {
                                    setCancellingOrder(null);
                                    setCancelReason("");
                                }}
                                className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tracking Modal */}
            {trackingModalOrder && trackingModalProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">Add / Edit Tracking Link</h3>
                        <p className="text-sm text-gray-600 mb-3">Product: {trackingModalProduct.product?.name || trackingModalProduct.product}</p>
                        <input type="text" value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} placeholder="Enter tracking URL" className="w-full border p-2 rounded mb-4" />
                        <div className="flex gap-3">
                            <button onClick={async () => {
                                try {
                                    setLoading(true);
                                    const token = await getToken();
                                    const { data } = await axios.put('/api/order/seller-orders', {
                                        orderId: trackingModalOrder._id,
                                        trackingLink: trackingInput,
                                        productId: trackingModalProduct.product?._id || trackingModalProduct.product
                                    }, {
                                        headers: { Authorization: `Bearer ${token}` }
                                    });

                                            console.debug('saveTracking response', data);
                                            if (data.success) {
                                                if (data.order && data.order._id) {
                                                    await replaceOrderInState(data.order);
                                                } else {
                                                    // No order returned; re-fetch to ensure consistency
                                                    await fetchSellerOrders();
                                                }

                                                if (data.updateResult) {
                                                    const ur = data.updateResult;
                                                    const matched = ur.matchedCount ?? ur.n ?? ur.nMatched ?? 0;
                                                    const modified = ur.modifiedCount ?? ur.nModified ?? 0;
                                                    toast.success(`Tracking saved (matched: ${matched}, modified: ${modified})`);
                                                } else {
                                                    toast.success('Tracking link saved');
                                                }
                                            } else {
                                                const debug = data.debug ? JSON.stringify(data.debug) : null;
                                                toast.error((data.message || 'Failed to save tracking') + (debug ? ` - ${debug}` : ''));
                                            }
                                } catch (err) {
                                    console.error('save tracking error', err);
                                    toast.error(err?.response?.data?.message || 'Failed to save tracking');
                                } finally {
                                    setTrackingModalOrder(null);
                                    setTrackingModalProduct(null);
                                    setTrackingInput('');
                                    setLoading(false);
                                }
                            }} className="flex-1 bg-green-600 text-white py-2 rounded">Save</button>
                            <button onClick={() => { setTrackingModalOrder(null); setTrackingModalProduct(null); setTrackingInput(''); }} className="flex-1 bg-gray-300 py-2 rounded">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Upload Modal */}
            {invoiceModalOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">Upload Invoice (PDF)</h3>
                        <input type="file" accept="application/pdf" onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)} />
                        <div className="flex gap-3 mt-4">
                            <button onClick={async () => {
                                if (!invoiceFile) { toast.error('Please choose a PDF file'); return; }
                                try {
                                    setLoading(true);
                                    const token = await getToken();
                                    // read file as base64
                                    const b64 = await new Promise((res, rej) => {
                                        const reader = new FileReader();
                                        reader.onload = () => res(reader.result);
                                        reader.onerror = (err) => rej(err);
                                        reader.readAsDataURL(invoiceFile);
                                    });
                                    const { data } = await axios.post('/api/order/upload-invoice', { orderId: invoiceModalOrder._id, fileBase64: b64 }, { headers: { Authorization: `Bearer ${token}` } });
                                    if (data.success) {
                                        // update local order with returned URL
                                        setOrders(prev => prev.map(o => o._id === invoiceModalOrder._id ? { ...o, invoiceUrl: data.url } : o));
                                        toast.success('Invoice uploaded');
                                    } else {
                                        toast.error(data.message || 'Failed to upload invoice');
                                    }
                                } catch (err) {
                                    console.error('upload invoice error', err);
                                    toast.error(err?.response?.data?.message || 'Failed to upload invoice');
                                } finally {
                                    setInvoiceFile(null);
                                    setInvoiceModalOrder(null);
                                    setLoading(false);
                                }
                            }} className="flex-1 bg-green-600 text-white py-2 rounded">Upload</button>
                            <button onClick={() => { setInvoiceFile(null); setInvoiceModalOrder(null); }} className="flex-1 bg-gray-300 py-2 rounded">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Order Modal */}
            {refundingOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">Refund Payment</h3>
                        <div className="space-y-2 mb-4">
                            {["Product defective", "Wrong item", "Customer request", "Other"].map((reason) => (
                                <label key={reason} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="refundReason"
                                        value={reason}
                                        checked={refundReason === reason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        className="text-orange-600"
                                    />
                                    <span>{reason}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleRefund}
                                className="flex-1 bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => {
                                    setRefundingOrder(null);
                                    setRefundReason("");
                                }}
                                className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Orders;