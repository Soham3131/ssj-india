// 'use client'
// import React, { useState } from "react";
// import { assets } from "@/assets/assets";
// import Image from "next/image";
// import { useAppContext } from "@/context/AppContext";
// import axios from "axios";
// import toast from "react-hot-toast";

// const AddProduct = () => {
//   const { getToken } = useAppContext();

//   const [files, setFiles] = useState([]);
//   const [videos, setVideos] = useState([]);
//   const [name, setName] = useState('');
//   const [description, setDescription] = useState('');
  
//   // Brand, Category, Subcategory states
//   const [brand, setBrand] = useState('');
//   const [category, setCategory] = useState('');
//   const [subcategory, setSubcategory] = useState('');
  
//   // Custom inputs (used when user selects "Other")
//   const [customBrand, setCustomBrand] = useState('');
//   const [customCategory, setCustomCategory] = useState('');
//   const [customSubcategory, setCustomSubcategory] = useState('');

//   // only offerPrice is shown to simplify UI; price will be set equal to offerPrice on submit
//   const [offerPrice, setOfferPrice] = useState('');
//   const [stockQuantity, setStockQuantity] = useState('');
//   const [minBuy, setMinBuy] = useState(1);
//   // Variants state
//   // Each variant group: { name: 'Storage', options: [ { label: '64GB', priceDelta: 0, stock: 10 }, ... ] }
//   const [variants, setVariants] = useState([]);
//   const [colorsInput, setColorsInput] = useState('');
  
//   // NOTE: replaced checkbox-based custom toggles by adding an "Other" option to selects/datalists

//   // Updated hierarchical data structure with EXACT 10 categories
//   const productHierarchy = {
//     'Boat': {
//       'Handsfree': ['Wired Handsfree', 'Wireless Handsfree', 'Sports Handsfree'],
//       'Earbuds': ['True Wireless Earbuds', 'Wireless Earbuds', 'Noise Cancelling Earbuds'],
//       'Mix Items': ['Combo Packs', 'Accessory Kits', 'Mixed Bundles'],
//       'Car Bluetooth': ['Bluetooth Car Kits', 'FM Transmitters', 'Car Audio Adapters'],
//       'OTG Cables': ['Type-C OTG', 'Micro USB OTG', 'Multi-port OTG'],
//       'Car Chargers': ['Fast Car Chargers', 'Multi-port Car Chargers', 'Wireless Car Chargers'],
//       'Cables and Chargers': ['Type-C Cables', 'Fast Chargers', 'Braided Cables'],
//       'Battery': ['Power Banks', 'Portable Chargers', 'Battery Cases'],
//       'Selfie Sticks': ['Bluetooth Selfie Sticks', 'Wired Selfie Sticks', 'Tripod Selfie Sticks'],
//       'Car and Bike Stand': ['Phone Holders', 'Bike Mounts', 'Dashboard Stands']
//     },
//     'JBL': {
//       'Handsfree': ['Wired Headphones', 'Wireless Headphones', 'Sports Headphones'],
//       'Earbuds': ['JBL True Wireless', 'Sports Earbuds', 'Noise Cancelling'],
//       'Mix Items': ['Speaker Combos', 'Audio Bundles', 'Gift Packs'],
//       'Car Bluetooth': ['Car Audio Systems', 'Bluetooth Receivers'],
//       'OTG Cables': ['Audio OTG Cables', 'Adapter Cables'],
//       'Car Chargers': ['Fast Charging Car Adapters'],
//       'Cables and Chargers': ['Audio Cables', 'Charging Cables'],
//       'Battery': ['Portable Speakers with Power Bank'],
//       'Selfie Sticks': ['Action Camera Accessories'],
//       'Car and Bike Stand': ['Audio System Mounts']
//     },
//     'Sony': {
//       'Handsfree': ['Sony Headphones', 'Noise Cancelling Headphones'],
//       'Earbuds': ['WF Series Earbuds', 'True Wireless', 'Sports Earbuds'],
//       'Mix Items': ['Audio Bundles', 'Entertainment Packs'],
//       'Car Bluetooth': ['Car Audio Systems', 'Bluetooth Car Adapters'],
//       'OTG Cables': ['Audio Adapter Cables'],
//       'Car Chargers': ['Sony Car Chargers'],
//       'Cables and Chargers': ['Premium Cables', 'Fast Chargers'],
//       'Battery': ['Sony Power Banks'],
//       'Selfie Sticks': ['Camera Accessories'],
//       'Car and Bike Stand': ['Car Audio Mounts']
//     },
//     'Samsung': {
//       'Handsfree': ['Samsung Headphones', 'AKG Headphones'],
//       'Earbuds': ['Galaxy Buds', 'Wireless Earbuds'],
//       'Mix Items': ['Samsung Bundles', 'Mobile Accessory Kits'],
//       'Car Bluetooth': ['Car Connectivity', 'SmartThings Auto'],
//       'OTG Cables': ['Type-C OTG', 'Multi-port Adapters'],
//       'Car Chargers': ['Fast Charge Car Adapters', 'Wireless Car Chargers'],
//       'Cables and Chargers': ['Fast Charging Cables', 'Adaptive Chargers'],
//       'Battery': ['Samsung Power Banks', 'Portable Batteries'],
//       'Selfie Sticks': ['Phone Camera Accessories'],
//       'Car and Bike Stand': ['Car Mounts', 'Phone Holders']
//     },
//     'Mi': {
//       'Handsfree': ['Mi Earphones', 'Basic Headphones'],
//       'Earbuds': ['Mi True Wireless', 'Redmi Earbuds'],
//       'Mix Items': ['Mi Ecosystem Bundles'],
//       'Car Bluetooth': ['Car Bluetooth Adapters'],
//       'OTG Cables': ['Mi OTG Cables', 'Adapter Cables'],
//       'Car Chargers': ['Mi Car Chargers', 'Fast Car Charging'],
//       'Cables and Chargers': ['Mi Cables', 'Fast Chargers'],
//       'Battery': ['Mi Power Banks', '10000mAh/20000mAh'],
//       'Selfie Sticks': ['Mi Selfie Sticks'],
//       'Car and Bike Stand': ['Car Phone Mounts']
//     },
//     'Apple': {
//       'Handsfree': ['AirPods Max', 'Beats Headphones'],
//       'Earbuds': ['AirPods Pro', 'AirPods', 'Beats Earbuds'],
//       'Mix Items': ['Apple Accessory Bundles'],
//       'Car Bluetooth': ['CarPlay Adapters', 'Bluetooth Car Kits'],
//       'OTG Cables': ['Lightning OTG', 'USB-C Adapters'],
//       'Car Chargers': ['MagSafe Car Chargers', 'Lightning Car Chargers'],
//       'Cables and Chargers': ['Lightning Cables', 'USB-C Cables'],
//       'Battery': ['MagSafe Battery Pack', 'Smart Battery Cases'],
//       'Selfie Sticks': ['iPhone Camera Accessories'],
//       'Car and Bike Stand': ['Car Mounts', 'MagSafe Holders']
//     },
//     'OnePlus': {
//       'Handsfree': ['OnePlus Buds', 'Bullets Wireless'],
//       'Earbuds': ['OnePlus Buds Pro', 'True Wireless'],
//       'Mix Items': ['OnePlus Accessory Bundles'],
//       'Car Bluetooth': ['Car Connectivity'],
//       'OTG Cables': ['Type-C OTG Cables'],
//       'Car Chargers': ['Warp Charge Car Chargers'],
//       'Cables and Chargers': ['Warp Charge Cables', 'Fast Chargers'],
//       'Battery': ['OnePlus Power Banks'],
//       'Selfie Sticks': ['Phone Accessories'],
//       'Car and Bike Stand': ['Car Phone Holders']
//     },
//     'Realme': {
//       'Handsfree': ['Realme Buds', 'Wireless Headphones'],
//       'Earbuds': ['Realme True Wireless', 'Buds Air'],
//       'Mix Items': ['Realme Tech Bundles'],
//       'Car Bluetooth': ['Car Audio Adapters'],
//       'OTG Cables': ['Realme OTG Adapters'],
//       'Car Chargers': ['Dart Charge Car Chargers'],
//       'Cables and Chargers': ['Realme Cables', 'Fast Chargers'],
//       'Battery': ['Realme Power Banks'],
//       'Selfie Sticks': ['Mobile Accessories'],
//       'Car and Bike Stand': ['Vehicle Mounts']
//     },
//     'Noise': {
//       'Handsfree': ['Noise Headphones', 'Neckbands'],
//       'Earbuds': ['Noise True Wireless', 'Fit Buds'],
//       'Mix Items': ['Noise Smart Watch Combos'],
//       'Car Bluetooth': ['Bluetooth Car Accessories'],
//       'OTG Cables': ['Adapter Cables'],
//       'Car Chargers': ['Car Charging Adapters'],
//       'Cables and Chargers': ['Charging Accessories'],
//       'Battery': ['Power Banks'],
//       'Selfie Sticks': ['Mobile Photography'],
//       'Car and Bike Stand': ['Smart Mounts']
//     },
//     'Boult': {
//       'Handsfree': ['Boult Headphones', 'Neckbands'],
//       'Earbuds': ['Boult True Wireless', 'Bass Buds'],
//       'Mix Items': ['Audio Combos'],
//       'Car Bluetooth': ['Car Audio'],
//       'OTG Cables': ['Adapter Cables'],
//       'Car Chargers': ['Car Chargers'],
//       'Cables and Chargers': ['Charging Cables'],
//       'Battery': ['Portable Chargers'],
//       'Selfie Sticks': ['Phone Accessories'],
//       'Car and Bike Stand': ['Vehicle Accessories']
//     }
//   };

