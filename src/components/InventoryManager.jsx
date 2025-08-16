import React, { useEffect, useState } from 'react';
import { FiUpload, FiPlus, FiCheckCircle, FiAlertCircle, FiFilter, FiDownload } from 'react-icons/fi';
import productService from '../services/productService';
import { CATEGORY_OPTIONS, getBrandsForCategory } from '../utils/catalog';

// Inline selector for categories used within InventoryManager
function CategorySelectorInline({ onPick, selected }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {CATEGORY_OPTIONS.map(opt => {
        const active = selected === opt.value;
        const brands = getBrandsForCategory(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onPick(opt.value)}
            className={`w-full text-left p-3 rounded-lg border transition ${active ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-emerald-500 hover:bg-emerald-50'}`}
          >
            <div className="flex items-center">
              <span className="mr-2" aria-hidden>{opt.label.split(' ')[0]}</span>
              <span className="font-medium">{opt.label}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {brands.map(b => (
                <span key={b} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200">{b}</span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
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
    unit: 'pack',
    status: 'active',
    brand: '', // must be one of catalog brands for chosen category
    description: '',
    tags: '',
  });
  // Prefill form when editing a product
  const startEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || '',
      sku: p.sku || '',
      category: p.category || '',
      price: p.price != null ? String(p.price) : '',
      costPrice: p.costPrice != null ? String(p.costPrice) : '',
      stock: p.stock != null ? String(p.stock) : '',
      unit: p.unit || 'pack',
      status: p.status || 'active',
      brand: p.brand || '',
      description: p.description || '',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
    });
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await productService.list({ page: 1, limit: 10, status: 'active' });
      // Only show active products for soft delete behavior
      setProducts(res.data.items.filter(it => it.status === 'active'));
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
      // Basic guard: ensure brand fits category
      const allowed = getBrandsForCategory(payload.category);
      if (allowed.length && !allowed.includes(payload.brand)) {
        return error('Please select a valid brand for the chosen category');
      }
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
    if (c.includes('biscuit')) return { icon: '🍪', bg: '#fffbeb' };
    if (c.includes('noodle')) return { icon: '🍜', bg: '#eff6ff' };
    if (c.includes('chip') || c.includes('namkeen')) return { icon: '🍟', bg: '#fff1f2' };
    if (c.includes('chocolate') || c.includes('candy')) return { icon: '🍫', bg: '#f5f3ff' };
    if (c.includes('juice') || c.includes('tetra')) return { icon: '🧃', bg: '#ecfdf5' };
    return { icon: '📦', bg: '#f3f4f6' };
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Product</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="border rounded p-2" required placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded p-2" required placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
          {/* Category first: choose from curated catalog */}
          <select className="border rounded p-2" required value={form.category} onChange={e => setForm({ ...form, category: e.target.value, brand: '' })}>
            <option value="" disabled>Select Category</option>
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input className="border rounded p-2" required type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          <input className="border rounded p-2" type="number" min="0" step="0.01" placeholder="Cost Price" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} />
          <input className="border rounded p-2" type="number" min="0" step="1" placeholder="Stock" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
          <select className="border rounded p-2" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
            {['unit','kg','g','lb','litre','ml','pack','box','dozen','bundle'].map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select className="border rounded p-2" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {['active','inactive'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {/* Brand depends on category */}
          <select className="border rounded p-2" required disabled={!form.category} value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}>
            <option value="" disabled>{form.category ? 'Select Brand' : 'Select category first'}</option>
            {getBrandsForCategory(form.category).map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
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

      {/* Category-based selection replacing Recent Products */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Select Category to View Products</h3>
        </div>
        <CategorySelectorInline
          selected={form.category}
          onPick={async (cat) => {
            // Remember selection
            setForm({ ...form, category: cat });
            setLoading(true);
            try {
              const res = await productService.list({ page: 1, limit: 100, status: 'active', category: cat });
              setProducts(res.data.items || []);
            } finally {
              setLoading(false);
            }
          }}
        />
        <div className="mt-4">
          {loading ? (
            <p>Loading...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-gray-500">No products found for the selected category.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Brand</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Price per unit</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Unit</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, idx) => {
                    const price = Number(p.price || 0).toFixed(2);
                    const statusClass = p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700';
                    const statusLabel = p.status === 'active' ? 'Active' : 'Inactive';
                    return (
                      <tr key={p._id || idx} className="border-b last:border-0">
                        <td className="py-3 px-4 text-gray-900 font-medium">{p.name}</td>
                        <td className="py-3 px-4 text-gray-600">{p.brand}</td>
                        <td className="py-3 px-4 text-gray-600">${price}</td>
                        <td className="py-3 px-4 text-gray-600">{p.unit || 'pack'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>{statusLabel}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <button onClick={() => startEdit(p)} className="text-blue-600 hover:underline text-xs">Edit</button>
                            <button onClick={() => handleDelete(p)} className="text-red-600 hover:underline text-xs">Delete</button>
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
    </div>
  
  );
}

export default InventoryManager;