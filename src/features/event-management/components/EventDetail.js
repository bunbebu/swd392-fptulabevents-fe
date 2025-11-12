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
const EventDetail = ({ eventId, onNavigateBack, onEditEvent }) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editHover, setEditHover] = useState(false);

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
    </div>
  );
};

export default EventDetail;

