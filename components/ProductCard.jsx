import React from 'react'
import { assets } from '@/assets/assets'
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';

const ProductCard = ({ product }) => {
    const { currency, router } = useAppContext()

    return (
        <div
            onClick={() => { router.push('/product/' + product._id); scrollTo(0, 0) }}
            className="flex flex-col items-start gap-1 max-w-[200px] w-full cursor-pointer"
        >
            <div className="relative bg-gray-500/10 rounded-lg w-full h-52 flex items-center justify-center overflow-hidden">
                <Image
                    src={product.image && product.image[0] ? product.image[0] : assets.upload_area}
                    alt={product.name}
                    className="object-cover w-4/5 h-4/5"
                    width={800}
                    height={800}
                />
                
                {/* Brand Badge */}
                {product.brand && (
                    <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        {product.brand}
                    </div>
                )}
            </div>

            <p className="text-base font-medium truncate w-full mt-2">{product.name}</p>
            
            {/* Category Tags */}
            <div className="flex gap-1 w-full flex-wrap">
                {product.category && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {product.category}
                    </span>
                )}
                {product.subcategory && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {product.subcategory}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2 mt-1">
                <p className="text-xs">4.5</p>
                <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map((star) => (
                        <Image
                            key={star}
                            className="h-3 w-3"
                            src={star <= 4 ? assets.star_icon : assets.star_dull_icon}
                            alt="star"
                        />
                    ))}
                </div>
            </div>

            <div className="flex items-end justify-between w-full mt-2">
                <p className="text-base font-medium">₹{product.offerPrice}</p>
                <button className="px-4 py-1.5 text-gray-500 border border-gray-300 rounded text-xs hover:bg-gray-50">
                    Buy now
                </button>
            </div>
        </div>
    )
}

export default ProductCard