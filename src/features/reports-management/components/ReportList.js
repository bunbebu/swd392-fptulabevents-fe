import React, { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../../../api';
import ReportDetail from './ReportDetail';

/**
 * Report List Component - Common for both Admin and User
 *
 * For Admin: View all reports with ability to update status
 * For User: View own reports with ability to create/edit/delete
 *
 * Related User Stories:
 * - US-XX: User - Manage reports
 * - US-XX: Admin - Manage all reports
 */
const ReportList = ({ userRole = 'Student', isAdmin = false, onSelectReport, onViewReport }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [toast, setToast] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [showDetailPage, setShowDetailPage] = useState(false);

  // Filter states
  const [apiFilters, setApiFilters] = useState({
    type: '',
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 10
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };

  // Load report data with pagination
  const loadReports = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        ...apiFilters,
        page: page - 1, // Backend uses 0-based pagination
        pageSize: pageSize
      };

      // Clean up empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) =>
          value !== '' && value !== null && value !== undefined
        )
      );

      const reportList = isAdmin
        ? await reportsApi.getAllReports(cleanFilters)
        : await reportsApi.getUserReports(cleanFilters);

      setReports(Array.isArray(reportList) ? reportList : []);
      
      // Calculate pagination
      const total = reportList.length;
      setTotalReports(total);
      setTotalPages(Math.ceil(total / pageSize));
    } catch (err) {
      console.error('Error loading reports:', err);
      setError(err.message || 'Unable to load report list');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [apiFilters, currentPage, pageSize, isAdmin]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Pagination handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      loadReports(newPage);
    }
  };

  // View report details
  const handleViewReport = (reportId) => {
    setSelectedReportId(reportId);
    setShowDetailPage(true);
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    loadReports(1);
  };

  // Clear filters
  const clearFilters = () => {
    setApiFilters({
      type: '',
      status: '',
      startDate: '',
      endDate: '',
      page: 1,
      pageSize: 10
    });
    setCurrentPage(1);
  };

  // Get status badge class
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

  // Get type badge class
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (showDetailPage && selectedReportId) {
    return (
      <ReportDetail
        reportId={selectedReportId}
        isAdmin={isAdmin}
        onNavigateBack={() => {
          setShowDetailPage(false);
          setSelectedReportId(null);
          loadReports(currentPage);
        }}
      />
    );
  }

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
        <h2>{isAdmin ? 'All Reports' : 'My Reports'}</h2>
      </div>

      {/* Success/Error Notification */}
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

      {/* Filters */}
      <div className="filters-section" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={apiFilters.type}
            onChange={(e) => setApiFilters({ ...apiFilters, type: e.target.value })}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">All Types</option>
            <option value="Lab">Lab</option>
            <option value="Equipment">Equipment</option>
          </select>

          <select
            value={apiFilters.status}
            onChange={(e) => setApiFilters({ ...apiFilters, status: e.target.value })}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">All Status</option>
            <option value="Open">Open</option>
            <option value="InProgress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <button onClick={applyFilters} className="btn-primary" style={{ padding: '8px 16px' }}>
            Apply Filters
          </button>
          <button onClick={clearFilters} className="btn-secondary" style={{ padding: '8px 16px' }}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Reports Table */}
      {error ? (
        <div className="error-message" style={{ padding: '20px', textAlign: 'center', color: '#dc2626' }}>
          {error}
        </div>
      ) : reports.length === 0 ? (
        <div className="no-data" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          No reports found
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  {isAdmin && <th>Reporter</th>}
                  <th>Reported Date</th>
                  <th>Resolved Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <strong>{report.title}</strong>
                      {report.description && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                          {report.description.substring(0, 60)}
                          {report.description.length > 60 ? '...' : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={getTypeBadgeClass(report.type)}>
                        {report.type}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(report.status)}>
                        {report.status}
                      </span>
                    </td>
                    {isAdmin && <td>{report.reporterName}</td>}
                    <td>{formatDate(report.reportedDate)}</td>
                    <td>{formatDate(report.resolvedAt)}</td>
                    <td>
                      <button
                        className="btn-icon"
                        onClick={() => handleViewReport(report.id)}
                        title="View Details"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-secondary"
              >
                Previous
              </button>
              <span style={{ padding: '8px 16px' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportList;

