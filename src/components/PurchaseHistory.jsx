import React, { useEffect, useState } from 'react';
import { FiPackage, FiCalendar, FiCreditCard } from 'react-icons/fi';
import transactionService from '../services/transactionService';
import { useToastContext } from '../contexts/ToastContext';

const PurchaseHistory = () => {
  const { error } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const load = async () => {
    try {
      setLoading(true);
      const res = await transactionService.getMyTransactions({ page, limit: 10 });
      const data = res?.data || { transactions: [], pagination: { page: 1, limit: 10, total: 0, pages: 1 } };
      setPurchases(Array.isArray(data.transactions) ? data.transactions : []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
    } catch (e) {
      const message = typeof e?.message === 'string' ? e.message : 'Failed to load purchases';
      error(message);
      console.error('My Purchases load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const formatDate = (d) => new Date(d).toLocaleString();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">My Purchases</h3>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : purchases.length === 0 ? (
          <div className="text-gray-500">No purchases yet.</div>
        ) : (
          <div className="space-y-4">
            {purchases.map((tx) => (
              <div key={tx._id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FiCreditCard className="w-4 h-4" />
                    <span className="font-medium text-gray-900">₹{tx.order?.totalAmount?.toFixed?.(2) ?? tx.order?.totalAmount}</span>
                    <span className={`ml-2 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : tx.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{tx.status || 'completed'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <FiCalendar className="w-4 h-4" />
                    <span>{formatDate(tx.paymentDate)}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-600 mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <span className="text-gray-500">Payment ID:</span> <span className="font-mono">{tx.razorpay_payment_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Method:</span> <span className="font-medium">{tx.paymentMethod?.toUpperCase?.() || tx.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Currency:</span> <span className="font-medium">{tx.order?.currency || 'INR'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(tx.order?.items || []).map((item, idx) => (
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
                  <div><span className="text-gray-600">Customer:</span> {tx.customer?.name} · {tx.customer?.email} · {tx.customer?.phone}</div>
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


