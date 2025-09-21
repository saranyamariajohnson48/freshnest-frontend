import React, { useEffect, useState } from 'react';
import { FiUpload, FiPlus, FiCheckCircle, FiAlertCircle, FiFilter, FiDownload, FiAlertTriangle } from 'react-icons/fi';
import productService from '../services/productService';
import supplierService from '../services/supplierService';
import { CATEGORY_OPTIONS, getBrandsForCategory } from '../utils/catalog';
import { getExpiryStatus } from '../utils/expiry';

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
  const [suppliers, setSuppliers] = useState([]); // suppliers matching category
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
    supplierId: '',
    expiryDate: '',
  });
  const [errors, setErrors] = useState({});
  const [alertTargetSupplier, setAlertTargetSupplier] = useState({}); // productId -> supplierId
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
      supplierId: p.supplierId || '',
      expiryDate: p.expiryDate ? new Date(p.expiryDate).toISOString().split('T')[0] : '',
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
  // Load suppliers when category changes (also covers edit prefill)
  useEffect(() => {
    (async () => {
      if (form.category) {
        try {
          const list = await supplierService.listByCategory(form.category, 'active');
          setSuppliers(list);
        } catch {
          setSuppliers([]);
        }
      } else {
        setSuppliers([]);
      }
    })();
  }, [form.category]);

  const validate = () => {
    const v = {};
    if (!form.name.trim()) v.name = 'Product name is required';
    if (!form.sku.trim()) v.sku = 'SKU is required';
    if (!form.category) v.category = 'Please choose a category';
    if (form.price === '' || isNaN(Number(form.price)) || Number(form.price) <= 0) v.price = 'Enter a valid price > 0';
    if (form.costPrice !== '' && (isNaN(Number(form.costPrice)) || Number(form.costPrice) < 0)) v.costPrice = 'Cost price cannot be negative';
    if (form.stock !== '' && (isNaN(Number(form.stock)) || Number(form.stock) < 0 || !Number.isInteger(Number(form.stock)))) v.stock = 'Stock must be a non-negative integer';
    if (!form.unit) v.unit = 'Unit is required';
    if (!form.brand) v.brand = 'Brand is required';
    if (!form.supplierId) v.supplierId = 'Supplier is required';
    // Optional expiry: if filled, must be valid future date
    if (form.expiryDate) {
      const d = new Date(form.expiryDate);
      if (isNaN(d.getTime())) v.expiryDate = 'Invalid date';
    }

    // Brand must be in catalog for the selected category
    const allowed = getBrandsForCategory(form.category);
    if (form.category && allowed.length && form.brand && !allowed.includes(form.brand)) {
      v.brand = 'Please select a valid brand for the chosen category';
    }
    setErrors(v);
    return Object.keys(v).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        costPrice: form.costPrice ? Number(form.costPrice) : 0,
        stock: form.stock ? Number(form.stock) : 0,
        tags: form.tags ? form.tags.split(',').map(s => s.trim()) : [],
        // Convert expiryDate to ISO if provided
        ...(form.expiryDate ? { expiryDate: new Date(form.expiryDate).toISOString() } : {}),
      };
      // Enforce supplier-category match if supplier selected
      if (payload.supplierId) {
        const selectedSupplier = suppliers.find(s => String(s.id || s._id) === String(payload.supplierId));
        if (!selectedSupplier) return error('Selected supplier not found');
        if (selectedSupplier.category !== payload.category) {
          return error('Supplier category must match product category');
        }
      }
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
        if (!payload.supplierId) {
          return error('Please select a supplier');
        }
        await productService.createProduct(payload);
        success('Product added successfully');
      }
      setForm({ name: '', sku: '', category: '', price: '', costPrice: '', stock: '', unit: 'pack', status: 'active', brand: '', description: '', tags: '', supplierId: '', expiryDate: '' });
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input className={`border rounded p-2 w-full ${errors.name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter product name" value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }); }} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
            <input className={`border rounded p-2 w-full ${errors.sku ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter SKU" value={form.sku} onChange={e => { setForm({ ...form, sku: e.target.value }); if (errors.sku) setErrors({ ...errors, sku: '' }); }} />
            {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
          </div>
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select className={`border rounded p-2 w-full ${errors.category ? 'border-red-500' : 'border-gray-300'}`} value={form.category} onChange={async e => {
              const category = e.target.value;
              setForm({ ...form, category, brand: '', supplierId: '' });
              if (errors.category) setErrors({ ...errors, category: '' });
              try {
                const list = await supplierService.listByCategory(category, 'active');
                setSuppliers(list);
              } catch { setSuppliers([]); }
            }}>
              <option value="" disabled>Select Category</option>
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>
          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
            <input className={`border rounded p-2 w-full ${errors.price ? 'border-red-500' : 'border-gray-300'}`} type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={e => { setForm({ ...form, price: e.target.value }); if (errors.price) setErrors({ ...errors, price: '' }); }} />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>
          {/* Cost Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
            <input className={`border rounded p-2 w-full ${errors.costPrice ? 'border-red-500' : 'border-gray-300'}`} type="number" min="0" step="0.01" placeholder="0.00" value={form.costPrice} onChange={e => { setForm({ ...form, costPrice: e.target.value }); if (errors.costPrice) setErrors({ ...errors, costPrice: '' }); }} />
            {errors.costPrice && <p className="text-red-500 text-xs mt-1">{errors.costPrice}</p>}
          </div>
          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input className={`border rounded p-2 w-full ${errors.stock ? 'border-red-500' : 'border-gray-300'}`} type="number" min="0" step="1" placeholder="0" value={form.stock} onChange={e => { setForm({ ...form, stock: e.target.value }); if (errors.stock) setErrors({ ...errors, stock: '' }); }} />
            {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
          </div>
          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
            <select className={`border rounded p-2 w-full ${errors.unit ? 'border-red-500' : 'border-gray-300'}`} value={form.unit} onChange={e => { setForm({ ...form, unit: e.target.value }); if (errors.unit) setErrors({ ...errors, unit: '' }); }}>
              {['unit','kg','g','lb','litre','ml','pack','box','dozen','bundle'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit}</p>}
          </div>
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="border rounded p-2 w-full" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {['active','inactive'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
            <select className={`border rounded p-2 w-full ${errors.brand ? 'border-red-500' : 'border-gray-300'}`} disabled={!form.category} value={form.brand} onChange={e => { setForm({ ...form, brand: e.target.value }); if (errors.brand) setErrors({ ...errors, brand: '' }); }}>
              <option value="" disabled>{form.category ? 'Select Brand' : 'Select category first'}</option>
              {getBrandsForCategory(form.category).map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
          </div>
          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
            <select className={`border rounded p-2 w-full ${errors.supplierId ? 'border-red-500' : 'border-gray-300'}`} disabled={!form.category} value={form.supplierId} onChange={e => { setForm({ ...form, supplierId: e.target.value }); if (errors.supplierId) setErrors({ ...errors, supplierId: '' }); }}>
              <option value="" disabled>{form.category ? 'Select Supplier' : 'Select category first'}</option>
              {suppliers.map(s => (
                <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
              ))}
            </select>
            {errors.supplierId && <p className="text-red-500 text-xs mt-1">{errors.supplierId}</p>}
          </div>
          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input
              type="date"
              className={`border rounded p-2 w-full ${errors.expiryDate ? 'border-red-500' : 'border-gray-300'}`}
              value={form.expiryDate}
              onChange={e => { setForm({ ...form, expiryDate: e.target.value }); if (errors.expiryDate) setErrors({ ...errors, expiryDate: '' }); }}
            />
            {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
          </div>
          {/* Tags */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input className="border rounded p-2 w-full" placeholder="Comma separated" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
          {/* Description */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="border rounded p-2 w-full" placeholder="Short description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
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
              setProducts((res.data.items || []).filter(it => it.status === 'active'));
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
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Unit</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Available Stock</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Supplier</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Expiry</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, idx) => {
                    const price = Number(p.price || 0).toFixed(2);
                    const statusClass = p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700';
                    const statusLabel = p.status === 'active' ? 'Active' : 'Inactive';
                    const isLow = typeof p.stock === 'number' && p.stock <= 5;
                    const eligibleSuppliers = suppliers.filter(s => s.category === p.category && (!p.brand || (Array.isArray(s.brands) && s.brands.includes(p.brand))));
                    return (
                      <tr key={p._id || idx} className={`border-b last:border-0 ${isLow ? 'bg-red-50/50' : ''}`}>
                        <td className="py-3 px-4 text-gray-900 font-medium">
                          <div className="flex items-center gap-2">
                            <span>{p.name}</span>
                            {isLow && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                                Low stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{p.brand}</td>
                        <td className="py-3 px-4 text-gray-600">${price}</td>
                        <td className="py-3 px-4 text-gray-600">{p.unit || 'pack'}</td>
                        <td className={`py-3 px-4 font-semibold ${isLow ? 'text-red-700' : 'text-gray-900'}`}>{p.stock != null ? p.stock : '-'}</td>
                        <td className="py-3 px-4 text-gray-600">{p.supplierName || p.supplierId || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>{statusLabel}</span>
                        </td>
                        <td className="py-3 px-4">
                          {p.expiryDate ? (
                            <div className="flex items-center gap-2">
                              {(() => {
                                const { expired, expiringSoon, within30, daysLeft } = getExpiryStatus(p.expiryDate);
                                const colorClass = expired ? 'text-red-600' : expiringSoon ? 'text-red-600' : within30 ? 'text-yellow-600' : 'text-gray-700';
                                return (
                                  <>
                                    <span className={`text-xs font-medium ${colorClass}`}>
                                      {new Date(p.expiryDate).toLocaleDateString()}
                                    </span>
                                    {expired && <FiAlertTriangle className="w-4 h-4 text-red-500" />}
                                    {!expired && expiringSoon && (
                                      <>
                                        <FiAlertTriangle className="w-4 h-4 text-red-500" />
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                                          {daysLeft <= 0 ? 'Expires today' : `Expiring soon`}
                                        </span>
                                      </>
                                    )}
                                    {!expired && within30 && <FiAlertTriangle className="w-4 h-4 text-yellow-500" />}
                                  </>
                                );
                              })()}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <button onClick={() => startEdit(p)} className="text-blue-600 hover:underline text-xs">Edit</button>
                            <button onClick={() => handleDelete(p)} className="text-red-600 hover:underline text-xs">Delete</button>
                            {isLow && (
                              <div className="flex items-center gap-2">
                                <select
                                  className="border border-gray-300 rounded text-xs py-1 px-1"
                                  value={alertTargetSupplier[p._id] || ''}
                                  onChange={(e) => setAlertTargetSupplier({ ...alertTargetSupplier, [p._id]: e.target.value })}
                                >
                                  <option value="">All suppliers</option>
                                  {eligibleSuppliers.map(s => {
                                    const label = s.brands && s.brands.length ? `${s.name} (${s.brands.join(', ')})` : s.name;
                                    return <option key={s.id || s._id} value={s.id || s._id}>{label}</option>;
                                  })}
                                </select>
                                <button
                                  onClick={async () => {
                                    try {
                                      const supplierId = alertTargetSupplier[p._id];
                                      await productService.sendLowStockAlert(p._id, supplierId ? { supplierId } : undefined);
                                      success('Alert sent');
                                    } catch (e) {
                                      error(e.message || 'Failed to send alert');
                                    }
                                  }}
                                  className="text-emerald-700 hover:underline text-xs"
                                  title="Send low stock alert"
                                >Send alert</button>
                              </div>
                            )}
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