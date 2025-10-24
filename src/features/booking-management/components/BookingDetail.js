import React, { useState, useEffect } from 'react';
import { bookingApi } from '../../../api';
import { 
  BOOKING_STATUS, 
  getBookingStatusLabel, 
  formatBookingDate,
  canApproveBooking,
  canRejectBooking,
  canDeleteBooking,
  getBookingDuration
} from '../../../constants/bookingConstants';

/**
 * Booking Detail Component
 * 
 * Displays detailed information about a booking on a separate page
 * Admin can approve, reject, or delete bookings from this view
 * 
 * Related User Stories:
 * - US-24: Admin - Bulk approve multiple bookings
 * - UC-04: Approve/Reject Booking
 */
const BookingDetail = ({ bookingId, onNavigateBack, userRole = 'Student' }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');

  const isAdmin = userRole === 'Admin';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const loadBooking = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await bookingApi.getBookingById(bookingId);
        setBooking(data);
      } catch (err) {
        console.error('Error loading booking:', err);
        setError(err.message || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await bookingApi.updateBookingStatus(bookingId, {
        status: BOOKING_STATUS.APPROVED,
        notes: approveNotes || 'Approved by admin'
      });
      setShowApproveModal(false);
      showToast('Booking approved successfully!', 'success');
      
      // Reload booking data
      const updatedBooking = await bookingApi.getBookingById(bookingId);
      setBooking(updatedBooking);
      setApproveNotes('');
    } catch (err) {
      showToast(err.message || 'Failed to approve booking', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await bookingApi.updateBookingStatus(bookingId, {
        status: BOOKING_STATUS.REJECTED,
        notes: rejectNotes || 'Rejected by admin'
      });
      setShowRejectModal(false);
      showToast('Booking rejected successfully!', 'success');
      
      // Reload booking data
      const updatedBooking = await bookingApi.getBookingById(bookingId);
      setBooking(updatedBooking);
      setRejectNotes('');
    } catch (err) {
      showToast(err.message || 'Failed to reject booking', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await bookingApi.deleteBooking(bookingId);
      showToast('Booking deleted successfully!', 'success');
      setTimeout(() => {
        onNavigateBack && onNavigateBack();
      }, 1000);
    } catch (err) {
      showToast(err.message || 'Failed to delete booking', 'error');
      setActionLoading(false);
    }
  };

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
      <div className="booking-detail-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading booking details...
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="booking-detail-container">
        <div className="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>{error || 'Booking not found'}</h3>
          <button className="btn-primary" onClick={onNavigateBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-detail-container">
      {/* Header */}
      <div className="detail-header">
        <button className="btn-back" onClick={onNavigateBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Bookings
        </button>
        <h1>Booking Details</h1>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Action Buttons */}
      {isAdmin && (
        <div className="detail-actions">
          {canApproveBooking(booking.status) && (
            <button 
              className="btn-approve"
              onClick={() => setShowApproveModal(true)}
              disabled={actionLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Approve Booking
            </button>
          )}
          
          {canRejectBooking(booking.status) && (
            <button 
              className="btn-reject"
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Reject Booking
            </button>
          )}
          
          {canDeleteBooking(booking.status) && (
            <button 
              className="btn-delete"
              onClick={() => setShowDeleteModal(true)}
              disabled={actionLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete Booking
            </button>
          )}
        </div>
      )}

      {/* Booking Information */}
      <div className="detail-content">
        {/* Status Card */}
        <div className="detail-card">
          <div className="detail-card-header">
            <h3>Status</h3>
          </div>
          <div className="detail-card-body">
            <span className={getStatusBadgeClass(booking.status)}>
              {getBookingStatusLabel(booking.status)}
            </span>
          </div>
        </div>

        {/* Basic Information */}
        <div className="detail-card">
          <div className="detail-card-header">
            <h3>Basic Information</h3>
          </div>
          <div className="detail-card-body">
            <div className="detail-row">
              <span className="detail-label">Booking ID:</span>
              <span className="detail-value">{booking.id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">User:</span>
              <span className="detail-value">{booking.userName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Room:</span>
              <span className="detail-value">{booking.roomName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Purpose:</span>
              <span className="detail-value">{booking.purpose || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Time Information */}
        <div className="detail-card">
          <div className="detail-card-header">
            <h3>Time Information</h3>
          </div>
          <div className="detail-card-body">
            <div className="detail-row">
              <span className="detail-label">Start Time:</span>
              <span className="detail-value">{formatBookingDate(booking.startTime)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">End Time:</span>
              <span className="detail-value">{formatBookingDate(booking.endTime)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Duration:</span>
              <span className="detail-value">{getBookingDuration(booking.startTime, booking.endTime)} hours</span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {(booking.eventId || booking.notes) && (
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Additional Information</h3>
            </div>
            <div className="detail-card-body">
              {booking.eventId && (
                <div className="detail-row">
                  <span className="detail-label">Event ID:</span>
                  <span className="detail-value">{booking.eventId}</span>
                </div>
              )}
              {booking.notes && (
                <div className="detail-row">
                  <span className="detail-label">Notes:</span>
                  <span className="detail-value">{booking.notes}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve Booking</h3>
              <button className="modal-close" onClick={() => setShowApproveModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to approve this booking?</p>
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
              <button className="btn-approve" onClick={handleApprove} disabled={actionLoading}>
                {actionLoading ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Booking</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to reject this booking?</p>
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
              <button className="btn-reject" onClick={handleReject} disabled={actionLoading || !rejectNotes}>
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Booking</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this booking?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={actionLoading}>
                Cancel
              </button>
              <button className="btn-delete" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetail;

