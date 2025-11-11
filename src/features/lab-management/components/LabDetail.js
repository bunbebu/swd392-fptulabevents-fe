import React, { useState, useEffect, useCallback } from 'react';
import { labsApi, bookingApi } from '../../../api';
import LabMemberList from './LabMemberList';
import BookingForm from '../../booking-management/student/BookingForm';

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

  // Favorite state for student view
  const [isFavorite, setIsFavorite] = useState(false);

  // Booking modal states
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

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

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };

  // Handle booking submission
  const handleBookingSubmit = async (bookingData) => {
    try {
      setIsSubmittingBooking(true);

      console.log('Submitting booking:', bookingData);
      console.log('Booking API endpoint: POST /api/Bookings');

      const result = await bookingApi.createBooking(bookingData);
      console.log('Booking created successfully:', result);

      // Close modal immediately
      setIsBookingModalOpen(false);

      // Show success toast notification
      showToast('Booking submitted successfully! Your booking is pending approval.', 'success');

    } catch (err) {
      console.error('Error creating booking:', err);
      console.error('Error status:', err.status);
      console.error('Error data:', err.data);
      console.error('Error details:', err.details);

      // Provide more detailed error message
      let errorMessage = 'Failed to create booking. ';

      if (err.status === 0) {
        errorMessage += 'Unable to connect to server. Please check your network connection.';
      } else if (err.status === 401) {
        errorMessage += 'You are not authorized. Please login again.';
      } else if (err.status === 400) {
        errorMessage += err.message || 'Invalid booking data.';
      } else if (err.status === 409) {
        errorMessage += 'Room is already booked for this time slot.';
      } else {
        errorMessage += err.message || 'Please try again.';
      }

      // Show error toast notification
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Open booking modal
  const handleOpenBookingModal = () => {
    setToast(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labId]);

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
                    <span className="detail-value">
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
            setToast(null);
          }}
          onSubmit={handleBookingSubmit}
          roomInfo={{
            id: lab.room?.id || lab.room?.Id || lab.Room?.id || lab.Room?.Id,
            name: lab.room?.name || lab.room?.Name || lab.Room?.name || lab.Room?.Name || lab.name || 'Lab'
          }}
          isSubmitting={isSubmittingBooking}
        />
      )}
    </div>
  );
};

export default LabDetail;

