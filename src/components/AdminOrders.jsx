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

      <div className="bg-white border border-slate-200 rounded-2xl p-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2">Order ID</th>
              <th className="py-2">Supplier</th>
              <th className="py-2">Product</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Status</th>
              <th className="py-2">Expected</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o._id} className="border-t border-slate-200">
                <td className="py-2">{o._id.slice(-6)}</td>
                <td className="py-2">{o.supplierId?.fullName || o.supplierId || '-'}</td>
                <td className="py-2">{o.product}</td>
                <td className="py-2">{o.quantity}</td>
                <td className="py-2">{o.status}</td>
                <td className="py-2">{o.expectedDelivery ? new Date(o.expectedDelivery).toLocaleDateString() : '-'}</td>
                <td className="py-2 space-x-2">
                  {o.status === 'Pending' && (
                    <>
                      <button onClick={()=>approve(o._id)} className="px-3 py-1 text-xs bg-emerald-50 text-emerald-700 rounded inline-flex items-center gap-1"><FiCheckCircle/>Approve</button>
                      <button onClick={()=>reject(o._id)} className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded inline-flex items-center gap-1"><FiXCircle/>Reject</button>
                    </>
                  )}
                  {o.status === 'Delivered' && !o.adminConfirmed && (
                    <button onClick={()=>confirm(o._id)} className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded inline-flex items-center gap-1"><FiTruck/>Confirm</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center text-slate-500 py-8">No orders</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}