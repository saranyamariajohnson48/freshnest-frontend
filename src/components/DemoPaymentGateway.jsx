import React, { useState } from 'react';
import { FiCreditCard, FiCheckCircle, FiAlertTriangle, FiX, FiLoader, FiShield } from 'react-icons/fi';

const DemoPaymentGateway = ({ 
  isOpen, 
  onClose, 
  orderData, 
  onSuccess, 
  onError,
  totalAmount,
  customerInfo 
}) => {
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('demo');
  const [formData, setFormData] = useState({
    name: customerInfo?.name || '',
    email: customerInfo?.email || '',
    phone: customerInfo?.phone || '',
    address: customerInfo?.address || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePayment = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      onError(new Error('Please fill in all required fields'));
      return;
    }

    try {
      setProcessing(true);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful payment
      const mockPaymentResponse = {
        razorpay_payment_id: `pay_demo_${Date.now()}`,
        razorpay_order_id: `order_demo_${Date.now()}`,
        razorpay_signature: `sig_demo_${Date.now()}`
      };

      const mockVerification = {
        success: true,
        data: {
          payment_id: mockPaymentResponse.razorpay_payment_id,
          order_id: mockPaymentResponse.razorpay_order_id,
          status: 'success',
          message: 'Payment verified successfully (Demo Mode)'
        }
      };

      setProcessing(false);
      onSuccess({
        paymentResponse: mockPaymentResponse,
        verification: mockVerification,
        customerInfo: formData
      });
    } catch (error) {
      setProcessing(false);
      onError(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Demo Payment Gateway</h3>
              <p className="text-gray-600 mt-1">Complete your order (Demo Mode)</p>
            </div>
            <button
              onClick={onClose}
              disabled={processing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <FiX className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Demo Mode Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FiShield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-blue-900">Demo Mode Active</h5>
                <p className="text-sm text-blue-700 mt-1">
                  This is a demonstration of the payment gateway. No real money will be charged.
                  In production, this would integrate with Razorpay for secure payments.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
            <div className="space-y-2">
              {orderData?.items?.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{item.name} x {item.quantity}</span>
                  <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex items-center justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-emerald-600">${totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your address"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Payment Method</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-4 border-2 border-emerald-500 rounded-lg cursor-pointer bg-emerald-50">
                <input 
                  type="radio" 
                  name="payment" 
                  value="demo" 
                  checked={paymentMethod === 'demo'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-emerald-600" 
                />
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <FiCreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Demo Payment</span>
                    <p className="text-xs text-gray-500">Simulated payment processing</p>
                  </div>
                </div>
              </label>
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FiCheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-emerald-900">Demo Mode</h5>
                    <p className="text-sm text-emerald-700 mt-1">
                      This is a demonstration of the payment flow. In production, this would integrate with Razorpay for secure payments.
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-emerald-600">
                      <span>🔒 Secure Demo</span>
                      <span>✅ No Real Charges</span>
                      <span>🛡️ Test Environment</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3">
            <input 
              type="checkbox" 
              id="terms" 
              className="mt-1 text-emerald-600" 
              required
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              I agree to the <a href="#" className="text-emerald-600 hover:underline">Terms and Conditions</a> and 
              <a href="#" className="text-emerald-600 hover:underline ml-1">Privacy Policy</a>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  <span>Processing Demo Payment...</span>
                </>
              ) : (
                <>
                  <FiCreditCard className="w-5 h-5" />
                  <span>Pay ${totalAmount?.toFixed(2)} (Demo)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPaymentGateway;
