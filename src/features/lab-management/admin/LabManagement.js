import React, { useState, useEffect, useCallback } from 'react';
import { labsApi } from '../../../api';
import LabForm from './LabForm';
import LabStatusForm from './LabStatusForm';

/**
 * Lab Management Component - Admin Only
 *
 * Full CRUD operations for lab management
 *
 * Related User Stories:
 * - US-09: Admin - Manage labs and equipment (High Priority, Approved)
 *
 * Related Use Cases:
 * - UC-10: Manage Labs (Admin) - High Priority
 * - UC-40: Lab Status Update (Admin) - Medium Priority
 */
const LabManagement = ({ onViewLab }) => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0 });
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [confirmDeleteLab, setConfirmDeleteLab] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };

  // Load lab data
  const loadLabs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [labList, totalCount, activeCount] = await Promise.all([
        labsApi.getLabs(),
        labsApi.getLabCount(),
        labsApi.getActiveLabCount()
      ]);

      setLabs(Array.isArray(labList) ? labList : []);
      setStats({ total: totalCount, active: activeCount });
    } catch (err) {
      console.error('Error loading labs:', err);
      setError(err.message || 'Unable to load lab list');
      setLabs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLabs();
  }, [loadLabs]);

  // Handle create lab
  const handleCreate = async (labData) => {
    try {
      setActionLoading(true);
      await labsApi.createLab(labData);
      showToast('Lab created successfully!', 'success');
      setShowCreateModal(false);
      await loadLabs();
    } catch (err) {
      showToast(err.message || 'Unable to create lab', 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update lab
  const handleUpdate = async (labData) => {
    try {
      setActionLoading(true);
      await labsApi.updateLab(selectedLab.id, labData);
      showToast('Lab updated successfully!', 'success');
      setShowEditModal(false);
      setSelectedLab(null);
      await loadLabs();
    } catch (err) {
      showToast(err.message || 'Unable to update lab', 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update status
  const handleUpdateStatus = async (statusData) => {
    try {
      setActionLoading(true);
      await labsApi.updateLabStatus(selectedLab.id, statusData.status);
      showToast('Status updated successfully!', 'success');
      setShowStatusModal(false);
      setSelectedLab(null);
      await loadLabs();
    } catch (err) {
      showToast(err.message || 'Unable to update status', 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete lab
  const handleDelete = async (labId) => {
    try {
      setActionLoading(true);
      await labsApi.deleteLab(labId, true);
      showToast('Lab deleted successfully!', 'success');
      setConfirmDeleteLab(null);
      await loadLabs();
    } catch (err) {
      showToast(err.message || 'Unable to delete lab', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle view lab details - call parent callback
  const handleView = (lab) => {
    if (onViewLab) {
      onViewLab(lab.id);
    }
  };

  // Filter labs
  const filteredLabs = labs.filter(lab => {
    const matchesStatus = statusFilter === 'All' || lab.status === statusFilter;
    const matchesLocation = locationFilter === 'All' || lab.location === locationFilter;
    const matchesSearch = !searchTerm || 
      lab.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lab.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lab.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesLocation && matchesSearch;
  });

  // Get unique locations
  const locations = ['All', ...new Set(labs.map(lab => lab.location).filter(Boolean))];

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusStyles = {
      Active: 'status-badge status-available',
      Inactive: 'status-badge status-maintenance'
    };
    return <span className={statusStyles[status] || 'status-badge'}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="admin-content">
        <div className="room-list-container">
          <div className="loading">
            <div className="loading-spinner"></div>
            Loading labs...
          </div>
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
          <button className="btn-primary" onClick={loadLabs}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lab-list-container">
      {/* Toast Notification */}
      {toast && (
        <div 
          className="table-notification"
          style={{
            backgroundColor: toast.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: toast.type === 'success' ? '#065f46' : '#dc2626',
            border: toast.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {toast.type === 'success' ? (
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            ) : (
              <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            )}
          </svg>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="lab-list-header">
        <h2>Lab Management</h2>
        <button 
          className="btn-new-booking"
          onClick={() => setShowCreateModal(true)}
          disabled={actionLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
          </svg>
          Create New Lab
        </button>
      </div>

      <div className="lab-list-stats">
        <span>Total labs: {stats.total}</span>
        <span>Active: {stats.active} | Inactive: {stats.total - stats.active}</span>
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        <div className="filter-row">
          <div className="search-bar">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search by name, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18"></path>
                  <path d="M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>

          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="filter-select"
            >
              {locations.map(loc => (
                <option key={loc} value={loc}>
                  {loc === 'All' ? 'All Locations' : loc}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setLocationFilter('All');
              }}
              disabled={actionLoading}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="lab-table-container">
        <table className="lab-table">
          <thead>
            <tr>
              <th>ID</th>
              <th className="col-name">Name</th>
              <th className="col-location">Location</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Room</th>
              <th>Members</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLabs.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  No labs found
                </td>
              </tr>
            ) : (
              filteredLabs.map((lab) => (
                <tr key={lab.id}>
                  <td>
                    {lab.id?.substring(0, 8)}...
                  </td>
                  <td className="col-name">
                    <div>
                      <strong>{lab.name}</strong>
                      {lab.description && (
                        <div className="text-muted small">{lab.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="col-location">{lab.location || 'N/A'}</td>
                  <td>{lab.capacity}</td>
                  <td>
                    <StatusBadge status={lab.status} />
                  </td>
                  <td>{lab.room?.name || 'N/A'}</td>
                  <td>{lab.memberCount || 0}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-icon btn-icon-outline color-yellow"
                        onClick={() => handleView(lab)}
                        disabled={actionLoading}
                        aria-label="View details"
                        title="View"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button
                        className="btn btn-sm btn-icon btn-icon-outline color-blue"
                        onClick={() => {
                          setSelectedLab(lab);
                          setShowEditModal(true);
                        }}
                        disabled={actionLoading}
                        aria-label="Edit lab"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"/>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                        </svg>
                      </button>
                      <button
                        className="btn btn-sm btn-icon btn-icon-outline color-purple"
                        onClick={() => {
                          setSelectedLab(lab);
                          setShowStatusModal(true);
                        }}
                        disabled={actionLoading}
                        aria-label="Update status"
                        title="Update Status"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 12l2 2 4-4"/>
                          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                        </svg>
                      </button>
                      <button
                        className="btn btn-sm btn-icon btn-icon-outline color-red"
                        onClick={() => setConfirmDeleteLab(lab)}
                        disabled={actionLoading}
                        aria-label="Delete lab"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                          <path d="M10 11v6"/>
                          <path d="M14 11v6"/>
                          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      <div className="table-footer">
        <p className="text-muted">
          Showing {filteredLabs.length} / {labs.length} labs
        </p>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <LabForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={actionLoading}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedLab && (
        <LabForm
          lab={selectedLab}
          onSubmit={handleUpdate}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedLab(null);
          }}
          loading={actionLoading}
        />
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedLab && (
        <LabStatusForm
          lab={selectedLab}
          onSubmit={handleUpdateStatus}
          onCancel={() => {
            setShowStatusModal(false);
            setSelectedLab(null);
          }}
          loading={actionLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteLab && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete lab <strong>{confirmDeleteLab.name}</strong>?</p>
              <p className="text-muted small">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteLab(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(confirmDeleteLab.id)}
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

export default LabManagement;

