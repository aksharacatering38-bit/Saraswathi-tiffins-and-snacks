
import React, { useState } from 'react';
import { ArrowLeft, Minus, Plus, FileText, ShieldCheck, Phone, Ticket, Check, X } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { CartItem } from '../types';
import { COUPONS } from '../constants';
import * as Store from '../services/store';

interface CartProps {
  cart: CartItem[];
  updateQuantity: (itemId: string, delta: number) => void;
  goBack: () => void;
  checkout: () => void;
}

const Cart: React.FC<CartProps> = ({ cart, updateQuantity, goBack, checkout }) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<typeof COUPONS[0] | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const itemTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const platformFee = 5;
  const deliveryFee = Store.getDeliveryFee();
  const gst = Math.round(itemTotal * 0.05);
  
  // Calculate total before discount
  const grossTotal = itemTotal + platformFee + deliveryFee + gst;
  const finalTotal = Math.max(0, grossTotal - discountAmount);

  const handleUpdateQuantity = async (id: string, delta: number) => {
    try {
        await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {}
    updateQuantity(id, delta);
  };

  const applyCoupon = () => {
    const coupon = COUPONS.find(c => c.code === couponCode.toUpperCase());
    if (coupon) {
      if (itemTotal < (coupon.minOrder || 0)) {
        alert(`Minimum order value is ₹${coupon.minOrder}`);
        return;
      }
      
      let discount = 0;
      if (coupon.discountAmount) {
        discount = coupon.discountAmount;
      } else if (coupon.discountPercent) {
        discount = (itemTotal * coupon.discountPercent) / 100;
        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      }
      
      setAppliedCoupon(coupon);
      setDiscountAmount(Math.round(discount));
      try { Haptics.notification({ type: 'SUCCESS' }); } catch (e) {}
    } else {
      alert("Invalid Coupon Code");
      setAppliedCoupon(null);
      setDiscountAmount(0);
      try { Haptics.notification({ type: 'ERROR' }); } catch (e) {}
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
  };

  if (cart.length === 0) {
    return (
      <div className="h-screen flex flex-col justify-center items-center p-8 text-center bg-white">
        <img 
          src="https://media.istockphoto.com/id/1138644570/vector/shopping-cart-icon-design-cart-icon-symbol-design.jpg?s=612x612&w=0&k=20&c=guuFF5oE1_r5d6Jk9q8YhJ7s3k6X6gK4s2g8k2g_1_g=" 
          alt="Empty Cart" 
          className="w-48 opacity-50 mb-6 grayscale"
        />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Good food is always cooking</h2>
        <p className="text-sm text-gray-500 mb-8">Your cart is empty. Add something from the menu.</p>
        <button
          onClick={goBack}
          className="border border-orange-500 text-orange-600 px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors uppercase"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4 pt-[safe-area-inset-top]">
        <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <div>
           <h1 className="text-lg font-bold text-gray-900">Cart</h1>
           <p className="text-xs text-gray-500">{cart.length} items</p>
        </div>
      </div>

      <div className="flex-1 p-4 pb-48 space-y-4 overflow-y-auto">
        
        {/* Items List */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
           {cart.map((item, index) => (
             <div key={item.id} className={`flex justify-between items-start py-4 ${index !== cart.length - 1 ? 'border-b border-gray-100' : ''}`}>
               <div className="flex items-start gap-2 flex-1">
                 <div className="mt-1">
                    {item.isVeg ? (
                        <div className="border border-green-600 w-3 h-3 flex items-center justify-center p-[1px]">
                            <div className="bg-green-600 w-full h-full rounded-full"></div>
                        </div>
                    ) : (
                        <div className="border border-red-600 w-3 h-3 flex items-center justify-center p-[1px]">
                            <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[6px] border-l-transparent border-r-transparent border-b-red-600"></div>
                        </div>
                    )}
                 </div>
                 <div>
                   <h4 className="font-semibold text-gray-800 text-sm">{item.name}</h4>
                   <p className="text-xs text-gray-500">₹{item.price}</p>
                 </div>
               </div>
               
               <div className="flex items-center border border-gray-300 rounded-md h-8 bg-white">
                 <button onClick={() => handleUpdateQuantity(item.id, -1)} className="px-2 text-gray-600 hover:text-green-600">
                    <Minus size={12} strokeWidth={3} />
                 </button>
                 <span className="text-green-600 font-bold text-sm w-4 text-center">{item.quantity}</span>
                 <button onClick={() => handleUpdateQuantity(item.id, 1)} className="px-2 text-green-600">
                    <Plus size={12} strokeWidth={3} />
                 </button>
               </div>
               
               <div className="text-sm font-medium text-gray-700 w-16 text-right">
                  ₹{item.price * item.quantity}
               </div>
             </div>
           ))}

           <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
             <input 
               placeholder="Any suggestions? We will pass it on..." 
               className="w-full bg-gray-50 p-3 rounded-lg text-sm outline-none focus:ring-1 focus:ring-gray-300"
             />
           </div>
        </div>

        {/* Coupon Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Ticket size={16} /> Offers & Benefits</h3>
            
            {appliedCoupon ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-600 text-white p-1 rounded-full"><Check size={12} /></div>
                        <div>
                            <p className="font-bold text-sm text-gray-800">'{appliedCoupon.code}' applied</p>
                            <p className="text-xs text-green-700">You saved ₹{discountAmount}</p>
                        </div>
                    </div>
                    <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500 font-bold text-xs uppercase p-2">Remove</button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Enter Coupon Code" 
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button 
                        onClick={applyCoupon}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-700"
                    >
                        APPLY
                    </button>
                </div>
            )}
            
            {!appliedCoupon && (
                <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                    {COUPONS.map(c => (
                        <button 
                            key={c.code}
                            onClick={() => { setCouponCode(c.code); }}
                            className="flex-shrink-0 border border-orange-200 bg-orange-50 rounded-lg p-2 text-left w-40"
                        >
                            <p className="font-bold text-xs text-orange-700">{c.code}</p>
                            <p className="text-[10px] text-gray-600 line-clamp-1">{c.description}</p>
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Bill Details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
           <h3 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
             <FileText size={16} /> Bill Details
           </h3>
           
           <div className="space-y-3 text-sm text-gray-600">
             <div className="flex justify-between">
               <span>Item Total</span>
               <span>₹{itemTotal}</span>
             </div>
             <div className="flex justify-between">
               <span className="underline decoration-dotted decoration-gray-400">Delivery Fee</span>
               <span className={deliveryFee === 0 ? "text-green-600" : ""}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
             </div>
             <div className="flex justify-between">
               <span className="underline decoration-dotted decoration-gray-400">GST (5%)</span>
               <span>₹{gst}</span>
             </div>
             <div className="flex justify-between">
               <span className="underline decoration-dotted decoration-gray-400">Platform Fee</span>
               <span>₹{platformFee}</span>
             </div>
             
             {discountAmount > 0 && (
                 <div className="flex justify-between text-green-600 font-bold bg-green-50 p-2 rounded -mx-2">
                   <span>Details Discount</span>
                   <span>- ₹{discountAmount}</span>
                 </div>
             )}
           </div>
           
           <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center text-gray-900">
             <span className="font-extrabold text-base">To Pay</span>
             <span className="font-extrabold text-base">₹{finalTotal}</span>
           </div>
        </div>

        {/* Savings Highlight */}
        {discountAmount > 0 && (
            <div className="bg-green-100 border border-green-200 rounded-xl p-3 text-center">
                <p className="text-green-800 font-bold text-sm">🎉 You saved ₹{discountAmount} on this order!</p>
            </div>
        )}

        {/* Benefits/Cancellations Policy visual */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
             <ShieldCheck className="text-green-600 flex-shrink-0" size={20} />
             <div>
                <h4 className="text-xs font-bold text-gray-800">Secure & Safe Delivery</h4>
                <p className="text-[10px] text-gray-500 mt-1">Rider will conform to all safety protocols during delivery.</p>
             </div>
        </div>

        {/* Help Link */}
        <div className="text-center pb-4">
            <a href="tel:9959730602" className="text-xs text-orange-600 font-bold flex items-center justify-center gap-1 hover:underline">
                <Phone size={12} /> Need Help? Call Us
            </a>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 pb-safe-bottom">
        <button
          onClick={checkout}
          className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold text-base shadow-lg shadow-green-200 active:scale-[0.98] transition-transform flex justify-between px-6 items-center"
        >
          <div className="text-left flex flex-col leading-none">
             <span className="text-[10px] uppercase font-medium opacity-80">Total</span>
             <span>₹{finalTotal}</span>
          </div>
          <span className="flex items-center gap-1">
            Proceed to Pay <ArrowLeft className="rotate-180" size={18} />
          </span>
        </button>
      </div>
    </div>
  );
};

export default Cart;
