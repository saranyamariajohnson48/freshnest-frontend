import React, { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiSearch, 
  FiFilter, 
  FiMoreVertical, 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiDollarSign, 
  FiClock, 
  FiUserCheck, 
  FiUserX, 
  FiRefreshCw,
  FiDownload,
  FiKey,
  FiLoader,
  FiGrid
} from 'react-icons/fi';
import { useToastContext } from '../contexts/ToastContext';
import staffService from '../services/staffService';

const StaffList = ({ onAddStaff, refreshTrigger }) => {
  const { success, error } = useToastContext();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    inactiveStaff: 0,
    recentJoinings: 0
  });

  const itemsPerPage = 10;

  // Fetch staff data
  const fetchStaff = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(shiftFilter !== 'all' && { shift: shiftFilter })
      };

      const data = await staffService.getAllStaff(params);
      setStaff(data.staff);
      setTotalPages(data.pagination.pages);

    } catch (err) {
      console.error('Fetch staff error:', err);
      error('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff statistics
  const fetchStats = async () => {
    try {
      const data = await staffService.getStaffStats();
      setStats(data);
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  // Delete/Deactivate staff
  const handleDeleteStaff = async (staffId, staffName, permanent = false) => {
    if (!confirm(`Are you sure you want to ${permanent ? 'permanently delete' : 'deactivate'} ${staffName}?`)) {
      return;
    }

    try {
      await staffService.deleteStaff(staffId, permanent);
      success(`Staff member ${permanent ? 'permanently deleted' : 'deactivated'} successfully`);
      fetchStaff();
      fetchStats();
    } catch (err) {
      console.error('Delete staff error:', err);
      error('Failed to delete staff member');
    }
  };

  // Reset staff password
  const handleResetPassword = async (staffId, staffName) => {
    if (!confirm(`Reset password for ${staffName}? A new password will be generated and displayed.`)) {
      return;
    }

    try {
      const data = await staffService.resetStaffPassword(staffId);
      
      // Create a professional modal to display the new password
      const passwordModal = document.createElement('div');
      passwordModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      passwordModal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
          <div class="text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2H7v-2H5v-2l3.257-3.257A6 6 0 0115 7z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-4">Password Reset Successful</h3>
            <p class="text-gray-600 mb-4">New password for <strong>${staffName}</strong>:</p>
            <div class="bg-gray-100 rounded-lg p-4 mb-4">
              <code class="text-lg font-mono text-gray-900 select-all">${data.newPassword}</code>
            </div>
            <p class="text-sm text-orange-600 mb-6">⚠️ Please share this password securely with the staff member and ask them to change it on first login.</p>
            <div class="flex space-x-3">
              <button onclick="
                navigator.clipboard.writeText('${data.newPassword}').then(() => {
                  this.textContent = 'Copied!';
                  setTimeout(() => this.textContent = 'Copy Password', 2000);
                });
              " class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Copy Password
              </button>
              <button onclick="this.closest('.fixed').remove()" class="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(passwordModal);
      
      // Remove modal when clicking outside
      passwordModal.addEventListener('click', (e) => {
        if (e.target === passwordModal) {
          passwordModal.remove();
        }
      });

      success('Password reset successfully');
    } catch (err) {
      console.error('Reset password error:', err);
      error('Failed to reset password');
    }
  };

  // Generate QR code for staff
  const handleGenerateQR = async (staffId, staffName) => {
    try {
      const data = await staffService.generateStaffQR(staffId);
      
      // Create a modal to display QR code
      const qrModal = document.createElement('div');
      qrModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      qrModal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
          <div class="text-center">
            <h3 class="text-xl font-bold text-gray-900 mb-4">QR Code for ${staffName}</h3>
            <div class="mb-4">
              <img src="${data.qrCode}" alt="Staff QR Code" class="mx-auto border rounded-lg" />
            </div>
            <p class="text-sm text-gray-600 mb-4">Employee ID: ${data.staff.employeeId}</p>
            <div class="flex space-x-3">
              <button onclick="
                const link = document.createElement('a');
                link.download = 'staff_qr_${data.staff.employeeId}.png';
                link.href = '${data.qrCode}';
                link.click();
              " class="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                Download QR
              </button>
              <button onclick="this.closest('.fixed').remove()" class="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(qrModal);
      
      // Remove modal when clicking outside
      qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) {
          qrModal.remove();
        }
      });

      success('QR code generated successfully');
    } catch (err) {
      console.error('Generate QR error:', err);
      error('Failed to generate QR code');
    }
  };

  // Export staff data
  const handleExportData = async () => {
    try {
      const filters = {
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(shiftFilter !== 'all' && { shift: shiftFilter })
      };

      const blob = await staffService.exportStaffData('csv', filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `staff_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      success('Staff data exported successfully');
    } catch (err) {
      console.error('Export data error:', err);
      error('Failed to export staff data');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get shift display
  const getShiftDisplay = (shift) => {
    const shifts = {
      morning: { label: 'Morning', icon: '🌅', color: 'bg-yellow-100 text-yellow-800' },
      evening: { label: 'Evening', icon: '🌆', color: 'bg-orange-100 text-orange-800' },
      night: { label: 'Night', icon: '🌙', color: 'bg-indigo-100 text-indigo-800' },
      flexible: { label: 'Flexible', icon: '⏰', color: 'bg-purple-100 text-purple-800' }
    };
    
    const shiftInfo = shifts[shift] || { label: 'N/A', icon: '❓', color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${shiftInfo.color}`}>
        <span className="mr-1">{shiftInfo.icon}</span>
        {shiftInfo.label}
      </span>
    );
  };

  // Effects
  useEffect(() => {
    fetchStaff();
  }, [currentPage, searchTerm, statusFilter, shiftFilter, refreshTrigger]);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, shiftFilter]);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-50">
              <FiUsers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Staff</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
          <p className="text-sm text-blue-600 font-medium">All members</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-green-50">
              <FiUserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Staff</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.activeStaff}</p>
          <p className="text-sm text-green-600 font-medium">Currently active</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-red-50">
              <FiUserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Staff</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.inactiveStaff}</p>
          <p className="text-sm text-red-600 font-medium">Deactivated</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-50">
              <FiCalendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Joinings</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.recentJoinings}</p>
          <p className="text-sm text-purple-600 font-medium">Last 30 days</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Staff Members</h2>
            <p className="text-gray-600 text-sm">Manage your team members and their roles</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportData}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <FiDownload className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={() => fetchStaff()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={onAddStaff}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <FiUsers className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Shift Filter */}
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Shifts</option>
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
            <option value="night">Night</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>

        {/* Staff Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-12">
            <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || shiftFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first staff member'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && shiftFilter === 'all' && (
              <button
                onClick={onAddStaff}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Add First Staff Member
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Staff Member</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Position</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Work Info</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-emerald-600 font-medium text-sm">
                              {member.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{member.fullName}</div>
                            {member.position && (
                              <div className="text-xs text-emerald-700 font-medium">{member.position}</div>
                            )}
                            <div className="text-sm text-gray-500">ID: {member.employeeId || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="text-sm font-medium text-gray-800">
                          {member.position || '—'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <FiMail className="w-4 h-4 mr-2" />
                            {member.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <FiPhone className="w-4 h-4 mr-2" />
                            {member.phone}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          <div>{getShiftDisplay(member.shift)}</div>
                          <div className="text-sm text-gray-600">
                            <FiCalendar className="w-4 h-4 inline mr-1" />
                            Joined: {formatDate(member.joiningDate)}
                          </div>
                          {member.salary && (
                            <div className="text-sm text-gray-600">
                              <FiDollarSign className="w-4 h-4 inline mr-1" />
                              {formatCurrency(member.salary)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.status === 'active' ? (
                            <>
                              <FiUserCheck className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <FiUserX className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleGenerateQR(member._id, member.fullName)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Generate QR Code"
                          >
                            <FiGrid className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(member._id, member.fullName)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Reset Password"
                          >
                            <FiKey className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(member._id, member.fullName, false)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Deactivate"
                          >
                            <FiUserX className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(member._id, member.fullName, true)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Permanently"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StaffList;