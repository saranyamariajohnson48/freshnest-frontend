import React, { useEffect, useState } from 'react';
import { FiPackage, FiCalendar, FiCreditCard, FiDownload, FiShoppingCart } from 'react-icons/fi';
import transactionService from '../services/transactionService';
import purchaseService from '../services/purchaseService';
import { useToastContext } from '../contexts/ToastContext';
import invoiceService from '../services/invoiceService';

const PurchaseHistory = () => {
  const { error } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const load = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading purchase history...', { page, limit: 10 });
      
      // Check authentication first
      const user = JSON.parse(localStorage.getItem('freshnest_user') || 'null');
      const token = localStorage.getItem('freshnest_access_token');
      
      console.log('🔐 Auth check:', { 
        user: user?.email, 
        hasToken: !!token,
        userRole: user?.role 
      });
      
      if (!user || !token) {
        throw new Error('User not authenticated. Please login again.');
      }
      
      // Prefer purchases endpoint if available
      let res;
      try {
        res = await purchaseService.getMyPurchases({ page, limit: 10 });
        console.log('📊 Purchases API response:', res);
        const data = res?.data || { purchases: [], pagination: { page: 1, limit: 10, total: 0, pages: 1 } };
        console.log('📋 Processed purchases data:', data);
        const list = Array.isArray(data.purchases) ? data.purchases : [];
        const pag = data.pagination || { page: 1, limit: 10, total: 0, pages: 1 };
        setPurchases(list);
        setPagination(pag);
        console.log('✅ Purchase history loaded successfully:', { purchaseCount: list.length, totalPages: pag.pages || 1 });
      } catch (purchaseErr) {
        console.warn('Purchases API failed, falling back to transactions:', purchaseErr);
        const txRes = await transactionService.getMyTransactions({ page, limit: 10 });
        const txData = txRes?.data || { transactions: [], pagination: { page: 1, limit: 10, total: 0, pages: 1 } };
        const list = Array.isArray(txData.transactions) ? txData.transactions : [];
        const pag = txData.pagination || { page: 1, limit: 10, total: 0, pages: 1 };
        setPurchases(list);
        setPagination(pag);
        console.log('✅ Transactions fallback loaded successfully:', { purchaseCount: list.length, totalPages: pag.pages || 1 });
      }
    } catch (e) {
      const message = typeof e?.message === 'string' ? e.message : 'Failed to load purchases';
      console.error('❌ My Purchases load error:', e);
      console.error('❌ Error details:', {
        message: e.message,
        stack: e.stack,
        name: e.name
      });
      error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const formatDate = (d) => new Date(d).toLocaleString();

  const downloadInvoice = (tx) => {
    try {
      const isPurchase = !!tx.amount && !tx.order; // heuristic
      const orderData = isPurchase ? {
        id: tx?.orderId || tx?._id,
        date: tx?.purchasedAt || tx?.createdAt || new Date().toISOString(),
        customer: {
          name: tx?.customer?.name,
          email: tx?.customerEmail,
          phone: tx?.customer?.phone,
          address: tx?.customer?.address,
        },
        items: Array.isArray(tx?.items) ? tx.items : [],
        totalAmount: Number(tx?.amount || 0),
      } : {
        id: tx?.order?.id || tx?.razorpay_order_id || tx?._id,
        date: tx?.paymentDate || tx?.createdAt || new Date().toISOString(),
        customer: {
          name: tx?.customer?.name,
          email: tx?.customer?.email,
          phone: tx?.customer?.phone,
          address: tx?.customer?.address,
        },
        items: Array.isArray(tx?.order?.items) ? tx.order.items : [],
        totalAmount: Number(tx?.order?.totalAmount || 0),
      };

      const paymentData = isPurchase ? {
        id: tx?.paymentId || tx?._id,
        orderId: tx?.orderId,
        method: tx?.paymentMethod || 'online',
        status: tx?.status || 'completed',
      } : {
        id: tx?.razorpay_payment_id || tx?._id,
        orderId: tx?.razorpay_order_id || tx?.order?.id,
        method: tx?.paymentMethod || 'online',
        status: tx?.status || 'completed',
      };

      invoiceService.generateInvoice(orderData, paymentData, { download: true });
    } catch (e) {
      console.error('Download invoice failed:', e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">My Purchases</h3>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="text-gray-500 mt-4">Loading your purchase history...</p>
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-12">
            <FiShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchases yet</h3>
            <p className="text-gray-500 mb-4">You haven't made any purchases yet. Start shopping to see your order history here.</p>
            <button 
              onClick={() => window.location.href = '/user/dashboard?section=shop'}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((tx) => (
              <div key={tx._id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FiCreditCard className="w-4 h-4" />
                    <span className="font-medium text-gray-900">₹{(tx.order?.totalAmount ?? tx.amount)?.toFixed ? (tx.order?.totalAmount ?? tx.amount).toFixed(2) : (tx.order?.totalAmount ?? tx.amount)}</span>
                    <span className={`ml-2 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : tx.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{tx.status || 'completed'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <button
                      onClick={() => downloadInvoice(tx)}
                      className="mr-3 inline-flex items-center px-2 py-1 rounded-lg border hover:bg-gray-50"
                      title="Download Invoice"
                    >
                      <FiDownload className="w-4 h-4 mr-1" />
                      Invoice
                    </button>
                    <FiCalendar className="w-4 h-4" />
                    <span>{formatDate(tx.paymentDate || tx.purchasedAt)}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-600 mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <span className="text-gray-500">Payment ID:</span> <span className="font-mono">{tx.razorpay_payment_id || tx.paymentId}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Method:</span> <span className="font-medium">{tx.paymentMethod?.toUpperCase?.() || tx.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Currency:</span> <span className="font-medium">{tx.order?.currency || tx.currency || 'INR'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(tx.order?.items || tx.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <FiPackage className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">Qty {item.quantity} · ₹{item.price}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  <div><span className="text-gray-600">Customer:</span> {(tx.customer?.name) || ''} · {(tx.customer?.email || tx.customerEmail) || ''} · {(tx.customer?.phone) || ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className={`px-3 py-1.5 rounded-lg border ${page <= 1 ? 'text-gray-400 bg-gray-50' : 'hover:bg-gray-50'}`}
        >
          Previous
        </button>
        <div className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages}</div>
        <button
          disabled={page >= pagination.pages}
          onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
          className={`px-3 py-1.5 rounded-lg border ${page >= pagination.pages ? 'text-gray-400 bg-gray-50' : 'hover:bg-gray-50'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PurchaseHistory;


