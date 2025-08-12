import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiSearch, 
  FiFilter, 
  FiMoreVertical, 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiPhone, 
  FiMail, 
  FiMapPin,
  FiTruck,
  FiDollarSign,
  FiCalendar,
  FiStar,
  FiToggleLeft,
  FiToggleRight,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';
import supplierService from '../services/supplierService';
import { useToastContext } from '../contexts/ToastContext';
import AddSupplierForm from './AddSupplierForm';

const SupplierList = ({ onAddSupplier, refreshTrigger }) => {
  const { success, error } = useToastContext();
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);

  // Categories for filter
  const categories = [
    'all',
    'Vegetables',
    'Fruits',
    'Dairy',
    'Bakery',
    'Meat & Poultry',
    'Seafood',
    'Grains & Cereals',
    'Beverages',
    'Spices & Herbs',
    'Other'
  ];

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await supplierService.getAllSuppliers();
      
      // Transform backend user data to supplier format
      const supplierData = response.users ? response.users.map(user => 
        supplierService.transformUserToSupplier(user)
      ) : [];
      
      setSuppliers(supplierData);
    } catch (err) {
      console.error('Error loading suppliers:', err);
      error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [error]);

  const filterSuppliers = useCallback(async () => {
    try {
      let filtered = [...suppliers];

      // If there's a search term, use backend search
      if (searchTerm) {
        const filters = {};
        if (selectedCategory !== 'all') filters.category = selectedCategory;
        if (selectedStatus !== 'all') filters.status = selectedStatus;
        
        const response = await supplierService.searchSuppliers(searchTerm, filters);
        filtered = response.users ? response.users.map(user => 
          supplierService.transformUserToSupplier(user)
        ) : [];
      } else {
        // Apply local filters
        if (selectedCategory !== 'all') {
          filtered = filtered.filter(supplier => 
            supplier.category === selectedCategory
          );
        }

        if (selectedStatus !== 'all') {
          filtered = filtered.filter(supplier => 
            supplier.status === selectedStatus
          );
        }
      }

      setFilteredSuppliers(filtered);
    } catch (err) {
      console.error('Error filtering suppliers:', err);
      // Fallback to local filtering on error
      let filtered = [...suppliers];
      
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(supplier => 
          supplier.category === selectedCategory
        );
      }

      if (selectedStatus !== 'all') {
        filtered = filtered.filter(supplier => 
          supplier.status === selectedStatus
        );
      }

      setFilteredSuppliers(filtered);
    }
  }, [suppliers, searchTerm, selectedCategory, selectedStatus]);

  // Load suppliers
  useEffect(() => {
    loadSuppliers();
    
    // Subscribe to supplier changes
    const unsubscribe = supplierService.subscribe(() => {
      loadSuppliers();
    });

    return unsubscribe;
  }, [refreshTrigger, loadSuppliers]);

  // Filter suppliers when search term or filters change
  useEffect(() => {
    filterSuppliers();
  }, [filterSuppliers]);

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowEditForm(true);
    setShowDropdown(null);
  };

  const handleDelete = async (supplier) => {
    if (window.confirm(`Are you sure you want to delete ${supplier.name}?`)) {
      try {
        await supplierService.deleteSupplier(supplier.id || supplier._id);
        success('Supplier deleted successfully');
        loadSuppliers(); // Reload the list
      } catch (err) {
        console.error('Error deleting supplier:', err);
        error('Failed to delete supplier');
      }
    }
    setShowDropdown(null);
  };

  const handleToggleStatus = async (supplier) => {
    try {
      const result = await supplierService.toggleSupplierStatus(supplier.id || supplier._id);
      success(`Supplier ${result.status === 'active' ? 'activated' : 'deactivated'} successfully`);
      loadSuppliers(); // Reload the list
    } catch (err) {
      console.error('Error toggling supplier status:', err);
      error('Failed to update supplier status');
    }
    setShowDropdown(null);
  };

  const handleExport = async () => {
    try {
      await supplierService.exportSuppliers('json');
      success('Suppliers data exported successfully');
    } catch (err) {
      console.error('Error exporting suppliers:', err);
      error('Failed to export suppliers data');
    }
  };

  const handleSupplierCreated = () => {
    setShowEditForm(false);
    setEditingSupplier(null);
    loadSuppliers();
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    if (status === 'active') {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    return `${baseClasses} bg-red-100 text-red-800`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Vegetables': 'bg-green-100 text-green-800',
      'Fruits': 'bg-orange-100 text-orange-800',
      'Dairy': 'bg-blue-100 text-blue-800',
      'Bakery': 'bg-yellow-100 text-yellow-800',
      'Meat & Poultry': 'bg-red-100 text-red-800',
      'Seafood': 'bg-cyan-100 text-cyan-800',
      'Grains & Cereals': 'bg-amber-100 text-amber-800',
      'Beverages': 'bg-purple-100 text-purple-800',
      'Spices & Herbs': 'bg-lime-100 text-lime-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['Other'];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600">Loading suppliers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Supplier Directory</h2>
            <p className="text-gray-600 text-sm">
              {filteredSuppliers.length} of {suppliers.length} suppliers
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={loadSuppliers}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search suppliers by name, contact, email, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
            <FiFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <FiFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Suppliers Grid */}
      {filteredSuppliers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <FiTruck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' 
              ? 'No suppliers found' 
              : 'No suppliers yet'
            }
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Add your first supplier to get started'
            }
          </p>
          {(!searchTerm && selectedCategory === 'all' && selectedStatus === 'all') && (
            <button
              onClick={onAddSupplier}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Add First Supplier
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id || supplier._id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {supplier.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{supplier.contactPerson}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={getStatusBadge(supplier.status)}>
                    {supplier.status}
                  </span>
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(showDropdown === supplier.id ? null : supplier.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiMoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    
                    {showDropdown === supplier.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="w-full flex items-center space-x-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <FiEdit className="w-4 h-4 text-gray-500" />
                          <span>Edit Supplier</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(supplier)}
                          className="w-full flex items-center space-x-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          {supplier.status === 'active' ? (
                            <>
                              <FiToggleLeft className="w-4 h-4 text-gray-500" />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <FiToggleRight className="w-4 h-4 text-gray-500" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(supplier)}
                          className="w-full flex items-center space-x-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-red-600"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(supplier.category)}`}>
                  {supplier.category}
                </span>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FiMail className="w-4 h-4" />
                  <span className="truncate">{supplier.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FiPhone className="w-4 h-4" />
                  <span>{supplier.phone}</span>
                </div>
                <div className="flex items-start space-x-2 text-sm text-gray-600">
                  <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{supplier.address}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 mb-1">
                    <FiTruck className="w-4 h-4" />
                    <span>Orders</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{supplier.totalOrders || 0}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 mb-1">
                    <FiDollarSign className="w-4 h-4" />
                    <span>Spent</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(supplier.totalSpent || 0)}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <FiCalendar className="w-4 h-4" />
                    <span>Last Order:</span>
                  </div>
                  <span className="text-gray-900">{formatDate(supplier.lastOrderDate)}</span>
                </div>
                {supplier.rating > 0 && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <div className="flex items-center space-x-1 text-gray-600">
                      <FiStar className="w-4 h-4" />
                      <span>Rating:</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-900">{supplier.rating.toFixed(1)}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(supplier.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Supplier Form */}
      <AddSupplierForm
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setEditingSupplier(null);
        }}
        onSupplierCreated={handleSupplierCreated}
        editingSupplier={editingSupplier}
      />

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(null)}
        />
      )}
    </div>
  );
};

export default SupplierList;