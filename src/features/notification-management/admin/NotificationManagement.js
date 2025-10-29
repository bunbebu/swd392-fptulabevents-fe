import React, { useState, useEffect, useCallback } from 'react';
import { notificationApi, authApi } from '../../../api';
import CreateNotification from './CreateNotification';
import EditNotification from './EditNotification';
import NotificationDetail from '../components/NotificationDetail';

/**
 * Notification Management Component - Admin Only
 * 
 * Full CRUD operations for notification management
 * Follows the same pattern as EquipmentManagement and RoomManagement
 */
const NotificationManagement = ({ userRole = 'Admin', onSelectNotification, onViewNotification }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  // eslint-disable-next-line no-unused-vars
  const [totalNotifications, setTotalNotifications] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });
  const [toast, setToast] = useState(null);
  
  // Modal states
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [showEditPage, setShowEditPage] = useState(false);
  const [showViewPage, setShowViewPage] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [confirmDeleteNotification, setConfirmDeleteNotification] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [actionLoading, setActionLoading] = useState(false);

  // Local filter states (for input fields before applying)
  const [localFilters, setLocalFilters] = useState({
    searchTerm: '',
    status: '',
    targetGroup: ''
  });

  // API filter states
  const [apiFilters, setApiFilters] = useState({
    title: '',
    content: '',
    status: '',
    targetGroup: '',
    page: 1,
    pageSize: 8
  });

  const isAdmin = userRole === 'Admin';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };

  // Load notification data with pagination
  const loadNotifications = useCallback(async (page, isPagination = false) => {
    try {
      // Only show main loading on initial load, not on pagination
      if (isPagination) {
        setPaginationLoading(true);
      } else {
      setLoading(true);
      }
      setError(null);

      // Use current API filters with pagination
      const filters = {
        ...apiFilters,
        page: page,
        pageSize: pageSize
      };
      
      // Clean up empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => 
          value !== '' && value !== null && value !== undefined
        )
      );

      // Get notification list from backend
      let notificationList;
      try {
        notificationList = await notificationApi.getAllNotifications(cleanFilters);
      } catch (authErr) {
        // If 401, try to refresh token and retry once
        if (authErr.status === 401) {
          try {
            await authApi.refreshAuthToken();
            notificationList = await notificationApi.getAllNotifications(cleanFilters);
          } catch (refreshErr) {
            throw authErr; // Throw original error if refresh fails
          }
        } else {
          throw authErr;
        }
      }

      console.log('Notification API response:', notificationList);

      // Backend returns a simple array (IReadOnlyList<NotificationListItem>)
      // It doesn't provide total count or pagination metadata
      let notificationData = [];

      if (Array.isArray(notificationList)) {
        notificationData = notificationList;
      } else if (notificationList?.Data && Array.isArray(notificationList.Data)) {
        // Handle C# response format with Data wrapper
        notificationData = notificationList.Data;
      } else if (notificationList?.data && Array.isArray(notificationList.data)) {
        // Handle lowercase data wrapper
        notificationData = notificationList.data;
      }

      // Determine if there are more pages based on the result count
      // If we get exactly pageSize items, there might be more pages
      // If we get less than pageSize, this is the last page
      const hasMorePages = notificationData.length === pageSize;

      console.log('Pagination info:', {
        page,
        pageSize,
        resultsCount: notificationData.length,
        hasMorePages
      });

      setNotifications(notificationData);
      // Store whether there are more pages for the Next button
      setTotalPages(hasMorePages ? page + 1 : page);
      setTotalNotifications(page * pageSize); // Approximate count

      // Calculate stats from the data we have
      const activeCount = notificationData.filter(n => n.status === 'Active').length;
      const expiredCount = notificationData.filter(n => n.status === 'Expired').length;
      setStats({ total: notificationData.length, active: activeCount, expired: expiredCount });
    } catch (err) {
      console.error('Error loading notifications:', err);
      
      // Handle specific error types
      if (err.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (err.status === 403) {
        setError('Access denied. You do not have permission to view notifications.');
      } else if (err.status === 0) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
      setError(err.message || 'Unable to load notification list');
      }
      
      setNotifications([]);
      setTotalNotifications(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [apiFilters, pageSize]);

  useEffect(() => {
    loadNotifications(currentPage, currentPage !== 1);
  }, [loadNotifications, currentPage]);

  // Pagination handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && !paginationLoading) {
      setCurrentPage(newPage);
    }
  };

  // CRUD operation handlers
  const handleCreateNotificationSuccess = async () => {
    setShowCreatePage(false);
    showToast('Notification created successfully!', 'success');
    // Reset to page 1 when creating new notification
    setCurrentPage(1);
  };

  const handleEditNotificationSuccess = async () => {
    setShowEditPage(false);
    setSelectedNotification(null);
      showToast('Notification updated successfully!', 'success');
    // Reload current page
    await loadNotifications(currentPage, false);
  };

  const handleDeleteNotification = async (notificationId) => {
    const notificationToDelete = notifications.find(n => n.id === notificationId);
    
    // Remove from UI immediately
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    setTotalNotifications(prev => prev - 1);

    try {
      await notificationApi.deleteNotification(notificationId);
      setConfirmDeleteNotification(null);
      showToast('Notification deleted successfully!', 'success');
    } catch (err) {
      // Restore notification on error
      setNotifications(prev => [...prev, notificationToDelete]);
      setTotalNotifications(prev => prev + 1);
      showToast(err.message || 'Failed to delete notification', 'error');
    }
  };

  // Open edit page
  const openEditPage = (notification) => {
    setSelectedNotification(notification);
    setShowEditPage(true);
  };

  // Handle view notification details
  const handleView = async (notification) => {
    setSelectedNotification(notification);
    setShowViewPage(true);
  };

  // Apply filters
  const applyFilters = () => {
    // Copy local filters to API filters
    setApiFilters(prev => ({
      ...prev,
      title: localFilters.searchTerm,
      content: localFilters.searchTerm,
      status: localFilters.status,
      targetGroup: localFilters.targetGroup
    }));
    setCurrentPage(1);
    // loadNotifications will be called automatically by useEffect when apiFilters changes
  };

  // Clear filters
  const clearFilters = () => {
    setLocalFilters({
      searchTerm: '',
      status: '',
      targetGroup: ''
    });
    setApiFilters({
      title: '',
      content: '',
      status: '',
      targetGroup: '',
      page: 1,
      pageSize: 8
    });
    setCurrentPage(1);
    // loadNotifications will be called automatically by useEffect when apiFilters changes
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusStyles = {
      Active: 'status-badge status-available',
      Expired: 'status-badge status-broken',
      Scheduled: 'status-badge status-maintenance'
    };
    return <span className={statusStyles[status] || 'status-badge'}>{status}</span>;
  };

  // Format date for display
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
      <div className="notification-list-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading notifications...
        </div>
      </div>
    );
  }

  return (
    <div className="notification-list-container">
      {showCreatePage ? (
        <CreateNotification onNavigateBack={() => setShowCreatePage(false)} onSuccess={handleCreateNotificationSuccess} />
      ) : showEditPage ? (
        <EditNotification notification={selectedNotification} onNavigateBack={() => {
          setShowEditPage(false);
          setSelectedNotification(null);
        }} onSuccess={handleEditNotificationSuccess} />
      ) : showViewPage ? (
        <NotificationDetail notificationId={selectedNotification?.id} onNavigateBack={() => {
          setShowViewPage(false);
          setSelectedNotification(null);
        }} />
      ) : (
        <>
          <div className="notification-list-header">
            <h2>Notification Management</h2>
            {isAdmin && (
              <button 
                className="btn-new-booking"
                onClick={() => setShowCreatePage(true)}
                disabled={actionLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                Create New Notification
              </button>
            )}
          </div>

          {/* Success/Error Notification above table */}
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

          {error && (
            <div className="error-message">
              {error}
              <div className="error-actions">
                <button onClick={() => loadNotifications()} className="btn btn-secondary">
                  Retry
                </button>
                {error.includes('Authentication required') && (
        <button 
                    className="btn btn-primary"
                    onClick={() => {
                      // Clear tokens and redirect to login
                      localStorage.removeItem('accessToken');
                      localStorage.removeItem('refreshToken');
                      sessionStorage.removeItem('accessToken');
                      sessionStorage.removeItem('refreshToken');
                      window.location.href = '/login';
                    }}
                  >
                    Go to Login
        </button>
                )}
              </div>
      </div>
          )}

      <div className="notification-list-stats">
            <span>Showing {notifications.length} notifications</span>
            <span>Page {currentPage}</span>
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
                  placeholder="Search by title or content..."
                  value={localFilters.searchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocalFilters(prev => ({
                      ...prev,
                      searchTerm: value
                    }));
                  }}
              className="search-input"
            />
                {localFilters.searchTerm && (
              <button
                className="clear-search"
                    onClick={() => setLocalFilters(prev => ({
                      ...prev,
                      searchTerm: ''
                    }))}
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
                  value={localFilters.status}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, status: e.target.value }))}
              className="filter-select"
            >
                  <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Expired">Expired</option>
            </select>

            <select
                  value={localFilters.targetGroup}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, targetGroup: e.target.value }))}
              className="filter-select"
            >
                  <option value="">All Target Groups</option>
              <option value="All">All Users</option>
              <option value="Lecturer">Lecturers</option>
              <option value="Student">Students</option>
            </select>
          </div>
          
          <div className="filter-actions">
                <button 
                  className="btn btn-primary"
                  onClick={applyFilters}
                  disabled={actionLoading}
                >
                  Apply Filters
                </button>
            <button 
              className="btn btn-secondary"
                  onClick={clearFilters}
              disabled={actionLoading}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="notification-table-container">
        <table className="notification-table">
          <thead>
            <tr>
              <th>ID</th>
              <th className="col-title">Title</th>
              <th>Target Group</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Created By</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && !paginationLoading ? (
              <tr>
                <td colSpan={isAdmin ? "8" : "7"} className="loading-cell">
                  <div className="loading-spinner"></div>
                  Loading notifications...
                </td>
              </tr>
            ) : paginationLoading ? (
              // Show skeleton rows during pagination
              Array.from({ length: pageSize }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="skeleton-row">
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  {isAdmin && <td><div className="skeleton-text"></div></td>}
                </tr>
              ))
            ) : notifications.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? "8" : "7"} className="no-data">
                  No notification data
                </td>
              </tr>
            ) : (
              notifications.map((notification) => (
                <tr key={notification.id}>
                  <td>
                    {notification.id?.substring(0, 8)}...
                  </td>
                  <td className="col-title">
                    <div>
                      <strong>{notification.title}</strong>
                      {notification.content && (
                        <div className="text-muted small" style={{ 
                          maxWidth: '300px', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }}>
                          {notification.content}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{notification.targetGroup}</td>
                  <td className="text-muted small">{formatDate(notification.startDate)}</td>
                  <td className="text-muted small">{formatDate(notification.endDate)}</td>
                  <td>
                    <StatusBadge status={notification.status} />
                  </td>
                  <td className="text-muted small">{notification.createdBy || 'Admin'}</td>
                      {isAdmin && (
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-icon btn-icon-outline color-yellow"
                              onClick={() => {
                                if (onViewNotification) {
                                  onViewNotification(notification.id);
                                } else {
                                  handleView(notification);
                                }
                              }}
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
                              onClick={() => openEditPage(notification)}
                        disabled={actionLoading}
                        aria-label="Edit notification"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"/>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                        </svg>
                      </button>
                      <button
                        className="btn btn-sm btn-icon btn-icon-outline color-red"
                        onClick={() => setConfirmDeleteNotification(notification)}
                        disabled={actionLoading}
                        aria-label="Delete notification"
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
                      )}
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
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || actionLoading || paginationLoading}
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
              Page {currentPage}
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
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || notifications.length < pageSize || actionLoading || paginationLoading}
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

        </>

      )}

      {/* Modals */}

      {/* Delete Confirmation Modal */}
      {confirmDeleteNotification && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete notification <strong>{confirmDeleteNotification.title}</strong>?</p>
              <p className="text-muted small">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteNotification(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteNotification(confirmDeleteNotification.id)}
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

export default NotificationManagement;

