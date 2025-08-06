import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import authService from '../services/authService';
import { useToastContext } from '../contexts/ToastContext';
import AddStaffForm from './AddStaffForm';
import StaffList from './StaffList';
import AddSupplierForm from './AddSupplierForm';
import SupplierList from './SupplierList';
import tokenManager from '../utils/tokenManager';
import announcementService from '../services/announcementService';

import { 
  FiHome, 
  FiPackage, 
  FiUsers, 
  FiShoppingCart, 
  FiTruck, 
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
  FiSend
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

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile
  const [activeSection, setActiveSection] = useState('dashboard');
  const [timeRange, setTimeRange] = useState('7d');
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [staffRefreshTrigger, setStaffRefreshTrigger] = useState(0);
  
  // Supplier states
  const [showAddSupplierForm, setShowAddSupplierForm] = useState(false);
  const [supplierRefreshTrigger, setSupplierRefreshTrigger] = useState(0);
  

  
  // Announcement states
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'info', // info, warning, success, error
    priority: 'normal', // low, normal, high, urgent
    targetAudience: 'all', // all, staff, retailers, users
    expiresAt: '',
    isActive: true
  });

  // Handle responsive sidebar behavior and token management
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true); // Auto-open on desktop
      } else {
        setSidebarOpen(false); // Auto-close on mobile
      }
    };

    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Start token auto-refresh to maintain session
    tokenManager.startAutoRefresh();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      tokenManager.stopAutoRefresh();
    };
  }, []);

  // Load announcements from service
  useEffect(() => {
    const loadAnnouncements = () => {
      const storedAnnouncements = announcementService.getAnnouncements();
      
      // If no announcements exist, create sample data
      if (storedAnnouncements.length === 0) {
        const sampleAnnouncements = [
          {
            title: 'System Maintenance Scheduled',
            content: 'We will be performing system maintenance on Sunday, December 15th from 2:00 AM to 4:00 AM. During this time, the system may be temporarily unavailable.',
            type: 'warning',
            priority: 'high',
            targetAudience: 'all',
            isActive: true,
            createdBy: 'Admin',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            title: 'New Holiday Policy',
            content: 'Please review the updated holiday policy for 2024. All staff members are required to submit their holiday requests by the end of this month.',
            type: 'info',
            priority: 'normal',
            targetAudience: 'staff',
            isActive: true,
            createdBy: 'Admin'
          },
          {
            title: 'Inventory Update Complete',
            content: 'The quarterly inventory update has been completed successfully. All product counts have been verified and updated in the system.',
            type: 'success',
            priority: 'low',
            targetAudience: 'all',
            isActive: false,
            createdBy: 'Admin'
          }
        ];
        
        // Add sample announcements to service
        sampleAnnouncements.forEach(announcement => {
          announcementService.addAnnouncement(announcement);
        });
      }
      
      setAnnouncements(announcementService.getAnnouncements());
    };

    loadAnnouncements();

    // Subscribe to announcement changes
    const unsubscribe = announcementService.subscribe((updatedAnnouncements) => {
      setAnnouncements(updatedAnnouncements);
    });

    return unsubscribe;
  }, []);

  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const { signOut } = useClerk();

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

  // Staff management handlers
  const handleAddStaff = () => {
    setShowAddStaffForm(true);
  };

  const handleStaffFormClose = () => {
    setShowAddStaffForm(false);
  };

  const handleStaffCreated = (newStaff) => {
    setStaffRefreshTrigger(prev => prev + 1);
    setShowAddStaffForm(false);
  };

  // Supplier management handlers
  const handleAddSupplier = () => {
    setShowAddSupplierForm(true);
  };

  const handleSupplierFormClose = () => {
    setShowAddSupplierForm(false);
  };

  const handleSupplierCreated = (newSupplier) => {
    setSupplierRefreshTrigger(prev => prev + 1);
    setShowAddSupplierForm(false);
  };

  // Announcement management handlers
  const handleAddAnnouncement = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({
      title: '',
      content: '',
      type: 'info',
      priority: 'normal',
      targetAudience: 'all',
      expiresAt: '',
      isActive: true
    });
    setShowAnnouncementForm(true);
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      expiresAt: announcement.expiresAt || '',
      isActive: announcement.isActive
    });
    setShowAnnouncementForm(true);
  };

  const handleDeleteAnnouncement = (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      if (announcementService.deleteAnnouncement(announcementId)) {
        success('Announcement deleted successfully');
      } else {
        error('Failed to delete announcement');
      }
    }
  };

  const handleAnnouncementFormSubmit = (e) => {
    e.preventDefault();
    
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      error('Please fill in all required fields');
      return;
    }

    const announcementData = {
      ...announcementForm,
      createdBy: 'Admin' // In real app, get from auth context
    };

    let result;
    if (editingAnnouncement) {
      result = announcementService.updateAnnouncement(editingAnnouncement.id, announcementData);
      if (result) {
        success('Announcement updated successfully');
      } else {
        error('Failed to update announcement');
      }
    } else {
      result = announcementService.addAnnouncement(announcementData);
      if (result) {
        success('Announcement created successfully');
      } else {
        error('Failed to create announcement');
      }
    }

    if (result) {
      setShowAnnouncementForm(false);
      setEditingAnnouncement(null);
    }
  };

  const handleAnnouncementFormClose = () => {
    setShowAnnouncementForm(false);
    setEditingAnnouncement(null);
  };

  const toggleAnnouncementStatus = (announcementId) => {
    if (announcementService.toggleAnnouncementStatus(announcementId)) {
      success('Announcement status updated');
    } else {
      error('Failed to update announcement status');
    }
  };
  
  const [stats, setStats] = useState({
    totalRevenue: 847250,
    totalOrders: 2847,
    activeCustomers: 1456,
    inventoryValue: 125000,
    growthRate: 12.5,
    conversionRate: 3.2,
    avgOrderValue: 298,
    customerSatisfaction: 4.8
  });

  // Professional Color Palette
  const theme = {
    primary: '#059669', // emerald-600
    secondary: '#10b981', // emerald-500
    accent: '#34d399', // emerald-400
    success: '#22c55e', // green-500
    warning: '#f59e0b', // amber-500
    error: '#ef4444', // red-500
    info: '#3b82f6', // blue-500
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    }
  };

  // Chart Data for Revenue Trend - Exact from Your Image
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Revenue',
        data: [65000, 72000, 68000, 85000, 92000, 88000, 95000, 102000, 98000, 115000, 125000, 135000],
        borderColor: theme.primary,
        backgroundColor: 'transparent',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: theme.primary,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Target',
        data: [60000, 70000, 75000, 80000, 85000, 90000, 95000, 100000, 105000, 110000, 115000, 120000],
        borderColor: theme.gray[300],
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      }
    ],
  };

  // Chart Data for Sales by Category (Doughnut) - Exact from Your Image
  const categoryData = {
    labels: ['Fresh Vegetables', 'Organic Fruits', 'Dairy Products', 'Grains & Cereals', 'Beverages'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          '#059669', // Fresh Vegetables
          '#10b981', // Organic Fruits  
          '#34d399', // Dairy Products
          '#3b82f6', // Grains & Cereals
          '#f59e0b'  // Beverages
        ],
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  // Weekly Orders Data (Bar Chart) - Exact from Your Image
  const weeklyOrdersData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Orders',
        data: [45, 52, 48, 61, 55, 67, 73],
        backgroundColor: theme.primary,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome, badge: null },
    { id: 'inventory', label: 'Inventory', icon: FiPackage, badge: '23' },
    { id: 'sales', label: 'Sales', icon: FiShoppingCart, badge: null },
    { id: 'staff', label: 'Staff', icon: FiUsers, badge: null },
    { id: 'announcements', label: 'Announcements', icon: FiMessageSquare, badge: announcements.filter(a => a.isActive).length.toString() },
    { id: 'suppliers', label: 'Suppliers', icon: FiTruck, badge: null },
    { id: 'reports', label: 'Reports', icon: FiBarChart2, badge: null },
  ];

  const MetricCard = ({ title, value, change, changeType, icon: Icon, subtitle, trend }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`p-2 rounded-lg ${changeType === 'positive' ? 'bg-emerald-50' : changeType === 'negative' ? 'bg-red-50' : 'bg-blue-50'}`}>
              <Icon className={`w-5 h-5 ${changeType === 'positive' ? 'text-emerald-600' : changeType === 'negative' ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <div className={`flex items-center space-x-1 text-sm font-medium ${
                changeType === 'positive' ? 'text-emerald-600' : 
                changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {changeType === 'positive' ? (
                  <FiTrendingUp className="w-4 h-4" />
                ) : changeType === 'negative' ? (
                  <FiTrendingDown className="w-4 h-4" />
                ) : null}
                <span>{change}</span>
              </div>
            )}
          </div>
        </div>
        {trend && (
          <div className="w-16 h-8">
            <svg className="w-full h-full" viewBox="0 0 64 32">
              <path
                d={trend}
                fill="none"
                stroke={changeType === 'positive' ? theme.success : changeType === 'negative' ? theme.error : theme.info}
                strokeWidth="2"
                className="opacity-60"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );

  const ChartCard = ({ title, subtitle, children, actions, className = "" }) => (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      <div className="p-4 lg:p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>
      <div className="p-4 lg:p-6">
        {children}
      </div>
    </div>
  );

  const ActivityItem = ({ title, description, time, status, avatar }) => (
    <div className="flex items-start space-x-3 p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
        status === 'success' ? 'bg-emerald-100 text-emerald-700' :
        status === 'warning' ? 'bg-amber-100 text-amber-700' :
        status === 'error' ? 'bg-red-100 text-red-700' :
        'bg-blue-100 text-blue-700'
      }`}>
        {avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
        <p className="text-xs text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  );

  const QuickAction = ({ icon: Icon, label, description, color = "gray" }) => (
    <div className="bg-gray-900 rounded-2xl p-4 lg:p-6 hover:bg-gray-800 transition-all duration-200 cursor-pointer group">
      <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-3 lg:mb-4 group-hover:bg-white/20 transition-colors`}>
        <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
      </div>
      <h4 className="font-medium text-white mb-2 text-sm lg:text-base">{label}</h4>
      <p className="text-xs lg:text-sm text-gray-400">{description}</p>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Clean Sidebar - Responsive */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ${
        sidebarOpen ? 'w-64' : 'lg:w-16'
      } fixed lg:relative inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col flex-shrink-0`}>
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🌱</span>
            </div>
            {sidebarOpen && (
              <span className="text-xl font-bold text-gray-900">FreshNest</span>
            )}
          </div>
        </div>

        {/* Menu Label */}
        {sidebarOpen && (
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">MENU</p>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    // Close sidebar on mobile after selection
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* General Section */}
        {sidebarOpen && (
          <div className="px-6 py-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">GENERAL</p>
            <div className="space-y-1">
              <button 
                onClick={() => {
                  setActiveSection('notifications');
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === 'notifications'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FiBell className="w-5 h-5 mr-3" />
                <span className="flex-1 text-left">Notifications</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  activeSection === 'notifications' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  3
                </span>
              </button>
              <button 
                onClick={() => {
                  setActiveSection('settings');
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === 'settings'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FiSettings className="w-5 h-5 mr-3" />
                <span>Settings</span>
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              >
                <FiLogOut className="w-5 h-5 mr-3" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Responsive */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
            
            {/* Search Bar - Hidden on mobile */}
            <div className="relative hidden md:block">
              <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search task"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm w-64 lg:w-80 bg-gray-50"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded hidden lg:block">⌘ F</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Search Icon for Mobile */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden">
              <FiSearch className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Mail Icon - Hidden on small screens */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
            
            {/* Notification Bell */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiBell className="w-5 h-5 text-gray-600" />
            </button>

            {/* Profile */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-xs">SM</span>
              </div>
              <div className="text-right hidden lg:block">
                <p className="text-sm font-medium text-gray-900">Saranya Maria</p>
                <p className="text-xs text-gray-500">saranyamariajohnson@mca.ajce.in</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content - Responsive */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50">
          {activeSection === 'dashboard' && (
            <div className="space-y-8">
              {/* Header Section - Responsive */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600 mt-1 text-sm lg:text-base">Plan, prioritize, and accomplish your tasks with ease.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="bg-emerald-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 text-sm lg:text-base">
                    <span className="text-lg">+</span>
                    <span className="hidden sm:inline">Add Project</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm lg:text-base hidden sm:block">
                    Import Data
                  </button>
                </div>
              </div>

              {/* Stats Cards - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {/* Total Revenue Card */}
                <MetricCard
                  title="Total Revenue"
                  subtitle="This month"
                  value="$847,250"
                  change="+12.5%"
                  changeType="positive"
                  icon={FiDollarSign}
                  trend="M 0 16 Q 16 8 32 12 T 64 8"
                />
                
                {/* Total Orders Card */}
                <MetricCard
                  title="Total Orders"
                  subtitle="This month"
                  value="2,847"
                  change="+8.2%"
                  changeType="positive"
                  icon={FiShoppingCart}
                  trend="M 0 20 Q 16 12 32 16 T 64 10"
                />
                
                {/* Active Customers Card */}
                <MetricCard
                  title="Active Customers"
                  subtitle="This month"
                  value="1,456"
                  change="+15.3%"
                  changeType="positive"
                  icon={FiUsers}
                  trend="M 0 18 Q 16 10 32 14 T 64 6"
                />
                
                {/* Inventory Value Card */}
                <MetricCard
                  title="Inventory Value"
                  subtitle="Current stock"
                  value="$125,000"
                  change="-2.1%"
                  changeType="negative"
                  icon={FiPackage}
                  trend="M 0 12 Q 16 8 32 16 T 64 20"
                />
              </div>

              {/* Charts Section - Responsive */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Revenue Trend Chart */}
                <ChartCard
                  title="Revenue Trend"
                  subtitle="Monthly revenue vs target"
                  className="lg:col-span-2"
                  actions={
                    <>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors bg-gray-900 text-white">
                        <FiDownload className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors bg-gray-900 text-white">
                        <FiRefreshCw className="w-4 h-4" />
                      </button>
                    </>
                  }
                >
                  <div className="h-64 lg:h-80">
                    <Line
                      data={revenueData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            align: 'start',
                            labels: {
                              boxWidth: 12,
                              boxHeight: 12,
                              usePointStyle: true,
                              font: {
                                size: 12,
                                weight: '500'
                              },
                              padding: 20
                            }
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            borderColor: theme.primary,
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: false,
                            min: 40000,
                            max: 140000,
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)',
                            },
                            ticks: {
                              color: theme.gray[500],
                              font: {
                                size: window.innerWidth < 640 ? 10 : 11,
                                weight: '500'
                              },
                              callback: function(value) {
                                return '$' + (value / 1000) + 'K';
                              }
                            },
                          },
                          x: {
                            grid: {
                              display: false,
                            },
                            ticks: {
                              color: theme.gray[500],
                              font: {
                                size: 11,
                                weight: '500'
                              }
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </ChartCard>

                {/* Sales by Category */}
                <ChartCard
                  title="Sales by Category"
                  subtitle="Product distribution"
                >
                  <div className="h-64 lg:h-80">
                    <Doughnut
                      data={categoryData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              padding: 20,
                              usePointStyle: true,
                              font: {
                                size: 11,
                                weight: '500'
                              }
                            },
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            cornerRadius: 8,
                            displayColors: false,
                            callbacks: {
                              label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                              }
                            }
                          },
                        },
                        cutout: '60%',
                      }}
                    />
                  </div>
                </ChartCard>
              </div>

              {/* Weekly Orders and Recent Activity - Responsive */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Weekly Orders Bar Chart */}
                <ChartCard
                  title="Weekly Orders"
                  subtitle="Orders per day this week"
                  className="lg:col-span-2"
                >
                  <div className="h-48 lg:h-64">
                    <Bar
                      data={weeklyOrdersData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            cornerRadius: 8,
                            displayColors: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 80,
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)',
                            },
                            ticks: {
                              color: theme.gray[500],
                              font: {
                                size: 11,
                                weight: '500'
                              }
                            },
                          },
                          x: {
                            grid: {
                              display: false,
                            },
                            ticks: {
                              color: theme.gray[500],
                              font: {
                                size: 11,
                                weight: '500'
                              }
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </ChartCard>

                {/* Recent Activity */}
                <ChartCard
                  title="Recent Activity"
                  subtitle="Latest updates"
                >
                  <div className="space-y-1 max-h-48 lg:max-h-64 overflow-y-auto">
                    <ActivityItem
                      title="Low stock alert"
                      description="Organic Apples running low"
                      time="15 minutes ago"
                      status="warning"
                      avatar="⚠️"
                    />
                    <ActivityItem
                      title="Payment processed"
                      description="$298.50 payment confirmed"
                      time="1 hour ago"
                      status="success"
                      avatar="💳"
                    />
                  </div>
                </ChartCard>
              </div>

              {/* Quick Actions - Responsive */}
              <ChartCard
                title="Quick Actions"
                subtitle="Frequently used operations"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <QuickAction
                    icon={FiPackage}
                    label="Add new items to inventory"
                    description=""
                  />
                  <QuickAction
                    icon={FiUsers}
                    label="View and edit team members"
                    description=""
                  />
                  <QuickAction
                    icon={FiBarChart2}
                    label="Create detailed analytics"
                    description=""
                  />
                  <QuickAction
                    icon={FiSettings}
                    label="Configure store preferences"
                    description=""
                  />
                </div>
              </ChartCard>

              {/* Orders and Activity - Responsive */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Orders */}
                <ChartCard
                  title="Weekly Orders"
                  subtitle="Orders per day this week"
                  className="lg:col-span-2"
                >
                  <div className="h-64">
                    <Bar
                      data={weeklyOrdersData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            cornerRadius: 8,
                            displayColors: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)',
                            },
                            ticks: {
                              color: theme.gray[500],
                              font: {
                                size: 11,
                                weight: '500'
                              }
                            },
                          },
                          x: {
                            grid: {
                              display: false,
                            },
                            ticks: {
                              color: theme.gray[500],
                              font: {
                                size: 11,
                                weight: '500'
                              }
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </ChartCard>

                {/* Recent Activity */}
                <ChartCard
                  title="Recent Activity"
                  subtitle="Latest updates"
                >
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    <ActivityItem
                      title="New order received"
                      description="Order #2847 from John Doe"
                      time="2 minutes ago"
                      status="success"
                      avatar="JD"
                    />
                    <ActivityItem
                      title="Low stock alert"
                      description="Organic Apples running low"
                      time="15 minutes ago"
                      status="warning"
                      avatar="⚠️"
                    />
                    <ActivityItem
                      title="Payment processed"
                      description="$298.50 payment confirmed"
                      time="1 hour ago"
                      status="success"
                      avatar="💳"
                    />
                    <ActivityItem
                      title="New customer registered"
                      description="Sarah Wilson joined"
                      time="2 hours ago"
                      status="info"
                      avatar="SW"
                    />
                    <ActivityItem
                      title="Supplier delivery"
                      description="Fresh vegetables restocked"
                      time="3 hours ago"
                      status="success"
                      avatar="🚚"
                    />
                  </div>
                </ChartCard>
              </div>
            </div>
          )}

          {/* Inventory Section */}
          {activeSection === 'inventory' && (
            <div className="space-y-6 lg:space-y-8 pr-[10rem] pl-[10rem]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Inventory Management</h1>
                  <p className="text-gray-600 mt-1 text-sm lg:text-base">Manage your products, stock levels, and inventory operations.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="bg-emerald-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 text-sm lg:text-base">
                    <span className="text-lg">+</span>
                    <span className="hidden sm:inline">Add Product</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm lg:text-base hidden sm:block">
                    Import CSV
                  </button>
                </div>
              </div>
              
              {/* Stats Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <FiPackage className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Products</p>
                    </div>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">1,247</p>
                  <p className="text-sm text-emerald-600 font-medium">+12 this week</p>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <FiAlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Low Stock</p>
                    </div>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">23</p>
                  <p className="text-sm text-amber-600 font-medium">Needs attention</p>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-red-50">
                      <FiX className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                    </div>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">5</p>
                  <p className="text-sm text-red-600 font-medium">Urgent restock</p>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <FiDollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                    </div>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">$125K</p>
                  <p className="text-sm text-blue-600 font-medium">+5.2% from last month</p>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 lg:p-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900">Recent Products</h3>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <FiFilter className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
                        <FiDownload className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Stock</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-green-600 font-medium">🥬</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Organic Lettuce</p>
                                <p className="text-sm text-gray-500">Fresh vegetables</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">Vegetables</td>
                          <td className="py-3 px-4 text-gray-600">45 units</td>
                          <td className="py-3 px-4 text-gray-600">$2.99</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">In Stock</span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <span className="text-red-600 font-medium">🍎</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Organic Apples</p>
                                <p className="text-sm text-gray-500">Fresh fruits</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">Fruits</td>
                          <td className="py-3 px-4 text-gray-600">5 units</td>
                          <td className="py-3 px-4 text-gray-600">$4.99</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Low Stock</span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 font-medium">🥛</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Organic Milk</p>
                                <p className="text-sm text-gray-500">Dairy products</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">Dairy</td>
                          <td className="py-3 px-4 text-gray-600">0 units</td>
                          <td className="py-3 px-4 text-gray-600">$3.49</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Out of Stock</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sales Section */}
          {activeSection === 'sales' && (
            <div className="space-y-6 lg:space-y-8 pr-[10rem] pl-[10rem]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Sales Management</h1>
                  <p className="text-gray-600 mt-1 text-sm lg:text-base">Track orders, manage transactions, and analyze sales performance.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="bg-emerald-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm lg:text-base">
                    <span className="hidden sm:inline">New Order</span>
                    <span className="sm:hidden">New</span>
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm lg:text-base hidden sm:block">
                    Export Data
                  </button>
                </div>
              </div>
              
              {/* Sales Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <FiShoppingCart className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    </div>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">2,847</p>
                  <p className="text-sm text-emerald-600 font-medium">+8.2% from last month</p>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <FiClock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                    </div>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">156</p>
                  <p className="text-sm text-blue-600 font-medium">Awaiting processing</p>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-50">
                      <FiDollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    </div>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">$847K</p>
                  <p className="text-sm text-green-600 font-medium">+12.5% growth</p>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-50">
                      <FiTrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                    </div>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">$298</p>
                  <p className="text-sm text-purple-600 font-medium">+3.2% increase</p>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 lg:p-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900">Recent Orders</h3>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <FiFilter className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
                        <FiRefreshCw className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Order ID</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Items</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-50">
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900">#2847</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-xs">JD</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">John Doe</p>
                                <p className="text-sm text-gray-500">john@example.com</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">5 items</td>
                          <td className="py-3 px-4 font-medium text-gray-900">$298.50</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Completed</span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">2 min ago</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900">#2846</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 font-medium text-xs">SW</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Sarah Wilson</p>
                                <p className="text-sm text-gray-500">sarah@example.com</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">3 items</td>
                          <td className="py-3 px-4 font-medium text-gray-900">$156.75</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Processing</span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">15 min ago</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900">#2845</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 font-medium text-xs">MB</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Mike Brown</p>
                                <p className="text-sm text-gray-500">mike@example.com</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">8 items</td>
                          <td className="py-3 px-4 font-medium text-gray-900">$425.20</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Pending</span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">1 hour ago</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'staff' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
                  <p className="text-gray-600 mt-1">Manage team members, roles, and permissions.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2">
                    <span className="text-lg">+</span>
                    <span>Add Staff</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Staff Module</h3>
                <p className="text-gray-500 mb-6">Employee management and scheduling tools coming soon.</p>
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">12</p>
                    <p className="text-sm text-gray-500">Total Staff</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">8</p>
                    <p className="text-sm text-gray-500">Active Today</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">3</p>
                    <p className="text-sm text-gray-500">Departments</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'announcements' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
                  <p className="text-gray-600 mt-1">Create and manage announcements for your team and users.</p>
                </div>
                <button
                  onClick={handleAddAnnouncement}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>New Announcement</span>
                </button>
              </div>

              {/* Announcements List */}
              <div className="grid gap-4">
                {announcements.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                    <FiMessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Announcements</h3>
                    <p className="text-gray-500 mb-6">Create your first announcement to communicate with your team.</p>
                    <button
                      onClick={handleAddAnnouncement}
                      className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Create Announcement
                    </button>
                  </div>
                ) : (
                  announcements.map((announcement) => (
                    <div key={announcement.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`p-2 rounded-lg ${
                              announcement.type === 'success' ? 'bg-green-50' :
                              announcement.type === 'warning' ? 'bg-yellow-50' :
                              announcement.type === 'error' ? 'bg-red-50' : 'bg-blue-50'
                            }`}>
                              <FiMessageSquare className={`w-4 h-4 ${
                                announcement.type === 'success' ? 'text-green-600' :
                                announcement.type === 'warning' ? 'text-yellow-600' :
                                announcement.type === 'error' ? 'text-red-600' : 'text-blue-600'
                              }`} />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>By {announcement.createdBy}</span>
                                <span>•</span>
                                <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  announcement.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                  announcement.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  announcement.priority === 'normal' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {announcement.priority}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  announcement.targetAudience === 'all' ? 'bg-purple-100 text-purple-700' :
                                  announcement.targetAudience === 'staff' ? 'bg-green-100 text-green-700' :
                                  announcement.targetAudience === 'retailers' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {announcement.targetAudience}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-4 leading-relaxed">{announcement.content}</p>
                          {announcement.expiresAt && (
                            <p className="text-sm text-gray-500">
                              Expires: {new Date(announcement.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            announcement.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {announcement.isActive ? 'Active' : 'Inactive'}
                          </div>
                          <button
                            onClick={() => toggleAnnouncementStatus(announcement.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            title={announcement.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditAnnouncement(announcement)}
                            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                            title="Edit"
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}



          {activeSection === 'reports' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                  <p className="text-gray-600 mt-1">Generate detailed reports and analyze business performance.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                    Generate Report
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    Export PDF
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <FiBarChart2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Reports Module</h3>
                <p className="text-gray-500 mb-6">Advanced reporting and analytics tools coming soon.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-emerald-600">Sales</p>
                    <p className="text-xs text-gray-500">Reports</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">Inventory</p>
                    <p className="text-xs text-gray-500">Reports</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-purple-600">Financial</p>
                    <p className="text-xs text-gray-500">Reports</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-orange-600">Custom</p>
                    <p className="text-xs text-gray-500">Reports</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-gray-600 mt-1">Manage system alerts, messages, and notification preferences.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                    Mark All Read
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-200 p-8">
                <div className="space-y-4">
                  <div className="flex items-start space-x-4 p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <FiAlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900">Low Stock Alert</h4>
                      <p className="text-sm text-red-700">Organic Apples are running low (5 units remaining)</p>
                      <p className="text-xs text-red-600 mt-1">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <FiShoppingCart className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">New Order Received</h4>
                      <p className="text-sm text-green-700">Order #2847 from John Doe ($298.50)</p>
                      <p className="text-xs text-green-600 mt-1">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <FiTruck className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Supplier Delivery</h4>
                      <p className="text-sm text-blue-700">Fresh vegetables delivery completed</p>
                      <p className="text-xs text-blue-600 mt-1">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div className="space-y-6 lg:space-y-8 pr-[18.5rem] pl-[18.5rem]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
                  <p className="text-gray-600 mt-1 text-sm lg:text-base">Configure system preferences and account settings.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <div className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-6">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Store Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                      <input type="text" defaultValue="FreshNest" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm lg:text-base" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Store Email</label>
                      <input type="email" defaultValue="admin@freshnest.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm lg:text-base" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm lg:text-base">
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                        <option>GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-6">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Low Stock Alerts</span>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Order Notifications</span>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Weekly Reports</span>
                      <input type="checkbox" className="rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suppliers Section */}
          {activeSection === 'suppliers' && (
            <div className="space-y-6 lg:space-y-8 pr-[10rem] pl-[10rem]">

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Supplier Management</h1>
                  <p className="text-gray-600 mt-1 text-sm lg:text-base">Manage supplier relationships and procurement.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleAddSupplier}
                    className="bg-emerald-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm lg:text-base flex items-center space-x-2"
                  >
                    <FiTruck className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Supplier</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
              </div>
              
              <SupplierList 
                onAddSupplier={handleAddSupplier}
                refreshTrigger={supplierRefreshTrigger}
              />
            </div>
          )}

          {/* Staff Section */}
          {activeSection === 'staff' && (
            <div className="space-y-6 lg:space-y-8 pr-[10rem] pl-[10rem]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Staff Management</h1>
                  <p className="text-gray-600 mt-1 text-sm lg:text-base">Manage team members, roles, and permissions.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleAddStaff}
                    className="bg-emerald-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm lg:text-base flex items-center space-x-2"
                  >
                    <FiUsers className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Staff</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
              </div>
              
              <StaffList 
                onAddStaff={handleAddStaff}
                refreshTrigger={staffRefreshTrigger}
              />
            </div>
          )}

          {/* Reports Section */}
          {activeSection === 'reports' && (
            <div className="space-y-6 lg:space-y-8 pr-[16rem] pl-[16rem]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                  <p className="text-gray-600 mt-1 text-sm lg:text-base">Generate insights and track business performance.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="bg-emerald-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm lg:text-base">
                    <span className="hidden sm:inline">Generate Report</span>
                    <span className="sm:hidden">Generate</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <FiBarChart2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Sales Reports</p>
                    </div>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">15</p>
                  <p className="text-sm text-blue-600 font-medium">Generated this month</p>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-50">
                      <FiTrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                    </div>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">+12.5%</p>
                  <p className="text-sm text-green-600 font-medium">Month over month</p>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-50">
                      <FiPieChart className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Data Points</p>
                    </div>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">2.4M</p>
                  <p className="text-sm text-purple-600 font-medium">Analyzed</p>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="space-y-6 lg:space-y-8 pr-[20rem] pl-[20rem]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-gray-600 mt-1 text-sm lg:text-base">Stay updated with system alerts and messages.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="border border-gray-300 text-gray-700 px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm lg:text-base">
                    <span className="hidden sm:inline">Mark All Read</span>
                    <span className="sm:hidden">Mark Read</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 lg:p-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm lg:text-base">New order received</p>
                        <p className="text-sm text-gray-600">Order #2847 from John Doe - $45.99</p>
                        <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm lg:text-base">Low stock alert</p>
                        <p className="text-sm text-gray-600">Organic Apples - Only 5 units remaining</p>
                        <p className="text-xs text-gray-500 mt-1">15 minutes ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm lg:text-base">Payment processed</p>
                        <p className="text-sm text-gray-600">$298.50 payment confirmed for order #2846</p>
                        <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for any other sections */}
          {!['dashboard', 'inventory', 'sales', 'staff', 'announcements', 'suppliers', 'reports', 'notifications', 'settings'].includes(activeSection) && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiPackage className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 capitalize">
                  {activeSection.replace('-', ' ')} Section
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm">
                  This section is under development. Advanced features coming soon.
                </p>
                <button className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                  Learn More
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Staff Form Modal */}
      <AddStaffForm
        isOpen={showAddStaffForm}
        onClose={handleStaffFormClose}
        onSuccess={handleStaffCreated}
      />

      {/* Add Supplier Form Modal */}
      <AddSupplierForm
        isOpen={showAddSupplierForm}
        onClose={handleSupplierFormClose}
        onSupplierCreated={handleSupplierCreated}
      />

      {/* Announcement Form Modal */}
      {showAnnouncementForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
              </h2>
              <button
                onClick={handleAnnouncementFormClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAnnouncementFormSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter announcement title"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter announcement content"
                  required
                />
              </div>

              {/* Type and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={announcementForm.type}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={announcementForm.priority}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Target Audience and Expiry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <select
                    value={announcementForm.targetAudience}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">All Users</option>
                    <option value="staff">Staff Only</option>
                    <option value="retailers">Retailers Only</option>
                    <option value="users">Regular Users Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expires At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={announcementForm.expiresAt}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={announcementForm.isActive}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active (visible to users)
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleAnnouncementFormClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <FiSend className="w-4 h-4" />
                  <span>{editingAnnouncement ? 'Update' : 'Create'} Announcement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;