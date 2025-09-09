import React, { useState, useEffect } from 'react';
import { 
  FiCreditCard, 
  FiX, 
  FiLoader, 
  FiShield, 
  FiCheck,
  FiArrowRight,
  FiClock,
  FiSmartphone,
  FiWifi,
  FiDollarSign
} from 'react-icons/fi';
import paymentService from '../services/paymentService';

const RazorpayStyleGateway = ({ 
  isOpen, 
  onClose, 
  orderData, 
  onSuccess, 
  onError,
  totalAmount,
  customerInfo 
}) => {
  const [selectedMethod, setSelectedMethod] = useState('cards');
  const [cardDetails, setCardDetails] = useState({
    number: '4111 1111 1111 1111',
    expiry: '10 / 29',
    cvv: '',
    name: 'John Doe'
  });
  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [qrTimer, setQrTimer] = useState(600); // 10 minutes in seconds
  const [showQR, setShowQR] = useState(false);

  // Timer for QR code
  useEffect(() => {
    if (showQR && qrTimer > 0) {
      const timer = setTimeout(() => setQrTimer(qrTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [qrTimer, showQR]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCardInputChange = (field, value) => {
    setCardDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePayment = async () => {
    setProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockPaymentResponse = {
        razorpay_payment_id: `pay_${Date.now()}`,
        razorpay_order_id: `order_${Date.now()}`,
        razorpay_signature: `sig_${Date.now()}`
      };

      const mockVerification = {
        success: true,
        data: {
          payment_id: mockPaymentResponse.razorpay_payment_id,
          order_id: mockPaymentResponse.razorpay_order_id,
          status: 'success',
          message: 'Payment successful'
        }
      };

      // Save transaction to backend
      try {
        const transactionData = {
          razorpay_payment_id: mockPaymentResponse.razorpay_payment_id,
          razorpay_order_id: mockPaymentResponse.razorpay_order_id,
          razorpay_signature: mockPaymentResponse.razorpay_signature,
          customer: customerInfo,
          order: orderData,
          paymentMethod: selectedMethod,
          status: 'completed'
        };

        console.log('Saving transaction to backend:', transactionData);
        
        // Save transaction to backend
        const saveResponse = await paymentService.saveTransaction(transactionData);
        console.log('✅ Transaction saved successfully:', saveResponse);
      } catch (saveError) {
        console.error('❌ Error saving transaction:', saveError);
        // Don't fail the payment if saving fails
      }

      onSuccess({
        paymentResponse: mockPaymentResponse,
        verification: mockVerification,
        customerInfo: customerInfo
      });
    } catch (error) {
      onError(error);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  const PaymentMethodButton = ({ id, label, icon, isSelected, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="w-8 h-8 flex items-center justify-center">
        {icon}
      </div>
      <span className="font-medium text-gray-700">{label}</span>
    </button>
  );

  const PaymentIcon = ({ name, className = "w-6 h-6" }) => {
    const icons = {
      visa: <div className={`${className} bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold`}>VISA</div>,
      mastercard: <div className={`${className} bg-red-600 rounded text-white flex items-center justify-center text-xs font-bold`}>MC</div>,
      rupay: <div className={`${className} bg-orange-500 rounded text-white flex items-center justify-center text-xs font-bold`}>RP</div>,
      gpay: <div className={`${className} bg-gray-800 rounded text-white flex items-center justify-center text-xs font-bold`}>GP</div>,
      phonepe: <div className={`${className} bg-purple-600 rounded text-white flex items-center justify-center text-xs font-bold`}>PP</div>,
      paytm: <div className={`${className} bg-blue-500 rounded text-white flex items-center justify-center text-xs font-bold`}>PT</div>,
      amazon: <div className={`${className} bg-orange-400 rounded text-white flex items-center justify-center text-xs font-bold`}>AZ</div>,
      bhim: <div className={`${className} bg-green-600 rounded text-white flex items-center justify-center text-xs font-bold`}>BH</div>,
      icici: <div className={`${className} bg-red-500 rounded text-white flex items-center justify-center text-xs font-bold`}>IC</div>,
      hdfc: <div className={`${className} bg-blue-700 rounded text-white flex items-center justify-center text-xs font-bold`}>HD</div>,
      sbi: <div className={`${className} bg-blue-800 rounded text-white flex items-center justify-center text-xs font-bold`}>SB</div>,
      axis: <div className={`${className} bg-red-600 rounded text-white flex items-center justify-center text-xs font-bold`}>AX</div>,
      mobikwik: <div className={`${className} bg-yellow-500 rounded text-white flex items-center justify-center text-xs font-bold`}>MK</div>,
      freecharge: <div className={`${className} bg-green-500 rounded text-white flex items-center justify-center text-xs font-bold`}>FC</div>,
      simpl: <div className={`${className} bg-purple-500 rounded text-white flex items-center justify-center text-xs font-bold`}>SP</div>,
      zest: <div className={`${className} bg-pink-500 rounded text-white flex items-center justify-center text-xs font-bold`}>ZT</div>
    };
    return icons[name] || <div className={`${className} bg-gray-400 rounded`}></div>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Payment Options</h2>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <span className="text-gray-600">⋯</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FiX className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Left Panel - Order Summary */}
          <div className="w-1/3 bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white relative overflow-hidden">
            {/* Background Graphics */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
            
            {/* Shop Info */}
            <div className="flex items-center space-x-3 mb-6 relative z-10">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">F</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">FreshNest</h3>
                <p className="text-blue-200 text-sm">Fresh Products Store</p>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-6 relative z-10">
              <h4 className="text-lg font-semibold mb-2">Price Summary</h4>
              <div className="text-3xl font-bold">₹{totalAmount?.toFixed(2)}</div>
            </div>

            {/* Customer Info */}
            <div className="bg-white bg-opacity-10 rounded-lg p-3 mb-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <FiSmartphone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm text-blue-200">Using as</p>
                  <p className="font-medium">+91 {customerInfo?.phone?.replace(/\d(?=\d{4})/g, "*") || "**** ****"}</p>
                </div>
                <FiArrowRight className="w-4 h-4 text-blue-200" />
              </div>
            </div>

            {/* Security Badge */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center space-x-2 text-blue-200">
                <FiShield className="w-4 h-4" />
                <span className="text-sm">Secured by Razorpay</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Payment Methods */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Payment Method Categories */}
            <div className="space-y-4">
              {/* Recommended */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Recommended</h3>
                <div className="space-y-2">
                  <PaymentMethodButton
                    id="upi-qr"
                    label="UPI QR"
                    icon={<FiSmartphone className="w-5 h-5 text-gray-600" />}
                    isSelected={selectedMethod === 'upi-qr'}
                    onClick={() => {
                      setSelectedMethod('upi-qr');
                      setShowQR(true);
                      setQrTimer(600);
                    }}
                  />
                </div>
              </div>

              {/* UPI */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">UPI</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <PaymentIcon name="gpay" className="w-8 h-8" />
                  <PaymentIcon name="phonepe" className="w-8 h-8" />
                  <PaymentIcon name="paytm" className="w-8 h-8" />
                  <PaymentIcon name="amazon" className="w-8 h-8" />
                  <PaymentIcon name="bhim" className="w-8 h-8" />
                </div>
                <PaymentMethodButton
                  id="upi"
                  label="UPI"
                  icon={<FiSmartphone className="w-5 h-5 text-gray-600" />}
                  isSelected={selectedMethod === 'upi'}
                  onClick={() => setSelectedMethod('upi')}
                />
              </div>

              {/* Cards */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Cards</h3>
                <div className="flex space-x-2 mb-2">
                  <PaymentIcon name="visa" className="w-8 h-8" />
                  <PaymentIcon name="mastercard" className="w-8 h-8" />
                  <PaymentIcon name="rupay" className="w-8 h-8" />
                </div>
                <PaymentMethodButton
                  id="cards"
                  label="Cards"
                  icon={<FiCreditCard className="w-5 h-5 text-gray-600" />}
                  isSelected={selectedMethod === 'cards'}
                  onClick={() => setSelectedMethod('cards')}
                />
              </div>

              {/* Net Banking */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Netbanking</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <PaymentIcon name="icici" className="w-8 h-8" />
                  <PaymentIcon name="hdfc" className="w-8 h-8" />
                  <PaymentIcon name="sbi" className="w-8 h-8" />
                  <PaymentIcon name="axis" className="w-8 h-8" />
                </div>
                <PaymentMethodButton
                  id="netbanking"
                  label="Netbanking"
                  icon={<FiWifi className="w-5 h-5 text-gray-600" />}
                  isSelected={selectedMethod === 'netbanking'}
                  onClick={() => setSelectedMethod('netbanking')}
                />
              </div>

              {/* Wallet */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Wallet</h3>
                <div className="flex space-x-2 mb-2">
                  <PaymentIcon name="paytm" className="w-8 h-8" />
                  <PaymentIcon name="mobikwik" className="w-8 h-8" />
                  <PaymentIcon name="freecharge" className="w-8 h-8" />
                </div>
                <PaymentMethodButton
                  id="wallet"
                  label="Wallet"
                  icon={<FiDollarSign className="w-5 h-5 text-gray-600" />}
                  isSelected={selectedMethod === 'wallet'}
                  onClick={() => setSelectedMethod('wallet')}
                />
              </div>

              {/* Pay Later */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Pay Later</h3>
                <div className="flex space-x-2 mb-2">
                  <PaymentIcon name="simpl" className="w-8 h-8" />
                  <PaymentIcon name="zest" className="w-8 h-8" />
                </div>
                <PaymentMethodButton
                  id="paylater"
                  label="Pay Later"
                  icon={<FiClock className="w-5 h-5 text-gray-600" />}
                  isSelected={selectedMethod === 'paylater'}
                  onClick={() => setSelectedMethod('paylater')}
                />
              </div>
            </div>

            {/* Payment Form */}
            <div className="mt-6">
              {selectedMethod === 'cards' && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold mb-4">Add a new card</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardDetails.number}
                          onChange={(e) => handleCardInputChange('number', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="1234 5678 9012 3456"
                        />
                        <div className="absolute right-3 top-2">
                          <PaymentIcon name="visa" className="w-6 h-4" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={cardDetails.expiry}
                          onChange={(e) => handleCardInputChange('expiry', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="MM / YY"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input
                          type="password"
                          value={cardDetails.cvv}
                          onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="•••"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardDetails.name}
                        onChange={(e) => handleCardInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="saveCard" className="text-blue-600" />
                      <label htmlFor="saveCard" className="text-sm text-gray-600">
                        Save this card as per RBI guidelines
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'upi' && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold mb-4">UPI Payment</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID / Number</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="example@okhdfcbank"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'upi-qr' && showQR && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">UPI QR</h4>
                    <div className="flex items-center space-x-2 text-red-600">
                      <FiClock className="w-4 h-4" />
                      <span className="font-mono">{formatTime(qrTimer)}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <div className="grid grid-cols-8 gap-1">
                        {Array.from({ length: 64 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">SCAN WITH ANY APP</p>
                    <div className="flex justify-center space-x-2 mb-4">
                      <PaymentIcon name="gpay" className="w-8 h-8" />
                      <PaymentIcon name="phonepe" className="w-8 h-8" />
                      <PaymentIcon name="paytm" className="w-8 h-8" />
                      <PaymentIcon name="amazon" className="w-8 h-8" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID / Number</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="example@okhdfcbank"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'netbanking' && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold mb-4">Net Banking</h4>
                  <p className="text-gray-600">Select your bank to continue with net banking</p>
                </div>
              )}

              {selectedMethod === 'wallet' && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold mb-4">Digital Wallet</h4>
                  <p className="text-gray-600">Select your preferred wallet to continue</p>
                </div>
              )}

              {selectedMethod === 'paylater' && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold mb-4">Pay Later</h4>
                  <p className="text-gray-600">Choose your pay later option</p>
                </div>
              )}
            </div>

            {/* Continue Button */}
            <div className="mt-6">
              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RazorpayStyleGateway;
