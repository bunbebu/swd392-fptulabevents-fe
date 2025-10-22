import React, { useState, useEffect, useCallback } from 'react';
import { equipmentApi } from '../../../api';
import EquipmentForm from './EquipmentForm';
import EquipmentStatusForm from './EquipmentStatusForm';

/**
 * Equipment Management Component - Admin Only
 * 
 * Full CRUD operations for equipment management
 * 
 * Related User Stories:
 * - US-09: Admin - Manage labs and equipment (High Priority, Approved)
 * 
 * Related Use Cases:
 * - UC-10: Manage Equipment (Admin) - High Priority
 * - UC-40: Equipment Status Update (Admin) - Medium Priority
 */
const EquipmentManagement = () => {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, available: 0 });
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [confirmDeleteEquipment, setConfirmDeleteEquipment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };

  // Load equipment data
  const loadEquipments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [equipmentList, totalCount, availableCount] = await Promise.all([
        equipmentApi.getEquipments(),
        equipmentApi.getEquipmentCount(),
        equipmentApi.getAvailableEquipmentCount()
      ]);

      setEquipments(Array.isArray(equipmentList) ? equipmentList : []);
      setStats({ total: totalCount, available: availableCount });
    } catch (err) {
      console.error('Error loading equipments:', err);
      setError(err.message || 'Unable to load equipment list');
      setEquipments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEquipments();
  }, [loadEquipments]);

  // Handle create equipment
  const handleCreate = async (equipmentData) => {
    try {
      setActionLoading(true);
      await equipmentApi.createEquipment(equipmentData);
      showToast('Equipment created successfully!', 'success');
      setShowCreateModal(false);
      await loadEquipments();
    } catch (err) {
      showToast(err.message || 'Unable to create equipment', 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update equipment
  const handleUpdate = async (equipmentData) => {
    try {
      setActionLoading(true);
      await equipmentApi.updateEquipment(selectedEquipment.id, equipmentData);
      showToast('Equipment updated successfully!', 'success');
      setShowEditModal(false);
      setSelectedEquipment(null);
      await loadEquipments();
    } catch (err) {
      showToast(err.message || 'Unable to update equipment', 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update status
  const handleUpdateStatus = async (statusData) => {
    try {
      setActionLoading(true);
      await equipmentApi.updateEquipmentStatus(
        selectedEquipment.id,
        statusData.status,
        statusData.notes || ''
      );
      showToast('Status updated successfully!', 'success');
      setShowStatusModal(false);
      setSelectedEquipment(null);
      await loadEquipments();
    } catch (err) {
      showToast(err.message || 'Unable to update status', 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete equipment
  const handleDelete = async (equipmentId) => {
    try {
      setActionLoading(true);
      await equipmentApi.deleteEquipment(equipmentId);
      showToast('Equipment deleted successfully!', 'success');
      setConfirmDeleteEquipment(null);
      await loadEquipments();
    } catch (err) {
      showToast(err.message || 'Unable to delete equipment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle view equipment details
  const handleView = async (equipment) => {
    setSelectedEquipment(equipment);
    setShowViewModal(true);
  };

  // Filter equipments
  const filteredEquipments = equipments.filter(eq => {
    const matchesStatus = statusFilter === 'All' || eq.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || eq.category === categoryFilter;
    const matchesSearch = !searchTerm || 
      eq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Get unique categories
  const categories = ['All', ...new Set(equipments.map(eq => eq.category).filter(Boolean))];

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusStyles = {
      Available: 'status-badge status-available',
      Maintenance: 'status-badge status-maintenance',
      Broken: 'status-badge status-broken'
    };
    return <span className={statusStyles[status] || 'status-badge'}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="admin-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading equipment list...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-content">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={loadEquipments}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="content-header">
        <div>
          <h2>Equipment Management</h2>
          <p>Manage lab equipment - Create, edit, delete equipment</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
          </svg>
          Add Equipment
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Total Equipment</h3>
              <p className="stat-number">{stats.total}</p>
            </div>
            <div className="stat-icon blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Available Equipment</h3>
              <p className="stat-number">{stats.available}</p>
            </div>
            <div className="stat-icon green">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Under Maintenance/Broken</h3>
              <p className="stat-number">{stats.total - stats.available}</p>
            </div>
            <div className="stat-icon orange">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="table-controls">
        <div className="search-box">
          <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <input
            type="text"
            placeholder="Search by name, equipment code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Status</option>
            <option value="Available">Available</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Broken">Broken</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="table-container">
        {filteredEquipments.length === 0 ? (
          <div className="empty-state">
            <p>No equipment found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Equipment Code</th>
                <th>Equipment Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Available</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipments.map((equipment) => (
                <tr key={equipment.id}>
                  <td>
                    <span className="equipment-code">{equipment.code}</span>
                  </td>
                  <td>
                    <div>
                      <strong>{equipment.name}</strong>
                      {equipment.description && (
                        <div className="text-muted small">{equipment.description}</div>
                      )}
                    </div>
                  </td>
                  <td>{equipment.category}</td>
                  <td className="text-center">{equipment.quantity}</td>
                  <td className="text-center">
                    <span className={equipment.quantityAvailable > 0 ? 'text-success' : 'text-danger'}>
                      <strong>{equipment.quantityAvailable}</strong>
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={equipment.status} />
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => handleView(equipment)}
                        title="View Details"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => {
                          setSelectedEquipment(equipment);
                          setShowEditModal(true);
                        }}
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => {
                          setSelectedEquipment(equipment);
                          setShowStatusModal(true);
                        }}
                        title="Update Status"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => setConfirmDeleteEquipment(equipment)}
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Results count */}
      <div className="table-footer">
        <p className="text-muted">
          Showing {filteredEquipments.length} / {equipments.length} equipment
        </p>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <EquipmentForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={actionLoading}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedEquipment && (
        <EquipmentForm
          equipment={selectedEquipment}
          onSubmit={handleUpdate}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedEquipment(null);
          }}
          loading={actionLoading}
        />
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedEquipment && (
        <EquipmentStatusForm
          equipment={selectedEquipment}
          onSubmit={handleUpdateStatus}
          onCancel={() => {
            setShowStatusModal(false);
            setSelectedEquipment(null);
          }}
          loading={actionLoading}
        />
      )}

      {/* View Modal */}
      {showViewModal && selectedEquipment && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Equipment Details</h3>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Equipment Code:</label>
                  <span>{selectedEquipment.code}</span>
                </div>
                <div className="detail-item">
                  <label>Equipment Name:</label>
                  <span>{selectedEquipment.name}</span>
                </div>
                <div className="detail-item">
                  <label>Category:</label>
                  <span>{selectedEquipment.category}</span>
                </div>
                <div className="detail-item">
                  <label>Quantity:</label>
                  <span>{selectedEquipment.quantity}</span>
                </div>
                <div className="detail-item">
                  <label>Available:</label>
                  <span>{selectedEquipment.quantityAvailable}</span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <StatusBadge status={selectedEquipment.status} />
                </div>
                {selectedEquipment.description && (
                  <div className="detail-item full-width">
                    <label>Description:</label>
                    <span>{selectedEquipment.description}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteEquipment && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteEquipment(null)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="modal-close" onClick={() => setConfirmDeleteEquipment(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete equipment <strong>{confirmDeleteEquipment.name}</strong>?</p>
              <p className="text-muted small">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setConfirmDeleteEquipment(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={() => handleDelete(confirmDeleteEquipment.id)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentManagement;

