import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import authService from '../services/authService';
import { useToastContext } from '../contexts/ToastContext';
import tokenManager from '../utils/tokenManager';
import { useAuth } from '../hooks/useAuth';
import announcementService from '../services/announcementService';
import leaveService from '../services/leaveService';
import staffService from '../services/staffService';
import taskService from '../services/taskService';
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
  FiBarChart2,
  FiMessageSquare,
  FiFileText
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
  const RoleMessagesLazy = React.lazy(() => import('./RoleMessages'));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Leave management states
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showLeaveDetails, setShowLeaveDetails] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [leaveForm, setLeaveForm] = useState({
    type: 'sick',
    startDate: '',
    endDate: '',
    reason: '',
    isHalfDay: false
  });
  
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

  // Function to get appropriate padding for different sections
  const getMainPadding = () => {
    switch (activeSection) {
      case 'dashboard':
        return 'p-6 pr-[22rem]'; // Full padding for dashboard with cards
      case 'jobcard':
        return 'p-4 pr-[60rem]'; // Slightly less padding for job card
      case 'tasks':
        return 'p-4 pr-[35rem]'; // Less padding for task management
      case 'leave':
        return 'p-4 pr-[24rem]'; // Less padding for leave management
      case 'messages':
        return 'p-2 pr-[60rem]'; // Minimal padding for messages
      case 'attendance':
        return 'p-4 pr-[73rem]'; // Standard padding for attendance
      case 'salary':
        return 'p-4 pr-[73rem]'; // Standard padding for salary
      case 'profile':
        return 'p-4 pr-[73rem]'; // Standard padding for profile
      case 'notifications':
        return 'p-2 pr-[74rem]'; // Minimal padding for notifications
      default:
        return 'p-6 pr-[22rem]'; // Default padding
    }
  };
  
  const [notifications, setNotifications] = useState([]);
  const [stockActivity, setStockActivity] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Task management states
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [tasksCreatedByMe, setTasksCreatedByMe] = useState([]);
  const [tasksAssignedToMe, setTasksAssignedToMe] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'Medium'
  });

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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
        // Optional inline toast using window.dispatchEvent to notify ToastProvider via custom event if needed
        for (const c of conversations || []) {
          const last = c.lastMessage;
          if (last && String(last.sender) !== String(me?._id || me?.id)) {
            const key = `${c._id}-${last.at}`;
            if (!lastSeen.has(key)) {
              // Basic toast via alert-like event: rely on already mounted ToastProvider hook elsewhere
              // If you prefer, wire useToastContext here and call info()
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
        const supervisorFlag = String(authUser?.position || '').toLowerCase().includes('supervisor');
        setIsSupervisor(supervisorFlag);
        
        // Start token auto-refresh for authenticated user
        tokenManager.startAutoRefresh();
        
        await loadDashboardData(authUser);
        if (supervisorFlag) {
          // Load active staff (non-supervisors) for assignment
          try {
            const list = await taskService.listAssignableStaff();
            setStaffList(list.data || []);
            // Load tasks created by me
            const created = await taskService.listTasks({ mine: 'true' });
            setTasksCreatedByMe(created.data || []);
            // Also load tasks assigned to me
            const assigned = await taskService.listTasks({ mine: 'false' });
            setTasksAssignedToMe(assigned.data || []);
          } catch (e) {
            console.error('Task preload error:', e);
          }
        } else {
          // Regular staff: load tasks assigned to me
          try {
            const assigned = await taskService.listTasks();
            setTasksAssignedToMe(assigned.data || []);
          } catch (e) {}
        }
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

  // Separate function to load leave data
  const loadLeaveData = async () => {
    try {
      const leaveResponse = await leaveService.getMyLeaves();
      if (leaveResponse.success) {
        const { leaves, leaveBalance } = leaveResponse.data;
        
        // Separate pending and recent leaves
        const pending = leaves.filter(leave => leave.status === 'pending');
        const recent = leaves.filter(leave => leave.status !== 'pending');
        
        setLeaveData({
          balance: leaveBalance,
          pending,
          recent
        });
      }
    } catch (error) {
      console.error('Error loading leave data:', error);
      // Fallback to default data if API fails
      setLeaveData({
        balance: { casual: 12, sick: 10, annual: 15 },
        pending: [],
        recent: []
      });
    }
  };

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
      await loadLeaveData();

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
      window.location.replace('/freshnest-frontend/login');
      
    } catch (error) {
      console.error('🔴 Logout error:', error);
      showWarning('Logout completed with some errors');
      
      // Force clear auth data and redirect even if there were errors
      authService.clearAuthData();
      tokenManager.stopAutoRefresh();
      
      // Force redirect
      window.location.replace('/freshnest-frontend/login');
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
      window.location.replace('/freshnest-frontend/login');
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

  // Leave management functions
  const handleApplyLeave = () => {
    setShowLeaveForm(true);
    setLeaveForm({
      type: 'sick',
      startDate: '',
      endDate: '',
      reason: '',
      isHalfDay: false
    });
  };

  const handleLeaveFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
      showError('Please fill in all required fields');
      return;
    }

    // Validate dates
    const startDate = new Date(leaveForm.startDate);
    const endDate = new Date(leaveForm.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      showError('Start date cannot be in the past');
      return;
    }

    if (endDate < startDate) {
      showError('End date cannot be before start date');
      return;
    }

    // Check for overlapping leaves
    const allLeaves = [...leaveData.pending, ...leaveData.recent];
    if (leaveService.checkDateOverlap(leaveForm.startDate, leaveForm.endDate, allLeaves)) {
      showError('You already have a leave application for overlapping dates');
      return;
    }

    try {
      const response = await leaveService.applyLeave({
        type: leaveForm.type,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason.trim(),
        isHalfDay: leaveForm.isHalfDay
      });

      if (response.success) {
        // Add the new leave to pending list
        setLeaveData(prev => ({
          ...prev,
          pending: [response.data, ...prev.pending]
        }));

        setShowLeaveForm(false);
        showSuccess('Leave application submitted successfully!');
        
        // Reload leave data to get updated balance
        loadLeaveData();
      }
    } catch (error) {
      showError(error.message || 'Failed to submit leave application');
    }
  };

  const handleLeaveFormChange = (field, value) => {
    setLeaveForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleViewLeaveDetails = (leave) => {
    setSelectedLeave(leave);
    setShowLeaveDetails(true);
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateInRange = (date, startDate, endDate) => {
    const checkDate = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return checkDate >= start && checkDate <= end;
  };

  const getLeaveStatusForDate = (date) => {
    const dateStr = formatDate(date);
    const allLeaves = [...leaveData.pending, ...leaveData.recent];
    
    for (const leave of allLeaves) {
      if (isDateInRange(date, leave.startDate, leave.endDate)) {
        return {
          status: leave.status,
          type: leave.type,
          leave: leave
        };
      }
    }
    return null;
  };

  const navigateCalendar = (direction) => {
    setCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const getLeaveTypeLabel = (type) => {
    const labels = {
      sick: 'Sick Leave',
      casual: 'Casual Leave',
      annual: 'Annual Leave'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
    { id: 'attendance', label: 'Attendance', icon: FiClock },
    { id: 'leave', label: 'Leave Management', icon: FiCalendar },
    { id: 'jobcard', label: 'Job Card', icon: FiFileText },
    { id: 'salary', label: 'Salary Slips', icon: FiDollarSign },
    { id: 'stock', label: 'Stock Activity', icon: FiPackage },
    { id: 'messages', label: 'Messages', icon: FiMessageSquare, badge: unreadCount ? String(unreadCount) : null },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'profile', label: 'My Profile', icon: FiUser }
  ];

  if (isSupervisor) {
    sidebarItems.splice(3, 0, { id: 'tasks', label: 'Task Management', icon: FiTarget });
  }

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
              <button
                onClick={() => setActiveSection('messages')}
                className="relative p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                title="Messages"
              >
                <FiMessageSquare className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">
                    {unreadCount}
                  </span>
                )}
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
        <main className={`${getMainPadding()}`}>
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
                      <div className="flex items-center space-x-2">
                        <FiAward className="w-4 h-4" />
                        <span>Position: {user?.position || 'Staff'}</span>
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
                <button
                  onClick={() => setActiveSection('jobcard')}
                  className="p-6 rounded-xl border-2 border-dashed border-teal-200 bg-white hover:border-teal-400 hover:bg-teal-50 text-teal-600 transition-all"
                >
                  <FiFileText className="w-8 h-8 mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Job Card</h3>
                  <p className="text-sm opacity-75">View assigned tasks</p>
                </button>
                {isSupervisor && (
                  <button
                    onClick={() => setActiveSection('tasks')}
                    className="p-6 rounded-xl border-2 border-dashed border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50 text-emerald-600 transition-all"
                  >
                    <FiTarget className="w-8 h-8 mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">Assign Tasks</h3>
                    <p className="text-sm opacity-75">Supervisor only</p>
                  </button>
                )}
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

          {/* Job Card - tasks assigned to me */}
          {activeSection === 'jobcard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Job Card</h2>
                  <p className="text-gray-600">Tasks assigned to you</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="space-y-3">
                  {tasksAssignedToMe.length === 0 && (
                    <p className="text-sm text-gray-500">No tasks assigned to you.</p>
                  )}
                  {tasksAssignedToMe.map((t) => (
                    <div key={t._id} className="p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{t.title}</p>
                          <p className="text-xs text-gray-500">From: {t.assignedBy?.fullName} • Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 ${t.priority === 'High' ? 'bg-red-100 text-red-700' : t.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>Priority: {t.priority || 'Medium'}</span>
                        </div>
                        <select
                          value={t.status}
                          onChange={async (e) => {
                            try {
                              const updated = await taskService.updateStatus(t._id, e.target.value);
                              setTasksAssignedToMe(prev => prev.map(x => x._id === t._id ? updated.data : x));
                              setTasksCreatedByMe(prev => prev.map(x => x._id === t._id ? updated.data : x));
                            } catch (err) {}
                          }}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option>Pending</option>
                          <option>In Progress</option>
                          <option>Completed</option>
                        </select>
                      </div>
                      {t.description && (
                        <p className="text-sm text-gray-700 mt-2">{t.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Task Management (Supervisor only) */}
          {activeSection === 'tasks' && isSupervisor && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
                  <p className="text-gray-600">Assign tasks to staff and track progress</p>
                </div>
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <FiSend className="w-4 h-4" />
                  <span>Assign Task</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Tasks I Assigned</h3>
                  <div className="space-y-3">
                    {tasksCreatedByMe.length === 0 && (
                      <p className="text-sm text-gray-500">No tasks assigned yet.</p>
                    )}
                    {tasksCreatedByMe.map((t) => (
                      <div key={t._id} className="p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{t.title}</p>
                            <p className="text-xs text-gray-500">To: {t.assignedTo?.fullName} • Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</p>
                            <div className="mt-1 space-x-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.priority === 'High' ? 'bg-red-100 text-red-700' : t.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>Priority: {t.priority || 'Medium'}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'Completed' ? 'bg-green-100 text-green-700' : t.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>Status: {t.status}</span>
                            </div>
                          </div>
                          <div />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Tasks Assigned To Me</h3>
                  <div className="space-y-3">
                    {tasksAssignedToMe.length === 0 && (
                      <p className="text-sm text-gray-500">No tasks assigned to you.</p>
                    )}
                    {tasksAssignedToMe.map((t) => (
                      <div key={t._id} className="p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{t.title}</p>
                            <p className="text-xs text-gray-500">From: {t.assignedBy?.fullName} • Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 ${t.priority === 'High' ? 'bg-red-100 text-red-700' : t.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>Priority: {t.priority || 'Medium'}</span>
                          </div>
                          <select
                            value={t.status}
                            onChange={async (e) => {
                              try {
                                const updated = await taskService.updateStatus(t._id, e.target.value);
                                setTasksAssignedToMe(prev => prev.map(x => x._id === t._id ? updated.data : x));
                                // also reflect in created list if present
                                setTasksCreatedByMe(prev => prev.map(x => x._id === t._id ? updated.data : x));
                              } catch (err) {}
                            }}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option>Pending</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leave Management Section */}
          {activeSection === 'leave' && (
            <div className="space-y-6">
              {/* Leave Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
                  <p className="text-gray-600">Apply for leave and track your applications</p>
                </div>
                <button
                  onClick={handleApplyLeave}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <FiCalendar className="w-4 h-4" />
                  <span>Apply Leave</span>
                </button>
              </div>

              {/* Leave Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Casual Leave</h3>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FiCoffee className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">{leaveData.balance.casual}</div>
                  <p className="text-sm text-gray-600">days remaining</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Sick Leave</h3>
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FiAlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-red-600 mb-2">{leaveData.balance.sick}</div>
                  <p className="text-sm text-gray-600">days remaining</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Annual Leave</h3>
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FiSun className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">{leaveData.balance.annual}</div>
                  <p className="text-sm text-gray-600">days remaining</p>
                </div>
              </div>

              {/* Calendar and Leave History */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-gray-900">Leave Calendar</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigateCalendar(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <FiChevronRight className="w-4 h-4 rotate-180" />
                      </button>
                      <span className="font-medium text-gray-900 min-w-[120px] text-center">
                        {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => navigateCalendar(1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <FiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for days before month starts */}
                    {Array.from({ length: getFirstDayOfMonth(calendarDate) }, (_, i) => (
                      <div key={`empty-${i}`} className="p-2 h-10"></div>
                    ))}
                    
                    {/* Calendar days */}
                    {Array.from({ length: getDaysInMonth(calendarDate) }, (_, i) => {
                      const day = i + 1;
                      const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
                      const leaveStatus = getLeaveStatusForDate(date);
                      const isToday = formatDate(date) === formatDate(new Date());
                      
                      return (
                        <div
                          key={day}
                          className={`p-2 h-10 flex items-center justify-center text-sm rounded-lg cursor-pointer transition-colors ${
                            isToday ? 'bg-emerald-100 text-emerald-700 font-semibold' :
                            leaveStatus ? 
                              leaveStatus.status === 'approved' ? 'bg-green-100 text-green-700' :
                              leaveStatus.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            : 'hover:bg-gray-100'
                          }`}
                          onClick={() => leaveStatus && handleViewLeaveDetails(leaveStatus.leave)}
                        >
                          {day}
                          {leaveStatus && (
                            <div className={`w-2 h-2 rounded-full ml-1 ${
                              leaveStatus.status === 'approved' ? 'bg-green-500' :
                              leaveStatus.status === 'pending' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Calendar Legend */}
                  <div className="flex items-center justify-center space-x-4 mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Pending</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Approved</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Rejected</span>
                    </div>
                  </div>
                </div>

                {/* Leave Applications */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-6">Recent Applications</h3>
                  
                  <div className="space-y-4">
                    {/* Pending Applications */}
                    {leaveData.pending.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Pending</h4>
                        {leaveData.pending.map((leave) => (
                          <div
                            key={leave._id}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleViewLeaveDetails(leave)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{leaveService.getLeaveTypeLabel(leave.type)}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${leaveService.getStatusColor(leave.status)}`}>
                                {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              {leaveService.formatDateRange(leave.startDate, leave.endDate)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Applied on {new Date(leave.appliedOn || leave.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recent Applications */}
                    {leaveData.recent.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent</h4>
                        {leaveData.recent.slice(0, 3).map((leave) => (
                          <div
                            key={leave._id}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleViewLeaveDetails(leave)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{leaveService.getLeaveTypeLabel(leave.type)}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${leaveService.getStatusColor(leave.status)}`}>
                                {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              {leaveService.formatDateRange(leave.startDate, leave.endDate)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Applied on {new Date(leave.appliedOn || leave.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {leaveData.pending.length === 0 && leaveData.recent.length === 0 && (
                      <div className="text-center py-8">
                        <FiCalendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No leave applications yet</p>
                        <button
                          onClick={handleApplyLeave}
                          className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Apply for your first leave
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Messages Section */}
          {activeSection === 'messages' && (
            <div className="p-4">
              <React.Suspense fallback={<div className="p-6">Loading messages...</div>}>
                <RoleMessagesLazy />
              </React.Suspense>
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

      {/* Leave Application Form Modal */}
      {showLeaveForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Apply Leave</h3>
                <button
                  onClick={() => setShowLeaveForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleLeaveFormSubmit} className="space-y-4">
                {/* Leave Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Leave Type
                  </label>
                  <select
                    value={leaveForm.type}
                    onChange={(e) => handleLeaveFormChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="annual">Annual Leave</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => handleLeaveFormChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => handleLeaveFormChange('endDate', e.target.value)}
                    min={leaveForm.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason For Leave
                  </label>
                  <textarea
                    value={leaveForm.reason}
                    onChange={(e) => handleLeaveFormChange('reason', e.target.value)}
                    placeholder="Please provide a reason for your leave application..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    required
                  />
                </div>

                {/* Half Day Option */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="halfDay"
                    checked={leaveForm.isHalfDay}
                    onChange={(e) => handleLeaveFormChange('isHalfDay', e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="halfDay" className="text-sm font-medium text-gray-700">
                    Is Half Day Leave?
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowLeaveForm(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Task Modal (Supervisor only) */}
      {showTaskForm && isSupervisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Assign Task</h3>
                <button
                  onClick={() => setShowTaskForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!taskForm.title.trim() || !taskForm.assignedTo) return;
                  try {
                    const created = await taskService.createTask(taskForm);
                    setTasksCreatedByMe(prev => [created.data, ...prev]);
                    setShowTaskForm(false);
                    setTaskForm({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium' });
                    showSuccess('Task assigned');
                  } catch (err) {
                    showError(err.message || 'Failed to assign task');
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="">Select staff member</option>
                    {staffList.map(s => (
                      <option key={s._id} value={s._id}>{s.fullName} — {s.position || 'Staff'}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTaskForm(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
                  >
                    Assign
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Leave Details Modal */}
      {showLeaveDetails && selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">{leaveService.getLeaveTypeLabel(selectedLeave.type)}</h3>
                <button
                  onClick={() => setShowLeaveDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-center">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${leaveService.getStatusColor(selectedLeave.status)}`}>
                    {selectedLeave.status.charAt(0).toUpperCase() + selectedLeave.status.slice(1)}
                  </span>
                </div>

                {/* Leave Details */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date</span>
                    <span className="font-medium text-gray-900">
                      {new Date(selectedLeave.startDate).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date</span>
                    <span className="font-medium text-gray-900">
                      {new Date(selectedLeave.endDate).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Half Day</span>
                    <span className="font-medium text-gray-900">{selectedLeave.isHalfDay ? 'Yes' : 'No'}</span>
                  </div>

                  <div>
                    <span className="text-gray-600 block mb-2">Reason</span>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-sm">
                      {selectedLeave.reason}
                    </p>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Applied on</span>
                    <span className="font-medium text-gray-900">
                      {new Date(selectedLeave.appliedOn || selectedLeave.createdAt).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  {selectedLeave.status === 'pending' && (
                    <button
                      onClick={async () => {
                        try {
                          const response = await leaveService.cancelLeave(selectedLeave._id);
                          if (response.success) {
                            // Remove from pending list
                            setLeaveData(prev => ({
                              ...prev,
                              pending: prev.pending.filter(leave => leave._id !== selectedLeave._id)
                            }));
                            setShowLeaveDetails(false);
                            showSuccess('Leave application cancelled successfully');
                            loadLeaveData(); // Reload to get updated balance
                          }
                        } catch (error) {
                          showError(error.message || 'Failed to cancel leave application');
                        }
                      }}
                      className="flex-1 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => setShowLeaveDetails(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
