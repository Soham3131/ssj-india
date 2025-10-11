"use client"
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
  const [colorsInput, setColorsInput] = useState(''); // CSV-style input for product-level colors
  const [colors, setColors] = useState([]); // structured colors: { label, color, imageIndex }
  const [newColorLabel, setNewColorLabel] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [newColorImageIndex, setNewColorImageIndex] = useState(1);
  const [highlightedThumbnailIndex, setHighlightedThumbnailIndex] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customSubcategory, setCustomSubcategory] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [minBuy, setMinBuy] = useState(1);
  const [variants, setVariants] = useState([]);

  const productHierarchy = {
    Boat: { Handsfree: ['Wired Handsfree', 'Wireless Handsfree'], Earbuds: ['True Wireless Earbuds'] },
    JBL: { Handsfree: ['Wired Headphones'] },
    Sony: { Handsfree: ['Sony Headphones'] },
  };

  const getCategories = () => {
    if (!brand || brand === 'Other') return [];
    return ['Handsfree', 'Earbuds', 'Mix Items', 'Cables and Chargers', 'Battery', 'Selfie Sticks', 'Gift and Crockery Items', 'Speaker'];
  };

  const getSubcategories = () => {
    if (!brand || brand === 'Other' || !category || category === 'Other') return [];
    return productHierarchy[brand] && productHierarchy[brand][category] ? productHierarchy[brand][category] : [];
  };

  const handleImageUpload = (index, file) => {
    const updated = [...files];
    updated[index] = file;
    setFiles(updated);
  };

  const handleVideoUpload = (index, file) => {
    // client-side check: allow up to 200MB
    if (file && file.size > 200 * 1024 * 1024) {
      toast.error('Video size should be less than 200MB');
      return;
    }
    const updated = [...videos];
    updated[index] = file;
    setVideos(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('brand', brand === 'Other' ? customBrand : brand);
    formData.append('category', category === 'Other' ? customCategory : category);
    if (subcategory) formData.append('subcategory', subcategory === 'Other' ? customSubcategory : subcategory);
    formData.append('price', offerPrice);
    formData.append('offerPrice', offerPrice);
    formData.append('stockQuantity', stockQuantity);
    formData.append('minBuy', minBuy);

    for (let i = 0; i < files.length; i++) if (files[i]) formData.append('images', files[i]);
    for (let i = 0; i < videos.length; i++) if (videos[i]) formData.append('videos', videos[i]);

    if (variants && variants.length) formData.append('variants', JSON.stringify(variants));

    // Prefer structured colors (JSON) if provided, otherwise fall back to CSV input
    if (colors && colors.length > 0) {
      formData.append('colors', JSON.stringify(colors));
    } else if (colorsInput && colorsInput.trim()) {
      formData.append('colors', colorsInput.trim());
    }

    try {
      const token = await getToken();
      const { data } = await axios.post('/api/product/add', formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      if (data.success) {
        toast.success(data.message);
        // reset
        setFiles([]); setVideos([]); setName(''); setDescription(''); setBrand(''); setCategory(''); setSubcategory(''); setCustomBrand(''); setCustomCategory(''); setCustomSubcategory(''); setOfferPrice(''); setStockQuantity(''); setMinBuy(1); setVariants([]); setColorsInput('');
      } else toast.error(data.message || 'Failed to add product');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    }
  };

  const removeFileAt = (arr, setter, index) => {
    const copy = arr.filter((_, i) => i !== index);
    setter(copy);
  };

  const handleBrandChange = (newBrand) => { setBrand(newBrand); setCategory(''); setSubcategory(''); };
  const handleCategoryChange = (newCat) => { setCategory(newCat); setSubcategory(''); };

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-5 max-w-2xl">
        {/* Images */}
        <div>
          <p className="text-base font-medium">Product Images (Max 6)</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="relative">
                <label htmlFor={`image${index}`} className="cursor-pointer">
                  <input onChange={(e) => handleImageUpload(index, e.target.files[0])} type="file" id={`image${index}`} accept="image/*" hidden />
                  <Image className="max-w-24 h-24 object-cover rounded" src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area} alt="" width={96} height={96} style={{ border: highlightedThumbnailIndex === index ? '3px solid #54B1CE' : undefined }} />
                </label>
                {files[index] && (<button type="button" onClick={() => removeFileAt(files, setFiles, index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">×</button>)}
              </div>
            ))}
          </div>
          
          {/* Color step editor - associate colors with an image slot */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-medium">Structured Colors (optional)</h3>
            <p className="text-xs text-gray-500">Add colors and associate each with an image slot (1-6). Buyers will see the image swap when they pick a color.</p>
            <div className="mt-3 space-y-2">
              {colors.length > 0 ? (
                colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full border" style={{ backgroundColor: c.color || c.label }} />
                    <div className="flex-1 text-sm">{c.label} {c.imageIndex ? `(Image ${c.imageIndex})` : ''}</div>
                    <button type="button" className="px-2 py-1 text-xs bg-gray-100 rounded" onClick={() => {
                      // highlight the associated thumbnail and focus its file input
                      const idx = (c.imageIndex && Number(c.imageIndex) > 0) ? Number(c.imageIndex) - 1 : null;
                      if (idx !== null) {
                        setHighlightedThumbnailIndex(idx);
                        const el = document.getElementById(`image${idx}`);
                        if (el) el.click();
                      }
                    }}>Highlight</button>
                    <button type="button" className="px-2 py-1 text-xs text-red-500" onClick={() => setColors(colors.filter((_,j)=>j!==i))}>Remove</button>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500">No structured colors added.</div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <input placeholder="Label e.g. Red" value={newColorLabel} onChange={(e)=>setNewColorLabel(e.target.value)} className="px-2 py-1 border rounded w-36" />
                <div className="flex items-center gap-2">
                  <input type="color" value={newColorHex} onChange={(e)=>setNewColorHex(e.target.value)} className="w-10 h-8 p-0 border rounded" />
                  <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: newColorHex || newColorLabel || '#ffffff' }} />
                </div>
                <input type="number" min={1} max={6} value={newColorImageIndex} onChange={(e)=>setNewColorImageIndex(e.target.value)} className="w-20 px-2 py-1 border rounded" />
                <button type="button" className="px-3 py-1 bg-green-100 rounded" onClick={()=>{
                  if (!newColorLabel.trim()) return toast.error('Color label required');
                  const colorValue = newColorHex && newColorHex !== '#000000' ? newColorHex : newColorLabel.trim();
                  const c = { label: newColorLabel.trim(), color: colorValue, imageIndex: Number(newColorImageIndex) || 1 };
                  setColors(prev => [...prev, c]);
                  setNewColorLabel(''); setNewColorHex('#000000'); setNewColorImageIndex(1);
                }}>Add Color</button>
              </div>
            </div>
          </div>
        </div>

        {/* Videos */}
        <div>
          <p className="text-base font-medium">Product Videos (Optional, Max 2)</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="relative">
                <label htmlFor={`video${index}`} className="cursor-pointer">
                  <input onChange={(e) => handleVideoUpload(index, e.target.files[0])} type="file" id={`video${index}`} accept="video/*" hidden />
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-100">
                    {videos[index] ? (<video className="w-full h-full object-cover rounded"><source src={URL.createObjectURL(videos[index])} /></video>) : <span className="text-gray-500 text-4xl">🎥</span>}
                  </div>
                </label>
                {videos[index] && (<button type="button" onClick={() => removeFileAt(videos, setVideos, index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">×</button>)}
              </div>
            ))}
          </div>
        </div>

        {/* Basic fields */}
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-name">Product Name</label>
          <input id="product-name" type="text" placeholder="Type here" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40" onChange={(e)=>setName(e.target.value)} value={name} required />
        </div>

        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-description">Product Description</label>
          <textarea id="product-description" rows={4} className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none" placeholder="Type here" onChange={(e)=>setDescription(e.target.value)} value={description} required />
        </div>

        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex flex-col gap-1 w-48">
            <label className="text-base font-medium">Brand <span className="text-red-500">*</span></label>
            <input list="brandList" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 flex-1" onChange={(e)=>{ handleBrandChange(e.target.value); }} value={brand} placeholder="Select or type brand" />
            <datalist id="brandList">{Object.keys(productHierarchy).map(b=> <option key={b} value={b} />)}<option value="Other"/></datalist>
            {brand==='Other' && <input type="text" placeholder="Enter custom brand" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 mt-2 w-full" onChange={(e)=>setCustomBrand(e.target.value)} value={customBrand} />}
          </div>

          <div className="flex flex-col gap-1 w-48">
            <label className="text-base font-medium">Category <span className="text-red-500">*</span></label>
            <input list="categoryList" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 flex-1" onChange={(e)=>{ handleCategoryChange(e.target.value); }} value={category} placeholder={brand && brand!=='Other' ? 'Select or type category' : 'Type category'} disabled={!brand} />
            <datalist id="categoryList">{getCategories().map(c=> <option key={c} value={c} />)}<option value="Other"/></datalist>
            {category==='Other' && <input type="text" placeholder="Enter custom category" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 mt-2 w-full" onChange={(e)=>setCustomCategory(e.target.value)} value={customCategory} />}
          </div>

          <div className="flex flex-col gap-1 w-48">
            <label className="text-base font-medium">Subcategory <span className="text-gray-500 text-sm">(Optional)</span></label>
            <input list="subcategoryList" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 flex-1" onChange={(e)=>setSubcategory(e.target.value)} value={subcategory} placeholder={category && category!=='Other' ? 'Select or type subcategory' : 'Type subcategory'} disabled={!category || category==='Other'} />
            <datalist id="subcategoryList">{getSubcategories().map(s=> <option key={s} value={s} />)}<option value="Other"/></datalist>
            {subcategory==='Other' && <input type="text" placeholder="Enter custom subcategory" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 mt-2 w-full" onChange={(e)=>setCustomSubcategory(e.target.value)} value={customSubcategory} />}
          </div>
        </div>

        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium">Offer Price <span className="text-red-500">*</span></label>
            <input type="number" placeholder="0" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40" onChange={(e)=>setOfferPrice(e.target.value)} value={offerPrice} required />
          </div>

          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium">Stock Quantity <span className="text-gray-500 text-sm">(optional)</span></label>
            <input type="number" min="0" placeholder="leave empty for unlimited" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40" onChange={(e)=>setStockQuantity(e.target.value)} value={stockQuantity} />
          </div>

          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium">Min Buy <span className="text-gray-500 text-sm">(minimum qty)</span></label>
            <input type="number" min="1" placeholder="1" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40" onChange={(e)=>setMinBuy(e.target.value)} value={minBuy} required />
          </div>

          {/* Legacy CSV colors input removed - use the structured color editor below to add colors with associated image slots */}
        </div>

        {/* Variants UI (colors per option intentionally removed) */}
        <div className="w-full mt-4">
          <label className="text-base font-medium">Product Variants (optional)</label>
          <div className="mt-2 space-y-3">
            {variants.map((group, gi)=> (
              <div key={gi} className="p-3 border rounded">
                <div className="flex items-center justify-between">
                  <input className="flex-1 outline-none px-2 py-1 border rounded" value={group.name} onChange={(e)=>{ const copy=[...variants]; copy[gi].name=e.target.value; setVariants(copy); }} placeholder="Variant group name e.g., Storage" />
                  <button type="button" className="ml-2 text-red-500" onClick={()=> setVariants(variants.filter((_,i)=>i!==gi))}>Remove Group</button>
                </div>
                <div className="mt-2 space-y-2">
                  {group.options.map((opt, oi)=> (
                    <div key={oi} className="flex items-center gap-3 p-2 border rounded-md">
                      <div className="flex-1">
                        <input className="w-full outline-none px-2 py-1 border rounded" value={opt.label} onChange={(e)=>{ const copy=[...variants]; copy[gi].options[oi].label=e.target.value; setVariants(copy); }} placeholder="Option label e.g., 64GB" />
                        <input className="w-full mt-2 outline-none px-2 py-1 border rounded" value={opt.description||''} onChange={(e)=>{ const copy=[...variants]; copy[gi].options[oi].description=e.target.value; setVariants(copy); }} placeholder="Option description (optional)" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-600">Absolute price</label>
                          <input className="w-28 outline-none px-2 py-1 border rounded" value={opt.price} onChange={(e)=>{ const copy=[...variants]; copy[gi].options[oi].price=e.target.value; setVariants(copy); }} placeholder="price (absolute)" />
                        </div>
                        <div className="flex flex-col items-end">
                          <button type="button" className="text-red-500 mb-1" onClick={()=>{ const copy=[...variants]; copy[gi].options.splice(oi,1); setVariants(copy); }}>Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-2"><button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={()=>{ const copy=[...variants]; copy[gi].options.push({ label:'', price:'', priceDelta:0, stock:'' }); setVariants(copy); }}>Add Option</button></div>
                </div>
              </div>
            ))}
            <div><button type="button" className="px-3 py-1 bg-green-100 rounded" onClick={()=> setVariants([...variants, { name:'', options: [] }])}>Add Variant Group</button></div>
          </div>
        </div>

        <button type="submit" className="px-8 py-2.5 bg-[#54B1CE] text-white font-medium rounded hover:bg-[#3a9cb8] transition-colors">ADD PRODUCT</button>
      </form>
    </div>
  );
};

export default AddProduct;