// 'use client'
// import React, { useEffect, useState } from "react";
// import { assets } from "@/assets/assets";
// import Image from "next/image";
// import { useAppContext } from "@/context/AppContext";
// import Footer from "@/components/Footer";
// import Loading from "@/components/Loading";
// import axios from "axios";
// import toast from "react-hot-toast";

// const ProductList = () => {
//   const { router, getToken, user } = useAppContext();
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [searchLoading, setSearchLoading] = useState(false);
  
//   // Edit Modal States
//   const [editModalOpen, setEditModalOpen] = useState(false);
//   const [editingProduct, setEditingProduct] = useState(null);
//   const [editForm, setEditForm] = useState({
//     name: "",
//     description: "",
//     price: "",
//     offerPrice: "",
//     category: "",
//     brand: "",
//     subcategory: "",
//     stockQuantity: "",
//     clearStock: false,
//     minBuy: 1
//   });
//   const [editLoading, setEditLoading] = useState(false);
  
//   // File upload states
//   const [newImages, setNewImages] = useState([]);
//   const [newVideo, setNewVideo] = useState(null);
//   const [imagesToDelete, setImagesToDelete] = useState([]);
//   const [videoToDelete, setVideoToDelete] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);

//   const fetchSellerProduct = async (searchQuery = "") => {
//     try {
//       if (searchQuery) setSearchLoading(true);
//       else setLoading(true);
      
//       const token = await getToken();
//       const url = searchQuery 
//         ? `/api/product/seller-list?search=${encodeURIComponent(searchQuery)}&t=${Date.now()}`
//         : `/api/product/seller-list?t=${Date.now()}`;

//       const { data } = await axios.get(url, { 
//         headers: { Authorization: `Bearer ${token}` } 
//       });

//       if (data.success) {
//         setProducts(data.products);
//         setLoading(false);
//         setSearchLoading(false);
//       } else {
//         toast.error(data.message);
//         setSearchLoading(false);
//       }
//     } catch (error) {
//       toast.error(error.message);
//       setSearchLoading(false);
//     }
//   };

//   // Handle search with debounce
//   useEffect(() => {
//     const delayDebounceFn = setTimeout(() => {
//       fetchSellerProduct(searchTerm);
//     }, 500);

//     return () => clearTimeout(delayDebounceFn);
//   }, [searchTerm]);

//   // Open Edit Modal
//   const openEditModal = (product) => {
//     setEditingProduct(product);
//     setEditForm({
//       name: product.name,
//       description: product.description,
//       price: product.price,
//       offerPrice: product.offerPrice,
//       category: product.category,
//       brand: product.brand,
//       subcategory: product.subcategory,
//   stockQuantity: product.stockQuantity !== undefined && product.stockQuantity !== null ? product.stockQuantity : '',
//       clearStock: false,
//       minBuy: product.minBuy || 1,
//       variants: product.variants || []
//     });
//     setNewImages([]);
//     setNewVideo(null);
//     setImagesToDelete([]);
//     setVideoToDelete(false);
//     setUploadProgress(0);
//     setEditModalOpen(true);
//   };

//   // Close Edit Modal
//   const closeEditModal = () => {
//     setEditModalOpen(false);
//     setEditingProduct(null);
//     setEditForm({
//       name: "",
//       description: "",
//       price: "",
//       offerPrice: "",
//       category: "",
//       brand: "",
//       subcategory: "",
//       stockQuantity: "",
//       clearStock: false,
//       minBuy: 1
//     });
//     setNewImages([]);
//     setNewVideo(null);
//     setImagesToDelete([]);
//     setVideoToDelete(false);
//     setUploadProgress(0);
//   };

//   // Handle image selection
//   const handleImageSelect = (e) => {
//     const files = Array.from(e.target.files);
//     if (files.length + newImages.length > 5) {
//       toast.error("Maximum 5 images allowed");
//       return;
//     }
//     setNewImages([...newImages, ...files]);
//   };

//   // Remove new image
//   const removeNewImage = (index) => {
//     const updatedImages = [...newImages];
//     updatedImages.splice(index, 1);
//     setNewImages(updatedImages);
//   };

//   // Remove existing image
//   const removeExistingImage = (imageUrl) => {
//     setImagesToDelete([...imagesToDelete, imageUrl]);
//   };

//   // Restore existing image
//   const restoreExistingImage = (imageUrl) => {
//     setImagesToDelete(imagesToDelete.filter(img => img !== imageUrl));
//   };

//   // Handle video selection
//   const handleVideoSelect = (e) => {
//     const file = e.target.files[0];
//     if (file && file.size > 50 * 1024 * 1024) {
//       toast.error("Video size should be less than 50MB");
//       return;
//     }
//     setNewVideo(file);
//   };

//   // Remove video
//   const removeVideo = () => {
//     if (editingProduct?.video) {
//       setVideoToDelete(true);
//     }
//     setNewVideo(null);
//   };

//   // Restore video
//   const restoreVideo = () => {
//     setVideoToDelete(false);
//   };

//   // Get current images after deletions
//   const getCurrentImages = () => {
//     if (!editingProduct) return [];
//     return editingProduct.image.filter(img => !imagesToDelete.includes(img));
//   };

