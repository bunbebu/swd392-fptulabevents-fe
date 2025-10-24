import React, { useState, useEffect } from 'react';
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
  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingReportDetail, setLoadingReportDetail] = useState(false);
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };

  // Clear toast when refreshKey changes (after reload)
  useEffect(() => {
    if (refreshKey > 0) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [refreshKey]);

  // Handle select report - fetch full detail first
  const handleSelectReport = async (report) => {
    try {
      setLoadingReportDetail(true);

      // Fetch full report detail to get AdminResponse
      const fullReport = await reportsApi.getReportByIdAdmin(report.id);

      setSelectedReport(fullReport);
      setShowStatusModal(true);
    } catch (err) {
      console.error('Error loading report detail:', err);
      showToast(err.message || 'Unable to load report details', 'error');
    } finally {
      setLoadingReportDetail(false);
    }
  };

  // Handle update status
  const handleUpdateStatus = async (statusData) => {
    try {
      setActionLoading(true);
      await reportsApi.updateReportStatus(
        selectedReport.id,
        statusData.status,
        statusData.adminResponse || ''
      );
      showToast('Status updated successfully!', 'success');
      setShowStatusModal(false);
      setSelectedReport(null);
      // Trigger ReportList refresh
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      showToast(err.message || 'Unable to update status', 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-content">
      {/* Loading overlay when fetching report detail */}
      {loadingReportDetail && (
        <div className="modal-overlay">
          <div className="loading">
            <div className="loading-spinner"></div>
            <div style={{ marginTop: '10px' }}>Loading report details...</div>
          </div>
        </div>
      )}

      {/* Report List */}
      <ReportList
        key={refreshKey}
        userRole="Admin"
        isAdmin={true}
        onSelectReport={handleSelectReport}
        externalToast={toast}
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

