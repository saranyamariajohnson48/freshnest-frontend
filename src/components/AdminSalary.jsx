import React, { useEffect, useMemo, useState } from 'react';
import { FiDollarSign, FiSearch, FiFilter, FiCalendar, FiMinusCircle, FiCheckCircle, FiCreditCard, FiDownload } from 'react-icons/fi';
import staffService from '../services/staffService';
import paymentService from '../services/paymentService';
import RazorpayStyleGateway from './RazorpayStyleGateway';
import invoiceService from '../services/invoiceService';
import PaymentSuccessModal from './PaymentSuccessModal';
import SalaryInvoice from './SalaryInvoice';
import { useToastContext } from '../contexts/ToastContext';

const monthString = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const AdminSalary = () => {
  const { success, error } = useToastContext();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0, limit: 10 });
  const [payModal, setPayModal] = useState({ open: false, staff: null });
  const [month, setMonth] = useState(monthString());
  const [baseSalary, setBaseSalary] = useState('');
  const [deductions, setDeductions] = useState('');
  const [deductionReason, setDeductionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showSalarySuccess, setShowSalarySuccess] = useState(false);
  const [lastSalaryPayment, setLastSalaryPayment] = useState(null);
  const [lastPaidStaff, setLastPaidStaff] = useState(null);
  const [paidAmountAtPayment, setPaidAmountAtPayment] = useState(0);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState('');
  
  // Salary Invoice state
  const [showSalaryInvoice, setShowSalaryInvoice] = useState(false);
  const [salaryInvoiceData, setSalaryInvoiceData] = useState(null);

  // Paid Salary Details panel state
  const [detailsStaff, setDetailsStaff] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [filterMonth, setFilterMonth] = useState(''); // e.g. 2025-09

  const openPaidDetails = async (s) => {
    try {
      setDetailsStaff(s);
      setHistoryLoading(true);
      setHistoryError('');
      const data = await staffService.getSalaryHistory(s._id, { page: 1, limit: 20 });
      setSalaryHistory(data?.payments || []);
    } catch (e) {
      setHistoryError(e.message || 'Failed to load salary history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const generateSalaryInvoice = (staff, payment) => {
    const invoiceData = {
      business: {
        name: 'Freshnest',
        addressLines: ['123 Business Street', 'City, State 12345'],
        email: 'admin@freshnest.com',
        phone: '+1 (555) 123-4567'
      },
      invoice: {
        number: `SAL-${payment._id.slice(-6).toUpperCase()}`,
        date: new Date().toLocaleDateString('en-IN'),
        dueDate: new Date().toLocaleDateString('en-IN')
      },
      staff: {
        fullName: staff.fullName || payment.staffName || 'Staff Member',
        email: staff.email || payment.staffEmail || '',
        employeeId: staff.employeeId || '',
        phone: staff.phone || ''
      },
      salary: {
        month: payment.month,
        baseSalary: Number(payment.baseSalary || 0),
        deductions: Number(payment.deductions || 0),
        deductionReason: payment.deductionReason || '',
        paidAmount: Number(payment.paidAmount || 0)
      },
      payment: {
        paymentId: payment.paymentId || '',
        paymentMethod: payment.paymentMethod || 'direct',
        paidAt: payment.paidAt || payment.createdAt
      },
      admin: {
        name: 'Admin User', // You can get this from auth context
        email: 'admin@freshnest.com'
      }
    };
    
    setSalaryInvoiceData(invoiceData);
    setShowSalaryInvoice(true);
  };

  const downloadSalaryInvoice = () => {
    if (salaryInvoiceData) {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Salary Invoice - ${salaryInvoiceData.staff.fullName}</title>
            <style>
              body { margin: 0; padding: 0; font-family: system-ui, sans-serif; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div id="invoice-root"></div>
            <script>
              // This would need React to be loaded in the print window
              // For now, we'll use a simpler approach
            </script>
          </body>
        </html>
      `);
      
      // For now, just trigger print on current window
      setTimeout(() => {
        window.print();
      }, 100);
    }
  };

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await staffService.getStaffForSalary({ search, status, page, limit });
      setStaff(data.staff || []);
      setPagination(data.pagination || { current: 1, pages: 1, total: 0, limit });
    } catch (e) {
      error(e.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [search, status, page]);

  // Load recent payments for quick visibility
  useEffect(() => {
    const loadRecent = async () => {
      try {
        setRecentLoading(true);
        setRecentError('');
        const data = await staffService.getRecentSalaryPayments({ limit: 10 });
        setRecentPayments(data?.payments || []);
      } catch (e) {
        setRecentError(e.message || 'Failed to load recent salary payments');
      } finally {
        setRecentLoading(false);
      }
    };
    loadRecent();
  }, []);

  const openPay = (s) => {
    setPayModal({ open: true, staff: s });
    setMonth(monthString());
    setBaseSalary(s.salary ? String(s.salary) : '');
    setDeductions('');
    setDeductionReason('');
  };

  const closePay = () => setPayModal({ open: false, staff: null });

  const paidAmount = useMemo(() => {
    const base = parseFloat(baseSalary || '0') || 0;
    const ded = parseFloat(deductions || '0') || 0;
    return Math.max(0, base - ded);
  }, [baseSalary, deductions]);

  const submitPay = async () => {
    try {
      if (!payModal.staff) return;
      if (!month || !baseSalary) {
        return error('Please select month and enter base salary');
      }
      if ((parseFloat(deductions || '0') || 0) > 0 && !deductionReason.trim()) {
        return error('Please provide a reason for the deduction');
      }
      
      // Open Razorpay payment gateway
      setProcessingPayment(true);
    } catch (e) {
      error(e.message || 'Failed to process salary payment');
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      setSubmitting(true);
      // Capture info before closing modal/resetting state
      setPaidAmountAtPayment(paidAmount);
      setLastPaidStaff(payModal.staff);
      
      // Record salary payment after successful payment
      await staffService.paySalary(payModal.staff._id, {
        month,
        baseSalary: parseFloat(baseSalary),
        deductions: parseFloat(deductions || '0') || 0,
        deductionReason: deductionReason.trim(),
        paymentId: paymentData.paymentResponse?.razorpay_payment_id,
        paymentMethod: 'razorpay'
      });
      
      success('Salary payment completed successfully! 🎉');
      setLastSalaryPayment(paymentData);
      setProcessingPayment(false);
      closePay();
      setShowSalarySuccess(true);
      
      // Generate salary invoice for the payment
      const mockPayment = {
        _id: paymentData.paymentResponse?.razorpay_order_id || Date.now().toString(),
        month,
        baseSalary: parseFloat(baseSalary),
        deductions: parseFloat(deductions || '0') || 0,
        deductionReason: deductionReason.trim(),
        paidAmount: paidAmount,
        paymentId: paymentData.paymentResponse?.razorpay_payment_id,
        paymentMethod: 'razorpay',
        paidAt: new Date().toISOString()
      };
      generateSalaryInvoice(payModal.staff, mockPayment);
    } catch (e) {
      error(e.message || 'Failed to record salary payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentError = (error) => {
    error(error.message || 'Payment failed');
    setProcessingPayment(false);
  };

  // Prepare order data for Razorpay payment
  const getSalaryOrderData = () => ({
    items: [{
      id: 'salary-payment',
      name: `Salary Payment - ${payModal.staff?.fullName}`,
      price: paidAmount,
      quantity: 1,
      category: 'salary'
    }],
    customer: {
      id: payModal.staff?._id || 'staff',
      name: payModal.staff?.fullName || 'Staff Member',
      email: payModal.staff?.email || 'staff@company.com',
      phone: payModal.staff?.phone || '9999999999'
    },
    totalAmount: paidAmount
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Salary Management</h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">Pay staff salaries and record deductions with reasons</p>
        </div>
      </div>

      {/* Recent Salary Payments */}
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">Recent Salary Payments</h2>
          <button onClick={async ()=>{ try{ setRecentLoading(true); const d=await staffService.getRecentSalaryPayments({ limit: 10 }); setRecentPayments(d?.payments||[]);} catch(e){ setRecentError(e.message||'Failed'); } finally{ setRecentLoading(false);} }} className="px-3 py-2 text-sm rounded-xl border border-gray-300 hover:bg-gray-50">Refresh</button>
        </div>
        {recentError && (<div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{recentError}</div>)}
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Employee</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Month</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Base</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Deduction</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Net Paid</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Paid On</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : recentPayments.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No recent salary payments</td></tr>
              ) : (
                recentPayments.map(p => (
                  <tr key={p._id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-900 font-medium">{p.staffName || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{p.staffEmail || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{p.month}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700">₹{Number(p.baseSalary||0).toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${Number(p.deductions||0)>0?'text-red-700':'text-gray-900'}`}>₹{Number(p.deductions||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">₹{Number(p.paidAmount||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => generateSalaryInvoice({ fullName: p.staffName, email: p.staffEmail, phone: '' }, p)} className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"><FiDownload className="w-4 h-4 mr-1"/>Invoice</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center flex-1 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl px-4 py-3 focus-within:border-blue-400 transition-colors">
            <FiSearch className="w-5 h-5 text-blue-600 mr-3" />
            <input
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              placeholder="Search by name, email, employee ID..."
              className="flex-1 bg-transparent outline-none text-gray-800 font-medium placeholder-gray-500"
            />
          </div>
          <div className="flex items-center bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl px-4 py-3">
            <FiFilter className="w-5 h-5 text-purple-600 mr-3" />
            <select 
              value={status} 
              onChange={(e) => { setPage(1); setStatus(e.target.value); }} 
              className="bg-transparent text-gray-800 font-semibold outline-none"
            >
              <option value="">All Staff</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-emerald-600 to-emerald-700">
              <tr>
                <th className="text-left text-sm font-bold text-white px-6 py-4">Employee</th>
                <th className="text-left text-sm font-bold text-white px-6 py-4">Email</th>
                <th className="text-left text-sm font-bold text-white px-6 py-4">Employee ID</th>
                <th className="text-left text-sm font-bold text-white px-6 py-4">Salary</th>
                <th className="text-left text-sm font-bold text-white px-6 py-4">Status</th>
                <th className="text-right text-sm font-bold text-white px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                      <span className="font-medium">Loading staff...</span>
                    </div>
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">No staff found</td>
                </tr>
              ) : (
                staff.map((s, index) => (
                  <tr key={s._id} className={`border-t border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 text-base">{s.fullName}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{s.email}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">{s.employeeId || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-bold text-lg">
                        {s.salary ? `₹${s.salary.toLocaleString()}` : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${
                        s.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openPay(s)} 
                        className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <FiDollarSign className="w-4 h-4 mr-2" /> Pay / Deduct
                      </button>
                      <button
                        onClick={() => openPaidDetails(s)}
                        className="ml-2 inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                      >
                        View Paid
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <div className="text-sm text-gray-600">Page {pagination.current} of {pagination.pages}</div>
            <div className="space-x-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50">Prev</button>
              <button disabled={page >= pagination.pages} onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Paid Salary Details Panel */}
      {detailsStaff && (
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Paid Salary Details</h2>
              <p className="text-sm text-gray-500">{detailsStaff.fullName} • {detailsStaff.email}</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-sm"
              />
              <button onClick={() => openPaidDetails(detailsStaff)} className="px-3 py-2 text-sm rounded-xl border border-gray-300 hover:bg-gray-50">Refresh</button>
              <button onClick={() => { setDetailsStaff(null); setSalaryHistory([]); setFilterMonth(''); }} className="px-3 py-2 text-sm rounded-xl border border-gray-300 hover:bg-gray-50">Close</button>
            </div>
          </div>

          {historyError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{historyError}</div>
          )}

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Month</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Base</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Deduction</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Net Paid</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Paid On</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Payment ID</th>
                  <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                ) : (
                  (() => {
                    const filtered = salaryHistory.filter(p => filterMonth ? String(p.month || '').startsWith(filterMonth) : true);
                    if (filtered.length === 0) {
                      return <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No paid records</td></tr>;
                    }
                    return filtered.map(p => (
                      <tr key={p._id} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-gray-900 font-medium">{p.month}</td>
                        <td className="px-4 py-3 text-right">₹{Number(p.baseSalary||0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">₹{Number(p.deductions||0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-700">₹{Number(p.paidAmount||0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{p.paymentId || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => generateSalaryInvoice(detailsStaff, p)} className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"><FiDownload className="w-4 h-4 mr-1"/>Invoice</button>
                        </td>
                      </tr>
                    ));
                  })()
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {payModal.open && payModal.staff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Pay Salary</h3>
                  <p className="text-emerald-100 text-sm mt-1">{payModal.staff.fullName}</p>
                  <p className="text-emerald-200 text-xs">{payModal.staff.email}</p>
                </div>
                <button onClick={closePay} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Month Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Payment Month</label>
                <div className="flex items-center bg-emerald-50 border-2 border-emerald-200 rounded-xl px-4 py-3 focus-within:border-emerald-400 transition-colors">
                  <FiCalendar className="w-5 h-5 text-emerald-600 mr-3" />
                  <input 
                    value={month} 
                    onChange={(e) => setMonth(e.target.value)} 
                    placeholder="2025-01" 
                    className="flex-1 bg-transparent outline-none text-gray-800 font-medium placeholder-gray-400" 
                  />
                </div>
              </div>

              {/* Base Salary */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Base Salary</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-bold">₹</span>
                  <input 
                    value={baseSalary} 
                    onChange={(e) => setBaseSalary(e.target.value)} 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    className="w-full bg-blue-50 border-2 border-blue-200 rounded-xl pl-10 pr-4 py-3 text-gray-800 font-semibold focus:border-blue-400 transition-colors" 
                  />
                </div>
              </div>

              {/* Deduction */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Deduction Amount</label>
                <div className="flex items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-bold">₹</span>
                    <input 
                      value={deductions} 
                      onChange={(e) => setDeductions(e.target.value)} 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      className="w-full bg-orange-50 border-2 border-orange-200 rounded-l-xl pl-10 pr-4 py-3 text-gray-800 font-semibold focus:border-orange-400 transition-colors" 
                    />
                  </div>
                  <div className="px-4 py-3 bg-orange-100 border-2 border-l-0 border-orange-200 rounded-r-xl text-orange-700 text-sm font-medium flex items-center">
                    <FiMinusCircle className="w-4 h-4 mr-1" /> Optional
                  </div>
                </div>
              </div>

              {/* Deduction Reason */}
              {(parseFloat(deductions || '0') || 0) > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Reason for Deduction</label>
                  <textarea 
                    value={deductionReason} 
                    onChange={(e) => setDeductionReason(e.target.value)} 
                    rows={3} 
                    className="w-full bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-gray-800 font-medium focus:border-red-400 transition-colors resize-none" 
                    placeholder="Please provide a clear reason for the salary deduction..."
                  />
                </div>
              )}

              {/* Amount Summary */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-gray-700 font-semibold">Amount to Pay</div>
                  <div className="text-2xl font-bold text-emerald-600">₹{paidAmount.toLocaleString()}</div>
                </div>
                {(parseFloat(deductions || '0') || 0) > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Base: ₹{parseFloat(baseSalary || '0').toLocaleString()} - Deduction: ₹{(parseFloat(deductions || '0') || 0).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <button 
                  onClick={closePay} 
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={submitting} 
                  onClick={submitPay} 
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  <FiCreditCard className="w-5 h-5 mr-2" /> 
                  {submitting ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Style Payment Gateway */}
      <RazorpayStyleGateway
        isOpen={processingPayment}
        onClose={() => setProcessingPayment(false)}
        orderData={getSalaryOrderData()}
        totalAmount={paidAmount}
        customerInfo={{
          name: payModal.staff?.fullName || 'Staff Member',
          email: payModal.staff?.email || 'staff@company.com',
          phone: payModal.staff?.phone || '+91 99999 99999',
          address: 'Company Office'
        }}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />

      {/* Salary Payment Success Modal */}
      <PaymentSuccessModal
        isOpen={showSalarySuccess}
        onClose={() => setShowSalarySuccess(false)}
        orderNumber={lastSalaryPayment?.paymentResponse?.razorpay_order_id?.replace('order_', '')}
        details={{
          date: new Date().toLocaleDateString(),
          method: 'Razorpay',
          total: `₹${paidAmountAtPayment.toFixed(2)}`,
          email: lastPaidStaff?.email || '—',
        }}
        subtitle={`Salary payment for ${lastPaidStaff?.fullName || 'Staff'} — ${month}`}
        onViewInvoice={() => { downloadSalaryInvoice(); setShowSalarySuccess(false); }}
      />

      {/* Salary Invoice Modal */}
      {showSalaryInvoice && salaryInvoiceData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Salary Invoice</h3>
                  <p className="text-emerald-100 text-sm mt-1">{salaryInvoiceData.staff.fullName}</p>
                  <p className="text-emerald-200 text-xs">{salaryInvoiceData.salary.month}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={downloadSalaryInvoice}
                    className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-colors"
                  >
                    <FiDownload className="w-4 h-4 mr-2" />
                    Print / Save PDF
                  </button>
                  <button 
                    onClick={() => { setShowSalaryInvoice(false); setSalaryInvoiceData(null); }} 
                    className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Invoice Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <SalaryInvoice {...salaryInvoiceData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSalary;