//   // Get current video
//   const getCurrentVideo = () => {
//     if (videoToDelete) return null;
//     return editingProduct?.video || null;
//   };

//   // Handle Edit Form Submit
//   const handleEditSubmit = async (e) => {
//     e.preventDefault();
//     setEditLoading(true);
//     setUploadProgress(0);

//     try {
//       // Client-side validation: ensure stock >= minBuy before upload
//       // If seller chose to 'Make unlimited' (clearStock) or left stock blank, skip this check
//       const numericMinBuy = Number(editForm.minBuy) || 1
//       const hasStockValue = !(editForm.clearStock) && editForm.stockQuantity !== undefined && editForm.stockQuantity !== null && editForm.stockQuantity !== '';
//       if (hasStockValue) {
//         const numericStock = Number(editForm.stockQuantity)
//         if (isNaN(numericStock) || numericStock < numericMinBuy) {
//           toast.error(`Stock quantity (${numericStock}) cannot be less than Minimum Buy (${numericMinBuy})`)
//           setEditLoading(false)
//           return
//         }
//       }

//       const token = await getToken();
//       const formData = new FormData();

//       formData.append('productId', editingProduct._id);
//       formData.append('name', editForm.name);
//       formData.append('description', editForm.description);
//   // Use a single price field: mirror offerPrice into price
//   formData.append('price', editForm.offerPrice);
//   formData.append('offerPrice', editForm.offerPrice);
//   formData.append('category', editForm.category === 'Other' ? (editForm.customCategory || '') : editForm.category);
//   formData.append('brand', editForm.brand === 'Other' ? (editForm.customBrand || '') : editForm.brand);
//   formData.append('subcategory', editForm.subcategory === 'Other' ? (editForm.customSubcategory || '') : editForm.subcategory);
//       // Append stockQuantity only when present (empty string means leave unchanged)
//       if (editForm.stockQuantity !== undefined && editForm.stockQuantity !== null && editForm.stockQuantity !== '') {
//         formData.append('stockQuantity', editForm.stockQuantity);
//       }
//   formData.append('minBuy', editForm.minBuy);

//   // If seller marked 'Make unlimited', include a clearStock flag so server can unset stockQuantity
//   if (editForm.clearStock) {
//     formData.append('clearStock', 'true');
//   }

//       // Append variants JSON if present
//       if (editForm.variants && editForm.variants.length > 0) {
//         formData.append('variants', JSON.stringify(editForm.variants));
//       }

//       imagesToDelete.forEach(imageUrl => {
//         formData.append('imagesToDelete', imageUrl);
//       });

//       if (videoToDelete) {
//         formData.append('deleteVideo', 'true');
//       }

//       newImages.forEach(image => {
//         formData.append('images', image);
//       });

//       if (newVideo) {
//         formData.append('video', newVideo);
//       }

//       const { data } = await axios.put('/api/product/seller-list', formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'multipart/form-data'
//         },
//         onUploadProgress: (progressEvent) => {
//           const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//           setUploadProgress(percentCompleted);
//         }
//       });

//       if (data.success) {
//         toast.success('Product updated successfully!');
//         fetchSellerProduct(searchTerm);
//         closeEditModal();
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       toast.error(error.response?.data?.message || error.message);
//     } finally {
//       setEditLoading(false);
//       setUploadProgress(0);
//     }
//   };

//   // Delete Product
//   const deleteProduct = async (productId, productName) => {
//     if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;

//     try {
//       const token = await getToken();
//       const { data } = await axios.delete(`/api/product/seller-list?id=${productId}&t=${Date.now()}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       if (data.success) {
//         toast.success('Product deleted successfully!');
//         fetchSellerProduct(searchTerm);
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       toast.error(error.response?.data?.message || error.message);
//     }
//   };

//   useEffect(() => {
//     if (user) {
//       fetchSellerProduct();
//     }
//   }, [user]);

//   return (
//     <div className="flex-1 min-h-screen flex flex-col justify-between">
//       {loading ? <Loading /> : (
//         <div className="w-full md:p-10 p-4">
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
//             <div>
//               <h2 className="text-2xl font-bold text-gray-800">My Products</h2>
//               <p className="text-gray-600">{products.length} product{products.length !== 1 ? 's' : ''} found</p>
//             </div>
            
