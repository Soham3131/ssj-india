'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";


const MyOrders = () => {
    const { currency, getToken, user } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRequestFor, setEditingRequestFor] = useState(null);
    const [tempRequestText, setTempRequestText] = useState('');

    // Status colors for better visual indication
    const statusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        confirmed: "bg-blue-100 text-blue-800",
        shipped: "bg-purple-100 text-purple-800",
        delivered: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800"
    };

    const paymentStatusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        paid: "bg-green-100 text-green-800",
        failed: "bg-red-100 text-red-800"
    };

    // fetchOrders(background=false): when background=true we avoid toggling the global `loading`
    // This prevents the page from flashing the full Loading component during periodic polling.
    const fetchOrders = async (background = false) => {
        try {
            if (!background) setLoading(true);
            const token = await getToken();
            
            if (!token) {
                toast.error("Authentication required");
                setLoading(false);
                return;
            }

            const { data } = await axios.get('/api/order/list', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setOrders(data.orders?.reverse() || []); // Safe array reversal
            } else {
                toast.error(data.message || "Failed to fetch orders");
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error(error.response?.data?.message || "Failed to load orders");
        } finally {
            if (!background) setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [user]);

    // Poll periodically so tracking updates (added by sellers) show up without a manual refresh
    useEffect(() => {
        if (!user) return;
        let mounted = true;
        const interval = setInterval(() => {
            if (mounted) fetchOrders(true); // background fetch to avoid visual refresh
        }, 15000); // every 15s
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [user]);

    // Format status text to be more readable
    const formatStatus = (status) => {
        if (!status) return "Unknown";
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    // Safe price calculation using selectedOptions semantics
    const calculateItemUnitPrice = (item) => {
        const product = item.product || {};
        let unit = Number(product.offerPrice || product.price || 0);
        try {
            const sel = item.selectedOptions || null;
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
            // ignore
        }
        return Math.floor(unit * 100) / 100;
    }

    const calculateItemTotal = (item) => {
        const quantity = item.quantity || 0;
        const unit = calculateItemUnitPrice(item);
        return (quantity * unit).toFixed(2);
    }

    const formatPrice = (v) => {
        if (v === null || v === undefined) return '0';
        const n = Number(v);
        if (Number.isInteger(n)) return n.toString();
        return n.toFixed(2);
    }

    // Helper: get tracking link from item with defensive fallbacks
    const getTrackingLink = (item) => {
        if (!item) return '';
        // primary: item.trackingLink
        if (item.trackingLink) return item.trackingLink;
        // fallback: item.product?.trackingLink (in case product was populated differently)
        if (item.product && item.product.trackingLink) return item.product.trackingLink;
        // fallback: item.product?.details?.trackingLink
        if (item.product && item.product.details && item.product.details.trackingLink) return item.product.details.trackingLink;
        return '';
    };

    const formatUpdatedDate = (d) => {
        if (!d) return null;
        try {
            return new Date(d).toLocaleString();
        } catch (e) {
            return null;
        }
    };

    // Format order ID safely
    const formatOrderId = (order, index) => {
        if (order?._id) {
            return `#${order._id.slice(-8).toUpperCase()}`;
        }
        return `#ORD${index + 1}`;
    };

    // Safe date formatting
    const formatOrderDate = (date) => {
        if (!date) return "Date not available";
        try {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return "Invalid date";
        }

        const hasSelection = (sel) => {
            if (!sel && sel !== 0) return false;
            if (Array.isArray(sel)) return sel.length > 0;
            if (typeof sel === 'object') return Object.keys(sel).length > 0;
            // string/number -> considered a selection (e.g., color string)
            return true;
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                        <p className="text-gray-600 mt-2">Track your order status and history</p>
                        <p className="text-gray-600 mt-2">If you wish to cancel or return your order, please contact us at +91 99909 29900.</p>
                        <div className="mt-3">
                            <button onClick={() => { setLoading(true); fetchOrders(); }} className="text-sm bg-[#54B1CE] text-white px-3 py-1 rounded">Refresh orders</button>
                        </div>
                    </div>

                    {loading ? (
                        <Loading />
                    ) : !orders || orders.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
                                <Image
                                    src={assets.box_icon}
                                    alt="No orders"
                                    width={80}
                                    height={80}
                                    className="mx-auto mb-4 opacity-50"
                                />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                                <p className="text-gray-500">You haven't placed any orders yet.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {orders
                                .slice()
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .map((order, index) => (
                                <div key={order?._id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    {/* Order Header */}
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Order {formatOrderId(order, index)}
                                                </h3>
                                                {/* Add an explicit Add/Edit button in the header so users can add notes after ordering */}
                                                <div className="mt-2">
                                                    {editingRequestFor === order._id ? null : (
                                                        order.specialRequest ? (
                                                            <button
                                                                onClick={() => { setEditingRequestFor(order._id); setTempRequestText(order.specialRequest || ''); }}
                                                                className="text-sm text-[#054b6d] underline"
                                                            >
                                                                Edit special request
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => { setEditingRequestFor(order._id); setTempRequestText(''); }}
                                                                className="text-sm text-[#054b6d] underline"
                                                            >
                                                                Add a special request
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Placed on {formatOrderDate(order?.date)}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 items-center">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order?.status] || 'bg-gray-100 text-gray-800'}`}>
                                                    {formatStatus(order?.status)}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentStatusColors[order?.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
                                                    Payment: {formatStatus(order?.paymentStatus)}
                                                </span>
                                                {order?.specialRequest && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Special Request</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Content */}
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Products */}
                                            <div className="lg:col-span-2">
                                                <h4 className="font-medium text-gray-900 mb-3">Products</h4>
                                                <div className="space-y-3">
                                                    {order.items?.map((item, itemIndex) => (
                                                        <div key={itemIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <Image
                                                                src={item.product?.image?.[0] || assets.box_icon}
                                                                alt={item.product?.name || "Product image"}
                                                                width={60}
                                                                height={60}
                                                                className="rounded-lg object-cover flex-shrink-0"
                                                                onError={(e) => {
                                                                    e.target.src = assets.box_icon;
                                                                }}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-gray-900 truncate">
                                                                    {item.product?.name || "Product"}
                                                                </p>
                                                                    <p className="text-sm text-gray-600">
                                                                        Quantity: {item.quantity || 0} × {currency}{formatPrice(calculateItemUnitPrice(item))}
                                                                    </p>
                                                                    <p className="text-sm font-semibold text-gray-900">
                                                                        Total: {currency}{calculateItemTotal(item)}
                                                                    </p>
                                                                    {/* Render selected options if present (show label, price, delta, description, color) */}
                                                                    {item.selectedOptions ? (
                                                                        <div className="mt-2 flex flex-wrap gap-2 text-sm">
                                                                            {Array.isArray(item.selectedOptions) ? (
                                                                                item.selectedOptions.map((s, si) => (
                                                                                    <div key={si} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-gray-600 bg-white/0 p-1 rounded">
                                                                                        <div className="flex items-center gap-2">
                                                                                            {s && s.color ? <span className="inline-block w-5 h-5 rounded-full border" style={{ backgroundColor: s.color }} title={s.colorLabel || s.color} /> : null}
                                                                                            <span className="font-medium">{s?.label || s?.option || s?.value || JSON.stringify(s)}</span>
                                                                                        </div>
                                                                                        <div className="text-xs text-gray-500">
                                                                                            {s && s.price !== undefined && s.price !== null ? <span>Price: {currency}{Number(s.price).toFixed(2)}</span> : null}
                                                                                            {s && s.priceDelta ? <span className="ml-2">Δ {currency}{Number(s.priceDelta).toFixed(2)}</span> : null}
                                                                                            {s && s.description ? <div className="mt-1 text-xs text-gray-500">{s.description}</div> : null}
                                                                                        </div>
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                Object.entries(item.selectedOptions).map(([group, s], si) => (
                                                                                    <div key={si} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-gray-600 bg-white/0 p-1 rounded">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-xs text-gray-500">{group === '_productColor' ? 'Color' : group}</span>
                                                                                            {s && s.color ? <span className="inline-block w-5 h-5 rounded-full border" style={{ backgroundColor: s.color }} title={s.colorLabel || s.color} /> : null}
                                                                                            <span className="font-medium">{typeof s === 'string' ? s : (s?.label || s?.option || s?.value || JSON.stringify(s))}</span>
                                                                                        </div>
                                                                                        <div className="text-xs text-gray-500">
                                                                                            {s && s.price !== undefined && s.price !== null ? <span>Price: {currency}{Number(s.price).toFixed(2)}</span> : null}
                                                                                            {s && s.priceDelta ? <span className="ml-2">Δ {currency}{Number(s.priceDelta).toFixed(2)}</span> : null}
                                                                                            {s && s.description ? <div className="mt-1 text-xs text-gray-500">{s.description}</div> : null}
                                                                                        </div>
                                                                                    </div>
                                                                                ))
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="mt-2 text-sm text-gray-500">No variants selected for this item</div>
                                                                            )}
                                                                {getTrackingLink(item) ? (
                                                                    <div className="text-sm mt-1">
                                                                        <a href={getTrackingLink(item)} target="_blank" rel="noreferrer" className="text-blue-600 underline">Track shipment</a>
                                                                        {item.trackingUpdatedDate || (item.product && item.product.trackingUpdatedDate) ? (
                                                                            <div className="text-xs text-gray-500 mt-1">Updated {formatUpdatedDate(item.trackingUpdatedDate || (item.product && item.product.trackingUpdatedDate))}</div>
                                                                        ) : null}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm mt-1 text-gray-500"></p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )) || (
                                                        <p className="text-gray-500 text-sm">No items found</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Order Summary */}
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        {order.address ? (
                                                            <>
                                                                <p className="font-medium text-gray-900">{order.address.fullName}</p>
                                                                <p className="text-sm text-gray-600">{order.address.area}</p>
                                                                <p className="text-sm text-gray-600">
                                                                    {order.address.city}, {order.address.state}
                                                                </p>
                                                                <p className="text-sm text-gray-600">{order.address.phoneNumber}</p>
                                                                {order.address.email && (
                                                                    <p className="text-sm text-gray-600">{order.address.email}</p>
                                                                )}
                                                                {editingRequestFor === order._id ? (
                                                                    <div className="space-y-2">
                                                                        <textarea
                                                                            value={tempRequestText}
                                                                            onChange={(e) => setTempRequestText(e.target.value)}
                                                                            className="w-full p-2.5 border border-gray-300 rounded-md min-h-[80px]"
                                                                        />
                                                                        <div className="flex gap-2 justify-end">
                                                                            <button onClick={async () => {
                                                                                try {
                                                                                    setLoading(true);
                                                                                    const token = await getToken();
                                                                                    const { data } = await axios.post('/api/order/update-special', { orderId: order._id, specialRequest: tempRequestText }, { headers: { Authorization: `Bearer ${token}` } });
                                                                                    if (data.success) {
                                                                                        // replace the order in state
                                                                                        setOrders((prev) => prev.map(o => o._id === order._id ? data.order : o));
                                                                                        toast.success('Special request saved');
                                                                                    } else {
                                                                                        toast.error(data.message || 'Failed to save');
                                                                                    }
                                                                                } catch (err) {
                                                                                    console.error('save special request error', err);
                                                                                    toast.error(err?.response?.data?.message || 'Failed to save');
                                                                                } finally {
                                                                                    setEditingRequestFor(null);
                                                                                    setTempRequestText('');
                                                                                    setLoading(false);
                                                                                }
                                                                            }} className="bg-[#54B1CE] text-white px-4 py-2 rounded-md">Save</button>
                                                                            <button onClick={() => { setEditingRequestFor(null); setTempRequestText(''); }} className="px-4 py-2 border rounded-md">Cancel</button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    order.specialRequest ? (
                                                                        <p className="text-sm text-gray-700 mt-2"><strong>Special Request:</strong>
                                                                            <span className="whitespace-pre-wrap break-all block max-h-40 overflow-auto mt-1">{order.specialRequest}</span>
                                                                        </p>
                                                                    ) : (
                                                                        <div className="mt-2">
                                                                            <button onClick={() => { setEditingRequestFor(order._id); setTempRequestText(order.specialRequest || ''); }} className="text-sm text-[#054b6d] underline">Add a special request</button>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </>
                                                        ) : (
                                                            <p className="text-gray-500 text-sm">Address not available</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                                                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">Subtotal:</span>
                                                            <span className="font-medium">{currency}{order.amount || 0}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">Shipping:</span>
                                                            <span className="font-medium">{currency}0.00</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                                                            <span className="text-gray-600">Total:</span>
                                                            <span className="font-semibold text-lg">{currency}{order.amount || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Cancellation Reason if applicable */}
                                                {order.cancellationReason && (
                                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                        <h5 className="font-medium text-red-800 text-sm mb-1">Cancellation Reason</h5>
                                                        <p className="text-red-700 text-sm">{order.cancellationReason}</p>
                                                    </div>
                                                )}
                                                {/* Invoice link if seller uploaded one, otherwise show friendly placeholder */}
                                                {order.invoiceUrl ? (
                                                    <div className="bg-white border border-gray-100 rounded-lg p-3">
                                                        <h5 className="font-medium text-gray-900 text-sm mb-1">Invoice</h5>
                                                        <a href={order.invoiceUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">View / Download invoice</a>
                                                    </div>
                                                ) : (
                                                    <div className="bg-white border border-gray-100 rounded-lg p-3">
                                                        <h5 className="font-medium text-gray-900 text-sm mb-1">Invoice</h5>
                                                        <p className="text-sm text-gray-600">Bill will be updated soon</p>
                                                    </div>
                                                )}
                                                {/* Button under the order card to add/edit special request */}
                                                <div className="mt-4 flex justify-end">
                                                    {editingRequestFor === order._id ? null : (
                                                        <button
                                                            onClick={() => { setEditingRequestFor(order._id); setTempRequestText(order.specialRequest || ''); }}
                                                            className="text-sm bg-[#54B1CE] text-white px-4 py-2 rounded-md"
                                                        >
                                                            {order.specialRequest ? 'Edit special request' : 'Add special request'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default MyOrders;