//   // Get categories for selected brand
//   const getCategories = () => {
//     // when brand is 'Other' or empty we don't have prefilled categories
//     if (!brand || brand === 'Other') return [];
//     return [
//       'Handsfree',
//       'Earbuds', 
//       'Mix Items',
//       'Car Bluetooth',
//       'OTG Cables',
//       'Car Chargers',
//       'Cables and Chargers',
//       'Battery',
//       'Selfie Sticks',
//       'Car and Bike Stand'
//     ];
//   };

//   // Get subcategories for selected category
//   const getSubcategories = () => {
//     if (!brand || brand === 'Other' || !category || category === 'Other') return [];
//     return productHierarchy[brand] && productHierarchy[brand][category]
//       ? productHierarchy[brand][category]
//       : [];
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Validation: stockQuantity is optional. If provided, validate it's non-negative and >= minBuy
//     if (stockQuantity !== null && stockQuantity !== undefined && stockQuantity !== '') {
//       if (isNaN(Number(stockQuantity)) || Number(stockQuantity) < 0) {
//         toast.error("Please enter a valid stock quantity");
//         return;
//       }
//       // Enforce stock >= minBuy on client side when stock provided
//       if (Number(stockQuantity) < Number(minBuy || 1)) {
//         toast.error(`Stock quantity (${stockQuantity}) cannot be less than Minimum Buy (${minBuy})`);
//         return;
//       }
//     }

//     console.log("=== 🚀 STARTING PRODUCT SUBMISSION ===");
//     console.log("📦 Form Values:");
//     console.log("Name:", name);
//     console.log("Description:", description);
//   console.log("Brand:", brand === 'Other' ? customBrand || '' : brand);
//   console.log("Category:", category === 'Other' ? customCategory || '' : category);
//   console.log("Subcategory:", subcategory === 'Other' ? customSubcategory || '' : subcategory);
//     console.log("Offer Price:", offerPrice);
//     console.log("Stock Quantity:", stockQuantity);
//     console.log("Image files count:", files.filter(Boolean).length);
//     console.log("Video files count:", videos.filter(Boolean).length);

//     const formData = new FormData();

//     // Append basic fields
//     formData.append('name', name);
//     formData.append('description', description);
//   formData.append('brand', brand === 'Other' ? customBrand : brand);
//   formData.append('category', category === 'Other' ? customCategory : category);
//   // keep a single price field: mirror offerPrice into price
//   formData.append('price', offerPrice);
//     formData.append('offerPrice', offerPrice);
//     formData.append('stockQuantity', stockQuantity);
//   formData.append('minBuy', minBuy);

//     // Append subcategory only if provided
//   const finalSubcategory = subcategory === 'Other' ? customSubcategory : subcategory;
//     if (finalSubcategory && finalSubcategory.trim() !== '') {
//       formData.append('subcategory', finalSubcategory);
//       console.log("📋 Subcategory included:", finalSubcategory);
//     } else {
//       console.log("📋 Subcategory skipped (optional field)");
//     }

//     // Append images
//     for (let i = 0; i < files.length; i++) {
//       if (files[i]) {
//         formData.append('images', files[i]);
//         console.log("📸 Added image:", files[i].name, files[i].type, files[i].size);
//       }
//     }

