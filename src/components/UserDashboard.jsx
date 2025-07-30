import React, { useState, useEffect } from 'react';
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
  FiMapPin
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [userEmail] = useState('saranyamariajohnson2026@mca.ajce.in');
  
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

  const InventoryTable = () => (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Inventory Overview</h3>
            <p className="text-sm text-gray-500 mt-1">Read-only access to warehouse data</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm w-64"
              />
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiFilter className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
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
            {inventoryData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                      <FiPackage className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{item.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-gray-900">{item.stock} units</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{item.supplier}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-gray-900">{item.price}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{item.lastUpdated}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    item.status === 'In Stock' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

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
                  You have read-only access to warehouse data
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
          <button className="w-full flex items-center px-4 py-4 text-sm font-semibold text-emerald-100 hover:text-white hover:bg-emerald-600/50 rounded-2xl transition-all duration-200 hover:scale-105">
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
                  <p className="text-xs text-gray-500">Read Only</p>
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
                      onClick={() => setActiveSection('inventory')}
                      className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors text-left"
                    >
                      <FiEye className="w-6 h-6 text-emerald-600 mb-2" />
                      <p className="font-semibold text-gray-900">View Inventory</p>
                      <p className="text-xs text-gray-500">Browse all products</p>
                    </button>
                    <button 
                      onClick={() => setActiveSection('reports')}
                      className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-left"
                    >
                      <FiDownload className="w-6 h-6 text-blue-600 mb-2" />
                      <p className="font-semibold text-gray-900">Download Reports</p>
                      <p className="text-xs text-gray-500">Get stock summaries</p>
                    </button>
                    <button 
                      onClick={() => setActiveSection('insights')}
                      className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-left"
                    >
                      <FiBarChart2 className="w-6 h-6 text-purple-600 mb-2" />
                      <p className="font-semibold text-gray-900">View Insights</p>
                      <p className="text-xs text-gray-500">Analytics & trends</p>
                    </button>
                    <button 
                      onClick={() => setActiveSection('notifications')}
                      className="p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors text-left"
                    >
                      <FiBell className="w-6 h-6 text-amber-600 mb-2" />
                      <p className="font-semibold text-gray-900">Notifications</p>
                      <p className="text-xs text-gray-500">View all alerts</p>
                    </button>
                  </div>
                </div>
              </div>
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
                      <p className="text-lg font-medium text-gray-900 mt-1">User (Read-Only)</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4">
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Access Level</label>
                      <p className="text-lg font-medium text-gray-900 mt-1">Warehouse Data Viewer</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4">
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Last Login</label>
                      <p className="text-lg font-medium text-gray-900 mt-1">Today, 9:30 AM</p>
                    </div>
                  </div>
                  <div className="text-center pt-6">
                    <button className="bg-red-600 text-white px-8 py-3 rounded-xl hover:bg-red-700 transition-colors font-semibold">
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;