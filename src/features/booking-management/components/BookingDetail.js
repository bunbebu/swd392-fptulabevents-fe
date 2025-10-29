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
import { BookingStatusForm } from '../admin';

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
  const [showStatusForm, setShowStatusForm] = useState(false);
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

  const handleStatusUpdate = async (formData) => {
    try {
      setActionLoading(true);
      await bookingApi.updateBookingStatus(bookingId, {
        status: formData.status,
        notes: formData.notes || 'Status updated by admin'
      });
      setShowStatusForm(false);
      showToast('Booking status updated successfully!', 'success');

      // Reload booking data
      const updatedBooking = await bookingApi.getBookingById(bookingId);
      setBooking(updatedBooking);
    } catch (err) {
      showToast(err.message || 'Failed to update booking status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case BOOKING_STATUS.PENDING:
        return 'status-badge status-pending';
      case BOOKING_STATUS.APPROVED:
        return 'status-badge status-available';
      case BOOKING_STATUS.REJECTED:
        return 'status-badge status-unavailable';
      case BOOKING_STATUS.CANCELLED:
        return 'status-badge status-maintenance';
      case BOOKING_STATUS.COMPLETED:
        return 'status-badge status-occupied';
      default:
        return 'status-badge';
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
      <div className="create-booking-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={onNavigateBack}
              title="Back to Booking List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Booking Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="loading">Loading booking details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="create-booking-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={onNavigateBack}
              title="Back to Booking List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Booking Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="error-message">
            {error}
            <div className="error-actions">
              <button onClick={onNavigateBack} className="btn btn-primary">
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="create-booking-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={onNavigateBack}
              title="Back to Booking List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Booking Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="no-data">Booking not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-booking-page">
      <style>{`
        .detail-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          padding: 1rem 0;
        }
        .action-card {
          display: flex;
          align-items: center;
          padding: 1.25rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }
        .action-card:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .action-card:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .action-card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 0.5rem;
          margin-right: 1rem;
          flex-shrink: 0;
        }
        .action-card-approve {
          border-color: #d1fae5;
        }
        .action-card-approve .action-card-icon {
          background: #d1fae5;
          color: #059669;
        }
        .action-card-reject {
          border-color: #fef3c7;
        }
        .action-card-reject .action-card-icon {
          background: #fef3c7;
          color: #d97706;
        }
        .action-card-update {
          border-color: #dbeafe;
        }
        .action-card-update .action-card-icon {
          background: #dbeafe;
          color: #2563eb;
        }
        .action-card-delete {
          border-color: #fee2e2;
        }
        .action-card-delete .action-card-icon {
          background: #fee2e2;
          color: #dc2626;
        }
        .action-card-content {
          flex: 1;
        }
        .action-card-title {
          display: block;
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }
        .action-card-desc {
          display: block;
          font-size: 0.875rem;
          color: #6b7280;
        }
      `}</style>
      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div className="header-content">
          <button 
            className="back-button"
            onClick={onNavigateBack}
            title="Back to Booking List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1>Booking Details</h1>
        </div>
      </div>

      <div className="page-content">
        <div className="room-detail-content">
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Basic Information</h3>
              <span className={getStatusBadgeClass(booking.status)}>
                {getBookingStatusLabel(booking.status)}
              </span>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Booking ID:</label>
                <span className="detail-value">{booking.id}</span>
              </div>
              <div className="detail-item">
                <label>User:</label>
                <span className="detail-value">{booking.userName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Room:</label>
                <span className="detail-value">{booking.roomName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Purpose:</label>
                <span className="detail-value">{booking.purpose || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Start Time:</label>
                <span className="detail-value">{formatBookingDate(booking.startTime)}</span>
              </div>
              <div className="detail-item">
                <label>End Time:</label>
                <span className="detail-value">{formatBookingDate(booking.endTime)}</span>
              </div>
              <div className="detail-item">
                <label>Duration:</label>
                <span className="detail-value">{getBookingDuration(booking.startTime, booking.endTime)} hours</span>
              </div>
              <div className="detail-item">
                <label>Created At:</label>
                <span className="detail-value">{formatDate(booking.createdAt)}</span>
              </div>
              {booking.eventId && (
                <div className="detail-item">
                  <label>Event ID:</label>
                  <span className="detail-value">{booking.eventId}</span>
                </div>
              )}
              {booking.notes && (
                <div className="detail-item full-width">
                  <label>Notes:</label>
                  <span className="detail-value">{booking.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons for Admin */}
          {isAdmin && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Actions</h3>
              </div>
              <div className="detail-card-body">
                <div className="detail-actions-grid">
                  <button
                    className="action-card action-card-update"
                    onClick={() => setShowStatusForm(true)}
                    disabled={actionLoading}
                  >
                    <div className="action-card-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12l2 2 4-4"/>
                        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                      </svg>
                    </div>
                    <div className="action-card-content">
                      <span className="action-card-title">Update Status</span>
                      <span className="action-card-desc">Change booking status</span>
                    </div>
                  </button>

                  {canApproveBooking(booking.status) && (
                  <button
                    className="action-card action-card-approve"
                    onClick={() => setShowApproveModal(true)}
                    disabled={actionLoading}
                  >
                    <div className="action-card-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <div className="action-card-content">
                      <span className="action-card-title">Approve Booking</span>
                      <span className="action-card-desc">Accept this booking request</span>
                    </div>
                  </button>
                  )}

                  {canRejectBooking(booking.status) && (
                    <button
                      className="action-card action-card-reject"
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                    >
                      <div className="action-card-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </div>
                      <div className="action-card-content">
                        <span className="action-card-title">Reject Booking</span>
                        <span className="action-card-desc">Decline this booking request</span>
                      </div>
                    </button>
                  )}

                  {canDeleteBooking(booking.status) && (
                    <button
                      className="action-card action-card-delete"
                      onClick={() => setShowDeleteModal(true)}
                      disabled={actionLoading}
                    >
                      <div className="action-card-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </div>
                      <div className="action-card-content">
                        <span className="action-card-title">Delete Booking</span>
                        <span className="action-card-desc">Remove this booking permanently</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
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
              <button className="btn-success" onClick={handleApprove} disabled={actionLoading}>
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
              <button className="btn-warning" onClick={handleReject} disabled={actionLoading || !rejectNotes}>
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
              <button className="btn-danger" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Form Modal */}
      {showStatusForm && (
        <BookingStatusForm
          booking={booking}
          onSubmit={handleStatusUpdate}
          onCancel={() => setShowStatusForm(false)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default BookingDetail;