//     // Append videos
//     for (let i = 0; i < videos.length; i++) {
//       if (videos[i]) {
//         formData.append('videos', videos[i]);
//         console.log("🎥 Added video:", videos[i].name, videos[i].type, videos[i].size);
//       }
//     }

//     // Append variants as JSON if any
//     if (variants && variants.length > 0) {
//       formData.append('variants', JSON.stringify(variants));
//       console.log('🔀 Variants included:', JSON.stringify(variants));
//     }

//     // Append product-level colors if provided (comma-separated input)
//     if (colorsInput && colorsInput.trim() !== '') {
//       formData.append('colors', colorsInput.trim());
//       console.log('🎨 Colors included:', colorsInput.trim());
//     }

//     // Debug: Check formData contents
//     console.log("🔄 FormData entries:");
//     for (let [key, value] of formData.entries()) {
//       if (value instanceof File) {
//         console.log(key + ": ", value.name, value.type, value.size);
//       } else {
//         console.log(key + ": ", value);
//       }
//     }

//     try {
//       const token = await getToken();
//       console.log("🔑 Token obtained, sending request to /api/product/add");

//       const { data } = await axios.post('/api/product/add', formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'multipart/form-data'
//         }
//       });

//       console.log("✅ API Response:", data);

//       if (data.success) {
//         toast.success(data.message);
//         console.log("🎉 Product added successfully!");
        
//         // Reset form
//     setFiles([]);
//         setVideos([]);
//         setName('');
//         setDescription('');
//       setBrand('');
//         setCategory('');
//         setSubcategory('');
//         setCustomBrand('');
//         setCustomCategory('');
//         setCustomSubcategory('');
//     setOfferPrice('');
//         setStockQuantity('');
//   setMinBuy(1);
//   // previously cleared custom-toggle flags; no longer needed with 'Other' flow
//       } else {
//         console.error("❌ API Error:", data.message);
//         toast.error(data.message);
//       }
//     } catch (error) {
//       console.error("💥 Request Error:", error);
//       console.error("💥 Error Response:", error.response?.data);
//       toast.error(error.response?.data?.message || error.message);
//     }
//   };

//   const handleImageUpload = (index, file) => {
//     const updatedFiles = [...files];
//     updatedFiles[index] = file;
//     setFiles(updatedFiles);
//     console.log(`🖼️ Image ${index} uploaded:`, file?.name);
//   };

//   const handleVideoUpload = (index, file) => {
//     const updatedVideos = [...videos];
//     updatedVideos[index] = file;
//     setVideos(updatedVideos);
//     console.log(`🎬 Video ${index} uploaded:`, file?.name);
//   };

//   const removeImage = (index) => {
//     const updatedFiles = files.filter((_, i) => i !== index);
//     setFiles(updatedFiles);
//     console.log(`🗑️ Image ${index} removed`);
//   };

//   const removeVideo = (index) => {
//     const updatedVideos = videos.filter((_, i) => i !== index);
//     setVideos(updatedVideos);
//     console.log(`🗑️ Video ${index} removed`);
//   };

//   // Reset category and subcategory when brand changes
//   const handleBrandChange = (newBrand) => {
//     setBrand(newBrand);
//     setCategory('');
//     setSubcategory('');
//     console.log(`🏷️ Brand changed to: ${newBrand}`);
//   };

//   // Reset subcategory when category changes
//   const handleCategoryChange = (newCategory) => {
//     setCategory(newCategory);
//     setSubcategory('');
//     console.log(`📂 Category changed to: ${newCategory}`);
//   };

//   return (
//     <div className="flex-1 min-h-screen flex flex-col justify-between">
//       <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-5 max-w-2xl">
        
//         {/* Product Images */}
//         <div>
//         <p className="text-base font-medium">Product Images (Max 6)</p>
//           <div className="flex flex-wrap items-center gap-3 mt-2">
//           {[...Array(6)].map((_, index) => (
//               <div key={index} className="relative">
//                 <label htmlFor={`image${index}`} className="cursor-pointer">
//                   <input 
//                     onChange={(e) => handleImageUpload(index, e.target.files[0])} 
//                     type="file" 
//                     id={`image${index}`} 
//                     accept="image/*"
//                     hidden 
//                   />
//                   <Image
//                     className="max-w-24 h-24 object-cover border-2 border-dashed border-gray-300 rounded"
//                     src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area}
//                     alt=""
//                     width={96}
//                     height={96}
//                   />
//                 </label>
//                 {files[index] && (
//                   <button
//                     type="button"
//                     onClick={() => removeImage(index)}
//                     className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
//                   >
//                     ×
//                   </button>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Product Videos */}
//         <div>
//           <p className="text-base font-medium">Product Videos (Optional, Max 2)</p>
//           <div className="flex flex-wrap items-center gap-3 mt-2">
//             {[...Array(2)].map((_, index) => (
//               <div key={index} className="relative">
//                 <label htmlFor={`video${index}`} className="cursor-pointer">
//                   <input 
//                     onChange={(e) => handleVideoUpload(index, e.target.files[0])} 
//                     type="file" 
//                     id={`video${index}`} 
//                     accept="video/*"
//                     hidden 
//                   />
//                   <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-100">
//                     {videos[index] ? (
//                       <video className="w-full h-full object-cover rounded">
//                         <source src={URL.createObjectURL(videos[index])} />
//                       </video>
//                     ) : (
//                       <span className="text-gray-500 text-4xl">🎥</span>
//                     )}
//                   </div>
//                 </label>
//                 {videos[index] && (
//                   <button
//                     type="button"
//                     onClick={() => removeVideo(index)}
//                     className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
//                   >
//                     ×
//                   </button>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Product Name */}
//         <div className="flex flex-col gap-1 max-w-md">
//           <label className="text-base font-medium" htmlFor="product-name">
//             Product Name
//           </label>
//           <input
//             id="product-name"
//             type="text"
//             placeholder="Type here"
//             className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
//             onChange={(e) => setName(e.target.value)}
//             value={name}
//             required
//           />
//         </div>

//         {/* Product Description */}
//         <div className="flex flex-col gap-1 max-w-md">
//           <label className="text-base font-medium" htmlFor="product-description">
//             Product Description
//           </label>
//           <textarea
//             id="product-description"
//             rows={4}
//             className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none"
//             placeholder="Type here"
//             onChange={(e) => setDescription(e.target.value)}
//             value={description}
//             required
//           ></textarea>
//         </div>

