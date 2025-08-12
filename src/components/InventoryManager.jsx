import React, { useEffect, useState } from 'react';
import { FiUpload, FiPlus, FiCheckCircle, FiAlertCircle, FiFilter, FiDownload } from 'react-icons/fi';
import productService from '../services/productService';
import { useToastContext } from '../contexts/ToastContext';

const sampleCSV = `name,sku,category,price,costPrice,stock,unit,status,brand,tags\nOrganic Lettuce,LETT-001,Vegetables,2.99,1.2,45,unit,active,FreshFarm,leafy green\nOrganic Apples,APPL-ORG,Fruits,4.99,2.5,5,unit,active,FruitCo,organic,seasonal`;

function InventoryManager() {
  const { success, error } = useToastContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [editing, setEditing] = useState(null); // product being edited
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    costPrice: '',
    stock: '',
    unit: 'unit',
    status: 'active',
    brand: '',
    description: '',
    tags: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await productService.list({ page: 1, limit: 10 });
      setProducts(res.data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        costPrice: form.costPrice ? Number(form.costPrice) : 0,
        stock: form.stock ? Number(form.stock) : 0,
        tags: form.tags ? form.tags.split(',').map(s => s.trim()) : [],
      };
      if (editing) {
        await productService.updateProduct(editing._id, payload);
        success('Product updated successfully');
        setEditing(null);
      } else {
        await productService.createProduct(payload);
        success('Product added successfully');
      }
      setForm({ name: '', sku: '', category: '', price: '', costPrice: '', stock: '', unit: 'unit', status: 'active', brand: '', description: '', tags: '' });
      await load();
    } catch (err) {
      error(err.message || 'Failed to save product');
    }
  };

  const handleCSVImport = async () => {
    if (!file) return error('Please choose a CSV file');
    try {
      setLoading(true);
      const res = await productService.importCSV(file);
      success(`Import complete: ${res.data.created} created, ${res.data.updated} updated, ${res.data.failed} failed`);
      setFile(null);
      await load();
    } catch (err) {
      error(err.message || 'CSV import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try {
      await productService.deleteProduct(product._id);
      success('Product deleted');
      await load();
    } catch (e) {
      error(e.message || 'Failed to delete');
    }
  };

  // tiny helper to map category to emoji + soft color
  function pickEmoji(category = '') {
    const c = category.toLowerCase();
    if (c.includes('vegetable')) return { icon: '🥬', bg: '#ecfdf5' }; // green-50
    if (c.includes('fruit')) return { icon: '🍎', bg: '#fff1f2' }; // rose-50
    if (c.includes('dairy')) return { icon: '🥛', bg: '#eff6ff' }; // blue-50
    if (c.includes('beverage')) return { icon: '🥤', bg: '#f5f3ff' };
    if (c.includes('grain')) return { icon: '🌾', bg: '#fffbeb' };
    return { icon: '📦', bg: '#f3f4f6' };
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Product</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="border rounded p-2" required placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded p-2" required placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
          <input className="border rounded p-2" required placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          <input className="border rounded p-2" required type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          <input className="border rounded p-2" type="number" min="0" step="0.01" placeholder="Cost Price" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} />
          <input className="border rounded p-2" type="number" min="0" step="1" placeholder="Stock" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
          <select className="border rounded p-2" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
            {['unit','kg','g','lb','litre','ml','pack','box','dozen','bundle'].map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select className="border rounded p-2" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {['active','inactive'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="border rounded p-2" placeholder="Brand (optional)" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
          <input className="border rounded p-2 col-span-1 md:col-span-2" placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          <textarea className="border rounded p-2 md:col-span-3" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="md:col-span-3 flex gap-3">
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded flex items-center gap-2">
              <FiPlus /> {editing ? 'Update Product' : 'Add Product'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => { setEditing(null); setForm({ name: '', sku: '', category: '', price: '', costPrice: '', stock: '', unit: 'unit', status: 'active', brand: '', description: '', tags: '' }); }}
                className="px-4 py-2 rounded border border-gray-300"
              >Cancel</button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Import Products from CSV</h3>
          <button
            onClick={() => {
              navigator.clipboard.writeText(sampleCSV);
              success('Sample CSV copied to clipboard');
            }}
            className="text-sm text-emerald-700 underline"
          >Copy sample header</button>
        </div>
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button onClick={handleCSVImport} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
            <FiUpload /> Import CSV
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">Required columns: name, sku, category, price. Optional: costPrice, stock, unit, status, brand, tags, description</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Products</h3>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-gray-900 text-white"><FiFilter /></button>
            <button className="p-2 rounded-lg bg-gray-900 text-white"><FiDownload /></button>
          </div>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => {
                  // derive status chip by stock
                  const stockNum = Number(p.stock) || 0;
                  const statusLabel = stockNum === 0 ? 'Out of Stock' : stockNum <= 10 ? 'Low Stock' : 'In Stock';
                  const statusClass = stockNum === 0 ? 'bg-red-100 text-red-700' : stockNum <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
                  const emoji = pickEmoji(p.category);
                  const sub = p.description?.trim() || (p.category ? `Fresh ${p.category.toLowerCase()}` : '');
                  return (
                    <tr key={p._id || idx} className="border-b last:border-0">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: emoji.bg }}>
                            <span className="text-lg" aria-hidden>{emoji.icon}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{p.name}</p>
                            <p className="text-sm text-gray-500">{sub}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{p.category}</td>
                      <td className="py-3 px-4 text-gray-600">{stockNum} units</td>
                      <td className="py-3 px-4 text-gray-600">${Number(p.price || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>{statusLabel}</span>
                          <button
                            onClick={() => setEditing(p)}
                            className="text-blue-600 hover:underline text-xs"
                          >Edit</button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="text-red-600 hover:underline text-xs"
                          >Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  
  );
}

export default InventoryManager;