import React, { useState, useEffect, useCallback } from 'react';
import { bookingApi, roomsApi } from '../../../api';
import { 
  BOOKING_STATUS, 
  BOOKING_STATUS_OPTIONS, 
  getBookingStatusLabel, 
  formatBookingDate,
  canApproveBooking,
  canRejectBooking,
  canDeleteBooking,
  getBookingDuration
} from '../../../constants/bookingConstants';

/**
 * Booking List Component - Admin
 * 
 * Admin can:
 * - View all bookings with filters
 * - Approve/Reject pending bookings
 * - Bulk approve bookings
 * - Delete bookings
 * - View booking details
 * 
 * Related User Stories:
 * - US-24: Admin - Bulk approve multiple bookings
 * - US-28: Admin - Manually mark attendance for users
 * 
 * Related Use Cases:
 * - UC-04: Approve/Reject Booking
 */
const BookingList = ({ userRole = 'Student', onViewBooking, onCreateBooking, initialToast, onToastShown }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [toast, setToast] = useState(null);
  const [rooms, setRooms] = useState([]);

  // Show initial toast passed from parent once on mount
  useEffect(() => {
    if (initialToast) {
      setToast(initialToast);
      window.clearTimeout(BookingList._tid);
      BookingList._tid = window.setTimeout(() => {
        setToast(null);
        if (onToastShown) onToastShown();
      }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToast]);
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDeleteBooking, setConfirmDeleteBooking] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  
  // Bulk selection
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  
  // API filter states
  const [apiFilters, setApiFilters] = useState({
    roomId: '',
    userId: '',
    status: '',
    from: '',
    to: '',
    page: 1,
    pageSize: 10
  });

  const isAdmin = userRole === 'Admin';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };

  // Load rooms for filter
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const roomsData = await roomsApi.getRooms();
        setRooms(roomsData || []);
      } catch (err) {
        console.error('Failed to load rooms:', err);
      }
    };
    loadRooms();
  }, []);

  // Load booking data with pagination
  const loadBookings = useCallback(async (page = currentPage, isPagination = false) => {
    try {
      if (isPagination) {
        setPaginationLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Use current API filters with pagination
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

      const bookingList = await bookingApi.getBookings(cleanFilters);
      
      setBookings(bookingList || []);
      setTotalBookings(bookingList?.length || 0);
      
      // Calculate total pages (simplified - backend should provide this)
      const calculatedTotalPages = Math.ceil((bookingList?.length || 0) / pageSize);
      setTotalPages(calculatedTotalPages || 1);
      
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError(err.message || 'Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [currentPage, pageSize, apiFilters]);

  useEffect(() => {
    loadBookings(currentPage);
  }, [loadBookings, currentPage]);

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      loadBookings(newPage, true);
    }
  };

  // Approve booking
  const handleApproveBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      setActionLoading(true);
      await bookingApi.updateBookingStatus(selectedBooking.id, {
        status: BOOKING_STATUS.APPROVED,
        notes: approveNotes || 'Approved by admin'
      });
      setShowApproveModal(false);
      setSelectedBooking(null);
      setApproveNotes('');
      showToast('Booking approved successfully!', 'success');
      await loadBookings(currentPage);
    } catch (err) {
      showToast(err.message || 'Failed to approve booking', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject booking
  const handleRejectBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      setActionLoading(true);
      await bookingApi.updateBookingStatus(selectedBooking.id, {
        status: BOOKING_STATUS.REJECTED,
        notes: rejectNotes || 'Rejected by admin'
      });
      setShowRejectModal(false);
      setSelectedBooking(null);
      setRejectNotes('');
      showToast('Booking rejected successfully!', 'success');
      await loadBookings(currentPage);
    } catch (err) {
      showToast(err.message || 'Failed to reject booking', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete booking
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

  // Bulk approve
  const handleBulkApprove = async () => {
    try {
      setActionLoading(true);
      const approvePromises = selectedBookings.map(bookingId =>
        bookingApi.updateBookingStatus(bookingId, {
          status: BOOKING_STATUS.APPROVED,
          notes: 'Bulk approved by admin'
        })
      );
      await Promise.all(approvePromises);
      setShowBulkApproveModal(false);
      setSelectedBookings([]);
      showToast(`${selectedBookings.length} bookings approved successfully!`, 'success');
      await loadBookings(currentPage);
    } catch (err) {
      showToast(err.message || 'Failed to bulk approve bookings', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle booking selection
  const toggleBookingSelection = (bookingId) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  // Select all pending bookings
  const selectAllPending = () => {
    const pendingBookings = bookings
      .filter(b => b.status === BOOKING_STATUS.PENDING)
      .map(b => b.id);
    setSelectedBookings(pendingBookings);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedBookings([]);
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    loadBookings(1);
  };

  // Clear filters
  const clearFilters = () => {
    setApiFilters({
      roomId: '',
      userId: '',
      status: '',
      from: '',
      to: '',
      page: 1,
      pageSize: 10
    });
    setCurrentPage(1);
    loadBookings(1);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case BOOKING_STATUS.PENDING:
        return 'status-badge status-pending';
      case BOOKING_STATUS.APPROVED:
        return 'status-badge status-approved';
      case BOOKING_STATUS.REJECTED:
        return 'status-badge status-rejected';
      case BOOKING_STATUS.CANCELLED:
        return 'status-badge status-cancelled';
      case BOOKING_STATUS.COMPLETED:
        return 'status-badge status-completed';
      default:
        return 'status-badge';
    }
  };

  if (loading) {
    return (
      <div className="booking-list-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading bookings...
        </div>
      </div>
    );
  }

  return (
    <div className="booking-list-container">
      <div className="booking-list-header">
        <h2>Booking Management</h2>
        {isAdmin && (
          <button
            className="btn-new-booking"
            onClick={() => onCreateBooking && onCreateBooking()}
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

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Room</label>
            <select
              value={apiFilters.roomId}
              onChange={(e) => setApiFilters({ ...apiFilters, roomId: e.target.value })}
            >
              <option value="">All Rooms</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={apiFilters.status}
              onChange={(e) => setApiFilters({ ...apiFilters, status: e.target.value })}
            >
              {BOOKING_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>From Date</label>
            <input
              type="datetime-local"
              value={apiFilters.from}
              onChange={(e) => setApiFilters({ ...apiFilters, from: e.target.value })}
            />
          </div>

          <div className="filter-group">
            <label>To Date</label>
            <input
              type="datetime-local"
              value={apiFilters.to}
              onChange={(e) => setApiFilters({ ...apiFilters, to: e.target.value })}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button className="btn-primary" onClick={applyFilters}>
            Apply Filters
          </button>
          <button className="btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {isAdmin && selectedBookings.length > 0 && (
        <div className="bulk-actions-bar">
          <span>{selectedBookings.length} booking(s) selected</span>
          <div className="bulk-actions-buttons">
            <button
              className="btn-approve"
              onClick={() => setShowBulkApproveModal(true)}
            >
              Bulk Approve
            </button>
            <button
              className="btn-secondary"
              onClick={clearSelection}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {isAdmin && bookings.some(b => b.status === BOOKING_STATUS.PENDING) && (
        <div className="quick-actions">
          <button
            className="btn-link"
            onClick={selectAllPending}
          >
            Select All Pending ({bookings.filter(b => b.status === BOOKING_STATUS.PENDING).length})
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}

      {/* Bookings Table */}
      {bookings.length === 0 ? (
        <div className="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <h3>No bookings found</h3>
          <p>There are no bookings matching your criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="booking-table">
            <thead>
              <tr>
                {isAdmin && <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedBookings.length === bookings.filter(b => b.status === BOOKING_STATUS.PENDING).length && bookings.filter(b => b.status === BOOKING_STATUS.PENDING).length > 0}
                    onChange={(e) => e.target.checked ? selectAllPending() : clearSelection()}
                  />
                </th>}
                <th>User</th>
                <th>Room</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Duration</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  {isAdmin && <td>
                    {booking.status === BOOKING_STATUS.PENDING && (
                      <input
                        type="checkbox"
                        checked={selectedBookings.includes(booking.id)}
                        onChange={() => toggleBookingSelection(booking.id)}
                      />
                    )}
                  </td>}
                  <td>{booking.userName}</td>
                  <td>{booking.roomName}</td>
                  <td>{formatBookingDate(booking.startTime)}</td>
                  <td>{formatBookingDate(booking.endTime)}</td>
                  <td>{getBookingDuration(booking.startTime, booking.endTime)}h</td>
                  <td>
                    <div className="purpose-cell" title={booking.purpose}>
                      {booking.purpose?.substring(0, 30)}{booking.purpose?.length > 30 ? '...' : ''}
                    </div>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(booking.status)}>
                      {getBookingStatusLabel(booking.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => onViewBooking && onViewBooking(booking.id)}
                        title="View Details"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>

                      {isAdmin && canApproveBooking(booking.status) && (
                        <button
                          className="btn-icon btn-approve"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowApproveModal(true);
                          }}
                          title="Approve"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </button>
                      )}

                      {isAdmin && canRejectBooking(booking.status) && (
                        <button
                          className="btn-icon btn-reject"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowRejectModal(true);
                          }}
                          title="Reject"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      )}

                      {isAdmin && canDeleteBooking(booking.status) && (
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => setConfirmDeleteBooking(booking)}
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || paginationLoading}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || paginationLoading}
          >
            Next
          </button>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve Booking</h3>
              <button className="modal-close" onClick={() => setShowApproveModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to approve this booking?</p>
              <div className="booking-info">
                <p><strong>User:</strong> {selectedBooking.userName}</p>
                <p><strong>Room:</strong> {selectedBooking.roomName}</p>
                <p><strong>Time:</strong> {formatBookingDate(selectedBooking.startTime)} - {formatBookingDate(selectedBooking.endTime)}</p>
              </div>
              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowApproveModal(false)} disabled={actionLoading}>
                Cancel
              </button>
              <button className="btn-approve" onClick={handleApproveBooking} disabled={actionLoading}>
                {actionLoading ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Booking</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to reject this booking?</p>
              <div className="booking-info">
                <p><strong>User:</strong> {selectedBooking.userName}</p>
                <p><strong>Room:</strong> {selectedBooking.roomName}</p>
                <p><strong>Time:</strong> {formatBookingDate(selectedBooking.startTime)} - {formatBookingDate(selectedBooking.endTime)}</p>
              </div>
              <div className="form-group">
                <label>Reason for Rejection *</label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows="3"
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRejectModal(false)} disabled={actionLoading}>
                Cancel
              </button>
              <button className="btn-reject" onClick={handleRejectBooking} disabled={actionLoading || !rejectNotes}>
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Approve Modal */}
      {showBulkApproveModal && (
        <div className="modal-overlay" onClick={() => setShowBulkApproveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Approve Bookings</h3>
              <button className="modal-close" onClick={() => setShowBulkApproveModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to approve {selectedBookings.length} booking(s)?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowBulkApproveModal(false)} disabled={actionLoading}>
                Cancel
              </button>
              <button className="btn-approve" onClick={handleBulkApprove} disabled={actionLoading}>
                {actionLoading ? 'Approving...' : `Approve ${selectedBookings.length} Booking(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteBooking && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteBooking(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Booking</h3>
              <button className="modal-close" onClick={() => setConfirmDeleteBooking(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this booking?</p>
              <div className="booking-info">
                <p><strong>User:</strong> {confirmDeleteBooking.userName}</p>
                <p><strong>Room:</strong> {confirmDeleteBooking.roomName}</p>
                <p><strong>Time:</strong> {formatBookingDate(confirmDeleteBooking.startTime)}</p>
              </div>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setConfirmDeleteBooking(null)}>
                Cancel
              </button>
              <button className="btn-delete" onClick={() => handleDeleteBooking(confirmDeleteBooking.id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingList;