//         {/* Brand, Category, Subcategory Hierarchy (with 'Other' option) */}
//         <div className="flex items-center gap-5 flex-wrap">

//           {/* Brand */}
//           <div className="flex flex-col gap-1 w-48">
//             <label className="text-base font-medium" htmlFor="brand">
//               Brand <span className="text-red-500">*</span>
//             </label>
//             <div className="flex gap-2 items-center">
//               <input
//                 id="brand"
//                 list="brandList"
//                 className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 flex-1"
//                 onChange={(e) => handleBrandChange(e.target.value)}
//                 value={brand}
//                 placeholder="Select or type brand"
//               />
//               <datalist id="brandList">
//                 {Object.keys(productHierarchy).map((brandName) => (
//                   <option key={brandName} value={brandName} />
//                 ))}
//                 <option value="Other" />
//               </datalist>
//             </div>
//             {brand === 'Other' && (
//               <input
//                 type="text"
//                 placeholder="Enter custom brand"
//                 className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 mt-2 w-full"
//                 onChange={(e) => setCustomBrand(e.target.value)}
//                 value={customBrand}
//               />
//             )}
//           </div>

//           {/* Category */}
//           <div className="flex flex-col gap-1 w-48">
//             <label className="text-base font-medium" htmlFor="category">
//               Category <span className="text-red-500">*</span>
//             </label>
//             <div className="flex gap-2 items-center">
//               <input
//                 id="category"
//                 list="categoryList"
//                 className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 flex-1"
//                 onChange={(e) => handleCategoryChange(e.target.value)}
//                 value={category}
//                 placeholder={brand && brand !== 'Other' ? 'Select or type category' : 'Type category'}
//                 disabled={!brand}
//               />
//               <datalist id="categoryList">
//                 {getCategories().map((cat) => (
//                   <option key={cat} value={cat} />
//                 ))}
//                 <option value="Other" />
//               </datalist>
//             </div>
//             {category === 'Other' && (
//               <input
//                 type="text"
//                 placeholder="Enter custom category"
//                 className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 mt-2 w-full"
//                 onChange={(e) => setCustomCategory(e.target.value)}
//                 value={customCategory}
//               />
//             )}
//           </div>

//           {/* Subcategory */}
//           <div className="flex flex-col gap-1 w-48">
//             <label className="text-base font-medium" htmlFor="subcategory">
//               Subcategory <span className="text-gray-500 text-sm">(Optional)</span>
//             </label>
//             <div className="flex gap-2 items-center">
//               <input
//                 id="subcategory"
//                 list="subcategoryList"
//                 className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 flex-1"
//                 onChange={(e) => setSubcategory(e.target.value)}
//                 value={subcategory}
//                 placeholder={category && category !== 'Other' ? 'Select or type subcategory' : 'Type subcategory'}
//                 disabled={!category || category === 'Other'}
//               />
//               <datalist id="subcategoryList">
//                 {getSubcategories().map((subcat) => (
//                   <option key={subcat} value={subcat} />
//                 ))}
//                 <option value="Other" />
//               </datalist>
//             </div>
//             {subcategory === 'Other' && (
//               <input
//                 type="text"
//                 placeholder="Enter custom subcategory"
//                 className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 mt-2 w-full"
//                 onChange={(e) => setCustomSubcategory(e.target.value)}
//                 value={customSubcategory}
//               />
//             )}
//           </div>
//         </div>

//   {/* Price, Offer Price, and Stock Quantity */}
//         <div className="flex items-center gap-5 flex-wrap">
//           {/* Note: only Offer Price is shown in the seller UI. The product 'price' field will mirror this value. */}
//           <div className="flex flex-col gap-1 w-32">
//             <label className="text-base font-medium" htmlFor="offer-price">
//               Offer Price <span className="text-red-500">*</span>
//             </label>
//             <input
//               id="offer-price"
//               type="number"
//               placeholder="0"
//               className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
//               onChange={(e) => setOfferPrice(e.target.value)}
//               value={offerPrice}
//               required
//             />
//           </div>
//           <div className="flex flex-col gap-1 w-32">
//             <label className="text-base font-medium" htmlFor="stock-quantity">
//               Stock Quantity <span className="text-gray-500 text-sm">(optional)</span>
//             </label>
//             <input
//               id="stock-quantity"
//               type="number"
//               min="0"
//               placeholder="leave empty for unlimited"
//               className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
//               onChange={(e) => setStockQuantity(e.target.value)}
//               value={stockQuantity}
//             />
//           </div>
//           <div className="flex flex-col gap-1 w-32">
//             <label className="text-base font-medium" htmlFor="min-buy">
//               Min Buy <span className="text-gray-500 text-sm">(minimum qty)</span>
//             </label>
//             <input
//               id="min-buy"
//               type="number"
//               min="1"
//               placeholder="1"
//               className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
//               onChange={(e) => setMinBuy(e.target.value)}
//               value={minBuy}
//               required
//             />
//           </div>
//                   <div className="flex flex-col gap-1 w-full">
//                     <label className="text-base font-medium">Product Colors (optional)</label>
//                     <input type="text" placeholder="Comma separated color labels e.g. Red, Blue" value={colorsInput} onChange={(e) => setColorsInput(e.target.value)} className="w-full px-3 py-2 border rounded" />
//                     <p className="text-xs text-gray-500">You can provide colors as labels, or send JSON via API. Example: Red, Blue</p>
//                     <div className="flex flex-wrap gap-2 mt-2">
//                       {(colorsInput || '').split(',').map(s => s.trim()).filter(Boolean).map((label, i) => (
//                         <div key={i} className="flex items-center gap-2">
//                           <span className="w-6 h-6 rounded-full border" style={{ backgroundColor: label }} />
//                           <span className="text-xs text-gray-700">{label}</span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//           {/* Variants UI */}
//           <div className="w-full mt-4">
//             <label className="text-base font-medium">Product Variants (optional)</label>
//             <div className="mt-2 space-y-3">
//               {variants.map((group, gi) => (
//                 <div key={gi} className="p-3 border rounded">
//                   <div className="flex items-center justify-between">
//                     <input className="flex-1 outline-none px-2 py-1 border rounded" value={group.name} onChange={(e) => {
//                       const copy = [...variants]; copy[gi].name = e.target.value; setVariants(copy);
//                     }} placeholder="Variant group name e.g., Storage, Color" />
//                     <button type="button" className="ml-2 text-red-500" onClick={() => { setVariants(variants.filter((_, i) => i !== gi)) }}>Remove Group</button>
//                   </div>
//                   <div className="mt-2 space-y-2">
//                           {group.options.map((opt, oi) => (
//                       <div key={oi} className="flex items-center gap-3 p-2 border rounded-md">
//                         <div className="flex-1">
//                           <input className="w-full outline-none px-2 py-1 border rounded" value={opt.label} onChange={(e) => { const copy = [...variants]; copy[gi].options[oi].label = e.target.value; setVariants(copy); }} placeholder="Option label e.g., 64GB, Red" />
//                           <input className="w-full mt-2 outline-none px-2 py-1 border rounded" value={opt.description || ''} onChange={(e) => { const copy = [...variants]; copy[gi].options[oi].description = e.target.value; setVariants(copy); }} placeholder="Option description (optional)" />
//                           <p className="text-xs text-gray-500 mt-1">Colors (comma separated labels, e.g. Red,Maroon). Use color names to show swatches.</p>
//                           <input className="w-full mt-1 outline-none px-2 py-1 border rounded" value={opt.colors || ''} onChange={(e) => { const copy = [...variants]; copy[gi].options[oi].colors = e.target.value; setVariants(copy); }} placeholder="Colors e.g. Red,Blue" />
//                         </div>

