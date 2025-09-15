import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import { useToastContext } from '../contexts/ToastContext';
import tokenManager from '../utils/tokenManager';
import supplierService from '../services/supplierService';
import authService from '../services/authService';
import {
  FiHome,
  FiPackage,
  FiTruck,
  FiTrendingUp,
  FiAward,
  FiClipboard,
  FiPhone,
  FiMail,
  FiMapPin,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiRefreshCw,
  FiCalendar,
  FiDollarSign,
  FiStar,
  FiMessageSquare
} from 'react-icons/fi';

// Lazy components
const SupplierOrdersLazy = React.lazy(() => import('./SupplierOrders'));
const SupplierDeliveriesLazy = React.lazy(() => import('./SupplierDeliveries'));
const RoleMessagesLazy = React.lazy(() => import('./RoleMessages'));

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user: authUser, logout: authLogout } = useAuth();
  const { success, error, info } = useToastContext();

  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [supplier, setSupplier] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simple sample metrics (replace with real API later)
  const [metrics, setMetrics] = useState({
    pendingOrders: 0,
    totalDeliveries: 0,
    onTimeRate: 0,
    totalEarnings: 0,
    rating: 0
  });

  // Function to get appropriate padding for different sections
  const getMainPadding = () => {
    switch (activeSection) {
      case 'overview':
        return 'col-span-12 lg:col-span-9 space-y-6 pr-[1rem] pl-[1rem]'; // Full padding for overview
      case 'orders':
        return 'col-span-12 lg:col-span-9 space-y-6 pr-[2rem] pl-[1rem]'; // Reduced padding for orders
      case 'deliveries':
        return 'col-span-12 lg:col-span-9 space-y-6 pr-[2rem] pl-[1rem]'; // Reduced padding for deliveries
      case 'messages':
        return 'col-span-12 lg:col-span-9 space-y-6 pr-[2rem] pl-[1rem]'; // Reduced padding for messages
      case 'performance':
        return 'col-span-12 lg:col-span-9 space-y-6 pr-[2rem] pl-[1rem]'; // Reduced padding for performance
      case 'profile':
        return 'col-span-12 lg:col-span-9 space-y-6 pr-[2rem] pl-[1rem]'; // Reduced padding for profile
      default:
        return 'col-span-12 lg:col-span-9 space-y-6 pr-[2rem] pl-[1rem]'; // Default padding
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (!authUser || (authUser.role !== 'supplier' && authUser.role !== 'Supplier')) {
          error('Access denied. Supplier access required.');
          navigate('/login');
          return;
        }

        tokenManager.startAutoRefresh();

        // Load supplier profile (from auth context first)
        setSupplier(authUser);

        // Attempt to refresh supplier from backend for latest details
        try {
          // Prefer profile endpoint to avoid 403 on /api/users/:id for non-admin
          const freshProfile = await authService.getProfile();
          if (freshProfile) {
            setSupplier({ ...authUser, ...freshProfile });
          }
        } catch (e) {
          // Non-blocking
          console.log('Could not refresh supplier from backend:', e?.message);
        }

        // Load basic metrics (placeholder for now)
        setMetrics(prev => ({
          ...prev,
          pendingOrders: 4,
          totalDeliveries: 132,
          onTimeRate: 96,
          totalEarnings: 42850,
          rating: supplier?.supplierDetails?.rating ?? 4.6
        }));

        setLoading(false);
      } catch (e) {
        console.error('Supplier dashboard init error:', e);
        error('Failed to load dashboard');
        setLoading(false);
      }
    };
    init();

    return () => tokenManager.stopAutoRefresh();
  }, [authUser, navigate, error, supplier?.supplierDetails?.rating]);

  // Low-stock notifier: fetch own products with stock <= 5 and show an alert banner
  useEffect(() => {
    let cancelled = false;
    const fetchLowStock = async () => {
      try {
        if (!authUser || (authUser.role !== 'supplier' && authUser.role !== 'Supplier')) return;
        const productService = (await import('../services/productService')).default;
        const res = await productService.publicList({ page: 1, limit: 50, lowStock: 5, my: true });
        const items = res?.data?.items || [];
        if (!cancelled && items.length > 0) {
          // Show a prominent, one-time info toast
          const names = items.slice(0, 5).map(p => p.name).join(', ');
          const more = items.length > 5 ? ` and ${items.length - 5} more` : '';
          const msg = `Low stock alert: ${items.length} item(s) need restock (e.g., ${names}${more}).`;
          // Use success/info channel to stand out; could be custom UI banner too
          try { info(msg, { duration: 6000 }); } catch { console.log(msg); }
        }
      } catch (e) {
        // non-blocking
      }
    };
    fetchLowStock();
    const id = setInterval(fetchLowStock, 60 * 1000); // poll every 60s
    return () => { cancelled = true; clearInterval(id); };
  }, [authUser, info]);

  // Poll chat for unread badge and toast on new incoming messages
  useEffect(() => {
    let mounted = true;
    let lastSeen = new Set();
    const poll = async () => {
      try {
        const chat = (await import('../services/chatService')).default;
        const me = (await import('../services/authService')).default.getUser();
        const { conversations } = await chat.listConversations();
        const unread = chat.computeUnread(conversations, me?._id || me?.id);
        if (!mounted) return;
        setUnreadCount(unread.total);
        for (const c of conversations || []) {
          const last = c.lastMessage;
          if (last && String(last.sender) !== String(me?._id || me?.id)) {
            const key = `${c._id}-${last.at}`;
            if (!lastSeen.has(key)) {
              lastSeen.add(key);
            }
          }
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 8000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const formatCurrency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

  const handleLogout = async () => {
    try {
      info('Logging out...');
      tokenManager.stopAutoRefresh();
      try { await authLogout(); } catch {}
      try { await signOut(); } catch {}
      window.location.replace('/freshnest-frontend/login');
    } catch (e) {
      window.location.replace('/freshnest-frontend/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading supplier dashboard...</p>
        </div>
      </div>
    );
  }

  const sd = supplier?.supplierDetails || {};

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <FiX className="w-5 h-5"/> : <FiMenu className="w-5 h-5"/>}
            </button>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-emerald-700">Fresh</span>
              <span className="text-xl font-black text-slate-900">Nest</span>
              <span className="ml-3 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">Supplier</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSection('messages')}
              className="relative p-2 rounded-lg hover:bg-slate-100"
              title="Messages"
            >
              <FiMessageSquare className="w-5 h-5"/>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">
                  {unreadCount}
                </span>
              )}
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100"><FiRefreshCw className="w-5 h-5"/></button>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
              <FiLogOut className="w-4 h-4"/> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className={`col-span-12 lg:col-span-3 ${sidebarOpen ? '' : 'hidden lg:block'}`}>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <FiUser className="w-7 h-7 text-emerald-700"/>
                </div>
                <div>
                  <div className="text-slate-900 font-semibold">{supplier?.fullName || supplier?.name}</div>
                  <div className="text-slate-500 text-sm">{sd?.category || 'Supplier'}</div>
                </div>
              </div>
            </div>

            <nav className="p-2">
              {[
                { id: 'overview', label: 'Overview', icon: <FiHome className="w-4 h-4"/> },
                { id: 'orders', label: 'Orders', icon: <FiClipboard className="w-4 h-4"/> },
                { id: 'deliveries', label: 'Deliveries', icon: <FiTruck className="w-4 h-4"/> },
                { id: 'messages', label: 'Messages', icon: <FiMessageSquare className="w-4 h-4"/> },
                { id: 'performance', label: 'Performance', icon: <FiTrendingUp className="w-4 h-4"/> },
                { id: 'profile', label: 'Profile', icon: <FiSettings className="w-4 h-4"/> },
              ].map(item => (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-slate-50 ${activeSection === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}>
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">Contact</div>
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-2"><FiMail className="w-4 h-4 text-slate-400"/>{supplier?.email}</div>
                <div className="flex items-center gap-2"><FiPhone className="w-4 h-4 text-slate-400"/>{supplier?.phone || 'N/A'}</div>
                <div className="flex items-center gap-2"><FiMapPin className="w-4 h-4 text-slate-400"/>{supplier?.address || 'No address'}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className={`${getMainPadding()}`}>
          {/* Overview cards */}
          {activeSection === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-500 text-sm">Pending Orders</div>
                      <div className="text-2xl font-bold text-slate-900">{metrics.pendingOrders}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center"><FiClipboard/></div>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-500 text-sm">Total Deliveries</div>
                      <div className="text-2xl font-bold text-slate-900">{metrics.totalDeliveries}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center"><FiTruck/></div>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-500 text-sm">On-time Rate</div>
                      <div className="text-2xl font-bold text-slate-900">{metrics.onTimeRate}%</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><FiAward/></div>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-500 text-sm">Total Earnings</div>
                      <div className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.totalEarnings)}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center"><FiDollarSign/></div>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Recent Orders</h3>
                    <button onClick={() => setActiveSection('orders')} className="text-sm text-emerald-700 hover:underline">View all</button>
                  </div>
                  <div className="text-slate-500 text-sm">No orders to display yet.</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Profile Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-700"><FiUser className="w-4 h-4 text-slate-400"/> Contact: {sd.contactPerson || '—'}</div>
                    <div className="flex items-center gap-2 text-slate-700"><FiPackage className="w-4 h-4 text-slate-400"/> Category: {sd.category || '—'}</div>
                    <div className="flex items-center gap-2 text-slate-700"><FiCalendar className="w-4 h-4 text-slate-400"/> Payment Terms: {sd.paymentTerms || 'Net 30'}</div>
                    <div className="flex items-center gap-2 text-slate-700"><FiStar className="w-4 h-4 text-yellow-500"/> Rating: {(sd.rating ?? metrics.rating) || 0}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Orders */}
          {activeSection === 'orders' && (
            <div className="bg-transparent">
              <React.Suspense fallback={<div className="p-6">Loading orders...</div>}>
                <SupplierOrdersLazy />
              </React.Suspense>
            </div>
          )}

          {/* Deliveries */}
          {activeSection === 'deliveries' && (
            <div className="bg-transparent">
              <React.Suspense fallback={<div className="p-6">Loading deliveries...</div>}>
                <SupplierDeliveriesLazy />
              </React.Suspense>
            </div>
          )}

          {/* Messages */}
          {activeSection === 'messages' && (
            <div className="bg-transparent">
              <React.Suspense fallback={<div className="p-6">Loading messages...</div>}>
                <RoleMessagesLazy />
              </React.Suspense>
            </div>
          )}

          {/* Performance placeholder */}
          {activeSection === 'performance' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <div className="text-sm text-emerald-700">On-time Deliveries</div>
                  <div className="text-2xl font-bold text-emerald-800 mt-1">{metrics.onTimeRate}%</div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="text-sm text-blue-700">Completed Deliveries</div>
                  <div className="text-2xl font-bold text-blue-800 mt-1">{metrics.totalDeliveries}</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                  <div className="text-sm text-yellow-700">Rating</div>
                  <div className="text-2xl font-bold text-yellow-800 mt-1">{(sd.rating ?? metrics.rating) || 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* Profile */}
          {activeSection === 'profile' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Supplier Profile</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-slate-500">Full Name</div>
                  <div className="text-slate-900 font-medium">{supplier?.fullName || supplier?.name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Email</div>
                  <div className="text-slate-900 font-medium">{supplier?.email}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Phone</div>
                  <div className="text-slate-900 font-medium">{supplier?.phone || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Address</div>
                  <div className="text-slate-900 font-medium">{supplier?.address || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Category</div>
                  <div className="text-slate-900 font-medium">{sd?.category || 'Other'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Payment Terms</div>
                  <div className="text-slate-900 font-medium">{sd?.paymentTerms || 'Net 30'}</div>
                </div>
              </div>
              {sd?.notes && (
                <div>
                  <div className="text-sm text-slate-500">Notes</div>
                  <div className="text-slate-900">{sd.notes}</div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SupplierDashboard;