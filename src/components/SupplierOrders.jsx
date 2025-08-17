import React, { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiClipboard, FiFilter, FiCalendar, FiTruck, FiCheck, FiX, FiPackage } from 'react-icons/fi';
import orderService from '../services/orderService';
import productService from '../services/productService';
import { useToastContext } from '../contexts/ToastContext';
import { getBrandsForCategory } from '../utils/catalog';

// Supplier-facing categories (fixed 5)
const SUPPLIER_CATEGORIES = [
  'Biscuits Pack',
  'Noodles Pack',
  'Chips Pack',
  'Chocolate Pack',
  'Juice Pack'
];
// Map product catalog categories -> supplier categories
const PRODUCT_TO_SUPPLIER_CATEGORY = {
  'Biscuits Pack': 'Biscuits Pack',
  'Noodles Pack': 'Noodles Pack',
  'Chips Pack': 'Chips Pack',
  'Chocolate / Candy Pack': 'Chocolate Pack',
  'Juice / Tetra Pack': 'Juice Pack'
};

export default function SupplierOrders() {
  const { success, error } = useToastContext();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);

  const [form, setForm] = useState({
    category: SUPPLIER_CATEGORIES[0],
    brand: '',
    pricePerQuantity: '',
    quantity: 1,
    expectedDelivery: '',
    notes: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await orderService.list(statusFilter === 'all' ? {} : { status: statusFilter });
        setOrders(res.data || res.orders || []);
      } catch (e) {
        error(e.message || 'Failed to load orders');
      }
    };
    load();
  }, [statusFilter, error]);

  // Load products and compute filtered list by category
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await productService.list({ limit: 200 });
        const items = res.data?.items || [];
        setProducts(items);
      } catch (e) {
        // non-blocking
      }
    };
    loadProducts();
  }, []);

  // When category changes, compute brand list from curated brands plus existing product brands in that category
  useEffect(() => {
    const curated = getBrandsForCategory(PRODUCT_TO_SUPPLIER_CATEGORY[form.category] || form.category);
    const productBrands = Array.from(new Set(
      products
        .filter(p => (PRODUCT_TO_SUPPLIER_CATEGORY[p.category] || p.category) === form.category)
        .map(p => p.brand)
        .filter(Boolean)
    ));
    const merged = Array.from(new Set([...(curated || []), ...productBrands]));
    setBrands(merged);
  }, [form.category, products]);

  const productsByCategory = useMemo(() => {
    const map = {};
    for (const c of SUPPLIER_CATEGORIES) map[c] = [];
    for (const p of products) {
      const supplierCat = PRODUCT_TO_SUPPLIER_CATEGORY[p.category] || p.category;
      if (SUPPLIER_CATEGORIES.includes(supplierCat)) {
        map[supplierCat].push(p);
      }
    }
    return map;
  }, [products]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.pricePerQuantity || Number(form.pricePerQuantity) < 0) throw new Error('Please enter a valid price per quantity');
      const payload = {
        category: form.category,
        brand: form.brand || undefined,
        pricePerQuantity: Number(form.pricePerQuantity),
        quantity: Number(form.quantity),
        expectedDelivery: new Date(form.expectedDelivery).toISOString(),
        notes: form.notes
      };
      const res = await orderService.create(payload);
      success('Order created');
      setShowForm(false);
      setForm({ category: SUPPLIER_CATEGORIES[0], brand: '', pricePerQuantity: '', quantity: 1, expectedDelivery: '', notes: '' });
      setOrders((prev) => [res.data, ...prev]);
    } catch (e) {
      error(e.message || 'Failed to create order');
    }
  };

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
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Orders</h3>
          <p className="text-slate-700 text-sm">Create and track your orders to warehouse</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-8 text-slate-800">
              <option value="all">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Rejected">Rejected</option>
            </select>
            <FiFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>
          <button onClick={()=>setShowForm(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
            <FiPlus className="w-4 h-4"/> New Order
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-700">
              <th className="py-2">Order ID</th>
              <th className="py-2">Brand</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Status</th>
              <th className="py-2">Date</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o._id} className="border-t border-slate-200 text-slate-800">
                <td className="py-2">{o._id.slice(-6)}</td>
                <td className="py-2">{o.brand || o.product || '-'}</td>
                <td className="py-2">{o.quantity}</td>
                <td className="py-2">{o.status}</td>
                <td className="py-2">{new Date(o.createdAt).toLocaleDateString()}</td>
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
                <td colSpan="6" className="text-center text-slate-700 py-8">No orders found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Order Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Create New Order</h4>
              <button onClick={()=>setShowForm(false)} className="p-2 hover:bg-slate-100 rounded"><FiX/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Category</label>
                <select value={form.category} onChange={(e)=>setForm(f=>({...f, category: e.target.value, product: ''}))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2">
                  {SUPPLIER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Brand</label>
                <select value={form.brand} onChange={(e)=>setForm(f=>({...f, brand: e.target.value}))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2">
                  <option value="">Select a brand</option>
                  {brands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Price per quantity</label>
                <input type="number" min="0" step="0.01" value={form.pricePerQuantity} onChange={(e)=>setForm(f=>({...f, pricePerQuantity: e.target.value}))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="e.g. 10.00" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Quantity</label>
                <input type="number" min={1} value={form.quantity} onChange={(e)=>setForm(f=>({...f, quantity: e.target.value}))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"/>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Expected Delivery Date</label>
                <input type="date" value={form.expectedDelivery} onChange={(e)=>setForm(f=>({...f, expectedDelivery: e.target.value}))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"/>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Notes (optional)</label>
                <textarea value={form.notes} onChange={(e)=>setForm(f=>({...f, notes: e.target.value}))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2" rows={3}/>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 border border-slate-300 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}