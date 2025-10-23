import React, { useState, useEffect } from 'react';
import { reportsApi } from '../../../api';

/**
 * Report Detail Component
 * Displays detailed information about a specific report
 * 
 * Related User Stories:
 * - US-XX: User - View and manage reports
 * - US-XX: Admin - Manage user reports
 */
const ReportDetail = ({ reportId, onNavigateBack, isAdmin = false }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReportDetail();
  }, [reportId]);

  const loadReportDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const detail = isAdmin 
        ? await reportsApi.getReportByIdAdmin(reportId)
        : await reportsApi.getUserReportById(reportId);
      const data = (detail && (detail.data || detail.Data)) || detail;
      setReport(data);
    } catch (err) {
      console.error('Error loading report details:', err);
      setError(err.message || 'Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toString()) {
      case 'Open':
      case 'Pending':
        return 'status-badge status-pending';
      case 'InProgress':
        return 'status-badge status-in-progress';
      case 'Resolved':
        return 'status-badge status-resolved';
      case 'Closed':
        return 'status-badge status-closed';
      default:
        return 'status-badge unknown';
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type?.toString()) {
      case 'Lab':
      case 'Room':
        return 'type-badge type-lab';
      case 'Equipment':
        return 'type-badge type-equipment';
      default:
        return 'type-badge';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="create-room-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={onNavigateBack}
              title="Back to Report List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Report Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="loading">Loading report details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="create-room-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={onNavigateBack}
              title="Back to Report List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Report Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="error-message">
            {error}
            <div className="error-actions">
              <button onClick={loadReportDetail} className="btn btn-primary">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="create-room-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={onNavigateBack}
              title="Back to Report List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Report Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="no-data">Report not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-room-page">
      <div className="page-header">
        <div className="header-content">
          <button 
            className="back-button"
            onClick={onNavigateBack}
            title="Back to Report List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1>Report Details</h1>
        </div>
      </div>

      <div className="page-content">
        <div className="room-detail-content">
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Report Information</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className={getTypeBadgeClass(report.type)}>
                  {report.type || 'Unknown'}
                </span>
                <span className={getStatusBadgeClass(report.status)}>
                  {report.status || 'Unknown'}
                </span>
              </div>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Title:</label>
                <span className="detail-value">{report.title}</span>
              </div>
              <div className="detail-item">
                <label>Reporter:</label>
                <span className="detail-value">{report.reporterName}</span>
              </div>
              <div className="detail-item">
                <label>Reported Date:</label>
                <span className="detail-value">{formatDate(report.reportedDate)}</span>
              </div>
              {report.resolvedAt && (
                <div className="detail-item">
                  <label>Resolved At:</label>
                  <span className="detail-value">{formatDate(report.resolvedAt)}</span>
                </div>
              )}
              {report.resolvedByName && (
                <div className="detail-item">
                  <label>Resolved By:</label>
                  <span className="detail-value">{report.resolvedByName}</span>
                </div>
              )}
              <div className="detail-item">
                <label>Created At:</label>
                <span className="detail-value">{formatDate(report.createdAt)}</span>
              </div>
              <div className="detail-item">
                <label>Last Updated:</label>
                <span className="detail-value">{formatDate(report.lastUpdatedAt)}</span>
              </div>
              <div className="detail-item full-width">
                <label>Description:</label>
                <span className="detail-value">{report.description}</span>
              </div>
            </div>
          </div>

          {/* Report Image */}
          {report.imageUrl && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Report Image</h3>
              </div>
              <div className="room-image-container">
                <img src={report.imageUrl} alt={report.title} className="room-image" />
              </div>
            </div>
          )}

          {/* Admin Response */}
          {report.adminResponse && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Admin Response</h3>
              </div>
              <div className="detail-grid">
                <div className="detail-item full-width">
                  <span className="detail-value">{report.adminResponse}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;

