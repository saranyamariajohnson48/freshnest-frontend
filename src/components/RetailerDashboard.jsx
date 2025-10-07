import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';
import { useToastContext } from '../contexts/ToastContext';
import purchaseService from '../services/purchaseService';
import InventoryManager from './InventoryManager';
import productService from '../services/productService';
import orderService from '../services/orderService';
import { 
  FiHome, 
  FiPackage, 
  FiShoppingCart, 
  FiBarChart2, 
  FiSettings, 
  FiBell, 
  FiLogOut,
  FiMenu,
  FiX,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiUser,
  FiSearch,
  FiActivity,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiMoreVertical,
  FiCalendar,
  FiClock,
  FiTarget,
  FiAward,
  FiAlertTriangle,
  FiCheck,
  FiUserCheck,
  FiPieChart,
  FiMessageSquare,
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiEye,
  FiSend,
  FiFileText,
  FiTag,
  FiBox,
  FiTrendingUp as FiTrendUp,
  FiTruck,
  FiShoppingBag
} from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components once at module load
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const today = new Date().toLocaleDateString();

const RetailerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToastContext();
  const { signOut } = useClerk();
  
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [unreadCount, setUnreadCount] = useState(3);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  // Dashboard stats state
  const [ordersPlaced, setOrdersPlaced] = useState(0);
  const [pendingDeliveries, setPendingDeliveries] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [recentProducts, setRecentProducts] = useState([]); // from purchases items
  // Retailer catalogue state (inventory section)
  const [catalogue, setCatalogue] = useState([]);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState('');
  const [cataloguePage, setCataloguePage] = useState(1);
  const [cataloguePages, setCataloguePages] = useState(1);
  const [catalogueQuery, setCatalogueQuery] = useState('');
  const [catalogueCategory, setCatalogueCategory] = useState('');
  const [cartItems, setCartItems] = useState([]); // {productId, name, price, brand, category, qty, stock}
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  // Load available products (compact list)
  useEffect(() => {
    (async () => {
      try {
        setLoadingAvailable(true);
        const res = await productService.list({ page: 1, limit: 8, status: 'active' });
        const items = Array.isArray(res?.data?.items) ? res.data.items : [];
        setAvailableProducts(items);
      } catch (e) {
        console.error('Failed to load products', e);
      } finally {
        setLoadingAvailable(false);
      }
    })();
  }, []);

  // Load dashboard KPIs (orders and purchases)
  useEffect(() => {
    if (activeSection !== 'dashboard') return;
    (async () => {
      try {
        // Supplier Orders for this user (if role supplier), used for orders and pending counts
        const orderRes = await orderService.list({});
        const orders = Array.isArray(orderRes?.data) ? orderRes.data : [];
        setOrdersPlaced(orders.length);
        setPendingDeliveries(orders.filter((o) => o.status === 'Pending' || o.status === 'Approved' || o.status === 'In Transit').length);

        // Purchases for current user: compute total spent and recent items
        const purchaseRes = await (await import('../services/purchaseService')).default.getMyPurchases({ page: 1, limit: 20 });
        const purchases = Array.isArray(purchaseRes?.data?.purchases) ? purchaseRes.data.purchases : [];
        const spent = purchases
          .filter((p) => (p.status || '').toLowerCase() === 'completed')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        setTotalSpent(spent);

        // Flatten items for recent list
        const recent = [];
        for (const p of purchases) {
          if (Array.isArray(p.items)) {
            for (const it of p.items) {
              if (it?.name) recent.push({ name: it.name, qty: it.quantity || 1, price: it.price || 0, purchasedAt: p.purchasedAt });
            }
          }
        }
        // Sort by purchase date desc and take top 6
        recent.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));
        setRecentProducts(recent.slice(0, 6));
      } catch (e) {
        console.error('Failed loading dashboard KPIs', e);
      }
    })();
  }, [activeSection]);

  // Load retailer catalogue when inventory tab active or filters/page change
  useEffect(() => {
    if (activeSection !== 'inventory') return;
    (async () => {
      try {
        setCatalogueLoading(true);
        setCatalogueError('');
        const params = { page: cataloguePage, limit: 10 };
        if (catalogueQuery) params.search = catalogueQuery;
        if (catalogueCategory) params.category = catalogueCategory;
        const res = await productService.publicList(params);
        const items = Array.isArray(res?.data?.items) ? res.data.items : [];
        const pagination = res?.data?.pagination || { pages: 1 };
        setCatalogue(items);
        setCataloguePages(pagination.pages || 1);
      } catch (e) {
        console.error('Failed to load catalogue', e);
        setCatalogueError('Failed to load products');
      } finally {
        setCatalogueLoading(false);
      }
    })();
  }, [activeSection, cataloguePage, catalogueCategory]);

  const addToCart = (product) => {
    const productId = product._id || product.id;
    if (!productId) return;
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        const nextQty = Math.min((existing.qty || 1) + 1, typeof product.stock === 'number' ? product.stock : Infinity);
        return prev.map((i) => i.productId === productId ? { ...i, qty: nextQty } : i);
      }
      return [
        ...prev,
        {
          productId,
          name: product.name,
          price: Number(product.price || 0),
          brand: product.brand,
          category: product.category,
          qty: 1,
          stock: typeof product.stock === 'number' ? product.stock : undefined,
        }
      ];
    });
    success('Added to cart');
  };

  const updateCartQty = (productId, qty) => {
    setCartItems((prev) => prev.map((i) => i.productId === productId ? { ...i, qty } : i));
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const checkoutCart = async () => {
    try {
      if (cartItems.length === 0) return;
      // Create one consolidated order by simple naming; backend expects supplier order fields
      // We will submit a simple order per first item category/brand/product summary
      const first = cartItems[0];
      const totalQty = cartItems.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
      const avgPrice = cartItems.reduce((sum, i) => sum + (i.price || 0), 0) / Math.max(cartItems.length, 1);
      const productSummary = cartItems.map((i) => `${i.name} x${i.qty}`).join(', ');
      const payload = {
        category: first?.category || 'misc',
        brand: first?.brand || 'generic',
        product: productSummary.slice(0, 200),
        pricePerQuantity: Number(avgPrice.toFixed(2)),
        quantity: totalQty,
        expectedDelivery: null,
        notes: 'Retailer order created from Product Catalogue',
      };
      const res = await orderService.create(payload);
      if (res?.success) {
        success('Order placed successfully');
        setCartItems([]);
      } else {
        error('Failed to place order');
      }
    } catch (e) {
      console.error('Checkout failed', e);
      error('Failed to place order');
    }
  };
  
  // Logout handler
  const handleLogout = async () => {
    try {
      success("Logging out... See you soon! 👋", { duration: 2000 });
      console.log('🔄 Starting logout process...');
      
      await authService.logout();
      console.log('✅ Cleared backend session');
      
      await signOut();
      console.log('✅ Signed out from Clerk');
      
      authService.clearAuthData();
      console.log('✅ Cleared all auth data');
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      console.error('Logout error:', err);
      error("Logout failed, but clearing session anyway", { duration: 3000 });
      
      try {
        await signOut();
      } catch (clerkError) {
        console.error('Clerk signout error:', clerkError);
      }
      
      authService.clearAuthData();
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }
  };

  const [notifications] = useState([
    { id: 1, message: 'Product XYZ is running low on stock.', time: '2 min ago', type: 'warning' },
    { id: 2, message: 'Invoice INV#2314 was downloaded successfully.', time: '1 hour ago', type: 'success' },
    { id: 3, message: 'Admin updated product pricing.', time: '3 hours ago', type: 'info' },
  ]);

  const salesToday = 2560;
  const salesSummary = {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    sales: [500, 700, 400, 600, 800, 300, 260],
    topProducts: [
      { name: 'Product A', sold: 30, revenue: 3600 },
      { name: 'Product B', sold: 22, revenue: 1760 },
      { name: 'Product C', sold: 15, revenue: 900 },
    ],
    avgSales: 512,
    totalMonthly: 12000,
    growthRate: 12.5,
  };

  const inventory = [
    { name: 'Product A', stock: 12, price: 120, category: 'Electronics', status: 'in-stock' },
    { name: 'Product B', stock: 5, price: 80, category: 'Clothing', status: 'low-stock' },
    { name: 'Product C', stock: 30, price: 60, category: 'Accessories', status: 'in-stock' },
    { name: 'Product D', stock: 0, price: 150, category: 'Electronics', status: 'out-of-stock' },
  ];

  // Navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
    { id: 'sales', label: 'Sales', icon: FiShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: FiPackage },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'settings', label: 'Settings', icon: FiSettings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <FiShoppingCart className="w-5 h-5 text-white" />
          </div>
            <span className="text-xl font-bold text-gray-900">Retailer</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <FiLogOut className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
            
            <div className="relative hidden md:block">
              <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products, sales..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm w-64 lg:w-80 bg-gray-50"
              />
            </div>
      </div>

          <div className="flex items-center space-x-2 lg:space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden">
              <FiSearch className="w-5 h-5 text-gray-600" />
            </button>
            
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <FiBell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-xs">
                  {(user?.fullName || user?.name || user?.email || 'R')
                    .split(' ')
                    .map(part => part.charAt(0).toUpperCase())
                    .slice(0, 2)
                    .join('')}
                </span>
              </div>
              <div className="text-right hidden lg:block">
                <p className="text-sm font-medium text-gray-900">{user?.fullName || user?.name || 'Retailer'}</p>
                <p className="text-xs text-gray-500">{user?.email || ''}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {activeSection === 'dashboard' && (
            <div className="space-y-8">
              {/* Header Section */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Retailer Dashboard</h1>
                  <p className="text-gray-600 mt-1 text-sm lg:text-base">
                    Welcome back, {user?.fullName || 'Retailer'}! Here's your business overview.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="bg-emerald-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 text-sm lg:text-base">
                    <FiPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Sale</span>
                    <span className="sm:hidden">Sale</span>
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm lg:text-base hidden sm:block">
                    Generate Report
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <MetricCard
                  title="Total Orders Placed"
                  subtitle="All time"
                  value={ordersPlaced.toLocaleString()}
                  change=""
                  changeType="neutral"
                  icon={FiShoppingBag}
                />
                <MetricCard
                  title="Pending Deliveries"
                  subtitle="Awaiting delivery"
                  value={pendingDeliveries.toLocaleString()}
                  change=""
                  changeType="neutral"
                  icon={FiTruck}
                />
                <MetricCard
                  title="Total Amount Spent"
                  subtitle="Completed purchases"
                  value={`₹${Number(totalSpent || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  change=""
                  changeType="neutral"
                  icon={FiDollarSign}
                />
                <MetricCard
                  title="Recently Ordered"
                  subtitle="Distinct items"
                  value={new Set(recentProducts.map((r) => r.name)).size.toString()}
                  change=""
                  changeType="neutral"
                  icon={FiPackage}
                />
              </div>

              {/* Available Products (compact) */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Available Products</h3>
                  <button
                    onClick={async () => {
                      try {
                        setLoadingAvailable(true);
                        const res = await productService.list({ page: 1, limit: 8, status: 'active' });
                        setAvailableProducts(Array.isArray(res?.data?.items) ? res.data.items : []);
                      } finally {
                        setLoadingAvailable(false);
                      }
                    }}
                    className="text-sm text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <FiRefreshCw className="w-4 h-4" /> Refresh
                  </button>
                </div>
                {loadingAvailable ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : availableProducts.length === 0 ? (
                  <p className="text-sm text-gray-500">No active products available.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {availableProducts.map((p, idx) => (
                      <div key={p._id || idx} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 truncate" title={p.name}>{p.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">₹{Number(p.price || 0).toFixed(2)}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            typeof p.stock === 'number' && p.stock > 5 ? 'bg-green-100 text-green-700' :
                            typeof p.stock === 'number' && p.stock > 0 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {typeof p.stock === 'number' ? `${p.stock} in stock` : 'N/A'}
                          </span>
                        </div>
                        {p.brand && (
                          <p className="text-[10px] text-gray-500 mt-2">Brand: {p.brand}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Entry Form */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Record New Sale</h3>
          <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option>Select a product</option>
              {inventory.map((item, idx) => (
                            <option key={idx} value={item.name}>{item.name}</option>
              ))}
            </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input 
                          type="number" 
                          placeholder="Enter quantity" 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                        <input 
                          type="number" 
                          placeholder="Optional" 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Note</label>
                        <textarea 
                          placeholder="Optional note..." 
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                      >
              Save Sale
            </button>
          </form>
        </div>
          </div>

                {/* Analytics and Inventory */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Sales Chart */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Sales Performance</h3>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full">7D</button>
                        <button className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-full">30D</button>
                        <button className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-full">90D</button>
            </div>
          </div>
                    <div className="h-64">
                      <Line 
                        data={{
                          labels: salesSummary.days,
                          datasets: [
                            {
                              label: 'Sales',
                              data: salesSummary.sales,
                              borderColor: 'rgb(16, 185, 129)', // emerald-500
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              tension: 0.4,
                              fill: true,
                              pointRadius: 3,
                              pointBackgroundColor: 'rgb(16, 185, 129)'
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              mode: 'index',
                              intersect: false
                            },
                            title: { display: false }
                          },
                          scales: {
                            x: {
                              grid: { display: false },
                              ticks: { color: '#6B7280' } // text-gray-500
                            },
                            y: {
                              grid: { color: '#F3F4F6' }, // gray-100
                              ticks: { color: '#6B7280' }
                            }
                          }
                        }}
                      />
        </div>
      </div>
                  
                  {/* Inventory Overview */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Inventory Overview</h3>
                      <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                        View All
                      </button>
        </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
            <thead>
                          <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                            <th className="pb-3">Product</th>
                            <th className="pb-3">Category</th>
                            <th className="pb-3">Stock</th>
                            <th className="pb-3">Price</th>
                            <th className="pb-3">Status</th>
              </tr>
            </thead>
                        <tbody className="divide-y divide-gray-200">
              {inventory.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="py-3 text-sm font-medium text-gray-900">{item.name}</td>
                              <td className="py-3 text-sm text-gray-500">{item.category}</td>
                              <td className="py-3 text-sm text-gray-900">{item.stock}</td>
                              <td className="py-3 text-sm text-gray-900">₹{item.price}</td>
                              <td className="py-3">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  item.status === 'in-stock' 
                                    ? 'bg-green-100 text-green-800'
                                    : item.status === 'low-stock'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {item.status === 'in-stock' ? 'In Stock' : 
                                   item.status === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                                </span>
                              </td>
                </tr>
              ))}
            </tbody>
          </table>
                    </div>
                  </div>
        </div>
      </div>

              {/* Notifications and Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FiBell className="w-5 h-5 mr-2 text-gray-500" />
                    Notifications
          </h3>
                  <div className="space-y-3">
            {notifications.map((note) => (
                      <div key={note.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          note.type === 'warning' ? 'bg-yellow-400' :
                          note.type === 'success' ? 'bg-green-400' : 'bg-blue-400'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{note.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{note.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
        </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FiActivity className="w-5 h-5 mr-2 text-gray-500" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <FiCheck className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">Sale completed for Product A</p>
                        <p className="text-xs text-gray-500">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiFileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">Invoice generated for Order #1234</p>
                        <p className="text-xs text-gray-500">1 hour ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <FiAlertTriangle className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">Low stock alert for Product B</p>
                        <p className="text-xs text-gray-500">3 hours ago</p>
                      </div>
                    </div>
                  </div>

                  {/* Recently Ordered Products */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Recently Ordered Products</h3>
                    </div>
                    {recentProducts.length === 0 ? (
                      <p className="text-sm text-gray-500">No recent purchases found.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {recentProducts.map((rp, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-900 truncate" title={rp.name}>{rp.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Qty: {rp.qty}</p>
                              </div>
                              <span className="text-xs text-gray-500">₹{Number(rp.price || 0).toFixed(2)}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(rp.purchasedAt).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Profile</h1>
                  <p className="text-gray-600 mt-1 text-sm lg:text-base">Retailer’s personal info and store details.</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <form
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  onSubmit={(e) => { e.preventDefault(); success('Profile saved'); }}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      defaultValue={user?.fullName || user?.name || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email / Contact</label>
                    <input
                      type="email"
                      defaultValue={user?.email || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <input
                      type="text"
                      placeholder="Your store or business"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      placeholder="Street, City, State, ZIP"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          // Use forgot-password to send reset link
                          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/auth/forgot-password`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: user?.email })
                          });
                          if (!res.ok) throw new Error('Failed');
                          success('Password reset link sent to your email');
                        } catch (err) {
                          error('Could not send reset link');
                        }
                      }}
                      className="text-sm text-emerald-700 hover:text-emerald-800"
                    >
                      Change Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {activeSection === 'inventory' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Inventory</h1>
                  <p className="text-gray-600 mt-1 text-sm lg:text-base">View products and place orders.</p>
                </div>
              </div>

              {/* Product Catalogue (read-only) */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
                  <div className="flex-1 flex gap-2">
                    <div className="relative w-full md:max-w-sm">
                      <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        value={catalogueQuery}
                        onChange={(e) => setCatalogueQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { setCataloguePage(1); /* trigger via query state change */ } }}
                        type="text"
                        placeholder="Search products..."
                        className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm w-full"
                      />
                    </div>
                    <select
                      value={catalogueCategory}
                      onChange={(e) => { setCatalogueCategory(e.target.value); setCataloguePage(1); }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    >
                      <option value="">All Categories</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Produce">Produce</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setCataloguePage(1); setCatalogueQuery(''); setCatalogueCategory(''); }}
                      className="text-sm text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <FiRefreshCw className="w-4 h-4" /> Reset
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                        <th className="pb-3">Product Name</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Price</th>
                        <th className="pb-3">Stock</th>
                        <th className="pb-3">Brand</th>
                        <th className="pb-3">Add to Order</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {catalogueLoading ? (
                        Array.from({ length: 10 }).map((_, i) => (
                          <tr key={i}>
                            <td className="py-3"><div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" /></td>
                            <td className="py-3"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse" /></td>
                            <td className="py-3"><div className="h-4 bg-gray-200 rounded w-16 animate-pulse" /></td>
                            <td className="py-3"><div className="h-4 bg-gray-200 rounded w-16 animate-pulse" /></td>
                            <td className="py-3"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse" /></td>
                            <td className="py-3"><div className="h-8 bg-gray-200 rounded w-28 animate-pulse" /></td>
                          </tr>
                        ))
                      ) : catalogueError ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-sm text-red-600">{catalogueError}</td>
                        </tr>
                      ) : catalogue.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-sm text-gray-500">No products found.</td>
                        </tr>
                      ) : (
                        catalogue.map((p) => (
                          <tr key={p._id} className="hover:bg-gray-50">
                            <td className="py-3 text-sm font-medium text-gray-900">{p.name}</td>
                            <td className="py-3 text-sm text-gray-500">{p.category}</td>
                            <td className="py-3 text-sm text-gray-900">₹{Number(p.price || 0).toFixed(2)}</td>
                            <td className="py-3 text-sm text-gray-900">{typeof p.stock === 'number' ? p.stock : 'N/A'}</td>
                            <td className="py-3 text-sm text-gray-500">{p.brand || '-'}</td>
                            <td className="py-3">
                              <button
                                onClick={() => addToCart(p)}
                                disabled={typeof p.stock === 'number' && p.stock <= 0}
                                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                                  typeof p.stock === 'number' && p.stock <= 0
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                }`}
                              >
                                Order Now
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-gray-500">Page {cataloguePage} of {cataloguePages}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCataloguePage((p) => Math.max(1, p - 1))}
                      disabled={cataloguePage <= 1}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCataloguePage((p) => Math.min(cataloguePages, p + 1))}
                      disabled={cataloguePage >= cataloguePages}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              {/* Cart Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Your Order</h3>
                  {cartItems.length > 0 && (
                    <button onClick={() => setCartItems([])} className="text-sm text-red-600 hover:text-red-700">Clear</button>
                  )}
                </div>
                {cartItems.length === 0 ? (
                  <p className="text-sm text-gray-500">No items added yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                          <th className="pb-3">Product</th>
                          <th className="pb-3">Qty</th>
                          <th className="pb-3">Price</th>
                          <th className="pb-3">Total</th>
                          <th className="pb-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {cartItems.map((i) => (
                          <tr key={i.productId}>
                            <td className="py-3 text-sm text-gray-900">{i.name}</td>
                            <td className="py-3 text-sm">
                              <input
                                type="number"
                                min={1}
                                max={i.stock || undefined}
                                value={i.qty}
                                onChange={(e) => updateCartQty(i.productId, Math.max(1, Math.min(Number(e.target.value) || 1, i.stock || Infinity)))}
                                className="w-20 border border-gray-300 rounded-lg px-2 py-1"
                              />
                            </td>
                            <td className="py-3 text-sm text-gray-900">₹{i.price.toFixed(2)}</td>
                            <td className="py-3 text-sm text-gray-900">₹{(i.price * i.qty).toFixed(2)}</td>
                            <td className="py-3 text-sm">
                              <button onClick={() => removeFromCart(i.productId)} className="text-red-600 hover:text-red-700">Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex items-center justify-end mt-4">
                      <button
                        onClick={checkoutCart}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        Place Order
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// MetricCard Component
const MetricCard = ({ title, subtitle, value, change, changeType, icon: Icon, trend }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 hover:shadow-lg transition-all duration-200">
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">{value}</p>
        <div className="flex items-center mt-2">
          <span className={`text-sm font-medium ${
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {change}
          </span>
          {changeType === 'positive' && <FiTrendingUp className="w-4 h-4 text-green-600 ml-1" />}
          {changeType === 'negative' && <FiTrendingDown className="w-4 h-4 text-red-600 ml-1" />}
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">
        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-emerald-600" />
        </div>
      </div>
    </div>
    {trend && (
      <div className="mt-4">
        <svg className="w-full h-8 text-gray-300" viewBox="0 0 64 32" preserveAspectRatio="none">
          <path
            d={trend}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )}
  </div>
);

export default RetailerDashboard;
