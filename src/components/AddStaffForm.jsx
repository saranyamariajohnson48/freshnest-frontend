import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiUser, FiMail, FiPhone, FiMapPin, FiTag, FiFileText, FiClock, FiDollarSign, FiKey } from 'react-icons/fi';
import staffService from '../services/staffService';
import { useToastContext } from '../contexts/ToastContext';

const AddStaffForm = ({ isOpen, onClose, onStaffCreated, editingStaff = null }) => {
  const { success, error } = useToastContext();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    position: 'Staff',
    department: 'General',
    shift: 'morning',
    salary: '',
    hireDate: '',
    status: 'active',
    password: '',
    confirmPassword: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Position options with responsibilities and example tasks
  const roleOptions = [
    {
      label: 'Warehouse Manager / Supervisor',
      responsibilities: 'Oversees warehouse operations',
      exampleTasks: ['Approve requests', 'Monitor stock', 'Assign tasks']
    },
    {
      label: 'Inventory Staff',
      responsibilities: 'Manage stock in/out, maintain inventory accuracy',
      exampleTasks: ['Stock entry', 'Stock counting', 'Report low stock']
    },
    {
      label: 'Pickers / Packers',
      responsibilities: 'Pick items from shelves, pack orders',
      exampleTasks: ['Pick items for shipment', 'Prepare orders']
    },
    {
      label: 'Delivery/Logistics Staff',
      responsibilities: 'Handle shipments and deliveries',
      exampleTasks: ['Dispatch orders', 'Track shipments']
    },
    {
      label: 'Quality Control Staff',
      responsibilities: 'Inspect goods for quality',
      exampleTasks: ['Inspect incoming/outgoing stock', 'Report defects']
    },
    {
      label: 'Supplier Coordinator (Optional)',
      responsibilities: 'Coordinate with suppliers and manage purchase orders',
      exampleTasks: ['Place orders', 'Follow up with suppliers', 'Maintain supplier records']
    },
    {
      label: 'Staff',
      responsibilities: 'General support across warehouse operations',
      exampleTasks: ['Assist in daily operations', 'Follow supervisor instructions']
    }
  ];

  // Department options
  const departments = [
    'General',
    'Sales',
    'Inventory',
    'Customer Service',
    'Administration',
    'Security',
    'Maintenance',
    'IT Support',
    'Human Resources',
    'Finance'
  ];

  // Shift options - matching backend enum values
  const shifts = [
    { value: 'morning', label: 'Morning (6:00 AM - 2:00 PM)' },
    { value: 'evening', label: 'Evening (2:00 PM - 10:00 PM)' },
    { value: 'night', label: 'Night (10:00 PM - 6:00 AM)' },
    { value: 'flexible', label: 'Flexible Hours' }
  ];

  // Load staff data when editing
  useEffect(() => {
    if (editingStaff) {
      // Split fullName into firstName and lastName if it exists
      const nameParts = editingStaff.fullName ? editingStaff.fullName.split(' ') : ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || ''; // Handle multiple last names
      
      setFormData({
        firstName: firstName,
        lastName: lastName,
        email: editingStaff.email || '',
        phone: editingStaff.phone || '',
        address: editingStaff.address || '',
        position: editingStaff.position || 'Staff',
        department: editingStaff.department || 'General',
        shift: editingStaff.shift || 'morning',
        salary: editingStaff.salary || '',
        hireDate: editingStaff.joiningDate ? editingStaff.joiningDate.split('T')[0] : (editingStaff.hireDate ? editingStaff.hireDate.split('T')[0] : ''),
        status: editingStaff.status || 'active',
        password: '', // Don't pre-fill password when editing
        confirmPassword: '',
        emergencyContact: editingStaff.emergencyContact || '',
        emergencyPhone: editingStaff.emergencyPhone || '',
        notes: editingStaff.notes || ''
      });
    } else {
      // Reset form for new staff
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        position: 'Staff',
        department: 'General',
        shift: 'morning',
        salary: '',
        hireDate: new Date().toISOString().split('T')[0], // Default to today
        status: 'active',
        password: '',
        confirmPassword: '',
        emergencyContact: '',
        emergencyPhone: '',
        notes: ''
      });
    }
    setErrors({});
  }, [editingStaff, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.hireDate) {
      newErrors.hireDate = 'Hire date is required';
    }

    if (formData.salary && isNaN(formData.salary)) {
      newErrors.salary = 'Salary must be a valid number';
    }

    // Password validation (optional for new staff, required if provided)
    if (formData.password || formData.confirmPassword) {
      if (!formData.password) {
        newErrors.password = 'Password is required when confirm password is provided';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters long';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API - combine firstName and lastName into fullName
      const staffData = {
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: 'staff' // Default role
      };

      // Add optional fields only if they have values
      if (formData.address && formData.address.trim()) {
        staffData.address = formData.address.trim();
      }
      
      if (formData.hireDate) {
        staffData.joiningDate = formData.hireDate;
      }
      
      if (formData.salary && formData.salary.trim()) {
        staffData.salary = parseFloat(formData.salary);
      }
      
      if (formData.shift) {
        staffData.shift = formData.shift;
      }
      
      if (formData.password && formData.password.trim()) {
        staffData.password = formData.password.trim();
      }
      
      // Include position now that backend supports it
      if (formData.position) {
        staffData.position = formData.position;
      }

      // Note: department, emergencyContact, emergencyPhone, notes 
      // are not in the backend User model, so we're excluding them for now

      let result;
      if (editingStaff) {
        result = await staffService.updateStaff(editingStaff.id, staffData);
        success('Staff member updated successfully!');
      } else {
        result = await staffService.createStaff(staffData);
        success('Staff member added successfully!');
      }

      // Notify parent component
      if (onStaffCreated) {
        onStaffCreated(result);
      }

      // Close form
      onClose();
    } catch (err) {
      console.error('Error saving staff:', err);
      error(err.message || 'An error occurred while saving the staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h2>
            <p className="text-gray-600 mt-1">
              {editingStaff ? 'Update staff member information' : 'Enter staff details to add them to your team'}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiUser className="w-5 h-5 mr-2 text-emerald-600" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                  disabled={loading}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                  disabled={loading}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiMail className="w-5 h-5 mr-2 text-emerald-600" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                  disabled={loading}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiMapPin className="w-4 h-4 inline mr-1" />
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter complete address"
                disabled={loading}
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>
          </div>

          {/* Job Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiTag className="w-5 h-5 mr-2 text-emerald-600" />
              Job Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  disabled={loading}
                >
                  {roleOptions.map(role => (
                    <option key={role.label} value={role.label}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  disabled={loading}
                >
                  {departments.map(department => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  disabled={loading}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiClock className="w-4 h-4 inline mr-1" />
                  Shift
                </label>
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  disabled={loading}
                >
                  {shifts.map(shift => (
                    <option key={shift.value} value={shift.value}>
                      {shift.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiDollarSign className="w-4 h-4 inline mr-1" />
                  Salary (Optional)
                </label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    errors.salary ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter monthly salary"
                  disabled={loading}
                  min="0"
                  step="0.01"
                />
                {errors.salary && (
                  <p className="text-red-500 text-sm mt-1">{errors.salary}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hire Date *
              </label>
              <input
                type="date"
                name="hireDate"
                value={formData.hireDate}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                  errors.hireDate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.hireDate && (
                <p className="text-red-500 text-sm mt-1">{errors.hireDate}</p>
              )}
            </div>
          </div>

          {/* Password Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiKey className="w-5 h-5 mr-2 text-emerald-600" />
              Login Credentials
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 mb-2">
                <strong>Password Policy:</strong> If no password is provided, a secure random password will be generated and sent to the staff member via email.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password (Optional)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter password (min 6 characters)"
                  disabled={loading}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm password"
                  disabled={loading}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiPhone className="w-5 h-5 mr-2 text-emerald-600" />
              Emergency Contact
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Enter emergency contact name"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Enter emergency contact phone"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiFileText className="w-5 h-5 mr-2 text-emerald-600" />
              Additional Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                placeholder="Enter any additional notes about the staff member..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingStaff ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4 mr-2" />
                  {editingStaff ? 'Update Staff' : 'Add Staff'}
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