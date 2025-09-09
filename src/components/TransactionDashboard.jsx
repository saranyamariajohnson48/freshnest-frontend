import React, { useState, useEffect } from 'react';
import { 
  FiCreditCard, 
  FiUser, 
  FiCalendar, 
  FiDollarSign, 
  FiSearch, 
  FiFilter, 
  FiDownload, 
  FiEye, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiPackage,
  FiSmartphone,
  FiWifi,
  FiDollarSign as FiWallet,
  FiClock as FiPayLater
} from 'react-icons/fi';
import transactionService from '../services/transactionService';
import authService from '../services/authService';
import { useToastContext } from '../contexts/ToastContext';

const TransactionDashboard = () => {
  const { success, error } = useToastContext();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    paymentMethod: '',
    customerEmail: ''
  });
  const [pagination, setPagination] = useState({});
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const isAdmin = authService.isAdmin();
      const response = isAdmin
        ? await transactionService.getAllTransactions(filters)
        : await transactionService.getMyTransactions(filters);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Only admins should see global stats
      if (authService.isAdmin()) {
        const response = await transactionService.getTransactionStats();
        setStats(response.data);
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    loadTransactions();
    loadStats();
  }, [filters]);

  // Listen for refresh events from payment success
  useEffect(() => {
    const handleRefresh = () => {
      loadTransactions();
      loadStats();
    };

    window.addEventListener('refreshTransactions', handleRefresh);
    return () => window.removeEventListener('refreshTransactions', handleRefresh);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleViewDetails = async (transactionId) => {
    try {
      const isAdmin = authService.isAdmin();
      const response = isAdmin
        ? await transactionService.getTransactionById(transactionId)
        : await transactionService.getMyTransactionById(transactionId);
      setSelectedTransaction(response.data);
      setShowDetails(true);
    } catch (err) {
      console.error('Failed to load transaction details:', err);
      error('Failed to load transaction details');
    }
  };

  const handleExport = async () => {
    try {
      await transactionService.exportTransactions('csv', filters);
      success('Transactions exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      error('Export failed');
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cards': return <FiCreditCard className="w-4 h-4" />;
      case 'upi': return <FiSmartphone className="w-4 h-4" />;
      case 'upi-qr': return <FiSmartphone className="w-4 h-4" />;
      case 'netbanking': return <FiWifi className="w-4 h-4" />;
      case 'wallet': return <FiWallet className="w-4 h-4" />;
      case 'paylater': return <FiPayLater className="w-4 h-4" />;
      default: return <FiCreditCard className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FiCheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <FiXCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <FiClock className="w-4 h-4 text-yellow-600" />;
      case 'refunded': return <FiRefreshCw className="w-4 h-4 text-blue-600" />;
      default: return <FiClock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatsCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
      {trend && (
        <div className={`flex items-center mt-3 text-sm ${
          trend.type === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend.type === 'up' ? (
            <FiTrendingUp className="w-4 h-4 mr-1" />
          ) : (
            <FiTrendingDown className="w-4 h-4 mr-1" />
          )}
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Transactions</h2>
          <p className="text-gray-600 mt-1">Manage and view all payment transactions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => { loadTransactions(); loadStats(); }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Transactions"
            value={stats.overview.totalTransactions}
            subtitle="All time"
            icon={FiCreditCard}
            color="blue"
          />
          <StatsCard
            title="Total Amount"
            value={`₹${stats.overview.totalAmount?.toLocaleString('en-IN') || '0'}`}
            subtitle="Revenue generated"
            icon={FiDollarSign}
            color="green"
          />
          <StatsCard
            title="Completed"
            value={stats.overview.completedTransactions}
            subtitle={`₹${stats.overview.completedAmount?.toLocaleString('en-IN') || '0'}`}
            icon={FiCheckCircle}
            color="green"
          />
          <StatsCard
            title="Success Rate"
            value={`${stats.overview.totalTransactions > 0 ? 
              Math.round((stats.overview.completedTransactions / stats.overview.totalTransactions) * 100) : 0}%`}
            subtitle="Payment success"
            icon={FiTrendingUp}
            color="emerald"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Methods</option>
              <option value="cards">Cards</option>
              <option value="upi">UPI</option>
              <option value="upi-qr">UPI QR</option>
              <option value="netbanking">Net Banking</option>
              <option value="wallet">Wallet</option>
              <option value="paylater">Pay Later</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
            <input
              type="email"
              value={filters.customerEmail}
              onChange={(e) => handleFilterChange('customerEmail', e.target.value)}
              placeholder="Search by email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span>Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.razorpay_payment_id}
                      </div>
                      <div className="text-xs text-gray-500">
                        Order: {transaction.razorpay_order_id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FiUser className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.customer.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {transaction.customer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {transaction.order.items.length} item(s)
                      </div>
                      <div className="text-xs text-gray-500">
                        {transaction.order.items.slice(0, 2).map(item => item.name).join(', ')}
                        {transaction.order.items.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">
                        ₹{transaction.order.totalAmount.toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getPaymentMethodIcon(transaction.paymentMethod)}
                        <span className="text-sm text-gray-600 capitalize">
                          {transaction.paymentMethod.replace('-', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(transaction.status)}
                        <span className={`text-sm font-medium capitalize ${
                          transaction.status === 'completed' ? 'text-green-600' :
                          transaction.status === 'failed' ? 'text-red-600' :
                          transaction.status === 'pending' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(transaction.paymentDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(transaction._id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <FiEye className="w-4 h-4" />
                        <span className="text-sm">View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showDetails && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDetails(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Transaction Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiXCircle className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Payment Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment ID:</span>
                      <span className="font-medium">{selectedTransaction.razorpay_payment_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium">{selectedTransaction.razorpay_order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-lg">₹{selectedTransaction.order.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${
                        selectedTransaction.status === 'completed' ? 'text-green-600' :
                        selectedTransaction.status === 'failed' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {selectedTransaction.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium capitalize">
                        {selectedTransaction.paymentMethod.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{formatDate(selectedTransaction.paymentDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Customer Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedTransaction.customer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedTransaction.customer.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedTransaction.customer.phone}</span>
                    </div>
                    {selectedTransaction.customer.address && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address:</span>
                        <span className="font-medium">{selectedTransaction.customer.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Order Items</h4>
                <div className="space-y-3">
                  {selectedTransaction.order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₹{item.price.toLocaleString('en-IN')}</div>
                        <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDashboard;
