import React, { useEffect, useMemo, useState } from 'react';
import { FiFilter, FiCheckCircle, FiXCircle, FiTruck } from 'react-icons/fi';
import orderService from '../services/orderService';
import { useToastContext } from '../contexts/ToastContext';

export default function AdminOrders() {
  const { success, error } = useToastContext();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Pending');

  const load = async () => {
    try {
      const res = await orderService.list(statusFilter === 'all' ? {} : { status: statusFilter });
      setOrders(res.data || res.orders || []);
    } catch (e) {
      error(e.message || 'Failed to load orders');
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const approve = async (id) => {
    try {
      const res = await orderService.review(id, 'approve');
      setOrders((prev)=>prev.map(o=>o._id===id?res.data:o));
      success('Order approved');
    } catch (e) {
      error(e.message || 'Approve failed');
    }
  };

  const reject = async (id) => {
    try {
      const res = await orderService.review(id, 'reject');
      setOrders((prev)=>prev.map(o=>o._id===id?res.data:o));
      success('Order rejected');
    } catch (e) {
      error(e.message || 'Reject failed');
    }
  };

  const confirm = async (id) => {
    try {
      const res = await orderService.confirmDelivery(id);
      setOrders((prev)=>prev.map(o=>o._id===id?res.data:o));
      success('Delivery confirmed');
    } catch (e) {
      error(e.message || 'Confirm failed');
    }
  };

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter(o => o.status === statusFilter);
  }, [orders, statusFilter]);

  // Style helpers
  const statusTextClass = (s) => {
    switch (s) {
      case 'Pending': return 'text-amber-600 font-medium';
      case 'Approved': return 'text-blue-600 font-medium';
      case 'In Transit': return 'text-indigo-600 font-medium';
      case 'Delivered': return 'text-emerald-700 font-semibold';
      case 'Rejected': return 'text-red-600 font-medium';
      default: return 'text-slate-700';
    }
  };

  const statusBadgeClass = (s) => {
    switch (s) {
      case 'Pending': return 'bg-amber-50 text-amber-700';
      case 'Approved': return 'bg-blue-50 text-blue-700';
      case 'In Transit': return 'bg-indigo-50 text-indigo-700';
      case 'Delivered': return 'bg-emerald-50 text-emerald-700';
      case 'Rejected': return 'bg-red-50 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Supplier Orders</h3>
          <p className="text-slate-500 text-sm">Review and manage orders from suppliers</p>
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-8">
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Rejected">Rejected</option>
            <option value="all">All</option>
          </select>
          <FiFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((o) => (
            <div key={o._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-500">Order #{o._id.slice(-6)}</div>
                  <div className="font-semibold text-slate-900">{o.supplierId?.fullName || '-'}</div>
                  <div className="text-xs text-slate-500">{o.supplierId?.email || '-'}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${statusBadgeClass(o.status)}`}>{o.status}</span>
              </div>

              {/* Body */}
              <div className="mt-4 space-y-2 text-sm">
                <div><span className="text-slate-500">Product:</span> <span className="text-slate-900">{o.product || '-'}</span></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-slate-500">Category:</span> <span className="text-slate-900">{o.category || '-'}</span></div>
                  <div><span className="text-slate-500">Brand:</span> <span className="text-slate-900">{o.brand || '-'}</span></div>
                </div>
                <div><span className="text-slate-500">Notes:</span> <span className="text-slate-900">{o.notes || '-'}</span></div>
              </div>

              {/* Metrics */}
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-500 text-xs">Quantity</div>
                  <div className="text-slate-900 font-medium">{o.quantity}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-500 text-xs">Unit Price</div>
                  <div className="text-slate-900 font-medium">{typeof o.pricePerQuantity === 'number' ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(o.pricePerQuantity) : '-'}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-500 text-xs">Total</div>
                  <div className="text-slate-900 font-semibold">{typeof o.pricePerQuantity === 'number' && typeof o.quantity === 'number' ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(o.pricePerQuantity * o.quantity) : '-'}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-500 text-xs">Expected</div>
                  <div className="text-slate-900 font-medium">{o.expectedDelivery ? new Date(o.expectedDelivery).toLocaleDateString() : '-'}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                {o.status === 'Pending' && (
                  <>
                    <button onClick={()=>approve(o._id)} className="px-3 py-1 text-xs bg-emerald-50 text-emerald-700 rounded inline-flex items-center gap-1"><FiCheckCircle/>Approve</button>
                    <button onClick={()=>reject(o._id)} className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded inline-flex items-center gap-1"><FiXCircle/>Reject</button>
                  </>
                )}
                {o.status === 'Delivered' && !o.adminConfirmed && (
                  <button onClick={()=>confirm(o._id)} className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded inline-flex items-center gap-1"><FiTruck/>Confirm</button>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center text-slate-500 py-8">No orders</div>
          )}
        </div>
      </div>
    </div>
  );
}