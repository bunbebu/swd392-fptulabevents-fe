import React, { useState, useEffect, useCallback } from 'react';
import { labsApi, bookingApi } from '../../../api';
import LabMemberList from './LabMemberList';
import BookingForm from './BookingForm';

/**
 * Lab Detail Component
 * Displays detailed information about a specific lab on a separate page
 * Includes integrated member management
 *
 * Related User Stories:
 * - US-09: Admin - Manage labs and equipment (includes lab member management)
 */
const LabDetail = ({ labId, onNavigateBack, isAdmin = false, userRole = 'Student' }) => {
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Calendar states for student view
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Booking modal states
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState(null); // { type: 'success' | 'error', text: string }

  const loadLabDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const detail = await labsApi.getLabById(labId);
      const data = (detail && (detail.data || detail.Data)) || detail;
      setLab(data);
    } catch (err) {
      console.error('Error loading lab details:', err);
      setError(err.message || 'Failed to load lab details');
    } finally {
      setLoading(false);
    }
  }, [labId]);

  // Load bookings for a specific date
  const loadBookingsForDate = async (roomId, date) => {
    try {
      setLoadingBookings(true);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const response = await bookingApi.getBookings({
        roomId: roomId,
        from: startOfDay.toISOString(),
        to: endOfDay.toISOString()
      });
      
      const bookingsData = Array.isArray(response) ? response : (response?.data || []);
      setBookings(bookingsData);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Save to localStorage or API
    const favorites = JSON.parse(localStorage.getItem('favoriteLabs') || '[]');
    if (!isFavorite) {
      favorites.push(labId);
    } else {
      const index = favorites.indexOf(labId);
      if (index > -1) favorites.splice(index, 1);
    }
    localStorage.setItem('favoriteLabs', JSON.stringify(favorites));
  };

  // Handle booking submission
  const handleBookingSubmit = async (bookingData) => {
    try {
      setIsSubmittingBooking(true);
      setBookingMessage(null);

      console.log('Submitting booking:', bookingData);
      const result = await bookingApi.createBooking(bookingData);
      console.log('Booking created successfully:', result);

      setBookingMessage({
        type: 'success',
        text: 'Booking submitted successfully! Your booking is pending approval.'
      });

      // Close modal after a short delay
      setTimeout(() => {
        setIsBookingModalOpen(false);
        // Reload bookings if we're showing them
        if (lab?.room?.id) {
          loadBookingsForDate(lab.room.id, selectedDate);
        }
      }, 1500);

    } catch (err) {
      console.error('Error creating booking:', err);
      setBookingMessage({
        type: 'error',
        text: err.message || 'Failed to create booking. Please try again.'
      });
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Open booking modal
  const handleOpenBookingModal = () => {
    setBookingMessage(null);
    setIsBookingModalOpen(true);
  };

  // Load favorites from localStorage
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoriteLabs') || '[]');
    setIsFavorite(favorites.includes(labId));
  }, [labId]);

  // Load lab details
  useEffect(() => {
    loadLabDetail();
  }, [labId]);

  // Load bookings when date changes (for student view)
  useEffect(() => {
    const roomId = lab?.room?.id || lab?.room?.Id || lab?.Room?.id || lab?.Room?.Id;
    if (!isAdmin && roomId) {
      loadBookingsForDate(roomId, selectedDate);
    }
  }, [selectedDate, lab?.room?.id, lab?.room?.Id, lab?.Room?.id, lab?.Room?.Id, isAdmin, loadBookingsForDate]);

  const getStatusBadgeClass = (status) => {
    switch (status?.toString()) {
      case 'Active':
        return 'status-badge status-available';
      case 'Inactive':
        return 'status-badge status-maintenance';
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

  // Render calendar slots for student view
  const renderCalendarSlots = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const slots = Array.from({ length: 48 }, (_, i) => ({
      hour: Math.floor(i / 2),
      minute: (i % 2) * 30,
      isOccupied: false
    }));

    // Mark occupied slots based on bookings
    bookings.forEach(booking => {
      const startTime = new Date(booking.StartTime || booking.startTime);
      const endTime = new Date(booking.EndTime || booking.endTime);
      
      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();
      const endHour = endTime.getHours();
      const endMinute = endTime.getMinutes();
      
      slots.forEach(slot => {
        const slotTime = slot.hour * 60 + slot.minute;
        const startSlotTime = startHour * 60 + startMinute;
        const endSlotTime = endHour * 60 + endMinute;
        
        if (slotTime >= startSlotTime && slotTime < endSlotTime) {
          slot.isOccupied = true;
        }
      });
    });

    return (
      <div className="calendar-slots">
        {hours.map(hour => (
          <div key={hour} className="hour-row">
            <div className="hour-label">{hour.toString().padStart(2, '0')}:00</div>
            <div className="hour-slots">
              {slots.filter(s => s.hour === hour).map((slot, idx) => (
                <div
                  key={`${hour}-${idx}`}
                  className={`time-slot ${slot.isOccupied ? 'occupied' : 'available'}`}
                  title={slot.isOccupied ? 'Occupied' : 'Available'}
                >
                  {idx === 0 ? '00' : '30'}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="create-room-page">
        {/* Admin: Show header with title and back button */}
        {isAdmin && (
          <div className="page-header">
            <div className="header-content">
              <button
                className="back-button"
                onClick={onNavigateBack}
                title="Back to Lab List"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5"></path>
                  <path d="M12 19l-7-7 7-7"></path>
                </svg>
              </button>
              <h1>Lab Details</h1>
            </div>
          </div>
        )}
        <div className="page-content">
          <div className="loading">Loading lab details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="create-room-page">
        {/* Admin: Show header with title and back button */}
        {isAdmin && (
          <div className="page-header">
            <div className="header-content">
              <button
                className="back-button"
                onClick={onNavigateBack}
                title="Back to Lab List"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5"></path>
                  <path d="M12 19l-7-7 7-7"></path>
                </svg>
              </button>
              <h1>Lab Details</h1>
            </div>
          </div>
        )}
        <div className="page-content">
          <div className="error-message">
            {error}
            <div className="error-actions">
              <button onClick={loadLabDetail} className="btn btn-primary">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="create-room-page">
        {/* Admin: Show header with title and back button */}
        {isAdmin && (
          <div className="page-header">
            <div className="header-content">
              <button
                className="back-button"
                onClick={onNavigateBack}
                title="Back to Lab List"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5"></path>
                  <path d="M12 19l-7-7 7-7"></path>
                </svg>
              </button>
              <h1>Lab Details</h1>
            </div>
          </div>
        )}
        <div className="page-content">
          <div className="no-data">Lab not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-room-page">
      {/* Admin: Show header with title and back button */}
      {isAdmin && (
        <div className="page-header">
          <div className="header-content">
            <button
              className="back-button"
              onClick={onNavigateBack}
              title="Back to Lab List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Lab Details</h1>
          </div>
        </div>
      )}

      <div className="page-content">
        <div className="room-detail-content">
        <div className="detail-card">
          <div className="detail-card-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <h3>Basic Information</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Booking and Favorite buttons for student mode */}
                {!isAdmin && (
                  <>
                    {(lab?.room?.id || lab?.room?.Id || lab?.Room?.id || lab?.Room?.Id) && (
                      <button
                        onClick={handleOpenBookingModal}
                        className="booking-btn"
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#3b82f6',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease'
                        }}
                        title="Book this lab"
                        onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Book Lab
                      </button>
                    )}
                    <button
                      onClick={toggleFavorite}
                      className="favorite-btn"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: isFavorite ? '#fef3c7' : '#f3f4f6',
                        color: isFavorite ? '#f59e0b' : '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      {isFavorite ? 'Favorited' : 'Favorite'}
                    </button>
                  </>
                )}
                <span className={getStatusBadgeClass(lab.status)}>
                  {lab.status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Lab Name:</label>
              <span className="detail-value">{lab.name}</span>
            </div>
            <div className="detail-item">
              <label>Location:</label>
              <span className="detail-value">{lab.location || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Capacity:</label>
              <span className="detail-value">{lab.capacity} people</span>
            </div>
            <div className="detail-item">
              <label>Member Count:</label>
              <span className="detail-value">{lab.memberCount || 0}</span>
            </div>
            <div className="detail-item">
              <label>Equipment Count:</label>
              <span className="detail-value">{lab.equipmentCount || 0}</span>
            </div>
            <div className="detail-item">
              <label>Active Bookings:</label>
              <span className="detail-value">{lab.activeBookings || 0}</span>
            </div>
            <div className="detail-item">
              <label>Created At:</label>
              <span className="detail-value">{formatDate(lab.createdAt)}</span>
            </div>
            <div className="detail-item">
              <label>Last Updated:</label>
              <span className="detail-value">{formatDate(lab.lastUpdatedAt)}</span>
            </div>
            {lab.description && (
              <div className="detail-item full-width">
                <label>Description:</label>
                <span className="detail-value">{lab.description}</span>
              </div>
            )}
          </div>
        </div>

        {/* Room Information */}
        <div className="detail-card">
          <div className="detail-card-header">
            <h3>Room Information</h3>
          </div>
          {(lab.room || lab.Room || lab.roomName || lab.RoomName) ? (
            <div className="detail-grid">
              <div className="detail-item">
                <label>Room Name:</label>
                <span className="detail-value">{lab.room?.name || lab.room?.Name || lab.Room?.name || lab.Room?.Name || lab.roomName || lab.RoomName || 'N/A'}</span>
              </div>
              {(lab.room || lab.Room) && (
                <>
                  <div className="detail-item">
                    <label>Room Location:</label>
                    <span className="detail-value">{lab.room?.location || lab.room?.Location || lab.Room?.location || lab.Room?.Location || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Room Capacity:</label>
                    <span className="detail-value">{lab.room?.capacity || lab.room?.Capacity || lab.Room?.capacity || lab.Room?.Capacity || 0} people</span>
                  </div>
                  <div className="detail-item">
                    <label>Room Status:</label>
                    <span className={getStatusBadgeClass(lab.room?.status || lab.room?.Status || lab.Room?.status || lab.Room?.Status)}>
                      {lab.room?.status || lab.room?.Status || lab.Room?.status || lab.Room?.Status || 'Unknown'}
                    </span>
                  </div>
                  {(lab.room?.description || lab.room?.Description || lab.Room?.description || lab.Room?.Description) && (
                    <div className="detail-item full-width">
                      <label>Room Description:</label>
                      <span className="detail-value">{lab.room?.description || lab.room?.Description || lab.Room?.description || lab.Room?.Description}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="detail-grid">
              <div className="detail-item full-width">
                <span className="detail-value" style={{ color: '#ef4444', fontStyle: 'italic' }}>
                  No room assigned to this lab
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Members Management - Admin Only */}
        {isAdmin && (
          <div className="detail-card">
            <LabMemberList labId={labId} isAdmin={isAdmin} />
          </div>
        )}

        {/* Equipment List */}
        {lab.equipments && lab.equipments.length > 0 && (
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Equipment ({lab.equipments.length})</h3>
            </div>
            <div className="equipment-list">
              {lab.equipments.map((equipment) => (
                <div key={equipment.id} className="equipment-item">
                  <div className="equipment-info">
                    <span className="equipment-name">{equipment.name}</span>
                    <span className="equipment-type">{equipment.serialNumber}</span>
                  </div>
                  <span className={getStatusBadgeClass(equipment.status)}>
                    {equipment.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Bookings */}
        {lab.recentBookings && lab.recentBookings.length > 0 && (
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Recent Bookings ({lab.recentBookings.length})</h3>
            </div>
            <div className="bookings-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lab.recentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.userName}</td>
                      <td>{formatDate(booking.startTime)}</td>
                      <td>{formatDate(booking.endTime)}</td>
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

      {/* Booking Form */}
      {!isAdmin && (lab?.room?.id || lab?.room?.Id || lab?.Room?.id || lab?.Room?.Id) && (
        <BookingForm
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setBookingMessage(null);
          }}
          onSubmit={handleBookingSubmit}
          roomInfo={{
            id: lab.room?.id || lab.room?.Id || lab.Room?.id || lab.Room?.Id,
            name: lab.room?.name || lab.room?.Name || lab.Room?.name || lab.Room?.Name || lab.name || 'Lab'
          }}
          isSubmitting={isSubmittingBooking}
        />
      )}

      {/* Success/Error Message Toast */}
      {bookingMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 20px',
            borderRadius: '8px',
            background: bookingMessage.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 1001,
            maxWidth: '400px',
            animation: 'slideInRight 0.3s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {bookingMessage.type === 'success' ? (
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            ) : (
              <circle cx="12" cy="12" r="10"></circle>
            )}
            {bookingMessage.type === 'success' ? (
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            ) : (
              <>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </>
            )}
          </svg>
          <span>{bookingMessage.text}</span>
        </div>
      )}
    </div>
  );
};

export default LabDetail;

