
import React, { useState } from 'react';
import { ArrowLeft, Lock, Clock, CreditCard, ShieldCheck } from 'lucide-react';
import { UserDetails } from '../types';
import { CUTOFF_HOUR, RAZORPAY_KEY_ID, STORE_NAME } from '../constants';

interface CheckoutProps {
  total: number;
  goBack: () => void;
  onPlaceOrder: (details: UserDetails, paymentId: string) => Promise<void>;
}

const Checkout: React.FC<CheckoutProps> = ({ total, goBack, onPlaceOrder }) => {
  const [details, setDetails] = useState<UserDetails>({
    name: '',
    phone: '',
    address: '',
    email: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const isLate = new Date().getHours() >= CUTOFF_HOUR;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLate) return;
    
    // Check if key is configured
    if (RAZORPAY_KEY_ID === "YOUR_RAZORPAY_KEY_ID_HERE") {
        alert("Admin Warning: Razorpay Key ID is not configured in constants.ts. Payment cannot proceed.");
        return;
    }

    setIsProcessing(true);

    const options = {
        key: RAZORPAY_KEY_ID,
        amount: total * 100, // Amount is in currency subunits (paise)
        currency: "INR",
        name: STORE_NAME,
        description: "Food Order Payment",
        // image: "https://your-logo-url.com/logo.png", // Optional: Add your logo here
        handler: function (response: any) {
            // This handler is called AUTOMATICALLY when payment is successful
            setIsProcessing(false);
            if (response.razorpay_payment_id) {
                onPlaceOrder(details, response.razorpay_payment_id);
            }
        },
        prefill: {
            name: details.name,
            email: details.email,
            contact: details.phone
        },
        theme: {
            color: "#ea580c" // Matches orange-600
        },
        modal: {
            ondismiss: function() {
                setIsProcessing(false);
            }
        }
    };

    try {
        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response: any){
            alert("Payment Failed: " + response.error.description);
            setIsProcessing(false);
        });
        rzp1.open();
    } catch (error) {
        console.error("Razorpay Error:", error);
        alert("Could not initiate payment. Please check connection.");
        setIsProcessing(false);
    }
  };

  if (isLate) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-100 p-6 rounded-full mb-6">
          <Clock size={48} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Orders Closed</h2>
        <p className="text-gray-600 mb-6">
          We do not accept orders after 6 PM. Please come back tomorrow!
        </p>
        <button
          onClick={goBack}
          className="bg-gray-800 text-white px-8 py-3 rounded-xl font-semibold"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
        <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-lg mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
             <ShieldCheck size={18} className="text-green-600"/> Delivery Details
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              required
              type="text"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              placeholder="Enter your name"
              value={details.name}
              onChange={e => setDetails({...details, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              required
              type="tel"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              placeholder="+91 98765 43210"
              value={details.phone}
              onChange={e => setDetails({...details, phone: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
            <textarea
              required
              rows={3}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              placeholder="House no, Street, Landmark..."
              value={details.address}
              onChange={e => setDetails({...details, address: e.target.value})}
            />
          </div>

           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (For Receipt)</label>
            <input
              required
              type="email"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              placeholder="your@email.com"
              value={details.email}
              onChange={e => setDetails({...details, email: e.target.value})}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className={`w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-200 flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? 'Processing...' : (
              <>
                <CreditCard size={20} />
                Pay ₹{total} & Place Order
              </>
          )}
        </button>
        <p className="text-xs text-center text-gray-500">
          Secure online payment via Razorpay. Order is confirmed automatically upon success.
        </p>
      </form>
    </div>
  );
};

export default Checkout;
