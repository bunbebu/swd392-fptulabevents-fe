import React, { useState, useEffect, useCallback } from 'react';
import { bookingApi, equipmentApi } from '../../../api';

/**
 * Booking Approval Management for Lecturers
 *
 * Features:
 * - View pending lab bookings
 * - Filter by lab, date, status
 * - Check equipment availability before approval
 * - Approve/Reject bookings with notes
 * - Bulk approve multiple bookings
 */
const BookingApprovalManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    roomId: '',
    status: '0', // Default to Pending (0)
    from: '',
    to: ''
  });

  // Modal states
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  // Approval modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null); // 'approve' or 'reject'
  const [approvalNotes, setApprovalNotes] = useState('');

  // Bulk selection
  const [selectedBookingIds, setSelectedBookingIds] = useState([]);

  // Helper to show toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Format date
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

  // Get status badge class and label
  const getStatusInfo = (status) => {
    const statusMap = {
      0: { label: 'Pending', class: 'pending' },
      1: { label: 'Approved', class: 'active' },
      2: { label: 'Rejected', class: 'rejected' },
      3: { label: 'Cancelled', class: 'cancelled' },
      4: { label: 'Completed', class: 'completed' }
    };
    return statusMap[status] || { label: 'Unknown', class: 'unknown' };
  };

  // Load bookings
  const loadBookings = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page,
        pageSize: pageSize,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      console.log('Loading bookings with params:', params);
      const response = await bookingApi.getBookings(params);

      console.log('Bookings response:', response);

      // Handle response
      let bookingList = [];
      if (Array.isArray(response)) {
        bookingList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        bookingList = response.data;
      }

      setBookings(bookingList);

      // Calculate pagination
      const total = bookingList.length;
      setTotalPages(Math.max(1, Math.ceil(total / pageSize)));

    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load bookings. Please try again.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize]);

  useEffect(() => {
    loadBookings(currentPage);
  }, [loadBookings, currentPage]);

  // Check equipment availability for a room
  const checkEquipmentAvailability = async (booking) => {
    setSelectedBooking(booking);
    setShowEquipmentModal(true);
    setLoadingEquipment(true);

    try {
      const roomId = booking.roomId || booking.RoomId;
      const equipment = await equipmentApi.getEquipmentByRoom(roomId);

      let equipmentArray = [];
      if (Array.isArray(equipment)) {
        equipmentArray = equipment;
      } else if (equipment?.data && Array.isArray(equipment.data)) {
        equipmentArray = equipment.data;
      }

      setEquipmentList(equipmentArray);
    } catch (err) {
      console.error('Error loading equipment:', err);
      showToast('Failed to load equipment information', 'error');
      setEquipmentList([]);
    } finally {
      setLoadingEquipment(false);
    }
  };

  // Open approval modal
  const openApprovalModal = (booking, action) => {
    setSelectedBooking(booking);
    setApprovalAction(action);
    setApprovalNotes('');
    setShowApprovalModal(true);
  };

  // Handle approve/reject booking
  const handleApproveReject = async () => {
    if (!selectedBooking || !approvalAction) return;

    // Extra confirmation before submitting action
    const actionLabel = approvalAction === 'approve' ? 'Approve' : 'Reject';
    const confirmed = window.confirm(`Are you sure you want to ${actionLabel.toLowerCase()} this booking?`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const bookingId = selectedBooking.id || selectedBooking.Id;
      const newStatus = approvalAction === 'approve' ? 1 : 2; // 1=Approved, 2=Rejected

      await bookingApi.updateBookingStatus(bookingId, {
        status: newStatus,
        notes: approvalNotes
      });

      showToast(
        `Booking ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully!`,
        'success'
      );

      // Refresh bookings list
      await loadBookings(currentPage);

      // Close modal
      setShowApprovalModal(false);
      setSelectedBooking(null);
      setApprovalAction(null);
      setApprovalNotes('');
    } catch (err) {
      console.error('Error updating booking status:', err);
      showToast(
        err.message || `Failed to ${approvalAction} booking`,
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk approve bookings
  const handleBulkApprove = async () => {
    if (selectedBookingIds.length === 0) {
      showToast('Please select bookings to approve', 'error');
      return;
    }

    setActionLoading(true);
    try {
      // Approve each booking
      const promises = selectedBookingIds.map(id =>
        bookingApi.updateBookingStatus(id, {
          status: 1, // Approved
          notes: 'Bulk approved by lecturer'
        })
      );

      await Promise.all(promises);

      showToast(`${selectedBookingIds.length} booking(s) approved successfully!`, 'success');

      // Clear selection and refresh
      setSelectedBookingIds([]);
      await loadBookings(currentPage);
    } catch (err) {
      console.error('Error bulk approving bookings:', err);
      showToast('Failed to approve some bookings', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle booking selection
  const toggleBookingSelection = (bookingId) => {
    setSelectedBookingIds(prev => {
      if (prev.includes(bookingId)) {
        return prev.filter(id => id !== bookingId);
      } else {
        return [...prev, bookingId];
      }
    });
  };

  // Select all visible bookings
  const toggleSelectAll = () => {
    if (selectedBookingIds.length === bookings.length) {
      setSelectedBookingIds([]);
    } else {
      setSelectedBookingIds(bookings.map(b => b.id || b.Id));
    }
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    loadBookings(1);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      roomId: '',
      status: '0',
      from: '',
      to: ''
    });
    setCurrentPage(1);
  };

  if (loading && bookings.length === 0) {
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
      <div className="room-list-header">
        <h2>Booking Approvals</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {selectedBookingIds.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={handleBulkApprove}
              disabled={actionLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Bulk Approve ({selectedBookingIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
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
        <div className="error-message">
          {error}
          <button onClick={() => loadBookings()} className="btn btn-secondary">
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="filter-controls">
        <div className="filter-row">
          <div className="filter-group">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="0">Pending</option>
              <option value="1">Approved</option>
              <option value="2">Rejected</option>
              <option value="3">Cancelled</option>
              <option value="4">Completed</option>
            </select>
          </div>

          <div className="filter-group">
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
              className="filter-input"
              placeholder="From Date"
            />
          </div>

          <div className="filter-group">
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
              className="filter-input"
              placeholder="To Date"
            />
          </div>

          <div className="filter-actions">
            <button className="btn btn-primary" onClick={applyFilters}>
              Apply Filters
            </button>
            <button className="btn btn-secondary" onClick={clearFilters}>
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="room-list-stats">
        <span>Total bookings: {bookings.length}</span>
        <span>Page {currentPage} / {totalPages}</span>
      </div>

      {/* Bookings Table */}
      <div className="room-table-container">
        <table className="room-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectedBookingIds.length === bookings.length && bookings.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>User</th>
              <th>Room/Lab</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  No bookings found
                </td>
              </tr>
            ) : (
              bookings.map((booking) => {
                const bookingId = booking.id || booking.Id;
                const userId = booking.userId || booking.UserId;
                const userName = booking.userName || booking.UserName || `User ${userId}`;
                const roomId = booking.roomId || booking.RoomId;
                const roomName = booking.roomName || booking.RoomName || `Room ${roomId}`;
                const startTime = booking.startTime || booking.StartTime;
                const endTime = booking.endTime || booking.EndTime;
                const status = booking.status !== undefined ? booking.status : booking.Status;
                const statusInfo = getStatusInfo(status);

                return (
                  <tr key={bookingId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedBookingIds.includes(bookingId)}
                        onChange={() => toggleBookingSelection(bookingId)}
                        disabled={status !== 0} // Only allow selection of pending bookings
                      />
                    </td>
                    <td>{userName}</td>
                    <td>{roomName}</td>
                    <td>{formatDate(startTime)}</td>
                    <td>{formatDate(endTime)}</td>
                    <td>
                      <span
                        className={`status-badge status-${statusInfo.class}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {/* Check Equipment Button */}
                        <button
                          className="btn btn-sm btn-icon btn-icon-outline color-blue"
                          onClick={() => checkEquipmentAvailability(booking)}
                          title="Check Equipment"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                          </svg>
                        </button>

                        {/* Approve Button - Only for Pending */}
                        {status === 0 && (
                          <>
                            <button
                              className="btn btn-sm btn-icon btn-icon-outline color-green"
                              onClick={() => openApprovalModal(booking, 'approve')}
                              disabled={actionLoading}
                              title="Approve"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </button>

                            <button
                              className="btn btn-sm btn-icon btn-icon-outline color-red"
                              onClick={() => openApprovalModal(booking, 'reject')}
                              disabled={actionLoading}
                              title="Reject"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="page-info">
          Page {currentPage} / {totalPages}
        </span>
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* Equipment Availability Modal */}
      {showEquipmentModal && (
        <div className="modal-overlay" onClick={() => setShowEquipmentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Equipment Availability</h3>
              <button
                className="modal-close"
                onClick={() => setShowEquipmentModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {loadingEquipment ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="loading-spinner"></div>
                  Loading equipment...
                </div>
              ) : equipmentList.length === 0 ? (
                <p>No equipment found for this room.</p>
              ) : (
                <table className="room-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipmentList.map(eq => {
                      const eqId = eq.id || eq.Id;
                      const name = eq.name || eq.Name || 'Unknown';
                      const type = eq.type || eq.Type || 'N/A';
                      const status = eq.status !== undefined ? eq.status : eq.Status;

                      return (
                        <tr key={eqId}>
                          <td>{name}</td>
                          <td>{type}</td>
                          <td>
                            <span className={`status-badge status-${status === 0 ? 'available' : 'unavailable'}`}>
                              {status === 0 ? 'Available' : status === 1 ? 'In Use' : 'Maintenance'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowEquipmentModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {showApprovalModal && (
        <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{approvalAction === 'approve' ? 'Approve Booking' : 'Reject Booking'}</h3>
              <button
                className="modal-close"
                onClick={() => setShowApprovalModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to {approvalAction} this booking?
              </p>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Notes (Optional):
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes or reason..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowApprovalModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={`btn ${approvalAction === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                onClick={handleApproveReject}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : (approvalAction === 'approve' ? 'Approve' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingApprovalManagement;
