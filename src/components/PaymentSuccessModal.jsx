import React from 'react';
import { FiCheck } from 'react-icons/fi';

const PaymentSuccessModal = ({
  isOpen,
  onClose,
  orderNumber,
  details = {},
  onViewInvoice,
  subtitle
}) => {
  if (!isOpen) return null;

  const info = {
    date: details.date,
    method: details.method,
    total: details.total,
    email: details.email,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl ring-1 ring-gray-100 w-full max-w-lg overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-600/90 shadow-lg shadow-emerald-200/50 mx-auto flex items-center justify-center">
            <FiCheck className="w-9 h-9 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Payment Successful</h2>
          <p className="mt-2 text-sm text-gray-500">{subtitle || 'Thank you for your purchase. A receipt has been sent to your email.'}</p>
          {orderNumber && (
            <div className="mt-4 inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-100">
              <span className="mr-2">🧾</span>
              <span>Order #{String(orderNumber)}</span>
            </div>
          )}

          <div className="mt-8 text-left">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Transaction details</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-2 gap-0">
                <div className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-r border-gray-200">Date</div>
                <div className="px-4 py-3 border-b border-gray-200 text-gray-900 font-medium">{info.date ? info.date : <span className="text-gray-400">-</span>}</div>
                <div className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-r border-gray-200">Payment Method</div>
                <div className="px-4 py-3 border-b border-gray-200 text-gray-900 font-medium">{info.method ? info.method : <span className="text-gray-400">-</span>}</div>
                <div className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-r border-gray-200">Total</div>
                <div className="px-4 py-3 border-b border-gray-200 text-gray-900 font-semibold">{info.total ?? <span className="text-gray-400">-</span>}</div>
                <div className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 bg-gray-50 border-r border-gray-200">Email</div>
                <div className="px-4 py-3 text-gray-900 font-medium">{info.email ? info.email : <span className="text-gray-400">-</span>}</div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={onViewInvoice}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              View invoice
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full text-gray-600 hover:text-gray-800 font-medium py-2 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>

        <div className="px-8 pb-8 text-left text-sm text-gray-500">
          <p className="mb-1">Hello Technologies, 1500 Oceanview Blvd, Suite 300</p>
          <p className="mb-1">San Francisco, CA 94123 – United States</p>
          <div className="mt-2 flex items-center justify-between">
            <a href="mailto:hello@hellotech.com" className="text-emerald-700 hover:underline">hello@hellotech.com</a>
            <a href="tel:+8945218527" className="text-emerald-700 hover:underline">+89 45 21 85 27</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;



