import React, { useState, useEffect, useRef } from 'react';
import { Package, Menu as MenuIcon, Settings, X, Bell, Upload, Image as ImageIcon, Volume2, CheckCircle, Edit2, Trash, Plus, Search, RefreshCw, AlertTriangle, MapPin, Phone } from 'lucide-react';
import { Order, MenuItem, OrderStatus } from '../types';
import * as Store from '../services/store';

interface AdminProps {
  onLogout: () => void;
  updateMenu: (newMenu: MenuItem[]) => void;
}

const Admin: React.FC<AdminProps> = ({ onLogout, updateMenu }) => {
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'MENU' | 'SETTINGS'>('ORDERS');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Notification Queue System
  const [notificationQueue, setNotificationQueue] = useState<Order[]>([]);
  const [activeNotification, setActiveNotification] = useState<Order | null>(null);
  
  // Settings State
  const [deliveryFee, setDeliveryFee] = useState(0);
  
  // Menu Editing State
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    refreshData();
    // Poll every 30 seconds as requested
    const interval = setInterval(checkForNewOrders, 30000); 
    return () => clearInterval(interval);
  }, []);

  // Queue Processor
  useEffect(() => {
    if (notificationQueue.length > 0 && !activeNotification) {
      const nextOrder = notificationQueue[0];
      setNotificationQueue(prev => prev.slice(1));
      setActiveNotification(nextOrder);
      playNotificationSound();
      const timer = setTimeout(() => {
        setActiveNotification(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [notificationQueue, activeNotification]);

  const refreshData = () => {
    setOrders(Store.getOrders());
    setMenu(Store.getMenu());
    setDeliveryFee(Store.getDeliveryFee());
  };

  const checkForNewOrders = () => {
    const latestOrders = Store.getOrders();
    setOrders(prevOrders => {
      const newOrders = latestOrders.filter(
        latest => !prevOrders.some(prev => prev.id === latest.id)
      );

      if (newOrders.length > 0) {
        setNewOrderCount(count => count + newOrders.length);
        setNotificationQueue(prevQueue => [...prevQueue, ...newOrders]);
      }

      return latestOrders;
    });
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => {
            console.log('Audio play failed - user interaction needed', e);
        });
    }
  };

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const updated = { ...order, status: newStatus };
      Store.updateOrder(updated);
      refreshData();
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 500;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                } else {
                    reject(new Error("Canvas context failed"));
                }
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editingItem) {
        const file = e.target.files[0];
        try {
            const compressedBase64 = await compressImage(file);
            setEditingItem({ ...editingItem, imageUrl: compressedBase64 });
        } catch (error) {
            alert("Error uploading image. Please try another file.");
        }
    }
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    let newMenu = [...menu];
    if (editingItem.id === 'new') {
        const newItem = { ...editingItem, id: Date.now().toString() };
        newMenu.push(newItem);
    } else {
        const index = newMenu.findIndex(i => i.id === editingItem.id);
        if (index !== -1) newMenu[index] = editingItem;
    }

    Store.saveMenu(newMenu);
    updateMenu(newMenu);
    setMenu(newMenu);
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
        const newMenu = menu.filter(i => i.id !== deleteId);
        Store.saveMenu(newMenu);
        updateMenu(newMenu);
        setMenu(newMenu);
        setDeleteId(null);
    }
  };

  const handleSaveSettings = () => {
      Store.setDeliveryFee(deliveryFee);
      alert('Settings saved successfully!');
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
    order.userDetails.name.toLowerCase().includes(orderSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-20 relative">
      {/* Toast Notification */}
      {activeNotification && (
        <div className="fixed top-20 right-4 z-[60] bg-gray-900 text-white p-4 rounded-xl shadow-2xl animate-bounce-slight max-w-sm w-full border-l-4 border-orange-500">
           <div className="flex justify-between items-start mb-2">
             <h4 className="font-bold text-orange-400 flex items-center gap-2">
               <Bell size={18} /> New Order Received!
             </h4>
             <button onClick={() => setActiveNotification(null)} className="text-gray-400 hover:text-white">
               <X size={16} />
             </button>
           </div>
           <p className="font-semibold text-lg">{activeNotification.userDetails.name}</p>
           <p className="text-gray-300 text-sm mb-2">{activeNotification.items.length} items • ₹{activeNotification.totalAmount}</p>
           <div className="text-xs text-gray-400">
              Just now • Online Payment
           </div>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-gray-900 text-white p-4 sticky top-0 z-10 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings size={20} className="text-orange-400" />
          Admin Panel
        </h1>
        <div className="flex gap-4 items-center">
            <button 
              onClick={playNotificationSound} 
              className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
              title="Test Notification Sound"
            >
              <Volume2 size={20} className="text-blue-300" />
            </button>

            {newOrderCount > 0 && (
                <button 
                  onClick={() => { setNewOrderCount(0); setActiveTab('ORDERS'); }}
                  className="relative p-2 bg-gray-800 rounded-full hover:bg-gray-700"
                >
                    <Bell size={20} className="text-yellow-400" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold animate-bounce">
                        {newOrderCount}
                    </span>
                </button>
            )}
            <button onClick={onLogout} className="text-sm bg-gray-800 px-3 py-1 rounded hover:bg-gray-700">
            Logout
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white shadow-sm mb-4">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`flex-1 py-4 font-semibold text-sm flex justify-center items-center gap-2 ${
            activeTab === 'ORDERS' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'
          }`}
        >
          <Package size={18} /> Orders
        </button>
        <button
          onClick={() => setActiveTab('MENU')}
          className={`flex-1 py-4 font-semibold text-sm flex justify-center items-center gap-2 ${
            activeTab === 'MENU' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'
          }`}
        >
          <MenuIcon size={18} /> Menu
        </button>
        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex-1 py-4 font-semibold text-sm flex justify-center items-center gap-2 ${
            activeTab === 'SETTINGS' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'
          }`}
        >
          <Settings size={18} /> Settings
        </button>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {activeTab === 'ORDERS' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-2">
                <h2 className="text-lg font-bold text-gray-800 w-full sm:w-auto">Recent Orders</h2>
                
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search by ID or Name" 
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-300 pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {orderSearchQuery && (
                        <button 
                            onClick={() => setOrderSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-end mb-2">
                <button onClick={refreshData} className="text-sm text-blue-600 font-normal hover:underline flex items-center gap-1">
                    <RefreshCw size={12} /> Refresh List
                </button>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                    <Search size={48} className="text-gray-200 mb-2" />
                    <p>No orders found matching "{orderSearchQuery}"</p>
                </div>
            ) : filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                  <div>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-1 ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'
                    }`}>
                      {order.status}
                    </span>
                    <p className="text-xs text-gray-400">ID: {order.id.slice(-6)} • {new Date(order.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">₹{order.totalAmount}</p>
                    <div className="flex items-center gap-1 justify-end text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full mt-1">
                       <CheckCircle size={10} /> Online Payment
                    </div>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm text-gray-700">
                      <span>{item.quantity} x {item.name}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-4">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-gray-900">{order.userDetails.name}</p>
                    <a href={`tel:${order.userDetails.phone}`} className="text-blue-600 flex items-center gap-1 text-xs bg-blue-50 px-2 py-1 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors">
                        <Phone size={12} /> Call
                    </a>
                  </div>
                  
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.userDetails.address)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 flex items-start gap-2 text-orange-700 font-medium hover:underline hover:bg-orange-50 p-1 rounded -ml-1 transition-colors"
                    title="Open in Google Maps"
                  >
                    <MapPin size={16} className="flex-shrink-0 mt-0.5 text-orange-600" />
                    <span>{order.userDetails.address}</span>
                  </a>
                </div>

                <div className="flex gap-2">
                  {order.status !== 'DELIVERED' && (
                    <button
                        onClick={() => handleStatusUpdate(order.id, OrderStatus.DELIVERED)}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
                    >
                        Mark Delivered
                    </button>
                  )}
                  {/* Additional Backup Call Button */}
                  <a href={`tel:${order.userDetails.phone}`} className="flex-1 border border-gray-300 text-center py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Phone size={14} /> {order.userDetails.phone}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'MENU' && (
          <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Menu Management</h2>
                <button 
                    onClick={() => {
                        setEditingItem({
                            id: 'new',
                            name: '',
                            price: 0,
                            description: '',
                            imageUrl: '',
                            available: true,
                            category: 'Recommended',
                            isVeg: true
                        });
                        setIsFormOpen(true);
                    }}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md hover:bg-orange-700 transition-colors"
                >
                    <Plus size={16} /> Add Item
                </button>
            </div>

            <div className="space-y-4">
                {menu.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition-shadow hover:shadow-md">
                        {/* Thumbnail Display */}
                        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                           <img 
                              src={item.imageUrl || 'https://placehold.co/400?text=No+Img'} 
                              className="w-full h-full object-cover" 
                              alt={item.name} 
                           />
                           {!item.available && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">OFF</div>}
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">{item.category}</span>
                                    <h4 className="font-bold text-lg text-gray-800">{item.name}</h4>
                                </div>
                                <div className={`w-3 h-3 border ${item.isVeg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center p-[1px]`}>
                                    <div className={`w-full h-full rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                </div>
                            </div>
                            
                            <p className="text-sm text-gray-500 mb-1 line-clamp-1">{item.description}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">₹{item.price}</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {item.available ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => { setEditingItem(item); setIsFormOpen(true); }} className="p-2 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"><Edit2 size={18} /></button>
                            <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"><Trash size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'SETTINGS' && (
           <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-6">App Settings</h2>
              
              <div className="max-w-md space-y-6">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                       Delivery Fee (₹)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Set to 0 for Free Delivery.</p>
                    <input 
                      type="number"
                      min="0"
                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value))}
                    />
                 </div>
                 
                 <button 
                   onClick={handleSaveSettings}
                   className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                 >
                    Save Settings
                 </button>
              </div>
           </div>
        )}
      </div>

      {/* Professional Edit/Add Modal */}
      {isFormOpen && editingItem && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
              <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-xl text-gray-800">{editingItem.id === 'new' ? 'Add New Item' : 'Edit Item'}</h3>
                    <button onClick={() => setIsFormOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={24} /></button>
                  </div>
                  
                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSaveItem} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Column: Image Handling */}
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-700 block">Item Image</label>
                        
                        <div className="relative group">
                          <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                             {editingItem.imageUrl ? (
                               <img src={editingItem.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                             ) : (
                               <div className="text-center text-gray-400">
                                 <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                                 <span className="text-sm">No Image Selected</span>
                               </div>
                             )}
                          </div>
                          
                          {/* Hover Overlay for upload */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl flex-col gap-2">
                             <button 
                               type="button"
                               onClick={() => fileInputRef.current?.click()}
                               className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform"
                             >
                               <Upload size={16} /> {editingItem.imageUrl ? 'Change' : 'Upload'}
                             </button>
                             
                             {editingItem.imageUrl && (
                                <button 
                                  type="button"
                                  onClick={() => setEditingItem({ ...editingItem, imageUrl: '' })}
                                  className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform hover:bg-red-600"
                                >
                                  <Trash size={16} /> Remove
                                </button>
                             )}
                          </div>
                        </div>

                        <input 
                          type="file" 
                          ref={fileInputRef}
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        
                        <div>
                          <p className="text-xs text-center text-gray-500 mb-2">- OR -</p>
                          <input 
                            placeholder="Paste Image URL" 
                            className="w-full text-xs border p-2 rounded bg-gray-50 focus:ring-1 focus:ring-orange-500 outline-none" 
                            value={editingItem.imageUrl} 
                            onChange={e => setEditingItem({...editingItem, imageUrl: e.target.value})} 
                          />
                        </div>
                      </div>

                      {/* Right Column: Details */}
                      <div className="space-y-5">
                          <div>
                              <label className="text-sm font-bold text-gray-700 block mb-1">Item Name</label>
                              <input required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} placeholder="e.g. Masala Dosa" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-sm font-bold text-gray-700 block mb-1">Price (₹)</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-500">₹</span>
                                    <input required type="number" className="w-full bg-gray-50 border border-gray-200 p-3 pl-8 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})} />
                                  </div>
                              </div>
                              <div>
                                  <label className="text-sm font-bold text-gray-700 block mb-1">Category</label>
                                  <input type="text" list="categories" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all" value={editingItem.category || ''} onChange={e => setEditingItem({...editingItem, category: e.target.value})} placeholder="e.g. Breads" />
                                  <datalist id="categories">
                                    <option value="Recommended" />
                                    <option value="Breads" />
                                    <option value="Curries" />
                                    <option value="Rice" />
                                    <option value="Snacks" />
                                  </datalist>
                              </div>
                          </div>

                          <div>
                              <label className="text-sm font-bold text-gray-700 block mb-1">Description</label>
                              <textarea className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none h-24" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} placeholder="Describe the dish..." />
                          </div>

                          <div className="flex gap-4">
                              <div className="flex-1 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer" onClick={() => setEditingItem({...editingItem, available: !editingItem.available})}>
                                  <div className={`w-8 h-5 rounded-full p-0.5 transition-colors ${editingItem.available ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${editingItem.available ? 'translate-x-3' : 'translate-x-0'}`} />
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 select-none">Available</span>
                              </div>

                              <div className="flex-1 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer" onClick={() => setEditingItem({...editingItem, isVeg: !editingItem.isVeg})}>
                                  <div className={`w-8 h-5 rounded-full p-0.5 transition-colors ${editingItem.isVeg ? 'bg-green-500' : 'bg-red-500'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${editingItem.isVeg ? 'translate-x-3' : 'translate-x-0'}`} />
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 select-none">{editingItem.isVeg ? 'Veg' : 'Non-Veg'}</span>
                              </div>
                          </div>
                      </div>
                    </form>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                    <button type="button" onClick={handleSaveItem} className="px-8 py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-700 active:scale-95 transition-all">
                      Save Changes
                    </button>
                  </div>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center transform transition-all scale-100">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash size={32} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Item?</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Are you sure you want to remove this item from the menu? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setDeleteId(null)}
                          className="flex-1 py-3 text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmDelete}
                          className="flex-1 py-3 text-white font-bold bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-200 transition-colors"
                      >
                          Yes, Delete
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Admin;