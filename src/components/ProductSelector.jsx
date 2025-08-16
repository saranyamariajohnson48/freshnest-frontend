import React, { useEffect, useMemo, useState } from 'react';
import { CATEGORY_OPTIONS, getBrandsForCategory } from '../utils/catalog';
import productService from '../services/productService';

// Simple category card component
function CategoryCard({ iconLabel, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all w-full
        ${active ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
    >
      <span className="text-xl" aria-hidden>{iconLabel.split(' ')[0]}</span>
      <span className="font-medium">{iconLabel}</span>
    </button>
  );
}

// Product card showing essential info
function ProductCard({ name, brand, price, unit }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-900 font-semibold">{name}</p>
          <p className="text-gray-500 text-sm">{brand}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-900 font-semibold">${Number(price || 0).toFixed(2)}</p>
          <p className="text-gray-500 text-xs">per {unit || 'pack'}</p>
        </div>
      </div>
    </div>
  );
}

function CategoryBrandsHint({ category }) {
  if (!category) return null;
  const brands = getBrandsForCategory(category);
  if (!brands.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {brands.map(b => (
        <span key={b} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200">{b}</span>
      ))}
    </div>
  );
}

export default function ProductSelector() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);

  // Load products when category changes
  useEffect(() => {
    const fetchByCategory = async () => {
      if (!selectedCategory) return setProducts([]);
      try {
        setLoading(true);
        const res = await productService.list({ page: 1, limit: 100, status: 'active', category: selectedCategory });
        setProducts(res.data.items || []);
      } catch (e) {
        console.error('Failed to load products:', e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchByCategory();
  }, [selectedCategory]);

  // Derived: show grid if category selected
  const showProducts = useMemo(() => Boolean(selectedCategory), [selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Category selection */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORY_OPTIONS.map((opt) => (
            <CategoryCard
              key={opt.value}
              iconLabel={opt.label}
              active={selectedCategory === opt.value}
              onClick={() => setSelectedCategory(opt.value)}
            />
          ))}
        </div>
      </div>

      {/* Products list for selected category */}
      {showProducts && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Products - {selectedCategory}</h3>
              <CategoryBrandsHint category={selectedCategory} />
            </div>
            {loading && <span className="text-sm text-gray-500">Loading...</span>}
          </div>

          {products.length === 0 && !loading ? (
            <div className="text-center text-gray-500 py-8">No products in this category yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard
                  key={p._id}
                  name={p.name}
                  brand={p.brand}
                  price={p.price}
                  unit={p.unit}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}