//             <div className="relative w-full md:w-80">
//               <div className="relative">
//                 <input
//                   type="text"
//                   placeholder="Search products by name, brand, category..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
//                 />
//                 <Image
//                   src={assets.search_icon}
//                   alt="Search"
//                   className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
//                   width={20}
//                   height={20}
//                 />
//                 {searchLoading && (
//                   <div className="absolute right-3 top-2.5">
//                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
//             <table className="w-full">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Brand</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {products.map((product) => (
//                   <tr key={product._id} className="hover:bg-gray-50 transition-colors">
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <div className="flex-shrink-0 h-10 w-10">
//                           <Image
//                             src={product.image[0]}
//                             alt={product.name}
//                             className="h-10 w-10 rounded-lg object-cover"
//                             width={40}
//                             height={40}
//                           />
//                         </div>
//                         <div className="ml-4">
//                           <div className="text-sm font-medium text-gray-900">{product.name}</div>
//                           <div className="text-sm text-gray-500 md:hidden">
//                             {product.category} • {product.brand}
//                             {product.stockQuantity !== undefined && product.stockQuantity !== null && product.stockQuantity !== '' && (
//                               <span> • Stock: {product.stockQuantity}</span>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
//                       {product.category}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
//                       {product.brand}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       <span className="font-semibold text-green-600">₹{product.offerPrice}</span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                       {product.stockQuantity !== undefined && product.stockQuantity !== null && product.stockQuantity !== '' ? (
//                         <span className={`px-2 py-1 rounded-full text-xs ${
//                           product.stockQuantity > 10 
//                             ? 'bg-green-100 text-green-800' 
//                             : product.stockQuantity > 0 
//                               ? 'bg-yellow-100 text-yellow-800' 
//                               : 'bg-red-100 text-red-800'
//                         }`}>
//                           {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
//                         </span>
//                       ) : (
//                         <span className="text-sm text-gray-500">&nbsp;</span>
//                       )}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                       <div className="flex space-x-2">
//                         <button
//                           onClick={() => router.push(`/product/${product._id}`)}
//                           className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs transition-colors"
//                         >
//                           View
//                         </button>
//                         <button
//                           onClick={() => openEditModal(product)}
//                           className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-xs transition-colors"
//                         >
//                           Edit
//                         </button>
//                         <button
//                           onClick={() => deleteProduct(product._id, product.name)}
//                           className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs transition-colors"
//                         >
//                           Delete
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>

