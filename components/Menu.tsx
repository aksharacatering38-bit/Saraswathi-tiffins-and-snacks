import React, { useState } from 'react';
import { Search, ShoppingBag, Star, Minus, Plus } from 'lucide-react';
import { MenuItem, CartItem } from '../types';
import { CUTOFF_HOUR } from '../constants';

interface MenuProps {
  menu: MenuItem[];
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  goToCart: () => void;
}

const Menu: React.FC<MenuProps> = ({ menu, cart, addToCart, updateQuantity, goToCart }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const currentHour = new Date().getHours();
  const isShopClosed = currentHour >= CUTOFF_HOUR;
  
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const getItemQuantity = (itemId: string) => {
    return cart.find(i => i.id === itemId)?.quantity || 0;
  };

  // Group menu by category
  const filteredMenu = menu.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories: string[] = Array.from(new Set(filteredMenu.map(item => item.category || 'Other')));
  // Sort categories to put "Recommended" first if it exists
  categories.sort((a, b) => {
    if (a === 'Recommended') return -1;
    if (b === 'Recommended') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Search Bar */}
      <div className="bg-white p-4 sticky top-[60px] z-[5] shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search for tiffins..." 
            className="w-full bg-gray-100 py-3 pl-10 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Warning Banner */}
      {isShopClosed && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4 rounded-r shadow-sm">
            <p className="font-bold text-red-700 text-sm">Orders Closed</p>
            <p className="text-xs text-red-600">We accept orders before 6 PM only.</p>
          </div>
      )}

      {!isShopClosed && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mx-4 mt-2 rounded-r flex items-center justify-between">
           <div>
             <p className="font-bold text-blue-800 text-xs">PRE-ORDER OPEN</p>
             <p className="text-[10px] text-blue-600 uppercase tracking-wide">Delivery by 8 PM Today</p>
           </div>
           <span className="text-2xl">🛵</span>
        </div>
      )}

      {/* Menu Categories */}
      <div className="space-y-6 mt-4">
        {categories.map(category => (
          <div key={category} className="bg-white pb-2">
            <h3 className="text-lg font-extrabold text-gray-800 px-4 py-4">{category}</h3>
            <div>
              {filteredMenu.filter(item => item.category === category).map((item, index, arr) => {
                const qty = getItemQuantity(item.id);
                const isLast = index === arr.length - 1;
                
                return (
                  <div key={item.id} className={`px-4 py-6 flex gap-4 ${!isLast ? 'border-b border-gray-100' : ''}`}>
                    {/* Text Section */}
                    <div className="flex-1">
                      {/* Veg Symbol */}
                      <div className="mb-2">
                         {item.isVeg ? (
                           <div className="border border-green-600 w-4 h-4 flex items-center justify-center p-[2px]">
                             <div className="bg-green-600 w-full h-full rounded-full"></div>
                           </div>
                         ) : (
                           <div className="border border-red-600 w-4 h-4 flex items-center justify-center p-[2px]">
                              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-l-transparent border-r-transparent border-b-red-600"></div>
                           </div>
                         )}
                      </div>

                      {item.isBestseller && (
                        <div className="flex items-center gap-1 mb-1">
                          <Star size={12} className="text-orange-500 fill-orange-500" />
                          <span className="text-[10px] font-bold text-orange-500">BESTSELLER</span>
                        </div>
                      )}

                      <h4 className="font-bold text-gray-800 text-base mb-1">{item.name}</h4>
                      <div className="font-semibold text-gray-700 text-sm mb-2">₹{item.price}</div>
                      
                      {item.rating && (
                        <div className="inline-flex items-center gap-1 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded text-[10px] text-green-700 font-bold mb-2">
                           <Star size={8} className="fill-green-700" /> {item.rating} <span className="text-gray-400 font-normal">({item.votes})</span>
                        </div>
                      )}

                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>

                    {/* Image Section */}
                    <div className="relative w-32 flex-shrink-0">
                       <div className="w-32 h-28 rounded-xl overflow-hidden shadow-sm bg-gray-100">
                         {item.imageUrl && (
                           <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                         )}
                       </div>
                       
                       {/* Add Button - Floating over image bottom */}
                       <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 shadow-lg rounded-lg bg-white overflow-hidden border border-gray-100">
                          {isShopClosed || !item.available ? (
                             <div className="text-xs font-bold text-gray-400 text-center py-2 bg-gray-50">UNAVAILABLE</div>
                          ) : qty === 0 ? (
                             <button 
                               onClick={() => addToCart(item)}
                               className="w-full py-2 text-green-600 font-extrabold text-sm hover:bg-green-50 uppercase"
                             >
                               ADD
                             </button>
                          ) : (
                             <div className="flex items-center justify-between px-2 py-1.5 bg-white">
                                <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-500 hover:text-green-600">
                                   <Minus size={14} strokeWidth={3} />
                                </button>
                                <span className="text-green-600 font-extrabold text-sm">{qty}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="text-green-600">
                                   <Plus size={14} strokeWidth={3} />
                                </button>
                             </div>
                          )}
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Bar (Swiggy Style) */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-8">
          <button
            onClick={goToCart}
            className="w-full bg-green-600 text-white p-3 rounded-xl shadow-xl flex justify-between items-center animate-fade-in hover:scale-[1.01] transition-transform"
          >
            <div className="flex flex-col items-start pl-2">
              <span className="text-xs font-medium uppercase tracking-wider text-green-100">{cartItemCount} ITEMS</span>
              <span className="font-bold text-lg">₹{cartTotal} <span className="text-sm font-normal text-green-100 opacity-80 ml-1">plus taxes</span></span>
            </div>
            <div className="flex items-center gap-2 pr-2 font-bold text-sm">
              View Cart <ShoppingBag size={18} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default Menu;