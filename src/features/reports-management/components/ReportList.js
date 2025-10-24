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
const ReportList = ({ isAdmin = false, onSelectReport, onViewReport, externalToast = null }) => {
  const [allReports, setAllReports] = useState([]); // Store all reports for client-side pagination
  const [reports, setReports] = useState([]); // Current page reports
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [toast, setToast] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [showDetailPage, setShowDetailPage] = useState(false);

  // Filter states - separate local filters from applied filters
  const [localFilters, setLocalFilters] = useState({
    title: '',
    type: '',
    status: ''
  });
  
  const [appliedFilters, setAppliedFilters] = useState({
    title: '',
    type: '',
    status: ''
    // Don't include page/pageSize here for client-side pagination
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };

  // Load ALL reports (client-side pagination)
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch ALL reports without pagination (backend doesn't support TotalCount)
      const filters = {
        ...appliedFilters
        // Don't send page/pageSize to get all records
      };

      // Clean up empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) =>
          value !== '' && value !== null && value !== undefined
        )
      );

      const reportList = isAdmin
        ? await reportsApi.getAllReports(cleanFilters)
        : await reportsApi.getUserReports(cleanFilters);

      console.log('=== loadReports response ===');
      console.log('Response:', reportList);
      console.log('Is Array?', Array.isArray(reportList));

      // Handle response - backend returns { Data: [...], Code: 200, Message: "OK" }
      let reportData = [];

      if (Array.isArray(reportList)) {
        reportData = reportList;
        console.log('Using direct array');
      } else if (reportList?.Data && Array.isArray(reportList.Data)) {
        // PascalCase response (C# backend style)
        reportData = reportList.Data;
        console.log('Using reportList.Data');
      } else if (reportList?.data && Array.isArray(reportList.data)) {
        // camelCase response
        reportData = reportList.data;
        console.log('Using reportList.data');
      }

      console.log('Total reports loaded:', reportData.length);
      console.log('Page size:', pageSize);
      console.log('Calculated total pages:', Math.ceil(reportData.length / pageSize));

      // Store all reports for client-side pagination
      setAllReports(reportData);
      setTotalReports(reportData.length);
      const calculatedTotalPages = Math.max(1, Math.ceil(reportData.length / pageSize));
      setTotalPages(calculatedTotalPages);

      console.log('State will be set to:');
      console.log('  allReports:', reportData.length, 'items');
      console.log('  totalReports:', reportData.length);
      console.log('  totalPages:', calculatedTotalPages);

      // Set current page to 1 and show first page
      setCurrentPage(1);
      const startIndex = 0;
      const endIndex = pageSize;
      const firstPageReports = reportData.slice(startIndex, endIndex);
      console.log('First page reports:', firstPageReports.length, 'items');
      setReports(firstPageReports);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError(err.message || 'Unable to load report list');
      setAllReports([]);
      setReports([]);
      setTotalReports(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, pageSize, isAdmin]);

  // Initial load and when filters change
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Client-side pagination handler
  const handlePageChange = (newPage) => {
    console.log('=== handlePageChange called ===');
    console.log('newPage:', newPage);
    console.log('currentPage:', currentPage);
    console.log('totalPages:', totalPages);
    console.log('totalReports:', totalReports);
    console.log('allReports.length:', allReports.length);
    console.log('Check conditions:');
    console.log('  newPage >= 1:', newPage >= 1);
    console.log('  newPage <= totalPages:', newPage <= totalPages);
    console.log('  newPage !== currentPage:', newPage !== currentPage);

    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      console.log('✓ Pagination allowed, changing page...');
      setPaginationLoading(true);

      // Simulate a small delay for better UX
      setTimeout(() => {
        setCurrentPage(newPage);

        // Calculate slice indices for client-side pagination
        const startIndex = (newPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        const pageReports = allReports.slice(startIndex, endIndex);
        console.log('Showing reports from index', startIndex, 'to', endIndex);
        console.log('Page reports count:', pageReports.length);

        setReports(pageReports);
        setPaginationLoading(false);
      }, 200);
    } else {
      console.log('✗ Pagination blocked!');
    }
  };

  // View report details
  const handleViewReport = (reportId) => {
    if (onViewReport) {
      onViewReport(reportId);
    } else {
      setSelectedReportId(reportId);
      setShowDetailPage(true);
    }
  };

  // Apply filters
  const applyFilters = () => {
    setAppliedFilters({
      ...localFilters
      // Don't include page/pageSize for client-side pagination
    });
    setCurrentPage(1);
  };

  // Clear filters
  const clearFilters = () => {
    const emptyFilters = {
      title: '',
      type: '',
      status: ''
    };
    setLocalFilters(emptyFilters);
    setAppliedFilters(emptyFilters); // Don't include page/pageSize
    setCurrentPage(1);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status?.toString()) {
      case '0':
      case 'Open':
        return 'status-badge status-open';
      case '1':
      case 'InProgress':
        return 'status-badge status-inprogress';
      case '2':
      case 'Resolved':
        return 'status-badge status-resolved';
      case '3':
      case 'Closed':
        return 'status-badge status-closed';
      default:
        return 'status-badge unknown';
    }
  };

  // Get status display text
  const getStatusText = (status) => {
    switch (status?.toString()) {
      case '0': return 'OPEN';
      case '1': return 'INPROGRESS';
      case '2': return 'RESOLVED';
      case '3': return 'CLOSED';
      default: return status || 'Unknown';
    }
  };

  // Get type display text
  const getTypeText = (type) => {
    switch (type?.toString()) {
      case '0': return 'Lab';
      case '1': return 'Equipment';
      default: return type || 'Unknown';
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
          loadReports(); // Reload all reports
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
        <h2>{isAdmin ? 'Reports Management' : 'My Reports'}</h2>
      </div>

      {/* Success/Error Notification */}
      {(externalToast || toast) && (
        <div
          className="table-notification"
          style={{
            backgroundColor: (externalToast || toast).type === 'success' ? '#d1fae5' : '#fee2e2',
            color: (externalToast || toast).type === 'success' ? '#065f46' : '#dc2626',
            border: (externalToast || toast).type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
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
            {(externalToast || toast).type === 'success' ? (
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            ) : (
              <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            )}
          </svg>
          {(externalToast || toast).message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <div className="error-actions">
            <button onClick={() => loadReports()} className="btn btn-secondary">
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="room-list-stats">
        <span>Total reports: {totalReports}</span>
        <span>Page {currentPage} / {totalPages}</span>
        <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
          (All: {allReports.length}, Showing: {reports.length})
        </span>
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
              placeholder="Search by title..."
              value={localFilters.title || ''}
              onChange={(e) => {
                const value = e.target.value;
                setLocalFilters(prev => ({ ...prev, title: value }));
              }}
              className="search-input"
            />
            {localFilters.title && (
              <button
                className="clear-search"
                onClick={() => setLocalFilters(prev => ({ ...prev, title: '' }))}
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
              value={localFilters.type}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, type: e.target.value }))}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="0">Lab</option>
              <option value="1">Equipment</option>
            </select>
            <select
              value={localFilters.status}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, status: e.target.value }))}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="0">Open</option>
              <option value="1">In Progress</option>
              <option value="2">Resolved</option>
              <option value="3">Closed</option>
            </select>
          </div>

          <div className="filter-actions">
            <button
              className="btn btn-primary"
              onClick={applyFilters}
            >
              Apply Filters
            </button>
            <button
              className="btn btn-secondary"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="room-table-container">
        <table className="room-table">
          <thead>
            <tr>
              <th className="col-name">Title</th>
              <th>Type</th>
              <th>Status</th>
              {isAdmin && <th>Reporter</th>}
              <th>Reported Date</th>
              <th>Resolved Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !paginationLoading ? (
              <tr>
                <td colSpan={isAdmin ? "7" : "6"} className="loading-cell">
                  <div className="loading-spinner"></div>
                  Loading reports...
                </td>
              </tr>
            ) : paginationLoading ? (
              // Show skeleton rows during pagination
              Array.from({ length: pageSize }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="skeleton-row">
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  {isAdmin && <td><div className="skeleton-text"></div></td>}
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                </tr>
              ))
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? "7" : "6"} className="no-data">
                  No report data
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id}>
                  <td className="col-name">
                    <div>
                      <strong>{report.title}</strong>
                      {report.description && (
                        <div className="text-muted small">
                          {report.description.substring(0, 100)}
                          {report.description.length > 100 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="type-badge">
                      {getTypeText(report.type)}
                    </span>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(report.status)}>
                      {getStatusText(report.status)}
                    </span>
                  </td>
                  {isAdmin && <td>{report.reporterName || 'Admin'}</td>}
                  <td>{formatDate(report.reportedDate)}</td>
                  <td>{formatDate(report.resolvedAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-icon btn-icon-outline color-yellow"
                        onClick={() => handleViewReport(report.id)}
                        aria-label="View details"
                        title="View"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      {isAdmin && onSelectReport && (
                        <button
                          className="btn btn-sm btn-icon btn-icon-outline color-blue"
                          onClick={() => onSelectReport(report)}
                          aria-label="Update status"
                          title="Update Status"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          className="btn btn-secondary"
          onClick={() => {
            console.log('Previous button clicked');
            handlePageChange(currentPage - 1);
          }}
          disabled={currentPage === 1 || paginationLoading}
          title={`Previous (disabled: ${currentPage === 1 || paginationLoading})`}
        >
          {paginationLoading && currentPage > 1 ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Loading...
            </>
          ) : (
            'Previous'
          )}
        </button>
        <span className="page-info">
          Page {currentPage} / {totalPages}
          {paginationLoading && (
            <span className="pagination-loading-indicator">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
            </span>
          )}
        </span>
        <button
          className="btn btn-secondary"
          onClick={() => {
            console.log('Next button clicked');
            handlePageChange(currentPage + 1);
          }}
          disabled={currentPage === totalPages || paginationLoading}
          title={`Next (disabled: ${currentPage === totalPages || paginationLoading}, currentPage=${currentPage}, totalPages=${totalPages})`}
        >
          {paginationLoading && currentPage < totalPages ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Loading...
            </>
          ) : (
            'Next'
          )}
        </button>
      </div>
    </div>
  );
};

export default ReportList;
