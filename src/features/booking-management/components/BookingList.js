import React, { useState, useEffect, useCallback } from 'react';
import { bookingApi, authApi } from '../../../api';
import BookingStatusForm from '../admin/BookingStatusForm';

/**
 * Booking List Component - Common for both Admin and Users
 *
 * For Admin: Full booking management with view/create/delete actions
 * For Users: View own bookings
 *
 * Related User Stories:
 * - US-XX: Admin - Manage bookings
 * - US-XX: User - View bookings
 *
 * Related Use Cases:
 * - UC-XX: Manage Bookings (Admin)
 * - UC-XX: View Bookings (All Users)
 */
const BookingList = ({
  userRole = 'Student',
  userId,
  onViewBooking,
  onCreateBooking,
  initialToast,
  onToastShown
}) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [stats, setStats] = useState({ total: 0, approved: 0 });
  const [toast, setToast] = useState(null);
  const [confirmDeleteBooking, setConfirmDeleteBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const isAdmin = userRole === 'Admin';

  // Local filter states (for input fields before applying)
  const [localFilters, setLocalFilters] = useState({
    searchTerm: '',
    status: '',
    from: '',
    to: ''
  });

  // API filter states (excluding page/pageSize - those are managed separately)
  const [apiFilters, setApiFilters] = useState({
    roomId: '', // Backend uses roomId for lab filtering
    userId: !isAdmin && userId ? userId : '', // Auto-set userId for non-admin users
    status: '',
    from: '', // Backend uses from/to for date filtering
    to: ''
  });

  // Helper function to normalize booking data
  const normalizeBooking = (booking) => {
    return {
      ...booking,
      id: booking.id || booking.Id,
      roomId: booking.roomId || booking.RoomId,
      userId: booking.userId || booking.UserId,
      startTime: booking.startTime || booking.StartTime,
      endTime: booking.endTime || booking.EndTime,
      status: booking.status !== undefined ? booking.status : booking.Status,
      createdAt: booking.createdAt || booking.CreatedAt,
      // Backend returns RoomName and UserName in list
      roomName: booking.roomName || booking.RoomName || 'Unknown Room',
      userName: booking.userName || booking.UserName || 'Unknown User',
      // Purpose is only in BookingDetail, not in list
      purpose: booking.purpose || booking.Purpose || null
    };
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };

  // Auto-set userId filter for non-admin users
  useEffect(() => {
    if (!isAdmin && userId) {
      setApiFilters(prev => ({ ...prev, userId: userId }));
    }
  }, [isAdmin, userId]);

  // Show initial toast if provided
  useEffect(() => {
    if (initialToast) {
      showToast(initialToast.message, initialToast.type);
      if (onToastShown) {
        onToastShown();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToast, onToastShown]);

  // Load booking data with pagination
  const loadBookings = useCallback(async (page = 1, isPagination = false) => {
    try {
      // Only show main loading on initial load, not on pagination
      if (isPagination) {
        setPaginationLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Backend returns plain array without pagination metadata
      // Strategy: Get total count first (without pagination), then get specific page

      // Step 1: Get total count (only on initial load or filter change)
      let totalCount = totalBookings; // Use cached value for pagination
      if (!isPagination) {
        // Get all bookings to determine total count
        // IMPORTANT: Don't send page/pageSize to get all items
        const countFilters = {
          roomId: apiFilters.roomId,
          userId: apiFilters.userId,
          status: apiFilters.status,
          from: apiFilters.from,
          to: apiFilters.to
          // Explicitly exclude page and pageSize
        };

        // Clean up empty filters
        const cleanCountFilters = Object.fromEntries(
          Object.entries(countFilters).filter(([key, value]) =>
            value !== '' && value !== null && value !== undefined
          )
        );

        console.log('[BookingList] Getting total count with filters:', cleanCountFilters);

        try {
          const allBookings = await bookingApi.getBookings(cleanCountFilters);
          if (Array.isArray(allBookings)) {
            totalCount = allBookings.length;
            console.log('[BookingList] Total count from API:', totalCount);
          }
        } catch (authErr) {
          // If 401, try to refresh token and retry once
          if (authErr.status === 401) {
            try {
              await authApi.refreshAuthToken();
              const allBookings = await bookingApi.getBookings(cleanCountFilters);
              if (Array.isArray(allBookings)) {
                totalCount = allBookings.length;
                console.log('[BookingList] Total count from API (after refresh):', totalCount);
              }
            } catch (refreshErr) {
              throw authErr;
            }
          } else {
            throw authErr;
          }
        }
      } else {
        console.log('[BookingList] Using cached total count:', totalCount);
      }

      // Step 2: Get specific page data
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

      // Get paginated data
      let bookingList;
      try {
        bookingList = await bookingApi.getBookings(cleanFilters);
      } catch (authErr) {
        // If 401, try to refresh token and retry once
        if (authErr.status === 401) {
          try {
            await authApi.refreshAuthToken();
            bookingList = await bookingApi.getBookings(cleanFilters);
          } catch (refreshErr) {
            throw authErr; // Throw original error if refresh fails
          }
        } else {
          throw authErr;
        }
      }

      console.log('[BookingList] Loaded bookings:', {
        page,
        pageSize,
        totalCount,
        receivedItems: Array.isArray(bookingList) ? bookingList.length : 0
      });

      // Backend returns plain array with server-side pagination
      let bookingData = [];
      if (Array.isArray(bookingList)) {
        bookingData = bookingList.map(normalizeBooking);
      }

      const totalPagesFromCount = Math.max(1, Math.ceil(totalCount / pageSize));

      setBookings(bookingData);
      setTotalPages(totalPagesFromCount);
      setTotalBookings(totalCount);

      // Calculate stats from current page only
      const approvedCount = bookingData.filter(b => b.status === 1).length;
      setStats({
        total: totalCount,
        approved: approvedCount // This is only for current page, not accurate for total
      });
    } catch (err) {
      console.error('Error loading bookings:', err);

      // Handle specific error types
      if (err.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (err.status === 403) {
        setError('Access denied. You do not have permission to view bookings.');
      } else if (err.status === 0) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError(err.message || 'Unable to load booking list');
      }

      setBookings([]);
      setTotalBookings(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [apiFilters, pageSize, totalBookings]);

  useEffect(() => {
    loadBookings(currentPage);
  }, [loadBookings, currentPage]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const statusMap = {
      0: 'status-badge status-pending',
      1: 'status-badge status-available', // Approved
      2: 'status-badge status-unavailable', // Rejected
      3: 'status-badge status-maintenance', // Cancelled
      4: 'status-badge status-occupied' // Completed
    };
    return statusMap[status] || 'status-badge unknown';
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      0: 'Pending',
      1: 'Approved',
      2: 'Rejected',
      3: 'Cancelled',
      4: 'Completed'
    };
    return statusMap[status] || 'Unknown';
  };

  // Pagination handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      loadBookings(newPage, true);
    }
  };

  // Handle delete booking
  const handleDeleteBooking = async (bookingId) => {
    const bookingToDelete = bookings.find(b => b.id === bookingId);

    // Remove from UI immediately
    setBookings(prev => prev.filter(booking => booking.id !== bookingId));
    setTotalBookings(prev => prev - 1);

    try {
      await bookingApi.deleteBooking(bookingId);
      setConfirmDeleteBooking(null);
      showToast('Booking deleted successfully!', 'success');
    } catch (err) {
      // Restore booking on error
      setBookings(prev => [...prev, bookingToDelete]);
      setTotalBookings(prev => prev + 1);
      showToast(err.message || 'Failed to delete booking', 'error');
    }
  };

  // Handle status update
  const handleStatusUpdate = async (statusData) => {
    const originalBooking = bookings.find(b => b.id === selectedBooking.id);
    
    // Create optimistic update
    const optimisticBooking = {
      ...originalBooking,
      status: statusData.status,
      isOptimistic: true
    };

    // Update UI immediately
    setBookings(prev => prev.map(booking => 
      booking.id === selectedBooking.id ? optimisticBooking : booking
    ));

    try {
      setActionLoading(true);
      const updatedBooking = await bookingApi.updateBookingStatus(selectedBooking.id, statusData.status, statusData.notes || '');
      
      // Replace with real updated booking
      setBookings(prev => prev.map(booking => 
        booking.id === selectedBooking.id 
          ? { ...updatedBooking, isOptimistic: false }
          : booking
      ));
      
      setShowStatusModal(false);
      setSelectedBooking(null);
      showToast('Status updated successfully!', 'success');
    } catch (err) {
      // Revert to original booking on error
      setBookings(prev => prev.map(booking => 
        booking.id === selectedBooking.id ? originalBooking : booking
      ));
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open status modal
  const openStatusModal = (booking) => {
    setSelectedBooking(booking);
    setShowStatusModal(true);
  };

  // Apply filters
  const applyFilters = () => {
    // Copy local filters to API filters
    setApiFilters(prev => ({
      ...prev,
      searchTerm: localFilters.searchTerm,
      status: localFilters.status,
      from: localFilters.from,
      to: localFilters.to
    }));
    setCurrentPage(1);
    // loadBookings will be called automatically by useEffect when apiFilters changes
  };

  // Clear filters
  const clearFilters = () => {
    setLocalFilters({
      searchTerm: '',
      status: '',
      from: '',
      to: ''
    });
    setApiFilters({
      roomId: '',
      userId: !isAdmin && userId ? userId : '',
      status: '',
      from: '',
      to: '',
      searchTerm: ''
    });
    setCurrentPage(1);
    // loadBookings will be called automatically by useEffect when apiFilters changes
  };

  // Filter bookings by search term (client-side filtering using applied filters)
  const filteredBookings = bookings.filter(booking => {
    if (!apiFilters.searchTerm || !apiFilters.searchTerm.trim()) return true;

    const searchLower = apiFilters.searchTerm.toLowerCase();
    const bookingId = typeof booking.id === 'string' && booking.id.length > 8
      ? `${booking.id.substring(0, 8)}...`
      : `#${booking.id}`;

    return (
      bookingId.toLowerCase().includes(searchLower) ||
      booking.roomName?.toLowerCase().includes(searchLower) ||
      booking.userName?.toLowerCase().includes(searchLower) ||
      booking.purpose?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="room-list-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading bookings...
        </div>
      </div>
    );
  }

  return (
    <div className="room-list-container">
      <>
        {isAdmin && (
          <div className="room-list-header">
            <h2>Room Booking Management</h2>
            {onCreateBooking && (
              <button
                className="btn-new-booking"
                onClick={onCreateBooking}
                disabled={actionLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                Create New Booking
              </button>
            )}
          </div>
        )}

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
              <button onClick={() => loadBookings()} className="btn btn-secondary">
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

        <div className="room-list-stats">
          <span>
            {apiFilters.searchTerm && isAdmin
              ? `Showing ${filteredBookings.length} of ${totalBookings} bookings`
              : `Total bookings: ${totalBookings}`}
          </span>
          <span>Page {currentPage} / {totalPages}</span>
        </div>

        {/* Filter Controls */}
        <div className="filter-controls">
          <div className="filter-row">
            {isAdmin && (
              <div className="search-bar">
                <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Search by ID, room, user, or purpose..."
                  value={localFilters.searchTerm}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="search-input"
                />
                {localFilters.searchTerm && (
                  <button
                    className="clear-search"
                    onClick={() => setLocalFilters(prev => ({ ...prev, searchTerm: '' }))}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18"></path>
                      <path d="M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            )}

            <div className="filter-group">
              <select
                value={localFilters.status}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, status: e.target.value }))}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="0">Pending</option>
                <option value="1">Approved</option>
                <option value="2">Rejected</option>
                <option value="3">Cancelled</option>
                <option value="4">Completed</option>
              </select>
              <input
                type="date"
                placeholder="From Date"
                value={localFilters.from}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, from: e.target.value }))}
                className="filter-input"
              />
              <input
                type="date"
                placeholder="To Date"
                value={localFilters.to}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, to: e.target.value }))}
                className="filter-input"
              />
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

        <div className="room-table-container">
          <table className="room-table">
            <thead>
              <tr>
                <th>ID</th>
                <th className="col-name">Room</th>
                {isAdmin && <th>User</th>}
                <th>Purpose</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && !paginationLoading ? (
                <tr>
                  <td colSpan={isAdmin ? "8" : "7"} className="loading-cell">
                    <div className="loading-spinner"></div>
                    Loading bookings...
                  </td>
                </tr>
              ) : paginationLoading ? (
                // Show skeleton rows during pagination
                Array.from({ length: pageSize }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="skeleton-row">
                    <td><div className="skeleton-text"></div></td>
                    <td><div className="skeleton-text"></div></td>
                    {isAdmin && <td><div className="skeleton-text"></div></td>}
                    <td><div className="skeleton-text"></div></td>
                    <td><div className="skeleton-text"></div></td>
                    <td><div className="skeleton-text"></div></td>
                    <td><div className="skeleton-text"></div></td>
                    {isAdmin && <td><div className="skeleton-text"></div></td>}
                  </tr>
                ))
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? "8" : "7"} className="no-data">
                    {apiFilters.searchTerm ? 'No bookings found matching your search' : 'No booking data'}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className={booking.isOptimistic ? 'optimistic-row' : ''}>
                    <td>
                      {typeof booking.id === 'string' && booking.id.length > 8
                        ? `${booking.id.substring(0, 8)}...`
                        : `#${booking.id}`}
                      {booking.isOptimistic && (
                        <span className="optimistic-indicator" title="Saving...">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12a9 9 0 11-6.219-8.56"/>
                          </svg>
                        </span>
                      )}
                    </td>
                    <td className="col-name">
                      <strong>{booking.roomName}</strong>
                    </td>
                    {isAdmin && <td>{booking.userName}</td>}
                    <td>{booking.purpose || 'N/A'}</td>
                    <td>{formatDate(booking.startTime)}</td>
                    <td>{formatDate(booking.endTime)}</td>
                    <td>
                      <span className={getStatusBadgeClass(booking.status)}>
                        {getStatusLabel(booking.status)}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="action-buttons">
                          {onViewBooking && (
                            <button
                              className="btn btn-sm btn-icon btn-icon-outline color-yellow"
                              onClick={() => onViewBooking(booking.id)}
                              disabled={actionLoading}
                              aria-label="View details"
                              title="View"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-icon btn-icon-outline color-purple"
                            onClick={() => openStatusModal(booking)}
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
                            onClick={() => setConfirmDeleteBooking(booking)}
                            disabled={actionLoading}
                            aria-label="Delete booking"
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
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || actionLoading || paginationLoading}
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

      {/* Status Update Modal */}
      {showStatusModal && selectedBooking && (
        <BookingStatusForm
          booking={selectedBooking}
          onSubmit={handleStatusUpdate}
          onCancel={() => {
            setShowStatusModal(false);
            setSelectedBooking(null);
          }}
          loading={actionLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteBooking && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete booking <strong>#{confirmDeleteBooking.id}</strong>?</p>
              <p className="text-muted small">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteBooking(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteBooking(confirmDeleteBooking.id)}
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

export default BookingList;
