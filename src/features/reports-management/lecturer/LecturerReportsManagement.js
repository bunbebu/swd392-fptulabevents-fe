import React, { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../../../api';

/**
 * Reports Management for Lecturers
 *
 * Features:
 * - Create issue reports (equipment/room problems)
 * - View own reports
 * - Update/Delete reports
 * - Track report status
 */
const LecturerReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Equipment', // Equipment, Room, Lab, Other
    priority: 'Medium', // Low, Medium, High
    location: ''
  });

  // Stats
  const [reportCount, setReportCount] = useState(0);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      0: { label: 'Pending', class: 'pending' },
      1: { label: 'In Progress', class: 'active' },
      2: { label: 'Resolved', class: 'completed' },
      3: { label: 'Rejected', class: 'rejected' }
    };
    return statusMap[status] || { label: 'Unknown', class: 'unknown' };
  };

  const getPriorityBadge = (priority) => {
    const map = {
      'Low': 'status-completed',
      'Medium': 'status-pending',
      'High': 'status-rejected'
    };
    return map[priority] || 'status-pending';
  };

  // Load reports
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let reportsData;
      let countData;

      try {
        reportsData = await reportsApi.getUserReports();
      } catch (err) {
        console.error('Error fetching reports:', err);
        // If it's auth error, show specific message
        if (err.status === 401 || err.status === 403) {
          setError('Authentication required. Please log in again.');
          setReports([]);
          setLoading(false);
          return;
        }
        // Otherwise continue with empty array
        reportsData = [];
      }

      try {
        countData = await reportsApi.getUserReportsCount();
      } catch (err) {
        console.error('Error fetching report count:', err);
        countData = { count: 0 };
      }

      let reportsList = [];
      if (Array.isArray(reportsData)) {
        reportsList = reportsData;
      } else if (reportsData?.data && Array.isArray(reportsData.data)) {
        reportsList = reportsData.data;
      } else if (reportsData?.Data && Array.isArray(reportsData.Data)) {
        reportsList = reportsData.Data;
      }

      setReports(reportsList);
      setReportCount(countData?.count || countData?.Count || reportsList.length);

    } catch (err) {
      console.error('Error loading reports:', err);
      setError(err.message || 'Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Create report
  const handleCreateReport = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      await reportsApi.createReport({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        location: formData.location
      });

      showToast('Report created successfully!', 'success');
      setShowCreateModal(false);
      resetForm();
      await loadReports();
    } catch (err) {
      console.error('Error creating report:', err);
      showToast(err.message || 'Failed to create report', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Update report
  const handleUpdateReport = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    setActionLoading(true);
    try {
      const reportId = selectedReport.id || selectedReport.Id;

      await reportsApi.updateUserReport(reportId, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        location: formData.location
      });

      showToast('Report updated successfully!', 'success');
      setShowEditModal(false);
      setSelectedReport(null);
      resetForm();
      await loadReports();
    } catch (err) {
      console.error('Error updating report:', err);
      showToast(err.message || 'Failed to update report', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete report
  const handleDeleteReport = async () => {
    if (!selectedReport) return;

    setActionLoading(true);
    try {
      const reportId = selectedReport.id || selectedReport.Id;
      await reportsApi.deleteUserReport(reportId);

      showToast('Report deleted successfully!', 'success');
      setShowDeleteConfirm(false);
      setSelectedReport(null);
      await loadReports();
    } catch (err) {
      console.error('Error deleting report:', err);
      showToast(err.message || 'Failed to delete report', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Equipment',
      priority: 'Medium',
      location: ''
    });
  };

  const openEditModal = (report) => {
    setSelectedReport(report);
    setFormData({
      title: report.title || report.Title || '',
      description: report.description || report.Description || '',
      category: report.category || report.Category || 'Equipment',
      priority: report.priority || report.Priority || 'Medium',
      location: report.location || report.Location || ''
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (report) => {
    setSelectedReport(report);
    setShowDeleteConfirm(true);
  };

  if (loading) {
    return (
      <div className="room-list-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading reports...
        </div>
      </div>
    );
  }

  return (
    <div className="room-list-container">
      <div className="room-list-header">
        <div>
          <h2>My Reports</h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Report equipment issues, room problems, or other concerns
          </p>
        </div>
        <button
          className="btn-new-booking"
          onClick={() => setShowCreateModal(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
          </svg>
          Create Report
        </button>
      </div>

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
            fontWeight: '500'
          }}
        >
          {toast.message}
        </div>
      )}

      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ color: '#991b1b', fontWeight: '500' }}>{error}</span>
          <button onClick={loadReports} className="btn btn-secondary" style={{ marginLeft: '12px' }}>
            Retry
          </button>
        </div>
      )}

      <div className="room-list-stats">
        <span>Total reports: {reportCount}</span>
      </div>

      <div className="room-table-container">
        <table className="room-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No reports found. Create your first report to get started.
                </td>
              </tr>
            ) : (
              reports.map((report) => {
                const reportId = report.id || report.Id;
                const title = report.title || report.Title || 'Untitled';
                const description = report.description || report.Description || '';
                // Map 'type' field from API to 'category' for display
                const category = report.type || report.Type || report.category || report.Category || 'Other';
                const priority = report.priority || report.Priority || 'Medium';
                // Map status string to number: Open=0, InProgress=1, Resolved=2, Rejected=3
                let status = report.status;
                if (typeof status === 'string') {
                  const statusMap = {
                    'Open': 0,
                    'InProgress': 1,
                    'Resolved': 2,
                    'Rejected': 3
                  };
                  status = statusMap[status] !== undefined ? statusMap[status] : 0;
                } else if (status === undefined && report.Status !== undefined) {
                  status = report.Status;
                }
                // Use reportedDate from API
                const createdAt = report.reportedDate || report.ReportedDate || report.createdAt || report.CreatedAt;
                const statusInfo = getStatusInfo(status);

                return (
                  <tr key={reportId}>
                    <td>
                      <div style={{ fontWeight: '500' }}>{title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                        {description.substring(0, 50)}{description.length > 50 ? '...' : ''}
                      </div>
                    </td>
                    <td>{category}</td>
                    <td>
                      <span className={`status-badge ${getPriorityBadge(priority)}`} style={{ fontSize: '0.625rem' }}>
                        {priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${statusInfo.class}`} style={{ fontSize: '0.625rem' }}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td>{formatDate(createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-icon btn-icon-outline color-blue"
                          onClick={() => openEditModal(report)}
                          disabled={status === 2 || status === 3}
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          className="btn btn-sm btn-icon btn-icon-outline color-red"
                          onClick={() => openDeleteConfirm(report)}
                          disabled={status === 1}
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Report</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateReport}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="Brief title of the issue"
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="Equipment">Equipment Issue</option>
                    <option value="Room">Room Issue</option>
                    <option value="Lab">Lab Issue</option>
                    <option value="Safety">Safety Concern</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Room A101, Lab B203"
                  />
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    rows="5"
                    placeholder="Detailed description of the issue..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Creating...' : 'Create Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Report Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Report</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateReport}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="Equipment">Equipment Issue</option>
                    <option value="Room">Room Issue</option>
                    <option value="Lab">Lab Issue</option>
                    <option value="Safety">Safety Concern</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    rows="5"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Updating...' : 'Update Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Report</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this report? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteReport}
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

export default LecturerReportsManagement;