//             {products.length === 0 && (
//               <div className="text-center py-12">
//                 <div className="text-gray-400 mb-4">
//                   <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v1m8 0h-8" />
//                   </svg>
//                 </div>
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
//                 <p className="text-gray-500 max-w-md mx-auto">
//                   {searchTerm ? `No products match "${searchTerm}". Try different search terms.` : "You haven't added any products yet."}
//                 </p>
//                 {!searchTerm && (
//                   <button
//                     onClick={() => router.push('/seller/add-product')}
//                     className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
//                   >
//                     Add Your First Product
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {editModalOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <h3 className="text-xl font-semibold">Edit Product</h3>
//                 <button 
//                   onClick={closeEditModal}
//                   className="text-gray-500 hover:text-gray-700 text-2xl"
//                 >
//                   ×
//                 </button>
//               </div>

//               <form onSubmit={handleEditSubmit} className="space-y-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
//                     <input
//                       type="text"
//                       value={editForm.name}
//                       onChange={(e) => setEditForm({...editForm, name: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
//                     <input
//                       list="brandListEdit"
//                       value={editForm.brand}
//                       onChange={(e) => setEditForm({...editForm, brand: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
//                       placeholder="Select or type brand"
//                       required
//                     />
//                     <datalist id="brandListEdit">
//                       {/* Populate from common list - lightweight duplicate is fine here */}
//                       <option value="JBL" />
//                       <option value="Sony" />
//                       <option value="Samsung" />
//                       <option value="Mi" />
//                       <option value="Apple" />
//                       <option value="OnePlus" />
//                       <option value="Realme" />
//                       <option value="Noise" />
//                       <option value="Boult" />
//                       <option value="Other" />
//                     </datalist>
//                     {editForm.brand === 'Other' && (
//                       <input
//                         type="text"
//                         value={editForm.customBrand || ''}
//                         onChange={(e) => setEditForm({...editForm, customBrand: e.target.value})}
//                         placeholder="Enter custom brand"
//                         className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
//                       />
//                     )}
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
//                   <textarea
//                     value={editForm.description}
//                     onChange={(e) => setEditForm({...editForm, description: e.target.value})}
//                     rows={3}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
//                     required
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
//                     <input
//                       list="categoryListEdit"
//                       value={editForm.category}
//                       onChange={(e) => setEditForm({...editForm, category: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
//                       placeholder="Select or type category"
//                       required
//                     />
//                     <datalist id="categoryListEdit">
//                       <option value="Handsfree" />
//                       <option value="Earbuds" />
//                       <option value="Mix Items" />
//                       <option value="Car Bluetooth" />
//                       <option value="OTG Cables" />
//                       <option value="Car Chargers" />
//                       <option value="Cables and Chargers" />
//                       <option value="Battery" />
//                       <option value="Selfie Sticks" />
//                       <option value="Car and Bike Stand" />
//                       <option value="Other" />
//                     </datalist>
//                     {editForm.category === 'Other' && (
//                       <input
//                         type="text"
//                         value={editForm.customCategory || ''}
//                         onChange={(e) => setEditForm({...editForm, customCategory: e.target.value})}
//                         placeholder="Enter custom category"
//                         className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
//                       />
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
//                     <input
//                       list="subcategoryListEdit"
//                       value={editForm.subcategory}
//                       onChange={(e) => setEditForm({...editForm, subcategory: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
//                       placeholder="Select or type subcategory"
//                       required
//                     />
//                     <datalist id="subcategoryListEdit">
//                       {/* If category-specific subcategories exist, it's fine to keep a generic list here */}
//                       <option value="Other" />
//                     </datalist>
//                     {editForm.subcategory === 'Other' && (
//                       <input
//                         type="text"
//                         value={editForm.customSubcategory || ''}
//                         onChange={(e) => setEditForm({...editForm, customSubcategory: e.target.value})}
//                         placeholder="Enter custom subcategory"
//                         className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
//                       />
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
//                     <div className="flex items-center gap-2">
//                       <input
//                         type="number"
//                         min="0"
//                         value={editForm.stockQuantity}
//                         onChange={(e) => setEditForm({...editForm, stockQuantity: e.target.value, clearStock: false})}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
//                       />
//                       <button
//                         type="button"
//                         className={`px-2 py-1 text-sm rounded border ${editForm.clearStock ? 'bg-green-100 border-green-300' : 'bg-white border-gray-200'}`}
//                         onClick={() => setEditForm({...editForm, stockQuantity: '', clearStock: true})}
//                       >
//                         Make unlimited
//                       </button>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Offer Price (₹)</label>
//                     <input
//                       type="number"
//                       value={editForm.offerPrice}
//                       onChange={(e) => setEditForm({...editForm, offerPrice: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Buy Quantity</label>
//                     <input
//                       type="number"
//                       min="1"
//                       value={editForm.minBuy}
//                       onChange={(e) => setEditForm({...editForm, minBuy: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
//                       required
//                     />
//                   </div>
//                 </div>

//                 {/* Variants editor (lightweight) */}
//                 <div className="mt-4">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Variants (optional)</label>
//                   <div className="space-y-3">
//                     {(editForm.variants || []).map((group, gi) => (
//                       <div key={gi} className="p-3 border rounded">
//                         <div className="flex items-center gap-2">
//                           <input className="flex-1 px-2 py-1 border rounded" value={group.name} onChange={(e) => { const c = {...editForm}; c.variants[gi].name = e.target.value; setEditForm(c); }} placeholder="Group name e.g., Storage" />
//                           <button type="button" className="text-red-500" onClick={() => { const c = {...editForm}; c.variants.splice(gi,1); setEditForm(c); }}>Remove Group</button>
//                         </div>
//                         <div className="mt-2 space-y-2">
//                           {group.options.map((opt, oi) => (
//                             <div key={oi} className="flex gap-2 items-center">
//                               <input className="flex-1 px-2 py-1 border rounded" value={opt.label} onChange={(e) => { const c = {...editForm}; c.variants[gi].options[oi].label = e.target.value; setEditForm(c); }} placeholder="Option label" />
//                               <input className="w-24 px-2 py-1 border rounded" value={opt.price} onChange={(e) => { const c = {...editForm}; c.variants[gi].options[oi].price = e.target.value; setEditForm(c); }} placeholder="price (absolute)" />
//                               <input className="w-28 px-2 py-1 border rounded" value={opt.priceDelta} onChange={(e) => { const c = {...editForm}; c.variants[gi].options[oi].priceDelta = e.target.value; setEditForm(c); }} placeholder="price delta" />
//                               <input className="w-40 px-2 py-1 border rounded" value={opt.description || ''} onChange={(e) => { const c = {...editForm}; c.variants[gi].options[oi].description = e.target.value; setEditForm(c); }} placeholder="description (optional)" />
//                               <input className="w-32 px-2 py-1 border rounded" value={opt.colors || ''} onChange={(e) => { const c = {...editForm}; c.variants[gi].options[oi].colors = e.target.value; setEditForm(c); }} placeholder="colors e.g. Red,Blue" />
//                               <button type="button" className="text-red-500" onClick={() => { const c = {...editForm}; c.variants[gi].options.splice(oi,1); setEditForm(c); }}>Remove</button>
//                             </div>
//                           ))}
//                           <div>
//                             <button type="button" className="px-2 py-1 bg-gray-100 rounded" onClick={() => { const c = {...editForm}; c.variants[gi].options.push({ label: '', price: '', priceDelta: 0, stock: '' }); setEditForm(c); }}>Add Option</button>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                     <div>
//                       <button type="button" className="px-3 py-1 bg-green-100 rounded" onClick={() => { const c = {...editForm}; c.variants = c.variants || []; c.variants.push({ name: '', options: [] }); setEditForm(c); }}>Add Variant Group</button>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="border-t pt-6">
//                   <h4 className="text-lg font-medium text-gray-900 mb-4">Product Images</h4>
                  
//                   {getCurrentImages().length > 0 && (
//                     <div className="mb-6">
//                       <label className="block text-sm font-medium text-gray-700 mb-3">Current Images</label>
//                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
//                         {getCurrentImages().map((imageUrl, index) => (
//                           <div key={index} className="relative group">
//                             <Image
//                               src={imageUrl}
//                               alt={`Product image ${index + 1}`}
//                               className="w-full h-24 object-cover rounded-lg border"
//                               width={100}
//                               height={100}
//                             />
//                             <button
//                               type="button"
//                               onClick={() => removeExistingImage(imageUrl)}
//                               className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
//                             >
//                               ×
//                             </button>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {imagesToDelete.length > 0 && (
//                     <div className="mb-6 p-3 bg-yellow-50 rounded-lg">
//                       <label className="block text-sm font-medium text-yellow-700 mb-3">Removed Images (Click to restore)</label>
//                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
//                         {imagesToDelete.map((imageUrl, index) => (
//                           <div key={index} className="relative">
//                             <Image
//                               src={imageUrl}
//                               alt={`Removed image ${index + 1}`}
//                               className="w-full h-24 object-cover rounded-lg border border-yellow-300 opacity-50"
//                               width={100}
//                               height={100}
//                             />
//                             <button
//                               type="button"
//                               onClick={() => restoreExistingImage(imageUrl)}
//                               className="absolute inset-0 bg-green-500 bg-opacity-50 text-white flex items-center justify-center rounded-lg"
//                             >
//                               Restore
//                             </button>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   <div className="mb-4">
//                     <label className="block text-sm font-medium text-gray-700 mb-3">Add New Images ({newImages.length}/5)</label>
//                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
//                       {newImages.map((image, index) => (
//                         <div key={index} className="relative group">
//                           <Image
//                             src={URL.createObjectURL(image)}
//                             alt={`New image ${index + 1}`}
//                             className="w-full h-24 object-cover rounded-lg border"
//                             width={100}
//                             height={100}
//                           />
//                           <button
//                             type="button"
//                             onClick={() => removeNewImage(index)}
//                             className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
//                           >
//                             ×
//                           </button>
//                         </div>
//                       ))}
                      
//                       {newImages.length < 5 && (
//                         <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
//                           <div className="flex flex-col items-center justify-center pt-5 pb-6">
//                             <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//                             </svg>
//                             <span className="text-sm text-gray-500">Add Image</span>
//                           </div>
//                           <input
//                             type="file"
//                             multiple
//                             accept="image/*"
//                             onChange={handleImageSelect}
//                             className="hidden"
//                           />
//                         </label>
//                       )}
//                     </div>
//                   </div>
//                   <div className="mt-4">
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Product Colors Preview</label>
//                     <div className="flex gap-2">
//                       {(editForm.colors || []).map((c, idx) => (
//                         <div key={idx} className="flex items-center gap-2">
//                           <span className="w-6 h-6 rounded-full border" style={{ backgroundColor: c.color || c.label }} />
//                           <span className="text-sm">{c.label}</span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="border-t pt-6">
//                   <h4 className="text-lg font-medium text-gray-900 mb-4">Product Video</h4>
                  
//                   {getCurrentVideo() && !newVideo && (
//                     <div className="mb-4">
//                       <label className="block text-sm font-medium text-gray-700 mb-3">Current Video</label>
//                       <div className="relative">
//                         <video
//                           controls
//                           className="w-full max-w-md rounded-lg border"
//                           src={getCurrentVideo()}
//                         />
//                         <button
//                           type="button"
//                           onClick={removeVideo}
//                           className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
//                         >
//                           ×
//                         </button>
//                       </div>
//                     </div>
//                   )}

//                   {videoToDelete && !newVideo && (
//                     <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
//                       <label className="block text-sm font-medium text-yellow-700 mb-3">Video Removed</label>
//                       <button
//                         type="button"
//                         onClick={restoreVideo}
//                         className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
//                       >
//                         Restore Video
//                       </button>
//                     </div>
//                   )}

//                   {newVideo && (
//                     <div className="mb-4">
//                       <label className="block text-sm font-medium text-gray-700 mb-3">New Video Preview</label>
//                       <div className="relative">
//                         <video
//                           controls
//                           className="w-full max-w-md rounded-lg border"
//                           src={URL.createObjectURL(newVideo)}
//                         />
//                         <button
//                           type="button"
//                           onClick={removeVideo}
//                           className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
//                         >
//                           ×
//                         </button>
//                       </div>
//                     </div>
//                   )}

//                   {!newVideo && (
//                     <label className="flex flex-col items-center justify-center w-full max-w-md p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
//                       <div className="flex flex-col items-center justify-center">
//                         <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
//                         </svg>
//                         <span className="text-sm text-gray-500">
//                           {getCurrentVideo() ? 'Replace Video' : 'Add Video (Max 50MB)'}
//                         </span>
//                       </div>
//                       <input
//                         type="file"
//                         accept="video/*"
//                         onChange={handleVideoSelect}
//                         className="hidden"
//                       />
//                     </label>
//                   )}
//                 </div>

//                 {uploadProgress > 0 && uploadProgress < 100 && (
//                   <div className="bg-blue-50 p-4 rounded-lg">
//                     <div className="flex justify-between items-center mb-2">
//                       <span className="text-sm font-medium text-blue-700">Uploading...</span>
//                       <span className="text-sm text-blue-700">{uploadProgress}%</span>
//                     </div>
//                     <div className="w-full bg-blue-200 rounded-full h-2">
//                       <div 
//                         className="bg-blue-600 h-2 rounded-full transition-all duration-300"
//                         style={{ width: `${uploadProgress}%` }}
//                       ></div>
//                     </div>
//                   </div>
//                 )}

//                 <div className="flex gap-4 pt-4 border-t">
//                   <button
//                     type="submit"
//                     disabled={editLoading}
//                     className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
//                   >
//                     {editLoading ? 'Updating...' : 'Update Product'}
//                   </button>
//                   <button
//                     type="button"
//                     onClick={closeEditModal}
//                     className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}

//       <Footer />
//     </div>
//   );
// };

// export default ProductList;

'use client'
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const ProductList = () => {
  const { router, getToken, user } = useAppContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    offerPrice: "",
    category: "",
    brand: "",
    subcategory: "",
    stockQuantity: "",
    clearStock: false,
    minBuy: 1
  });
  const [editLoading, setEditLoading] = useState(false);
  
  // File upload states
  const [newImages, setNewImages] = useState([]);
  const [newVideo, setNewVideo] = useState(null);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [videoToDelete, setVideoToDelete] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchSellerProduct = async (searchQuery = "") => {
    try {
      if (searchQuery) setSearchLoading(true);
      else setLoading(true);
      
      const token = await getToken();
      const url = searchQuery 
        ? `/api/product/seller-list?search=${encodeURIComponent(searchQuery)}&t=${Date.now()}`
        : `/api/product/seller-list?t=${Date.now()}`;

      const { data } = await axios.get(url, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (data.success) {
        setProducts(data.products);
        setLoading(false);
        setSearchLoading(false);
      } else {
        toast.error(data.message);
        setSearchLoading(false);
      }
    } catch (error) {
      toast.error(error.message);
      setSearchLoading(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSellerProduct(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Open Edit Modal
  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price,
      offerPrice: product.offerPrice,
      category: product.category,
      brand: product.brand,
      subcategory: product.subcategory,
  stockQuantity: product.stockQuantity !== undefined && product.stockQuantity !== null ? product.stockQuantity : '',
      clearStock: false,
      minBuy: product.minBuy || 1,
      variants: product.variants || []
    });
    setNewImages([]);
    setNewVideo(null);
    setImagesToDelete([]);
    setVideoToDelete(false);
    setUploadProgress(0);
    setEditModalOpen(true);
  };

  // Close Edit Modal
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingProduct(null);
    setEditForm({
      name: "",
      description: "",
      price: "",
      offerPrice: "",
      category: "",
      brand: "",
      subcategory: "",
      stockQuantity: "",
      clearStock: false,
      minBuy: 1
    });
    setNewImages([]);
    setNewVideo(null);
    setImagesToDelete([]);
    setVideoToDelete(false);
    setUploadProgress(0);
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + newImages.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    setNewImages([...newImages, ...files]);
  };

  // Remove new image
  const removeNewImage = (index) => {
    const updatedImages = [...newImages];
    updatedImages.splice(index, 1);
    setNewImages(updatedImages);
  };

  // Remove existing image
  const removeExistingImage = (imageUrl) => {
    setImagesToDelete([...imagesToDelete, imageUrl]);
  };

  // Restore existing image
  const restoreExistingImage = (imageUrl) => {
    setImagesToDelete(imagesToDelete.filter(img => img !== imageUrl));
  };

  // Handle video selection
  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 50 * 1024 * 1024) {
      toast.error("Video size should be less than 50MB");
      return;
    }
    setNewVideo(file);
  };

  // Remove video
  const removeVideo = () => {
    if (editingProduct?.video) {
      setVideoToDelete(true);
    }
    setNewVideo(null);
  };

  // Restore video
  const restoreVideo = () => {
    setVideoToDelete(false);
  };

  // Get current images after deletions
  const getCurrentImages = () => {
    if (!editingProduct) return [];
    return editingProduct.image.filter(img => !imagesToDelete.includes(img));
  };

  // Get current video
  const getCurrentVideo = () => {
    if (videoToDelete) return null;
    return editingProduct?.video || null;
  };

  // Handle Edit Form Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setUploadProgress(0);

    try {
      // Client-side validation: ensure stock >= minBuy before upload
      // If seller chose to 'Make unlimited' (clearStock) or left stock blank, skip this check
      const numericMinBuy = Number(editForm.minBuy) || 1
      const hasStockValue = !(editForm.clearStock) && editForm.stockQuantity !== undefined && editForm.stockQuantity !== null && editForm.stockQuantity !== '';
      if (hasStockValue) {
        const numericStock = Number(editForm.stockQuantity)
        if (isNaN(numericStock) || numericStock < numericMinBuy) {
          toast.error(`Stock quantity (${numericStock}) cannot be less than Minimum Buy (${numericMinBuy})`)
          setEditLoading(false)
          return
        }
      }

      const token = await getToken();
      const formData = new FormData();

      formData.append('productId', editingProduct._id);
      formData.append('name', editForm.name);
      formData.append('description', editForm.description);
  // Use a single price field: mirror offerPrice into price
  formData.append('price', editForm.offerPrice);
  formData.append('offerPrice', editForm.offerPrice);
  formData.append('category', editForm.category === 'Other' ? (editForm.customCategory || '') : editForm.category);
  formData.append('brand', editForm.brand === 'Other' ? (editForm.customBrand || '') : editForm.brand);
  formData.append('subcategory', editForm.subcategory === 'Other' ? (editForm.customSubcategory || '') : editForm.subcategory);
      // Append stockQuantity only when present (empty string means leave unchanged)
      if (editForm.stockQuantity !== undefined && editForm.stockQuantity !== null && editForm.stockQuantity !== '') {
        formData.append('stockQuantity', editForm.stockQuantity);
      }
  formData.append('minBuy', editForm.minBuy);

  // If seller marked 'Make unlimited', include a clearStock flag so server can unset stockQuantity
  if (editForm.clearStock) {
    formData.append('clearStock', 'true');
  }

      // Append variants JSON if present
      if (editForm.variants && editForm.variants.length > 0) {
        formData.append('variants', JSON.stringify(editForm.variants));
      }

      imagesToDelete.forEach(imageUrl => {
        formData.append('imagesToDelete', imageUrl);
      });

      if (videoToDelete) {
        formData.append('deleteVideo', 'true');
      }

      newImages.forEach(image => {
        formData.append('images', image);
      });

      if (newVideo) {
        formData.append('video', newVideo);
      }

      const { data } = await axios.put('/api/product/seller-list', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (data.success) {
        toast.success('Product updated successfully!');
        fetchSellerProduct(searchTerm);
        closeEditModal();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setEditLoading(false);
      setUploadProgress(0);
    }
  };

  // Delete Product
  const deleteProduct = async (productId, productName) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;

    try {
      const token = await getToken();
      const { data } = await axios.delete(`/api/product/seller-list?id=${productId}&t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success('Product deleted successfully!');
        fetchSellerProduct(searchTerm);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSellerProduct();
    }
  }, [user]);

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading ? <Loading /> : (
        <div className="w-full md:p-10 p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">My Products</h2>
              <p className="text-gray-600">{products.length} product{products.length !== 1 ? 's' : ''} found</p>
            </div>
            
            <div className="relative w-full md:w-80">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products by name, brand, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <Image
                  src={assets.search_icon}
                  alt="Search"
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  width={20}
                  height={20}
                />
                {searchLoading && (
                  <div className="absolute right-3 top-2.5">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Image
                            src={product.image[0]}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover"
                            width={40}
                            height={40}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 md:hidden">
                            {product.category} • {product.brand}
                            {product.stockQuantity !== undefined && product.stockQuantity !== null && product.stockQuantity !== '' && (
                              <span> • Stock: {product.stockQuantity}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      {product.brand}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-semibold text-green-600">₹{product.offerPrice}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {product.stockQuantity !== undefined && product.stockQuantity !== null && product.stockQuantity !== '' ? (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.stockQuantity > 10 
                            ? 'bg-green-100 text-green-800' 
                            : product.stockQuantity > 0 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">&nbsp;</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/product/${product._id}`)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEditModal(product)}
                          className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-xs transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProduct(product._id, product.name)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {products.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v1m8 0h-8" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {searchTerm ? `No products match "${searchTerm}". Try different search terms.` : "You haven't added any products yet."}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => router.push('/seller/add-product')}
                    className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                  >
                    Add Your First Product
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Edit Product</h3>
                <button 
                  onClick={closeEditModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                    <input
                      list="brandListEdit"
                      value={editForm.brand}
                      onChange={(e) => setEditForm({...editForm, brand: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Select or type brand"
                      required
                    />
                    <datalist id="brandListEdit">
                      {/* Populate from common list - lightweight duplicate is fine here */}
                      <option value="JBL" />
                      <option value="Sony" />
                      <option value="Samsung" />
                      <option value="Mi" />
                      <option value="Apple" />
                      <option value="OnePlus" />
                      <option value="Realme" />
                      <option value="Noise" />
                      <option value="Boult" />
                      <option value="Other" />
                    </datalist>
                    {editForm.brand === 'Other' && (
                      <input
                        type="text"
                        value={editForm.customBrand || ''}
                        onChange={(e) => setEditForm({...editForm, customBrand: e.target.value})}
                        placeholder="Enter custom brand"
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <input
                      list="categoryListEdit"
                      value={editForm.category}
                      onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Select or type category"
                      required
                    />
                    <datalist id="categoryListEdit">
                      <option value="Handsfree" />
                      <option value="Earbuds" />
                      <option value="Mix Items" />
                      <option value="Car Bluetooth" />
                      <option value="OTG Cables" />
                      <option value="Car Chargers" />
                      <option value="Cables and Chargers" />
                      <option value="Battery" />
                      <option value="Selfie Sticks" />
                      <option value="Car and Bike Stand" />
                      <option value="Other" />
                    </datalist>
                    {editForm.category === 'Other' && (
                      <input
                        type="text"
                        value={editForm.customCategory || ''}
                        onChange={(e) => setEditForm({...editForm, customCategory: e.target.value})}
                        placeholder="Enter custom category"
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                    <input
                      list="subcategoryListEdit"
                      value={editForm.subcategory}
                      onChange={(e) => setEditForm({...editForm, subcategory: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Select or type subcategory"
                      required
                    />
                    <datalist id="subcategoryListEdit">
                      {/* If category-specific subcategories exist, it's fine to keep a generic list here */}
                      <option value="Other" />
                    </datalist>
                    {editForm.subcategory === 'Other' && (
                      <input
                        type="text"
                        value={editForm.customSubcategory || ''}
                        onChange={(e) => setEditForm({...editForm, customSubcategory: e.target.value})}
                        placeholder="Enter custom subcategory"
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={editForm.stockQuantity}
                        onChange={(e) => setEditForm({...editForm, stockQuantity: e.target.value, clearStock: false})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        type="button"
                        className={`px-2 py-1 text-sm rounded border ${editForm.clearStock ? 'bg-green-100 border-green-300' : 'bg-white border-gray-200'}`}
                        onClick={() => setEditForm({...editForm, stockQuantity: '', clearStock: true})}
                      >
                        Make unlimited
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Offer Price (₹)</label>
                    <input
                      type="number"
                      value={editForm.offerPrice}
                      onChange={(e) => setEditForm({...editForm, offerPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Buy Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.minBuy}
                      onChange={(e) => setEditForm({...editForm, minBuy: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>

                {/* Variants editor (lightweight) */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Variants (optional)</label>
                  <div className="space-y-3">
                    {(editForm.variants || []).map((group, gi) => (
                      <div key={gi} className="p-3 border rounded">
                        <div className="flex items-center gap-2">
                          <input className="flex-1 px-2 py-1 border rounded" value={group.name} onChange={(e) => { const c = {...editForm}; c.variants[gi].name = e.target.value; setEditForm(c); }} placeholder="Group name e.g., Storage" />
                          <button type="button" className="text-red-500" onClick={() => { const c = {...editForm}; c.variants.splice(gi,1); setEditForm(c); }}>Remove Group</button>
                        </div>
                        <div className="mt-2 space-y-2">
                          {group.options.map((opt, oi) => (
                            <div key={oi} className="flex gap-2 items-center">
                              <input className="flex-1 px-2 py-1 border rounded" value={opt.label} onChange={(e) => { const c = {...editForm}; c.variants[gi].options[oi].label = e.target.value; setEditForm(c); }} placeholder="Option label" />
                              <input className="w-24 px-2 py-1 border rounded" value={opt.price} onChange={(e) => { const c = {...editForm}; c.variants[gi].options[oi].price = e.target.value; setEditForm(c); }} placeholder="price (absolute)" />
                              <input className="w-28 px-2 py-1 border rounded" value={opt.priceDelta} onChange={(e) => { const c = {...editForm}; c.variants[gi].options[oi].priceDelta = e.target.value; setEditForm(c); }} placeholder="price delta" />
                              <input className="w-40 px-2 py-1 border rounded" value={opt.description || ''} onChange={(e) => { const c = {...editForm}; c.variants[gi].options[oi].description = e.target.value; setEditForm(c); }} placeholder="description (optional)" />
                              {/* Variant-level colors removed: sellers should not edit per-option colors here */}
                              <button type="button" className="text-red-500" onClick={() => { const c = {...editForm}; c.variants[gi].options.splice(oi,1); setEditForm(c); }}>Remove</button>
                            </div>
                          ))}
                          <div>
                            <button type="button" className="px-2 py-1 bg-gray-100 rounded" onClick={() => { const c = {...editForm}; c.variants[gi].options.push({ label: '', price: '', priceDelta: 0, stock: '' }); setEditForm(c); }}>Add Option</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div>
                      <button type="button" className="px-3 py-1 bg-green-100 rounded" onClick={() => { const c = {...editForm}; c.variants = c.variants || []; c.variants.push({ name: '', options: [] }); setEditForm(c); }}>Add Variant Group</button>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Product Images</h4>
                  
                  {getCurrentImages().length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">Current Images</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {getCurrentImages().map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={imageUrl}
                              alt={`Product image ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border"
                              width={100}
                              height={100}
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(imageUrl)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {imagesToDelete.length > 0 && (
                    <div className="mb-6 p-3 bg-yellow-50 rounded-lg">
                      <label className="block text-sm font-medium text-yellow-700 mb-3">Removed Images (Click to restore)</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {imagesToDelete.map((imageUrl, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={imageUrl}
                              alt={`Removed image ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-yellow-300 opacity-50"
                              width={100}
                              height={100}
                            />
                            <button
                              type="button"
                              onClick={() => restoreExistingImage(imageUrl)}
                              className="absolute inset-0 bg-green-500 bg-opacity-50 text-white flex items-center justify-center rounded-lg"
                            >
                              Restore
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Add New Images ({newImages.length}/5)</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {newImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={URL.createObjectURL(image)}
                            alt={`New image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                            width={100}
                            height={100}
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      
                      {newImages.length < 5 && (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="text-sm text-gray-500">Add Image</span>
                          </div>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Colors Preview</label>
                    <div className="flex gap-2">
                      {(editForm.colors || []).map((c, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full border" style={{ backgroundColor: c.color || c.label }} />
                          <span className="text-sm">{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Product Video</h4>
                  
                  {getCurrentVideo() && !newVideo && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3">Current Video</label>
                      <div className="relative">
                        <video
                          controls
                          className="w-full max-w-md rounded-lg border"
                          src={getCurrentVideo()}
                        />
                        <button
                          type="button"
                          onClick={removeVideo}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}

                  {videoToDelete && !newVideo && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                      <label className="block text-sm font-medium text-yellow-700 mb-3">Video Removed</label>
                      <button
                        type="button"
                        onClick={restoreVideo}
                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                      >
                        Restore Video
                      </button>
                    </div>
                  )}

                  {newVideo && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3">New Video Preview</label>
                      <div className="relative">
                        <video
                          controls
                          className="w-full max-w-md rounded-lg border"
                          src={URL.createObjectURL(newVideo)}
                        />
                        <button
                          type="button"
                          onClick={removeVideo}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}

                  {!newVideo && (
                    <label className="flex flex-col items-center justify-center w-full max-w-md p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-500">
                          {getCurrentVideo() ? 'Replace Video' : 'Add Video (Max 50MB)'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-blue-700">Uploading...</span>
                      <span className="text-sm text-blue-700">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {editLoading ? 'Updating...' : 'Update Product'}
                  </button>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProductList;