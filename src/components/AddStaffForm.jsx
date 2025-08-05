import React, { useState } from 'react';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiCalendar, 
  FiDollarSign, 
  FiClock, 
  FiUserCheck, 
  FiKey, 
  FiX,
  FiSave,
  FiLoader,
  FiEye,
  FiEyeOff,
  FiShield,
  FiCheck,
  FiAlertCircle
} from 'react-icons/fi';
import { useToastContext } from '../contexts/ToastContext';
import staffService from '../services/staffService';

const AddStaffForm = ({ isOpen, onClose, onSuccess }) => {
  const { success, error } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    username: '',
    role: 'staff',
    address: '',
    joiningDate: new Date().toISOString().split('T')[0],
    salary: '',
    shift: '',
    password: '',
    permissions: []
  });

  const [errors, setErrors] = useState({});

  const shifts = [
    { value: 'morning', label: 'Morning (6 AM - 2 PM)', icon: '🌅' },
    { value: 'evening', label: 'Evening (2 PM - 10 PM)', icon: '🌆' },
    { value: 'night', label: 'Night (10 PM - 6 AM)', icon: '🌙' },
    { value: 'flexible', label: 'Flexible Hours', icon: '⏰' }
  ];

  const roles = [
    { value: 'staff', label: 'General Staff', description: 'Basic staff member with standard permissions' },
    { value: 'salesperson', label: 'Salesperson', description: 'Sales team member with customer interaction focus' },
    { value: 'manager', label: 'Manager', description: 'Team manager with additional responsibilities' },
    { value: 'supervisor', label: 'Supervisor', description: 'Supervisor with oversight duties' }
  ];

  const availablePermissions = [
    { id: 'inventory_read', label: 'View Inventory', category: 'Inventory' },
    { id: 'inventory_write', label: 'Manage Inventory', category: 'Inventory' },
    { id: 'orders_read', label: 'View Orders', category: 'Orders' },
    { id: 'orders_write', label: 'Manage Orders', category: 'Orders' },
    { id: 'customers_read', label: 'View Customers', category: 'Customers' },
    { id: 'customers_write', label: 'Manage Customers', category: 'Customers' },
    { id: 'reports_read', label: 'View Reports', category: 'Reports' },
    { id: 'settings_read', label: 'View Settings', category: 'Settings' }
  ];

  // Generate random password
  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.salary && (isNaN(formData.salary) || parseFloat(formData.salary) < 0)) {
      newErrors.salary = 'Please enter a valid salary amount';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const staffData = {
        ...formData,
        salary: formData.salary ? parseFloat(formData.salary) : null
      };

      console.log('Sending staff data:', staffData);
      const data = await staffService.createStaff(staffData);

      success(`Staff member ${formData.fullName} created successfully! 🎉`);
      
      // Show credentials in a separate success message
      setTimeout(() => {
        success(`Login credentials sent to ${formData.email}. Employee ID: ${data.credentials.employeeId}`, {
          duration: 8000
        });
      }, 1000);

      onSuccess && onSuccess(data.staff);
      handleClose();

    } catch (err) {
      console.error('Create staff error:', err);
      
      // Handle specific error cases
      if (err.message.includes('Token expired') || err.message.includes('Authentication required')) {
        error('Your session has expired. Please refresh the page and try again.', {
          duration: 8000,
          action: {
            label: 'Refresh Page',
            onClick: () => window.location.reload()
          }
        });
      } else if (err.message.includes('already exists')) {
        error(err.message);
      } else {
        error(err.message || 'Failed to create staff member');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle permission changes
  const handlePermissionChange = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  // Handle profile picture change
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        error('Profile picture must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        error('Please select a valid image file');
        return;
      }

      setProfilePicture(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove profile picture
  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview(null);
  };

  // Handle close
  const handleClose = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      username: '',
      role: 'staff',
      address: '',
      joiningDate: new Date().toISOString().split('T')[0],
      salary: '',
      shift: '',
      password: '',
      permissions: []
    });
    setErrors({});
    setProfilePicture(null);
    setProfilePicturePreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FiUserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add New Staff Member</h2>
              <p className="text-emerald-100 text-sm">Create a new staff account with role and permissions</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiUser className="w-5 h-5 mr-2 text-emerald-600" />
                  Personal Information
                </h3>
                
                {/* Full Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter full name"
                    />
                    <FiUser className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                    <FiMail className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter phone number"
                    />
                    <FiPhone className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Username */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Leave empty to use email"
                    />
                    <FiUser className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">If not provided, email will be used as username</p>
                </div>

                {/* Role */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {roles.find(r => r.value === formData.role)?.description}
                  </p>
                </div>

                {/* Profile Picture */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture (Optional)
                  </label>
                  <div className="flex items-center space-x-4">
                    {profilePicturePreview ? (
                      <div className="relative">
                        <img
                          src={profilePicturePreview}
                          alt="Profile preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={removeProfilePicture}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <FiUser className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                        id="profilePicture"
                      />
                      <label
                        htmlFor="profilePicture"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <FiUser className="w-4 h-4 mr-2" />
                        Choose Photo
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG only</p>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address (Optional)
                  </label>
                  <div className="relative">
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                      placeholder="Enter address"
                    />
                    <FiMapPin className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiClock className="w-5 h-5 mr-2 text-emerald-600" />
                  Work Information
                </h3>

                {/* Joining Date */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Joining Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="joiningDate"
                      value={formData.joiningDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                    <FiCalendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Salary */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Salary (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        errors.salary ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter monthly salary"
                    />
                    <FiDollarSign className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                  {errors.salary && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {errors.salary}
                    </p>
                  )}
                </div>

                {/* Shift */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Shift
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {shifts.map((shift) => (
                      <label key={shift.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="shift"
                          value={shift.value}
                          checked={formData.shift === shift.value}
                          onChange={handleChange}
                          className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                        />
                        <span className="ml-3 text-2xl">{shift.icon}</span>
                        <span className="ml-2 text-sm font-medium text-gray-900">{shift.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Password */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-20 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter password"
                    />
                    <div className="absolute right-3 top-3.5 flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="w-5 h-5 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                      <FiKey className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Generate Random Password
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiShield className="w-5 h-5 mr-2 text-emerald-600" />
              Permissions (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {availablePermissions.map((permission) => (
                <label key={permission.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission.id)}
                    onChange={() => handlePermissionChange(permission.id)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{permission.label}</div>
                    <div className="text-xs text-gray-500">{permission.category}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <FiSave className="w-5 h-5" />
                  <span>Create Staff Member</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaffForm;