import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';
import { useToastContext } from '../contexts/ToastContext';
import {
  FaPlus,
  FaFileInvoice,
  FaBoxOpen,
  FaShoppingCart,
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
} from 'react-icons/fa';

const today = new Date().toLocaleDateString();

const RetailerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const [notifications] = useState([
    { id: 1, message: 'Product XYZ is running low on stock.' },
    { id: 2, message: 'Invoice INV#2314 was downloaded successfully.' },
    { id: 3, message: 'Admin updated product pricing.' },
  ]);

  const salesToday = 2560;
  const salesSummary = {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    sales: [500, 700, 400, 600, 800, 300, 260],
    topProducts: [
      { name: 'Product A', sold: 30 },
      { name: 'Product B', sold: 22 },
      { name: 'Product C', sold: 15 },
    ],
    avgSales: 512,
    totalMonthly: 12000,
  };

  const inventory = [
    { name: 'Product A', stock: 12, price: 120 },
    { name: 'Product B', stock: 5, price: 80 },
    { name: 'Product C', stock: 30, price: 60 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-teal-50 p-6">
      {/* Top Header Section */}
      <div className="relative bg-white rounded-xl shadow-md p-6 mb-8 overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-full bg-cover bg-center opacity-10" style={{ backgroundImage: 'url(https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940)' }}></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Welcome back, {user?.fullName || 'Retailer'}</h2>
            <p className="text-gray-500">{today}</p>
          </div>
          <div className="mt-4 md:mt-0 text-lg font-medium">
            Today’s Sales: <span className="text-green-600 font-bold">₹{salesToday}</span>
          </div>
        </div>
      </div>

      {/* Tab-like Quick Actions */}
      <div className="flex flex-wrap gap-4 mb-8">
        <ActionButton icon={<FaPlus size={20} />} label="Add Sale" color="bg-teal-500" />
        <ActionButton icon={<FaFileInvoice size={20} />} label="Generate Invoice" color="bg-emerald-500" />
        <ActionButton icon={<FaBoxOpen size={20} />} label="Sales Records" color="bg-yellow-400" />
        <ActionButton icon={<FaShoppingCart size={20} />} label="Inventory" color="bg-indigo-500" />
      </div>

      {/* Card Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Sales Entry Form */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Record New Sale</h3>
          <form className="space-y-4">
            <select className="w-full border rounded-md p-2">
              <option>Select a product</option>
              {inventory.map((item, idx) => (
                <option key={idx}>{item.name}</option>
              ))}
            </select>
            <input type="number" placeholder="Quantity" className="w-full border rounded-md p-2" />
            <input type="text" placeholder="Discount (optional)" className="w-full border rounded-md p-2" />
            <textarea placeholder="Customer note (optional)" className="w-full border rounded-md p-2" />
            <button type="submit" className="w-full bg-teal-500 text-white py-2 rounded-md hover:bg-teal-600">
              Save Sale
            </button>
          </form>
        </div>

        {/* Sales Summary */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">My Performance</h3>
          <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400 rounded mb-4">
            [Sales Chart Placeholder]
          </div>
          <div className="flex flex-wrap gap-4">
            <Stat label="Monthly Sales" value={`₹${salesSummary.totalMonthly}`} />
            <Stat label="Avg. Sale" value={`₹${salesSummary.avgSales}`} />
            <div>
              <div className="text-sm text-gray-500 mb-1">Top Products</div>
              <ul className="text-sm text-gray-700">
                {salesSummary.topProducts.map((p, idx) => (
                  <li key={idx}>{p.name}: <span className="font-medium">{p.sold}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice and Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Invoice Generator</h3>
          <p className="text-gray-500">Select a recent sale to view/download its invoice.</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Inventory Overview</h3>
          <input className="w-full border rounded-md p-2 mb-3" placeholder="Search products..." />
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-600 border-b">
                <th className="py-2">Product</th>
                <th className="py-2">Stock</th>
                <th className="py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, idx) => (
                <tr key={idx} className="border-t text-sm">
                  <td className="py-2">{item.name}</td>
                  <td className="py-2">{item.stock}</td>
                  <td className="py-2">₹{item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notifications and Profile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <FaBell className="mr-2 text-gray-500" /> Notifications
          </h3>
          <ul className="space-y-2">
            {notifications.map((note) => (
              <li key={note.id} className="text-gray-700">{note.message}</li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center">
          <FaUserCircle size={48} className="text-gray-400 mb-2" />
          <div className="text-lg font-semibold">{user?.fullName || 'Retailer'}</div>
          <div className="text-gray-500">{user?.email || 'retailer@email.com'}</div>
          <button
            onClick={handleLogout}
            className="mt-4 flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ icon, label, color }) => (
  <button
    className={`${color} text-white px-4 py-3 rounded-xl shadow-sm flex flex-col items-center hover:scale-105 transition`}
  >
    {icon}
    <span className="mt-2 text-sm font-medium">{label}</span>
  </button>
);

const Stat = ({ label, value }) => (
  <div>
    <div className="text-sm text-gray-500">{label}</div>
    <div className="font-semibold">{value}</div>
  </div>
);

export default RetailerDashboard;
