import React, { useState, useEffect, useCallback } from 'react';
import { eventApi } from '../../../api';

/**
 * Event Detail Component
 * Displays detailed information about a specific event
 * 
 * Related User Stories:
 * - US-XX: Admin - Manage events
 * - US-XX: User - View event details
 */
const EventDetail = ({ eventId, onNavigateBack, onEditEvent, userRole = 'Student' }) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editHover, setEditHover] = useState(false);
  const [deleteHover, setDeleteHover] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const isAdmin = userRole === 'Admin';

  const loadEventDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const detail = await eventApi.getEventById(eventId);
      const data = (detail && (detail.data || detail.Data)) || detail;
      setEvent(data);
    } catch (err) {
      console.error('Error loading event details:', err);
      setError(err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadEventDetail();
  }, [eventId, loadEventDetail]);

  const getStatusBadgeClass = (status) => {
    switch (status?.toString()) {
      case 'Active':
        return 'status-badge status-available';
      case 'Inactive':
        return 'status-badge status-unavailable';
      case 'Cancelled':
        return 'status-badge status-maintenance';
      case 'Completed':
        return 'status-badge status-occupied';
      default:
        return 'status-badge unknown';
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

  const handleDeleteEvent = async () => {
    setDeleting(true);
    try {
      console.log('Attempting to delete event:', eventId);
      await eventApi.deleteEvent(eventId, true);
      // Navigate back after successful deletion
      if (onNavigateBack) {
        onNavigateBack();
      }
    } catch (err) {
      console.error('Delete error:', err);
      let errorMessage = 'Failed to delete event';

      // Check for validation errors from backend
      if (err.data?.errors || err.details) {
        const errors = err.data?.errors || err.details;
        const errorMessages = [];
        if (typeof errors === 'object') {
          Object.keys(errors).forEach(key => {
            const messages = errors[key];
            if (Array.isArray(messages)) {
              errorMessages.push(...messages);
            } else if (typeof messages === 'string') {
              errorMessages.push(messages);
            }
          });
        }
        if (errorMessages.length > 0) {
          errorMessage = errorMessages[0];
        }
      }

      // Check err.data for backend message
      if (!errorMessage || errorMessage === 'Failed to delete event') {
        if (err.data?.title) {
          errorMessage = err.data.title;
        } else if (err.data?.Message || err.data?.message) {
          errorMessage = err.data.Message || err.data.message;
        } else if (err.message && err.message !== 'Request failed (400)') {
          errorMessage = err.message;
        }
      }

      // Check for specific error patterns
      if (
        errorMessage.includes('entity changes') ||
        errorMessage.includes('foreign key') ||
        errorMessage.includes('constraint') ||
        errorMessage.includes('booking') ||
        errorMessage.includes('related data')
      ) {
        errorMessage = 'Cannot delete event: This event has related data that must be removed first. This may include:\n• Bookings\n• Notifications\n• Reports\n• Other linked records\n\nPlease check and remove all dependencies through their respective management pages before deleting this event.';
      } else if (errorMessage.includes('validation error')) {
        errorMessage = `Cannot delete event: ${errorMessage}`;
      } else if (err.status === 400) {
        if (errorMessage === 'Failed to delete event' || errorMessage.includes('Request failed')) {
          errorMessage = 'Cannot delete event: The server rejected this request. This event may have related data that needs to be removed first.';
        } else if (!errorMessage.includes('Cannot delete')) {
          errorMessage = `Cannot delete event: ${errorMessage}`;
        }
      } else if (err.status === 404) {
        errorMessage = 'Event not found';
      } else if (err.status === 401) {
        errorMessage = 'Authentication required';
      } else if (err.status === 403) {
        errorMessage = 'You do not have permission to delete this event';
      }

      setError(errorMessage);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="create-room-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={onNavigateBack}
              title="Back to Event List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Event Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="loading">Loading event details...</div>
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
              title="Back to Event List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Event Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="error-message">
            {error}
            <div className="error-actions">
              <button onClick={loadEventDetail} className="btn btn-primary">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="create-room-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={onNavigateBack}
              title="Back to Event List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Event Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="no-data">Event not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-room-page">
      <div className="page-header">
        <div className="header-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <button 
            className="back-button"
            onClick={onNavigateBack}
            title="Back to Event List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1 style={{ margin: 0, flex: '1 1 auto' }}>Event Details</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {onEditEvent && (
              <button
                className="btn"
                onClick={() => onEditEvent(eventId)}
                onMouseEnter={() => setEditHover(true)}
                onMouseLeave={() => setEditHover(false)}
                title="Edit Event"
                style={{
                  background: editHover ? '#2563eb' : '#60a5fa',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  boxShadow: editHover ? '0 2px 6px rgba(37, 99, 235, 0.4)' : '0 2px 6px rgba(96, 165, 250, 0.35)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>
                Edit
              </button>
            )}
            {isAdmin && (
              <button
                className="btn"
                onClick={() => setShowDeleteModal(true)}
                onMouseEnter={() => setDeleteHover(true)}
                onMouseLeave={() => setDeleteHover(false)}
                disabled={deleting}
                title="Delete Event"
                style={{
                  background: deleteHover ? '#dc2626' : '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                  boxShadow: deleteHover ? '0 2px 6px rgba(220, 38, 38, 0.4)' : '0 2px 6px rgba(239, 68, 68, 0.35)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                  <path d="M10 11v6"></path>
                  <path d="M14 11v6"></path>
                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="room-detail-content">
        <div className="detail-card">
          <div className="detail-card-header">
            <h3>Basic Information</h3>
            <span className={getStatusBadgeClass(event.status)}>
              {event.status || 'Unknown'}
            </span>
          </div>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Event Title:</label>
              <span className="detail-value">{event.title}</span>
            </div>
            <div className="detail-item">
              <label>Location:</label>
              <span className="detail-value">{event.location || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Start Date:</label>
              <span className="detail-value">{formatDate(event.startDate)}</span>
            </div>
            <div className="detail-item">
              <label>End Date:</label>
              <span className="detail-value">{formatDate(event.endDate)}</span>
            </div>
            <div className="detail-item">
              <label>Capacity:</label>
              <span className="detail-value">{typeof event.capacity === 'number' ? `${event.capacity} people` : 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Lab:</label>
              <span className="detail-value">{event.labName || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Room:</label>
              <span className="detail-value">{event.roomName || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Created By:</label>
              <span className="detail-value">{event.createdBy || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Visibility:</label>
              <span className="detail-value">{event.visibility ? 'Public' : 'Private'}</span>
            </div>
            <div className="detail-item">
              <label>Booking Count:</label>
              <span className="detail-value">{event.bookingCount || 0}</span>
            </div>
            <div className="detail-item">
              <label>Is Upcoming:</label>
              <span className="detail-value">{event.isUpcoming ? 'Yes' : 'No'}</span>
            </div>
            <div className="detail-item">
              <label>Created At:</label>
              <span className="detail-value">{formatDate(event.createdAt)}</span>
            </div>
            <div className="detail-item">
              <label>Last Updated:</label>
              <span className="detail-value">{formatDate(event.lastUpdatedAt)}</span>
            </div>
            {event.description && (
              <div className="detail-item full-width">
                <label>Description:</label>
                <span className="detail-value">{event.description}</span>
              </div>
            )}
            {event.recurrenceRule && (
              <div className="detail-item full-width">
                <label>Recurrence Rule:</label>
                <span className="detail-value">{event.recurrenceRule}</span>
              </div>
            )}
          </div>
        </div>

        {event.imageUrl && (
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Event Cover Image</h3>
            </div>
            <div className="room-image-container">
              <img src={event.imageUrl} alt={event.title} className="room-image" />
            </div>
          </div>
        )}

        {event.roomSlots && event.roomSlots.length > 0 && (
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Reserved Room Slots ({event.roomSlots.length})</h3>
            </div>
            <div className="slot-summary-list">
              {event.roomSlots.map((slot) => (
                <div key={slot.id} className="slot-summary-item">
                  <span className="slot-date">{slot.dateFormatted || formatDate(slot.date)}</span>
                  <span className="slot-time">{slot.timeRange}</span>
                  <span className="slot-room">{slot.roomName || event.roomName || 'Room'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookings List */}
        {event.bookings && event.bookings.length > 0 && (
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Bookings ({event.bookings.length})</h3>
            </div>
            <div className="bookings-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Room</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Purpose</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {event.bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.userName}</td>
                      <td>{booking.roomName}</td>
                      <td>{formatDate(booking.startTime)}</td>
                      <td>{formatDate(booking.endTime)}</td>
                      <td>{booking.purpose}</td>
                      <td>
                        <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && event && (
        <div className="modal-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete event <strong>{event.title || event.Title}</strong>?</p>

              {/* Warning for any potential dependencies */}
              <div style={{
                padding: '12px',
                backgroundColor: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '6px',
                marginTop: '12px',
                marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#92400E', display: 'block', marginBottom: '4px' }}>Important Notice</strong>
                    {event.bookingCount > 0 ? (
                      <p style={{ color: '#92400E', fontSize: '14px', margin: 0 }}>
                        This event has <strong>{event.bookingCount} booking(s)</strong>. You must cancel or delete all bookings before deleting this event.
                      </p>
                    ) : (
                      <p style={{ color: '#92400E', fontSize: '14px', margin: 0 }}>
                        This event may have related data (notifications, reports, or other records). If deletion fails, you may need to remove these dependencies first through their respective management pages.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-muted small">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              {event.bookingCount > 0 ? (
                <button
                  className="btn btn-danger"
                  disabled={true}
                  title="Cannot delete event with existing bookings"
                  style={{ cursor: 'not-allowed', opacity: 0.5 }}
                >
                  Cannot Delete (Has Bookings)
                </button>
              ) : (
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteEvent}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;

