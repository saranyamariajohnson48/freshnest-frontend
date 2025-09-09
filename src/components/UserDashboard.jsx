import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import authService from '../services/authService';
import productService from '../services/productService';
import paymentService from '../services/paymentService';
import RazorpayStyleGateway from './RazorpayStyleGateway';
import TransactionDashboard from './TransactionDashboard';
import { useToastContext } from '../contexts/ToastContext';
import { 
  FiHome, 
  FiPackage, 
  FiBarChart2, 
  FiDownload, 
  FiBell, 
  FiLogOut,
  FiMenu,
  FiX,
  FiUser,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
  FiEye,
  FiFileText,
  FiShoppingCart,
  FiTruck,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiShoppingBag,
  FiPlus,
  FiMinus,
  FiHeart,
  FiStar,
  FiCreditCard,
  FiTrash2
} from 'react-icons/fi';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const UserDashboard = () => {
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const { signOut } = useClerk();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [userEmail] = useState('saranyamariajohnson2026@mca.ajce.in');
  
  // Shopping cart state
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Shopping cart functions
  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        return prevCart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
    success(`Added ${product.name} to cart!`);
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== productId));
    success('Item removed from cart');
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item._id === productId ? { ...item, quantity } : item
      )
    );
  };

  const toggleWishlist = (product) => {
    setWishlist(prevWishlist => {
      const isInWishlist = prevWishlist.find(item => item._id === product._id);
      if (isInWishlist) {
        success('Removed from wishlist');
        return prevWishlist.filter(item => item._id !== product._id);
      } else {
        success('Added to wishlist');
        return [...prevWishlist, product];
      }
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handlePaymentSuccess = (paymentData) => {
          success('Payment successful! Order placed successfully! 🎉');
          setCart([]);
          setCheckoutOpen(false);
          setProcessingPayment(false);
    console.log('Payment successful:', paymentData);
    
    // Refresh transaction data if we're on the transactions page
    if (activeSection === 'transactions') {
      // Trigger a refresh of the transaction dashboard
      window.dispatchEvent(new CustomEvent('refreshTransactions'));
    }
  };

  const handlePaymentError = (error) => {
          error(`Payment failed: ${error.message}`);
          setProcessingPayment(false);
          console.error('Payment error:', error);
  };

  const processOrder = () => {
    setCheckoutOpen(false);
    setProcessingPayment(true);
  };

  // Shopping Cart Component
  const ShoppingCart = () => (
    <div className={`fixed inset-0 z-50 ${cartOpen ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setCartOpen(false)}></div>
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Shopping Cart</h3>
            <button
              onClick={() => setCartOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <FiShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Your cart is empty</p>
              <p className="text-gray-400 text-sm mt-2">Add some products to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item._id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl">
                  <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FiPackage className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.category}</p>
                    <p className="text-lg font-bold text-emerald-600">₹{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateCartQuantity(item._id, item.quantity - 1)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiMinus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item._id, item.quantity + 1)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiPlus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-emerald-600">₹{getCartTotal().toFixed(2)}</span>
            </div>
            <button 
              onClick={processOrder}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center space-x-2"
            >
              <FiCreditCard className="w-5 h-5" />
              <span>Pay with Razorpay</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Prepare order data for payment
  const getOrderData = () => ({
    items: cart.map(item => ({
      id: item._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      category: item.category
    })),
    customer: {
      id: userEmail,
      name: 'John Doe',
      email: userEmail,
      phone: '+1 (555) 123-4567'
    },
    totalAmount: getCartTotal()
  });

  // Shop Component
  const Shop = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortBy, setSortBy] = useState('name');

    const loadProducts = async () => {
      try {
        setLoading(true);
        const params = { page: 1, limit: 50 };
        if (searchQuery) params.search = searchQuery;
        if (selectedCategory) params.category = selectedCategory;
        
        const response = await productService.publicList(params);
        let products = response?.data?.items || [];
        
        // Sort products
        products.sort((a, b) => {
          switch (sortBy) {
            case 'price-low':
              return a.price - b.price;
            case 'price-high':
              return b.price - a.price;
            case 'name':
            default:
              return a.name.localeCompare(b.name);
          }
        });
        
        setProducts(products);
      } catch (err) {
        console.error('Failed to load products:', err);
        error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      loadProducts();
    }, [searchQuery, selectedCategory, sortBy]);

    const ProductCard = ({ product }) => {
      const isInWishlist = wishlist.find(item => item._id === product._id);
      const isInCart = cart.find(item => item._id === product._id);
      
      return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group">
          <div className="relative">
            <div className="w-full h-48 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center mb-4">
              <FiPackage className="w-16 h-16 text-emerald-600" />
            </div>
            <button
              onClick={() => toggleWishlist(product)}
              className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                isInWishlist 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-white/80 text-gray-600 hover:bg-red-100 hover:text-red-600'
              }`}
            >
              <FiHeart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
            {product.stock < 10 && (
              <div className="absolute top-3 left-3 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-semibold">
                Low Stock
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                {product.name}
              </h3>
              <p className="text-sm text-gray-500">{product.category}</p>
              {product.brand && (
                <p className="text-xs text-gray-400">Brand: {product.brand}</p>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-600">₹{product.price.toFixed(2)}</p>
                <p className="text-sm text-gray-500">per {product.unit}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Stock: {product.stock}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">(4.8)</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {isInCart ? (
                <button
                  onClick={() => setCartOpen(true)}
                  className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-xl hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center space-x-2"
                >
                  <FiShoppingCart className="w-4 h-4" />
                  <span>View Cart</span>
                </button>
              ) : (
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-xl hover:bg-emerald-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">FreshNest Shop</h2>
              <p className="text-gray-600">Shop fresh products from our warehouse</p>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="relative bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-semibold flex items-center space-x-2"
            >
              <FiShoppingCart className="w-5 h-5" />
              <span>Cart</span>
              {getCartItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {getCartItemCount()}
                </span>
              )}
            </button>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              <option value="fruits">Fruits</option>
              <option value="vegetables">Vegetables</option>
              <option value="dairy">Dairy</option>
              <option value="bakery">Bakery</option>
              <option value="meat">Meat</option>
              <option value="seafood">Seafood</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FiPackage className="w-4 h-4" />
              <span>{products.length} products found</span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="text-gray-500 mt-4">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No products found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      // Show logout toast
      success("Logging out... See you soon! 👋", { duration: 2000 });
      
      console.log('🔄 Starting logout process...');
      
      // First, clear JWT tokens and backend session
      await authService.logout();
      console.log('✅ Cleared backend session');
      
      // Then sign out from Clerk (Google OAuth)
      await signOut();
      console.log('✅ Signed out from Clerk');
      
      // Clear any remaining auth data
      authService.clearAuthData();
      console.log('✅ Cleared all auth data');
      
      // Delay redirect to show toast
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      console.error('Logout error:', err);
      error("Logout failed, but clearing session anyway", { duration: 3000 });
      
      // Even if logout fails, clear everything and redirect
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
  
  // Sample inventory data
  const [inventoryData] = useState([
    {
      id: 1,
      name: 'Organic Tomatoes',
      category: 'Fresh Vegetables',
      stock: 150,
      supplier: 'Green Valley Farms',
      lastUpdated: '2024-01-28',
      status: 'In Stock',
      price: '$3.99/kg'
    },
    {
      id: 2,
      name: 'Fresh Spinach',
      category: 'Leafy Greens',
      stock: 25,
      supplier: 'Organic Harvest Co.',
      lastUpdated: '2024-01-28',
      status: 'Low Stock',
      price: '$2.49/kg'
    },
    {
      id: 3,
      name: 'Premium Apples',
      category: 'Seasonal Fruits',
      stock: 200,
      supplier: 'Mountain Orchards',
      lastUpdated: '2024-01-27',
      status: 'In Stock',
      price: '$4.99/kg'
    },
    {
      id: 4,
      name: 'Organic Milk',
      category: 'Dairy Products',
      stock: 80,
      supplier: 'Pure Dairy Farms',
      lastUpdated: '2024-01-28',
      status: 'In Stock',
      price: '$3.29/L'
    },
    {
      id: 5,
      name: 'Whole Grain Bread',
      category: 'Bakery Items',
      stock: 12,
      supplier: 'Artisan Bakery',
      lastUpdated: '2024-01-28',
      status: 'Low Stock',
      price: '$2.99/loaf'
    }
  ]);

  // Sample notifications
  const [notifications] = useState([
    {
      id: 1,
      message: '25 items are in low stock',
      type: 'warning',
      time: '2 hours ago'
    },
    {
      id: 2,
      message: 'New supplier "Fresh Valley Co." added',
      type: 'info',
      time: '1 day ago'
    },
    {
      id: 3,
      message: 'Weekly inventory report generated',
      type: 'success',
      time: '2 days ago'
    }
  ]);

  // Chart data for insights
  const topProductsData = {
    labels: ['Organic Tomatoes', 'Premium Apples', 'Fresh Spinach', 'Organic Milk', 'Whole Grain Bread'],
    datasets: [
      {
        label: 'Units Sold',
        data: [450, 380, 290, 320, 180],
        backgroundColor: [
          '#059669',
          '#10b981',
          '#34d399',
          '#6ee7b7',
          '#a7f3d0'
        ],
        borderWidth: 0,
      },
    ],
  };

  const stockTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Stock Level',
        data: [85, 78, 82, 75, 88, 92],
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: FiHome },
    { id: 'shop', label: 'Shop Products', icon: FiShoppingBag },
    { id: 'transactions', label: 'Payment History', icon: FiCreditCard },
    { id: 'inventory', label: 'Inventory View', icon: FiPackage },
    { id: 'reports', label: 'Stock Reports', icon: FiFileText },
    { id: 'insights', label: 'Warehouse Insights', icon: FiBarChart2 },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'profile', label: 'Profile', icon: FiUser },
  ];

  const StatsCard = ({ title, value, subtitle, icon: Icon, status, trend }) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`p-3 rounded-xl ${
              status === 'good' ? 'bg-emerald-50' : 
              status === 'warning' ? 'bg-amber-50' : 
              'bg-blue-50'
            }`}>
              <Icon className={`w-6 h-6 ${
                status === 'good' ? 'text-emerald-600' : 
                status === 'warning' ? 'text-amber-600' : 
                'text-blue-600'
              }`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
              {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className={`flex items-center space-x-1 text-sm font-medium ${
                trend.type === 'up' ? 'text-emerald-600' : 
                trend.type === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend.type === 'up' ? (
                  <FiTrendingUp className="w-4 h-4" />
                ) : trend.type === 'down' ? (
                  <FiTrendingDown className="w-4 h-4" />
                ) : null}
                <span>{trend.value}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const InventoryTable = () => {
    // Local UI state for search, filters, pagination
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    // Data state
    const [items, setItems] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const loadProducts = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const params = { page, limit };
        if (query) params.search = query;
        if (category) params.category = category;
        if (status) params.status = status;
        // If user lacks admin role, backend public endpoint will still allow read access
        const res = await productService.publicList(params);
        // Backend returns { success, data: { items, pagination } }
        const apiItems = res?.data?.items || [];
        const pagination = res?.data?.pagination || { pages: 1 };
        setItems(apiItems);
        setTotalPages(pagination.pages || 1);
      } catch (err) {
        console.error('Load products failed:', err);
        setErrorMsg('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      loadProducts();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, category, status]);

    const onSearchSubmit = (e) => {
      e.preventDefault();
      setPage(1);
      loadProducts();
    };

    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Inventory Overview</h3>
              <p className="text-sm text-gray-500 mt-1">Products managed by admin</p>
            </div>
            <form onSubmit={onSearchSubmit} className="flex items-center space-x-3">
              <div className="relative">
                <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, SKU, brand..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm w-64"
                />
              </div>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Categories</option>
                <option value="fruits">Fruits</option>
                <option value="vegetables">Vegetables</option>
                <option value="dairy">Dairy</option>
              </select>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button type="submit" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FiFilter className="w-4 h-4 text-gray-600" />
              </button>
            </form>
          </div>
        </div>

        {errorMsg && (
          <div className="px-6 py-3 bg-red-50 text-red-700 text-sm">{errorMsg}</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">Loading products...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">No products found</td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                          <FiPackage className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">SKU: {p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{p.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{p.stock} {p.unit || 'unit'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{p.supplierName || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">${p.price?.toFixed ? p.price.toFixed(2) : p.price}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{new Date(p.updatedAt || p.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        (p.status || 'active') === 'active' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {(p.status || 'active')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 text-sm">
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <div className="space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`px-3 py-1.5 rounded-lg border ${page <= 1 ? 'text-gray-400 bg-gray-50' : 'hover:bg-gray-50'}`}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`px-3 py-1.5 rounded-lg border ${page >= totalPages ? 'text-gray-400 bg-gray-50' : 'hover:bg-gray-50'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-800 shadow-2xl transition-all duration-300 flex flex-col relative overflow-hidden`}>
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
        
        {/* Logo Section */}
        <div className="h-20 flex items-center px-8 border-b border-emerald-500/30 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-emerald-600 font-bold text-lg">🌱</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">FreshNest</h1>
                <p className="text-sm text-emerald-200 font-medium">User Portal</p>
              </div>
            )}
          </div>
        </div>

        {/* User Welcome Section */}
        {sidebarOpen && (
          <div className="px-8 py-6 border-b border-emerald-500/30 relative z-10">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                  <FiUser className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Welcome,</p>
                  <p className="text-xs text-emerald-200 truncate">{userEmail}</p>
                </div>
              </div>
              <div className="bg-emerald-500/20 rounded-lg p-2">
                <p className="text-xs text-emerald-100 font-medium">
                  Enjoy your personalized dashboard experience
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-6 py-8 relative z-10">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center px-4 py-4 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-emerald-700 shadow-lg scale-105'
                      : 'text-emerald-100 hover:text-white hover:bg-emerald-600/50 hover:scale-105'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-4" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="px-6 py-6 border-t border-emerald-500/30 relative z-10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-4 text-sm font-semibold text-emerald-100 hover:text-white hover:bg-emerald-600/50 rounded-2xl transition-all duration-200 hover:scale-105"
          >
            <FiLogOut className="w-5 h-5 mr-4" />
            {sidebarOpen && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="h-full flex items-center justify-between px-8">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all duration-200 border border-gray-200"
              >
                {sidebarOpen ? <FiX className="w-6 h-6 text-gray-600" /> : <FiMenu className="w-6 h-6 text-gray-600" />}
              </button>
              <div className="border-l border-gray-200 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 capitalize">
                  {activeSection === 'overview' ? 'Dashboard Overview' : activeSection.replace('-', ' ')}
                </h2>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  FreshNest Warehouse Management System
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-3 hover:bg-gray-100 rounded-2xl transition-all duration-200 border border-gray-200"
              >
                <FiShoppingCart className="w-6 h-6 text-gray-600" />
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full text-xs text-white flex items-center justify-center font-semibold">
                    {getCartItemCount()}
                  </span>
                )}
              </button>
              <div className="relative">
                <FiBell className="w-6 h-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {notifications.length}
                </span>
              </div>
              <div className="flex items-center space-x-3 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-200">
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                  <FiUser className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-bold text-gray-900">User Access</p>
                  <p className="text-xs text-gray-500">Standard</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeSection === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Total Products"
                  value="1,247"
                  subtitle="Items in inventory"
                  icon={FiPackage}
                  status="good"
                  trend={{ type: 'up', value: '+12% this month' }}
                />
                <StatsCard
                  title="Low Stock Items"
                  value="25"
                  subtitle="Need attention"
                  icon={FiAlertTriangle}
                  status="warning"
                  trend={{ type: 'down', value: '-5% from last week' }}
                />
                <StatsCard
                  title="Active Suppliers"
                  value="18"
                  subtitle="Verified partners"
                  icon={FiTruck}
                  status="good"
                  trend={{ type: 'up', value: '+2 new suppliers' }}
                />
                <StatsCard
                  title="Inventory Health"
                  value="92%"
                  subtitle="Overall status"
                  icon={FiCheckCircle}
                  status="good"
                  trend={{ type: 'up', value: '+3% improvement' }}
                />
              </div>

              {/* Quick Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          notification.type === 'warning' ? 'bg-amber-100' :
                          notification.type === 'success' ? 'bg-emerald-100' :
                          'bg-blue-100'
                        }`}>
                          {notification.type === 'warning' ? (
                            <FiAlertTriangle className="w-4 h-4 text-amber-600" />
                          ) : notification.type === 'success' ? (
                            <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <FiBell className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setActiveSection('shop')}
                      className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors text-left"
                    >
                      <FiShoppingBag className="w-6 h-6 text-emerald-600 mb-2" />
                      <p className="font-semibold text-gray-900">Shop Products</p>
                      <p className="text-xs text-gray-500">Buy from warehouse</p>
                    </button>
                    <button 
                      onClick={() => setActiveSection('inventory')}
                      className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-left"
                    >
                      <FiEye className="w-6 h-6 text-blue-600 mb-2" />
                      <p className="font-semibold text-gray-900">View Inventory</p>
                      <p className="text-xs text-gray-500">Browse all products</p>
                    </button>
                    <button 
                      onClick={() => setActiveSection('reports')}
                      className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-left"
                    >
                      <FiDownload className="w-6 h-6 text-purple-600 mb-2" />
                      <p className="font-semibold text-gray-900">Download Reports</p>
                      <p className="text-xs text-gray-500">Get stock summaries</p>
                    </button>
                    <button 
                      onClick={() => setActiveSection('transactions')}
                      className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-left"
                    >
                      <FiCreditCard className="w-6 h-6 text-purple-600 mb-2" />
                      <p className="font-semibold text-gray-900">Payment History</p>
                      <p className="text-xs text-gray-500">View all transactions</p>
                    </button>
                    <button 
                      onClick={() => setActiveSection('insights')}
                      className="p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors text-left"
                    >
                      <FiBarChart2 className="w-6 h-6 text-amber-600 mb-2" />
                      <p className="font-semibold text-gray-900">View Insights</p>
                      <p className="text-xs text-gray-500">Analytics & trends</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'shop' && <Shop />}

          {activeSection === 'transactions' && (
            <div className="space-y-6">
              <TransactionDashboard />
            </div>
          )}

          {activeSection === 'inventory' && (
            <div className="space-y-6">
              <InventoryTable />
            </div>
          )}

          {activeSection === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-8">
                <div className="text-center mb-8">
                  <FiFileText className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Stock Reports</h3>
                  <p className="text-gray-600">Download comprehensive inventory reports</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
                    <FiCalendar className="w-8 h-8 text-blue-600 mb-4" />
                    <h4 className="font-bold text-gray-900 mb-2">Daily Summary</h4>
                    <p className="text-sm text-gray-600 mb-4">Today's inventory status and movements</p>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Download PDF
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
                    <FiBarChart2 className="w-8 h-8 text-emerald-600 mb-4" />
                    <h4 className="font-bold text-gray-900 mb-2">Weekly Summary</h4>
                    <p className="text-sm text-gray-600 mb-4">7-day inventory analysis and trends</p>
                    <button className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                      Download Excel
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
                    <FiAlertTriangle className="w-8 h-8 text-amber-600 mb-4" />
                    <h4 className="font-bold text-gray-900 mb-2">Low Stock Alert</h4>
                    <p className="text-sm text-gray-600 mb-4">Products that need restocking</p>
                    <button className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors">
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'insights' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Top 5 Products</h3>
                  <div className="h-80">
                    <Doughnut
                      data={topProductsData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              padding: 20,
                              usePointStyle: true,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Stock Trends</h3>
                  <div className="h-80">
                    <Line
                      data={stockTrendData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              callback: function(value) {
                                return value + '%';
                              }
                            }
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">All Notifications</h3>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      notification.type === 'warning' ? 'bg-amber-100' :
                      notification.type === 'success' ? 'bg-emerald-100' :
                      'bg-blue-100'
                    }`}>
                      {notification.type === 'warning' ? (
                        <FiAlertTriangle className="w-5 h-5 text-amber-600" />
                      ) : notification.type === 'success' ? (
                        <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <FiBell className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{notification.message}</p>
                      <p className="text-sm text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'profile' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiUser className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">User Profile</h3>
                  <p className="text-gray-600">View your account information</p>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-xl p-4">
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Email Address</label>
                      <p className="text-lg font-medium text-gray-900 mt-1">{userEmail}</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4">
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Role</label>
                      <p className="text-lg font-medium text-gray-900 mt-1">User</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4">
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Access Level</label>
                      <p className="text-lg font-medium text-gray-900 mt-1">Standard</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4">
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Last Login</label>
                      <p className="text-lg font-medium text-gray-900 mt-1">Today, 9:30 AM</p>
                    </div>
                  </div>
                  <div className="text-center pt-6">
                    <button onClick={handleLogout} className="bg-red-600 text-white px-8 py-3 rounded-xl hover:bg-red-700 transition-colors font-semibold">
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Shopping Cart */}
      <ShoppingCart />
      
      {/* Razorpay Style Payment Gateway */}
      <RazorpayStyleGateway
        isOpen={processingPayment}
        onClose={() => setProcessingPayment(false)}
        orderData={getOrderData()}
        totalAmount={getCartTotal()}
        customerInfo={{
          name: 'John Doe',
          email: userEmail,
          phone: '+91 98765 43210',
          address: '123 Main St, City, State 12345'
        }}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
};

export default UserDashboard;