//                         <div className="flex items-center gap-2">
//                           <div className="flex flex-col">
//                             <label className="text-xs text-gray-600">Absolute price</label>
//                             <input className="w-28 outline-none px-2 py-1 border rounded" value={opt.price} onChange={(e) => { const copy = [...variants]; copy[gi].options[oi].price = e.target.value; setVariants(copy); }} placeholder="price (absolute)" />
//                           </div>
//                           <div className="flex flex-col items-end">
//                             <button type="button" className="text-red-500 mb-1" onClick={() => { const copy = [...variants]; copy[gi].options.splice(oi,1); setVariants(copy); }}>Remove</button>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                     <div className="mt-2">
//                       <button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={() => { const copy = [...variants]; copy[gi].options.push({ label: '', price: '', priceDelta: 0, stock: '', color: '' }); setVariants(copy); }}>Add Option</button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//               <div>
//                 <button type="button" className="px-3 py-1 bg-green-100 rounded" onClick={() => setVariants([...variants, { name: '', options: [] }])}>Add Variant Group</button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Updated Button with #54B1CE color */}
//         <button 
//           type="submit" 
//           className="px-8 py-2.5 bg-[#54B1CE] text-white font-medium rounded hover:bg-[#3a9cb8] transition-colors"
//         >
//           ADD PRODUCT
//         </button>
//       </form>
//     </div>
//   );
// };


// export default AddProduct;

