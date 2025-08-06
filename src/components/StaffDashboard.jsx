import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import authService from '../services/authService';
import { useToastContext } from '../contexts/ToastContext';
import tokenManager from '../utils/tokenManager';
import { useAuth } from '../hooks/useAuth';
import announcementService from '../services/announcementService';
import { 
  FiHome, 
  FiClock, 
  FiCalendar, 
  FiDollarSign, 
  FiPackage, 
  FiBell, 
  FiUser, 
  FiLogOut,
  FiMenu,
  FiX,
  FiCheck,
  FiXCircle,
  FiAlertCircle,
  FiDownload,
  FiEye,
  FiEdit,
  FiSend,
  FiRefreshCw,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCamera,
  FiSettings,
  FiChevronRight,
  FiActivity,
  FiTrendingUp,
  FiCoffee,
  FiSun,
  FiMoon,
  FiStar,
  FiAward,
  FiTarget,
  FiBarChart2
} from 'react-icons/fi';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { success: showSuccess, error: showError, warning: showWarning, info: showInfo } = useToastContext();
  const { user: authUser, logout: authLogout } = useAuth();
  
  // State management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Dashboard data states
  const [attendanceData, setAttendanceData] = useState({
    todayStatus: null,
    thisMonth: { present: 22, absent: 2, late: 1 },
    recentHistory: []
  });
  
  const [leaveData, setLeaveData] = useState({
    balance: { casual: 8, sick: 5, annual: 12 },
    pending: [],
    recent: []
  });
  
  const [salaryData, setSalaryData] = useState({
    currentMonth: null,
    recentSlips: []
  });
  
  const [notifications, setNotifications] = useState([]);
  const [stockActivity, setStockActivity] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load user data and dashboard info
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Use auth context user data
        if (!authUser || authUser.role !== 'staff') {
          showError('Access denied. Staff access required.');
          navigate('/login');
          return;
        }
        
        setUser(authUser);
        
        // Start token auto-refresh for authenticated user
        tokenManager.startAutoRefresh();
        
        await loadDashboardData(authUser);
      } catch (error) {
        console.error('Error loading user data:', error);
        showError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (authUser) {
      loadUserData();
    } else {
      setLoading(false);
    }
    
    // Cleanup function to stop auto-refresh when component unmounts
    return () => {
      tokenManager.stopAutoRefresh();
    };
  }, [authUser, navigate, showError]);

  // Load announcements for staff
  useEffect(() => {
    const loadAnnouncements = () => {
      // Get announcements targeted for staff or all users
      const staffAnnouncements = announcementService.getActiveAnnouncements('staff');
      const allAnnouncements = announcementService.getActiveAnnouncements('all');
      
      // Combine and sort by priority and date
      const combinedAnnouncements = [...staffAnnouncements, ...allAnnouncements]
        .filter((announcement, index, self) => 
          index === self.findIndex(a => a.id === announcement.id)
        )
        .sort((a, b) => {
          // Sort by priority first (urgent > high > normal > low)
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then by creation date (newest first)
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      
      setAnnouncements(combinedAnnouncements);
    };

    loadAnnouncements();

    // Subscribe to announcement changes
    const unsubscribe = announcementService.subscribe(() => {
      loadAnnouncements();
    });

    return unsubscribe;
  }, []);

  const loadDashboardData = async (userData) => {
    try {
      // Load attendance data
      // TODO: Replace with actual API calls
      setAttendanceData({
        todayStatus: 'present',
        thisMonth: { present: 22, absent: 2, late: 1 },
        recentHistory: [
          { date: '2024-08-05', status: 'present', checkIn: '09:00', checkOut: '18:00' },
          { date: '2024-08-04', status: 'present', checkIn: '09:15', checkOut: '18:05' },
          { date: '2024-08-03', status: 'present', checkIn: '08:55', checkOut: '17:58' },
          { date: '2024-08-02', status: 'late', checkIn: '09:30', checkOut: '18:30' },
          { date: '2024-08-01', status: 'present', checkIn: '09:00', checkOut: '18:00' }
        ]
      });

      // Load leave data
      setLeaveData({
        balance: { casual: 8, sick: 5, annual: 12 },
        pending: [
          { id: 1, type: 'Casual', dates: '2024-08-15 to 2024-08-16', status: 'pending', reason: 'Personal work' }
        ],
        recent: [
          { id: 2, type: 'Sick', dates: '2024-07-20', status: 'approved', reason: 'Fever' },
          { id: 3, type: 'Casual', dates: '2024-07-10 to 2024-07-11', status: 'approved', reason: 'Family function' }
        ]
      });

      // Load salary data
      setSalaryData({
        currentMonth: {
          month: 'July 2024',
          basic: 25000,
          allowances: 5000,
          deductions: 2000,
          net: 28000
        },
        recentSlips: [
          { month: 'June 2024', net: 28000, status: 'paid' },
          { month: 'May 2024', net: 27500, status: 'paid' },
          { month: 'April 2024', net: 28000, status: 'paid' }
        ]
      });

      // Load notifications
      setNotifications([
        { id: 1, type: 'success', message: 'Your leave application has been approved', time: '2 hours ago' },
        { id: 2, type: 'info', message: 'Monthly salary slip is now available', time: '1 day ago' },
        { id: 3, type: 'warning', message: 'Please update your profile information', time: '3 days ago' }
      ]);

      // Load stock activity
      setStockActivity([
        { date: '2024-08-05', product: 'Fresh Apples', quantity: '50 kg', action: 'Received' },
        { date: '2024-08-04', product: 'Organic Bananas', quantity: '30 kg', action: 'Dispatched' },
        { date: '2024-08-03', product: 'Mixed Vegetables', quantity: '25 kg', action: 'Quality Check' }
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  // Handle logout confirmation
  const handleLogoutClick = () => {
    console.log('🔴 Logout button clicked!');
    setShowLogoutConfirm(true);
  };

  // Confirm logout
  const confirmLogout = async () => {
    console.log('🔴 Confirm logout called!');
    setShowLogoutConfirm(false);
    
    try {
      console.log('🔴 Starting logout process...');
      showInfo('Logging out...');
      
      // Stop token auto-refresh
      tokenManager.stopAutoRefresh();
      console.log('🔴 Token auto-refresh stopped');
      
      // Try to logout from backend first (while we still have tokens)
      try {
        await authService.logout();
        console.log('🔴 Backend logout successful');
      } catch (logoutError) {
        console.error('🔴 Backend logout error:', logoutError);
        // Continue with logout even if backend call fails
      }
      
      // Try to sign out from Clerk
      try {
        await signOut();
        console.log('🔴 Clerk signout successful');
      } catch (clerkError) {
        console.error('🔴 Clerk signout error:', clerkError);
        // Continue with logout even if Clerk signout fails
      }
      
      // Use auth context logout method (this handles backend logout and state clearing)
      try {
        console.log('🔴 Calling authLogout...');
        await authLogout();
        console.log('🔴 AuthLogout completed');
      } catch (authError) {
        console.error('🔴 Auth context logout error:', authError);
        // Continue with manual cleanup
      }
      
      // Force clear all auth data
      authService.clearAuthData();
      console.log('🔴 Auth data cleared');
      
      // Trigger storage event to notify other components
      window.dispatchEvent(new Event('storage'));
      console.log('🔴 Storage event dispatched');
      
      showSuccess('Logged out successfully! 👋');
      
      // Force redirect immediately
      console.log('🔴 Redirecting to login...');
      window.location.href = '/login';
      
    } catch (error) {
      console.error('🔴 Logout error:', error);
      showWarning('Logout completed with some errors');
      
      // Force clear auth data and redirect even if there were errors
      authService.clearAuthData();
      tokenManager.stopAutoRefresh();
      
      // Force redirect
      window.location.href = '/login';
    }
  };

  // Cancel logout
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
    showInfo('Logout cancelled');
  };

  // Simple logout for testing
  const simpleLogout = () => {
    console.log('🔴 Simple logout called!');
    
    // Clear all auth data
    authService.clearAuthData();
    tokenManager.stopAutoRefresh();
    
    // Clear any Clerk data
    try {
      signOut();
    } catch (e) {
      console.log('Clerk signout error:', e);
    }
    
    showInfo('Logging out...');
    
    // Force redirect immediately
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  };

  // Handle attendance marking
  const handleMarkAttendance = async () => {
    try {
      // TODO: Implement actual API call
      setAttendanceData(prev => ({
        ...prev,
        todayStatus: 'present'
      }));
      showSuccess('Attendance marked successfully!');
    } catch (error) {
      showError('Failed to mark attendance');
    }
  };

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
    { id: 'attendance', label: 'Attendance', icon: FiClock },
    { id: 'leave', label: 'Leave Management', icon: FiCalendar },
    { id: 'salary', label: 'Salary Slips', icon: FiDollarSign },
    { id: 'stock', label: 'Stock Activity', icon: FiPackage },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'profile', label: 'My Profile', icon: FiUser }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <FiActivity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FreshNest</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-3 py-3 mb-1 text-left rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-emerald-50 text-emerald-700 border-r-2 border-emerald-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FiLogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 px-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <FiMenu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {sidebarItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Test logout button */}
              <button
                onClick={simpleLogout}
                className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
              >
                Test Logout
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                <p className="text-xs text-gray-500">{user?.employeeId}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <FiUser className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 pr-[20rem]">
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.fullName}! 👋</h2>
                    <p className="text-emerald-100 mb-4">
                      {currentTime.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} • {currentTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <FiUser className="w-4 h-4" />
                        <span>Employee ID: {user?.employeeId}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiMapPin className="w-4 h-4" />
                        <span>Role: {user?.role}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-white/20 rounded-lg p-4">
                      <p className="text-sm text-emerald-100">Today's Status</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {attendanceData.todayStatus === 'present' ? (
                          <>
                            <FiCheck className="w-5 h-5 text-green-300" />
                            <span className="font-semibold">Present</span>
                          </>
                        ) : (
                          <>
                            <FiClock className="w-5 h-5 text-yellow-300" />
                            <span className="font-semibold">Not Marked</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <button
                  onClick={handleMarkAttendance}
                  disabled={attendanceData.todayStatus === 'present'}
                  className={`p-6 rounded-xl border-2 border-dashed transition-all ${
                    attendanceData.todayStatus === 'present'
                      ? 'border-green-200 bg-green-50 text-green-600 cursor-not-allowed'
                      : 'border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50 text-emerald-600'
                  }`}
                >
                  <FiClock className="w-8 h-8 mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">
                    {attendanceData.todayStatus === 'present' ? 'Attendance Marked' : 'Mark Attendance'}
                  </h3>
                  <p className="text-sm opacity-75">
                    {attendanceData.todayStatus === 'present' ? 'You are present today' : 'Click to mark present'}
                  </p>
                </button>

                <button
                  onClick={() => setActiveSection('leave')}
                  className="p-6 rounded-xl border-2 border-dashed border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-blue-600 transition-all"
                >
                  <FiCalendar className="w-8 h-8 mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Apply Leave</h3>
                  <p className="text-sm opacity-75">Request time off</p>
                </button>

                <button
                  onClick={() => setActiveSection('salary')}
                  className="p-6 rounded-xl border-2 border-dashed border-purple-200 bg-white hover:border-purple-400 hover:bg-purple-50 text-purple-600 transition-all"
                >
                  <FiDollarSign className="w-8 h-8 mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Salary Slips</h3>
                  <p className="text-sm opacity-75">View pay details</p>
                </button>

                <button
                  onClick={() => setActiveSection('profile')}
                  className="p-6 rounded-xl border-2 border-dashed border-orange-200 bg-white hover:border-orange-400 hover:bg-orange-50 text-orange-600 transition-all"
                >
                  <FiUser className="w-8 h-8 mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">My Profile</h3>
                  <p className="text-sm opacity-75">Update details</p>
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">This Month</h3>
                    <FiBarChart2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Present</span>
                      <span className="font-semibold text-green-600">{attendanceData.thisMonth.present} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Absent</span>
                      <span className="font-semibold text-red-600">{attendanceData.thisMonth.absent} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Late</span>
                      <span className="font-semibold text-yellow-600">{attendanceData.thisMonth.late} days</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Leave Balance</h3>
                    <FiCalendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Casual</span>
                      <span className="font-semibold text-blue-600">{leaveData.balance.casual} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sick</span>
                      <span className="font-semibold text-green-600">{leaveData.balance.sick} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Annual</span>
                      <span className="font-semibold text-purple-600">{leaveData.balance.annual} days</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Current Salary</h3>
                    <FiDollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  {salaryData.currentMonth && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Net Pay</span>
                        <span className="font-bold text-green-600">₹{salaryData.currentMonth.net.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Month</span>
                        <span className="font-semibold text-gray-900">{salaryData.currentMonth.month}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Recent Attendance</h3>
                    <button
                      onClick={() => setActiveSection('attendance')}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {attendanceData.recentHistory.slice(0, 5).map((record, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            record.status === 'present' ? 'bg-green-500' :
                            record.status === 'late' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className="text-gray-900">{record.date}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium capitalize text-gray-900">{record.status}</p>
                          <p className="text-xs text-gray-500">{record.checkIn} - {record.checkOut}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Announcements & Notifications</h3>
                    <button
                      onClick={() => setActiveSection('notifications')}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {/* Show announcements first */}
                    {announcements.slice(0, 2).map((announcement) => (
                      <div key={`announcement-${announcement.id}`} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50">
                        <div className={`w-3 h-3 rounded-full mt-1.5 ${
                          announcement.priority === 'urgent' ? 'bg-red-500' :
                          announcement.priority === 'high' ? 'bg-orange-500' :
                          announcement.priority === 'normal' ? 'bg-blue-500' : 'bg-gray-500'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900">{announcement.title}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              announcement.type === 'success' ? 'bg-green-100 text-green-700' :
                              announcement.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                              announcement.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {announcement.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 mb-1">{announcement.content.substring(0, 100)}...</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>By {announcement.createdBy}</span>
                            <span>•</span>
                            <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                            {announcement.expiresAt && (
                              <>
                                <span>•</span>
                                <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show regular notifications */}
                    {notifications.slice(0, announcements.length > 0 ? 2 : 4).map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'success' ? 'bg-green-500' :
                          notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    ))}
                    
                    {announcements.length === 0 && notifications.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No announcements or notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other sections will be added here */}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiLogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Confirm Logout
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to logout? You'll need to sign in again to access your dashboard.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
