import React, { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../../../api';
import UserReportForm from './UserReportForm';
import ReportList from '../components/ReportList';

/**
 * User Reports Component
 * 
 * Allows users to manage their own reports
 * 
 * Related User Stories:
 * - US-XX: User - Create and manage reports
 */
const UserReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0 });
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [confirmDeleteReport, setConfirmDeleteReport] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };

  // Load report data
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [reportList, totalCount] = await Promise.all([
        reportsApi.getUserReports(),
        reportsApi.getUserReportsCount()
      ]);

      setReports(Array.isArray(reportList) ? reportList : []);
      setStats({ total: totalCount || 0 });
    } catch (err) {
      console.error('Error loading reports:', err);
      setError(err.message || 'Unable to load report list');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Handle create report
  const handleCreate = async (reportData) => {
    try {
      setActionLoading(true);
      await reportsApi.createReport(reportData);
      showToast('Report created successfully!', 'success');
      setShowCreateModal(false);
      await loadReports();
    } catch (err) {
      showToast(err.message || 'Unable to create report', 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update report
  const handleUpdate = async (reportData) => {
    try {
      setActionLoading(true);
      await reportsApi.updateReport(selectedReport.id, reportData);
      showToast('Report updated successfully!', 'success');
      setShowEditModal(false);
      setSelectedReport(null);
      await loadReports();
    } catch (err) {
      showToast(err.message || 'Unable to update report', 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete report
  const handleDelete = async (reportId) => {
    try {
      setActionLoading(true);
      await reportsApi.deleteReport(reportId);
      showToast('Report deleted successfully!', 'success');
      setConfirmDeleteReport(null);
      await loadReports();
    } catch (err) {
      showToast(err.message || 'Unable to delete report', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your reports...</p>
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
          <button className="btn-primary" onClick={loadReports}>
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
          <h2>My Reports</h2>
          <p>Create and manage your reports</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
          </svg>
          Create New Report
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Total Reports</h3>
              <p className="stat-number">{stats.total}</p>
            </div>
            <div className="stat-icon blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Report List */}
      <ReportList 
        userRole="Student" 
        isAdmin={false}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <UserReportForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={actionLoading}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedReport && (
        <UserReportForm
          report={selectedReport}
          onSubmit={handleUpdate}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedReport(null);
          }}
          loading={actionLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteReport && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteReport(null)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="modal-close" onClick={() => setConfirmDeleteReport(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete report <strong>{confirmDeleteReport.title}</strong>?</p>
              <p className="text-muted small">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setConfirmDeleteReport(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={() => handleDelete(confirmDeleteReport.id)}
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

export default UserReports;