'use client'
import React, { useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";

const AddProduct = () => {
  const { getToken } = useAppContext();

  const [files, setFiles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Brand, Category, Subcategory states
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  
  // Custom inputs (used when user selects "Other")
  const [customBrand, setCustomBrand] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customSubcategory, setCustomSubcategory] = useState('');
  // only offerPrice is shown to simplify UI; price will be set equal to offerPrice on submit
  const [offerPrice, setOfferPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [minBuy, setMinBuy] = useState(1);
  // Variants state
  // Each variant group: { name: 'Storage', options: [ { label: '64GB', priceDelta: 0, stock: 10 }, ... ] }
  const [variants, setVariants] = useState([]);
  const [colorsInput, setColorsInput] = useState('');
  
  // NOTE: replaced checkbox-based custom toggles by adding an "Other" option to selects/datalists

  // Updated hierarchical data structure with EXACT 10 categories
  const productHierarchy = {
    'Boat': {
      'Handsfree': ['Wired Handsfree', 'Wireless Handsfree', 'Sports Handsfree'],
      'Earbuds': ['True Wireless Earbuds', 'Wireless Earbuds', 'Noise Cancelling Earbuds'],
      'Mix Items': ['Combo Packs', 'Accessory Kits', 'Mixed Bundles'],
      'Car Bluetooth': ['Bluetooth Car Kits', 'FM Transmitters', 'Car Audio Adapters'],
      'OTG Cables': ['Type-C OTG', 'Micro USB OTG', 'Multi-port OTG'],
      'Car Chargers': ['Fast Car Chargers', 'Multi-port Car Chargers', 'Wireless Car Chargers'],
      'Cables and Chargers': ['Type-C Cables', 'Fast Chargers', 'Braided Cables'],
      'Battery': ['Power Banks', 'Portable Chargers', 'Battery Cases'],
      'Selfie Sticks': ['Bluetooth Selfie Sticks', 'Wired Selfie Sticks', 'Tripod Selfie Sticks'],
      'Car and Bike Stand': ['Phone Holders', 'Bike Mounts', 'Dashboard Stands']
    },
    'JBL': {
      'Handsfree': ['Wired Headphones', 'Wireless Headphones', 'Sports Headphones'],
      'Earbuds': ['JBL True Wireless', 'Sports Earbuds', 'Noise Cancelling'],
      'Mix Items': ['Speaker Combos', 'Audio Bundles', 'Gift Packs'],
      'Car Bluetooth': ['Car Audio Systems', 'Bluetooth Receivers'],
      'OTG Cables': ['Audio OTG Cables', 'Adapter Cables'],
      'Car Chargers': ['Fast Charging Car Adapters'],
      'Cables and Chargers': ['Audio Cables', 'Charging Cables'],
      'Battery': ['Portable Speakers with Power Bank'],
      'Selfie Sticks': ['Action Camera Accessories'],
      'Car and Bike Stand': ['Audio System Mounts']
    },
    'Sony': {
      'Handsfree': ['Sony Headphones', 'Noise Cancelling Headphones'],
      'Earbuds': ['WF Series Earbuds', 'True Wireless', 'Sports Earbuds'],
      'Mix Items': ['Audio Bundles', 'Entertainment Packs'],
      'Car Bluetooth': ['Car Audio Systems', 'Bluetooth Car Adapters'],
      'OTG Cables': ['Audio Adapter Cables'],
      'Car Chargers': ['Sony Car Chargers'],
      'Cables and Chargers': ['Premium Cables', 'Fast Chargers'],
      'Battery': ['Sony Power Banks'],
      'Selfie Sticks': ['Camera Accessories'],
      'Car and Bike Stand': ['Car Audio Mounts']
    },
    'Samsung': {
      'Handsfree': ['Samsung Headphones', 'AKG Headphones'],
      'Earbuds': ['Galaxy Buds', 'Wireless Earbuds'],
      'Mix Items': ['Samsung Bundles', 'Mobile Accessory Kits'],
      'Car Bluetooth': ['Car Connectivity', 'SmartThings Auto'],
      'OTG Cables': ['Type-C OTG', 'Multi-port Adapters'],
      'Car Chargers': ['Fast Charge Car Adapters', 'Wireless Car Chargers'],
      'Cables and Chargers': ['Fast Charging Cables', 'Adaptive Chargers'],
      'Battery': ['Samsung Power Banks', 'Portable Batteries'],
      'Selfie Sticks': ['Phone Camera Accessories'],
      'Car and Bike Stand': ['Car Mounts', 'Phone Holders']
    },
    'Mi': {
      'Handsfree': ['Mi Earphones', 'Basic Headphones'],
      'Earbuds': ['Mi True Wireless', 'Redmi Earbuds'],
      'Mix Items': ['Mi Ecosystem Bundles'],
      'Car Bluetooth': ['Car Bluetooth Adapters'],
      'OTG Cables': ['Mi OTG Cables', 'Adapter Cables'],
      'Car Chargers': ['Mi Car Chargers', 'Fast Car Charging'],
      'Cables and Chargers': ['Mi Cables', 'Fast Chargers'],
      'Battery': ['Mi Power Banks', '10000mAh/20000mAh'],
      'Selfie Sticks': ['Mi Selfie Sticks'],
      'Car and Bike Stand': ['Car Phone Mounts']
    },
    'Apple': {
      'Handsfree': ['AirPods Max', 'Beats Headphones'],
      'Earbuds': ['AirPods Pro', 'AirPods', 'Beats Earbuds'],
      'Mix Items': ['Apple Accessory Bundles'],
      'Car Bluetooth': ['CarPlay Adapters', 'Bluetooth Car Kits'],
      'OTG Cables': ['Lightning OTG', 'USB-C Adapters'],
      'Car Chargers': ['MagSafe Car Chargers', 'Lightning Car Chargers'],
      'Cables and Chargers': ['Lightning Cables', 'USB-C Cables'],
      'Battery': ['MagSafe Battery Pack', 'Smart Battery Cases'],
      'Selfie Sticks': ['iPhone Camera Accessories'],
      'Car and Bike Stand': ['Car Mounts', 'MagSafe Holders']
    },
    'OnePlus': {
      'Handsfree': ['OnePlus Buds', 'Bullets Wireless'],
      'Earbuds': ['OnePlus Buds Pro', 'True Wireless'],
      'Mix Items': ['OnePlus Accessory Bundles'],
      'Car Bluetooth': ['Car Connectivity'],
      'OTG Cables': ['Type-C OTG Cables'],
      'Car Chargers': ['Warp Charge Car Chargers'],
      'Cables and Chargers': ['Warp Charge Cables', 'Fast Chargers'],
      'Battery': ['OnePlus Power Banks'],
      'Selfie Sticks': ['Phone Accessories'],
      'Car and Bike Stand': ['Car Phone Holders']
    },
    'Realme': {
      'Handsfree': ['Realme Buds', 'Wireless Headphones'],
      'Earbuds': ['Realme True Wireless', 'Buds Air'],
      'Mix Items': ['Realme Tech Bundles'],
      'Car Bluetooth': ['Car Audio Adapters'],
      'OTG Cables': ['Realme OTG Adapters'],
      'Car Chargers': ['Dart Charge Car Chargers'],
      'Cables and Chargers': ['Realme Cables', 'Fast Chargers'],
      'Battery': ['Realme Power Banks'],
      'Selfie Sticks': ['Mobile Accessories'],
      'Car and Bike Stand': ['Vehicle Mounts']
    },
    'Noise': {
      'Handsfree': ['Noise Headphones', 'Neckbands'],
      'Earbuds': ['Noise True Wireless', 'Fit Buds'],
      'Mix Items': ['Noise Smart Watch Combos'],
      'Car Bluetooth': ['Bluetooth Car Accessories'],
      'OTG Cables': ['Adapter Cables'],
      'Car Chargers': ['Car Charging Adapters'],
      'Cables and Chargers': ['Charging Accessories'],
      'Battery': ['Power Banks'],
      'Selfie Sticks': ['Mobile Photography'],
      'Car and Bike Stand': ['Smart Mounts']
    },
    'Boult': {
      'Handsfree': ['Boult Headphones', 'Neckbands'],
      'Earbuds': ['Boult True Wireless', 'Bass Buds'],
      'Mix Items': ['Audio Combos'],
      'Car Bluetooth': ['Car Audio'],
      'OTG Cables': ['Adapter Cables'],
      'Car Chargers': ['Car Chargers'],
      'Cables and Chargers': ['Charging Cables'],
      'Battery': ['Portable Chargers'],
      'Selfie Sticks': ['Phone Accessories'],
      'Car and Bike Stand': ['Vehicle Accessories']
    }
  };

  // Get categories for selected brand
  const getCategories = () => {
    // when brand is 'Other' or empty we don't have prefilled categories
    if (!brand || brand === 'Other') return [];
    return [
      'Handsfree',
      'Earbuds', 
      'Mix Items',
      'Car Bluetooth',
      'OTG Cables',
      'Car Chargers',
      'Cables and Chargers',
      'Battery',
      'Selfie Sticks',
      'Car and Bike Stand'
    ];
  };

  // Get subcategories for selected category
  const getSubcategories = () => {
    if (!brand || brand === 'Other' || !category || category === 'Other') return [];
    return productHierarchy[brand] && productHierarchy[brand][category]
      ? productHierarchy[brand][category]
      : [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: stockQuantity is optional. If provided, validate it's non-negative and >= minBuy
    if (stockQuantity !== null && stockQuantity !== undefined && stockQuantity !== '') {
      if (isNaN(Number(stockQuantity)) || Number(stockQuantity) < 0) {
        toast.error("Please enter a valid stock quantity");
        return;
      }
      // Enforce stock >= minBuy on client side when stock provided
      if (Number(stockQuantity) < Number(minBuy || 1)) {
        toast.error(`Stock quantity (${stockQuantity}) cannot be less than Minimum Buy (${minBuy})`);
        return;
      }
    }

    console.log("=== 🚀 STARTING PRODUCT SUBMISSION ===");
    console.log("📦 Form Values:");
    console.log("Name:", name);
    console.log("Description:", description);
  console.log("Brand:", brand === 'Other' ? customBrand || '' : brand);
  console.log("Category:", category === 'Other' ? customCategory || '' : category);
  console.log("Subcategory:", subcategory === 'Other' ? customSubcategory || '' : subcategory);
    console.log("Offer Price:", offerPrice);
    console.log("Stock Quantity:", stockQuantity);
    console.log("Image files count:", files.filter(Boolean).length);
    console.log("Video files count:", videos.filter(Boolean).length);

    const formData = new FormData();

    // Append basic fields
    formData.append('name', name);
    formData.append('description', description);
  formData.append('brand', brand === 'Other' ? customBrand : brand);
  formData.append('category', category === 'Other' ? customCategory : category);
  // keep a single price field: mirror offerPrice into price
  formData.append('price', offerPrice);
    formData.append('offerPrice', offerPrice);
    formData.append('stockQuantity', stockQuantity);
  formData.append('minBuy', minBuy);

    // Append subcategory only if provided
  const finalSubcategory = subcategory === 'Other' ? customSubcategory : subcategory;
    if (finalSubcategory && finalSubcategory.trim() !== '') {
      formData.append('subcategory', finalSubcategory);
      console.log("📋 Subcategory included:", finalSubcategory);
    } else {
      console.log("📋 Subcategory skipped (optional field)");
    }

    // Append images
    for (let i = 0; i < files.length; i++) {
      if (files[i]) {
        formData.append('images', files[i]);
        console.log("📸 Added image:", files[i].name, files[i].type, files[i].size);
      }
    }

    // Append videos
    for (let i = 0; i < videos.length; i++) {
      if (videos[i]) {
        formData.append('videos', videos[i]);
        console.log("🎥 Added video:", videos[i].name, videos[i].type, videos[i].size);
      }
    }

    // Append variants as JSON if any
    if (variants && variants.length > 0) {
      formData.append('variants', JSON.stringify(variants));
      console.log('🔀 Variants included:', JSON.stringify(variants));
    }

    // Append product-level colors if provided (comma-separated input)
    if (colorsInput && colorsInput.trim() !== '') {
      formData.append('colors', colorsInput.trim());
      console.log('🎨 Colors included:', colorsInput.trim());
    }

    // Debug: Check formData contents
    console.log("🔄 FormData entries:");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(key + ": ", value.name, value.type, value.size);
      } else {
        console.log(key + ": ", value);
      }
    }

    try {
      const token = await getToken();
      console.log("🔑 Token obtained, sending request to /api/product/add");

      const { data } = await axios.post('/api/product/add', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log("✅ API Response:", data);

      if (data.success) {
        toast.success(data.message);
        console.log("🎉 Product added successfully!");
        
        // Reset form
    setFiles([]);
        setVideos([]);
        setName('');
        setDescription('');
      setBrand('');
        setCategory('');
        setSubcategory('');
        setCustomBrand('');
        setCustomCategory('');
        setCustomSubcategory('');
    setOfferPrice('');
        setStockQuantity('');
  setMinBuy(1);
  // previously cleared custom-toggle flags; no longer needed with 'Other' flow
      } else {
        console.error("❌ API Error:", data.message);
        toast.error(data.message);
      }
    } catch (error) {
      console.error("💥 Request Error:", error);
      console.error("💥 Error Response:", error.response?.data);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleImageUpload = (index, file) => {
    const updatedFiles = [...files];
    updatedFiles[index] = file;
    setFiles(updatedFiles);
    console.log(`🖼️ Image ${index} uploaded:`, file?.name);
  };

  const handleVideoUpload = (index, file) => {
    const updatedVideos = [...videos];
    updatedVideos[index] = file;
    setVideos(updatedVideos);
    console.log(`🎬 Video ${index} uploaded:`, file?.name);
  };

  const removeImage = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    console.log(`🗑️ Image ${index} removed`);
  };

  const removeVideo = (index) => {
    const updatedVideos = videos.filter((_, i) => i !== index);
    setVideos(updatedVideos);
    console.log(`🗑️ Video ${index} removed`);
  };

  // Reset category and subcategory when brand changes
  const handleBrandChange = (newBrand) => {
    setBrand(newBrand);
    setCategory('');
    setSubcategory('');
    console.log(`🏷️ Brand changed to: ${newBrand}`);
  };

  // Reset subcategory when category changes
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setSubcategory('');
    console.log(`📂 Category changed to: ${newCategory}`);
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-5 max-w-2xl">
        
        {/* Product Images */}
        <div>
        <p className="text-base font-medium">Product Images (Max 6)</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
          {[...Array(6)].map((_, index) => (
              <div key={index} className="relative">
                <label htmlFor={`image${index}`} className="cursor-pointer">
                  <input 
                    onChange={(e) => handleImageUpload(index, e.target.files[0])} 
                    type="file" 
                    id={`image${index}`} 
                    accept="image/*"
                    hidden 
                  />
                  <Image
                    className="max-w-24 h-24 object-cover border-2 border-dashed border-gray-300 rounded"
                    src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area}
                    alt=""
                    width={96}
                    height={96}
                  />
                </label>
                {files[index] && (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Product Videos */}
        <div>
          <p className="text-base font-medium">Product Videos (Optional, Max 2)</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="relative">
                <label htmlFor={`video${index}`} className="cursor-pointer">
                  <input 
                    onChange={(e) => handleVideoUpload(index, e.target.files[0])} 
                    type="file" 
                    id={`video${index}`} 
                    accept="video/*"
                    hidden 
                  />
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-100">
                    {videos[index] ? (
                      <video className="w-full h-full object-cover rounded">
                        <source src={URL.createObjectURL(videos[index])} />
                      </video>
                    ) : (
                      <span className="text-gray-500 text-4xl">🎥</span>
                    )}
                  </div>
                </label>
                {videos[index] && (
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Product Name */}
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-name">
            Product Name
          </label>
          <input
            id="product-name"
            type="text"
            placeholder="Type here"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
          />
        </div>

        {/* Product Description */}
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-description">
            Product Description
          </label>
          <textarea
            id="product-description"
            rows={4}
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none"
            placeholder="Type here"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            required
          ></textarea>
        </div>

        {/* Brand, Category, Subcategory Hierarchy (with 'Other' option) */}
        <div className="flex items-center gap-5 flex-wrap">

          {/* Brand */}
          <div className="flex flex-col gap-1 w-48">
            <label className="text-base font-medium" htmlFor="brand">
              Brand <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                id="brand"
                list="brandList"
                className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 flex-1"
                onChange={(e) => handleBrandChange(e.target.value)}
                value={brand}
                placeholder="Select or type brand"
              />
              <datalist id="brandList">
                {Object.keys(productHierarchy).map((brandName) => (
                  <option key={brandName} value={brandName} />
                ))}
                <option value="Other" />
              </datalist>
            </div>
            {brand === 'Other' && (
              <input
                type="text"
                placeholder="Enter custom brand"
                className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 mt-2 w-full"
                onChange={(e) => setCustomBrand(e.target.value)}
                value={customBrand}
              />
            )}
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1 w-48">
            <label className="text-base font-medium" htmlFor="category">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                id="category"
                list="categoryList"
                className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 flex-1"
                onChange={(e) => handleCategoryChange(e.target.value)}
                value={category}
                placeholder={brand && brand !== 'Other' ? 'Select or type category' : 'Type category'}
                disabled={!brand}
              />
              <datalist id="categoryList">
                {getCategories().map((cat) => (
                  <option key={cat} value={cat} />
                ))}
                <option value="Other" />
              </datalist>
            </div>
            {category === 'Other' && (
              <input
                type="text"
                placeholder="Enter custom category"
                className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 mt-2 w-full"
                onChange={(e) => setCustomCategory(e.target.value)}
                value={customCategory}
              />
            )}
          </div>

          {/* Subcategory */}
          <div className="flex flex-col gap-1 w-48">
            <label className="text-base font-medium" htmlFor="subcategory">
              Subcategory <span className="text-gray-500 text-sm">(Optional)</span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                id="subcategory"
                list="subcategoryList"
                className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 flex-1"
                onChange={(e) => setSubcategory(e.target.value)}
                value={subcategory}
                placeholder={category && category !== 'Other' ? 'Select or type subcategory' : 'Type subcategory'}
                disabled={!category || category === 'Other'}
              />
              <datalist id="subcategoryList">
                {getSubcategories().map((subcat) => (
                  <option key={subcat} value={subcat} />
                ))}
                <option value="Other" />
              </datalist>
            </div>
            {subcategory === 'Other' && (
              <input
                type="text"
                placeholder="Enter custom subcategory"
                className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 mt-2 w-full"
                onChange={(e) => setCustomSubcategory(e.target.value)}
                value={customSubcategory}
              />
            )}
          </div>
        </div>

  {/* Price, Offer Price, and Stock Quantity */}
        <div className="flex items-center gap-5 flex-wrap">
          {/* Note: only Offer Price is shown in the seller UI. The product 'price' field will mirror this value. */}
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="offer-price">
              Offer Price <span className="text-red-500">*</span>
            </label>
            <input
              id="offer-price"
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setOfferPrice(e.target.value)}
              value={offerPrice}
              required
            />
          </div>
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="stock-quantity">
              Stock Quantity <span className="text-gray-500 text-sm">(optional)</span>
            </label>
            <input
              id="stock-quantity"
              type="number"
              min="0"
              placeholder="leave empty for unlimited"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setStockQuantity(e.target.value)}
              value={stockQuantity}
            />
          </div>
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="min-buy">
              Min Buy <span className="text-gray-500 text-sm">(minimum qty)</span>
            </label>
            <input
              id="min-buy"
              type="number"
              min="1"
              placeholder="1"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setMinBuy(e.target.value)}
              value={minBuy}
              required
            />
          </div>
                  <div className="flex flex-col gap-1 w-full">
                    <label className="text-base font-medium">Product Colors (optional)</label>
                    <input type="text" placeholder="Comma separated color labels e.g. Red, Blue" value={colorsInput} onChange={(e) => setColorsInput(e.target.value)} className="w-full px-3 py-2 border rounded" />
                    <p className="text-xs text-gray-500">You can provide colors as labels, or send JSON via API. Example: Red, Blue</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(colorsInput || '').split(',').map(s => s.trim()).filter(Boolean).map((label, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full border" style={{ backgroundColor: label }} />
                          <span className="text-xs text-gray-700">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
          {/* Variants UI */}
          <div className="w-full mt-4">
            <label className="text-base font-medium">Product Variants (optional)</label>
            <div className="mt-2 space-y-3">
              {variants.map((group, gi) => (
                <div key={gi} className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <input className="flex-1 outline-none px-2 py-1 border rounded" value={group.name} onChange={(e) => {
                      const copy = [...variants]; copy[gi].name = e.target.value; setVariants(copy);
                    }} placeholder="Variant group name e.g., Storage, Color" />
                    <button type="button" className="ml-2 text-red-500" onClick={() => { setVariants(variants.filter((_, i) => i !== gi)) }}>Remove Group</button>
                  </div>
                  <div className="mt-2 space-y-2">
                          {group.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-3 p-2 border rounded-md">
                        <div className="flex-1">
                          <input className="w-full outline-none px-2 py-1 border rounded" value={opt.label} onChange={(e) => { const copy = [...variants]; copy[gi].options[oi].label = e.target.value; setVariants(copy); }} placeholder="Option label e.g., 64GB, Red" />
                          <input className="w-full mt-2 outline-none px-2 py-1 border rounded" value={opt.description || ''} onChange={(e) => { const copy = [...variants]; copy[gi].options[oi].description = e.target.value; setVariants(copy); }} placeholder="Option description (optional)" />
                          {/* Variant-level colors removed: sellers should not add colors per option here */}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <label className="text-xs text-gray-600">Absolute price</label>
                            <input className="w-28 outline-none px-2 py-1 border rounded" value={opt.price} onChange={(e) => { const copy = [...variants]; copy[gi].options[oi].price = e.target.value; setVariants(copy); }} placeholder="price (absolute)" />
                          </div>
                          <div className="flex flex-col items-end">
                            <button type="button" className="text-red-500 mb-1" onClick={() => { const copy = [...variants]; copy[gi].options.splice(oi,1); setVariants(copy); }}>Remove</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-2">
                      <button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={() => { const copy = [...variants]; copy[gi].options.push({ label: '', price: '', priceDelta: 0, stock: '' }); setVariants(copy); }}>Add Option</button>
                    </div>
                  </div>
                </div>
              ))}
              <div>
                <button type="button" className="px-3 py-1 bg-green-100 rounded" onClick={() => setVariants([...variants, { name: '', options: [] }])}>Add Variant Group</button>
              </div>
            </div>
          </div>
        </div>

        {/* Updated Button with #54B1CE color */}
        <button 
          type="submit" 
          className="px-8 py-2.5 bg-[#54B1CE] text-white font-medium rounded hover:bg-[#3a9cb8] transition-colors"
        >
          ADD PRODUCT
        </button>
      </form>
    </div>
  );
};

export default AddProduct;