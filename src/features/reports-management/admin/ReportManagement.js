import React, { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../../../api';
import ReportStatusForm from './ReportStatusForm';
import ReportList from '../components/ReportList';

/**
 * Report Management Component - Admin Only
 * 
 * Full management operations for all reports
 * 
 * Related User Stories:
 * - US-XX: Admin - Manage user reports
 */
const ReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  
  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
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

      const [reportList, pendingCount] = await Promise.all([
        reportsApi.getAllReports(),
        reportsApi.getPendingReportsCount()
      ]);

      setReports(Array.isArray(reportList) ? reportList : []);
      setStats({ 
        total: Array.isArray(reportList) ? reportList.length : 0, 
        pending: pendingCount || 0 
      });
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

  // Handle update status
  const handleUpdateStatus = async (statusData) => {
    try {
      setActionLoading(true);
      await reportsApi.updateReportStatus(
        selectedReport.id,
        statusData.status,
        statusData.adminResponse || ''
      );
      showToast('Report status updated successfully!', 'success');
      setShowStatusModal(false);
      setSelectedReport(null);
      await loadReports();
    } catch (err) {
      showToast(err.message || 'Unable to update status', 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading reports...</p>
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
          <h2>Report Management</h2>
          <p>Manage user reports - View and respond to reports</p>
        </div>
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

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Pending Reports</h3>
              <p className="stat-number">{stats.pending}</p>
            </div>
            <div className="stat-icon orange">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Resolved Reports</h3>
              <p className="stat-number">{stats.total - stats.pending}</p>
            </div>
            <div className="stat-icon green">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Report List */}
      <ReportList 
        userRole="Admin" 
        isAdmin={true}
        onSelectReport={(report) => {
          setSelectedReport(report);
          setShowStatusModal(true);
        }}
      />

      {/* Status Update Modal */}
      {showStatusModal && selectedReport && (
        <ReportStatusForm
          report={selectedReport}
          onSubmit={handleUpdateStatus}
          onCancel={() => {
            setShowStatusModal(false);
            setSelectedReport(null);
          }}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default ReportManagement;

