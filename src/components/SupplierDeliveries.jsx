import React, { useEffect, useMemo, useState } from 'react';
import { FiFilter } from 'react-icons/fi';
import orderService from '../services/orderService';
import { useToastContext } from '../contexts/ToastContext';

export default function SupplierDeliveries() {
  const { success, error } = useToastContext();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('In Transit');

  const load = async () => {
    try {
      const res = await orderService.list(statusFilter === 'all' ? {} : { status: statusFilter });
      setOrders(res.data || res.orders || []);
    } catch (e) {
      error(e.message || 'Failed to load deliveries');
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (orderId, status) => {
    try {
      const res = await orderService.updateStatus(orderId, status);
      setOrders((prev) => prev.map(o => o._id === orderId ? res.data : o));
      success('Status updated');
    } catch (e) {
      error(e.message || 'Failed to update status');
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
          <h3 className="text-lg font-semibold text-slate-900">Delivery Updates</h3>
          <p className="text-slate-700 text-sm">Mark shipments In Transit or Delivered</p>
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-8 text-slate-800">
            <option value="In Transit">In Transit</option>
            <option value="Pending">Pending</option>
            <option value="Delivered">Delivered</option>
            <option value="all">All</option>
          </select>
          <FiFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-700">
              <th className="py-2">Order ID</th>
              <th className="py-2">Product</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Status</th>
              <th className="py-2">Expected</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o._id} className="border-t border-slate-200 text-slate-800">
                <td className="py-2">{o._id.slice(-6)}</td>
                <td className="py-2">{o.product}</td>
                <td className="py-2">{o.quantity}</td>
                <td className="py-2">{o.status}</td>
                <td className="py-2">{o.expectedDelivery ? new Date(o.expectedDelivery).toLocaleDateString() : '-'}</td>
                <td className="py-2 space-x-2">
                  {o.status === 'Pending' && (
                    <button onClick={()=>updateStatus(o._id, 'In Transit')} className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded">Mark In Transit</button>
                  )}
                  {o.status === 'In Transit' && (
                    <button onClick={()=>updateStatus(o._id, 'Delivered')} className="px-3 py-1 text-xs bg-emerald-50 text-emerald-700 rounded">Mark Delivered</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-slate-700 py-8">No deliveries found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}