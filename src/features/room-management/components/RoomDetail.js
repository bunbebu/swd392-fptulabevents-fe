import React, { useState, useEffect, useCallback } from 'react';
import { roomsApi } from '../../../api';
import { EquipmentList } from '../../equipment-management';

/**
 * Room Detail Component
 * Displays detailed information about a specific room
 * 
 * Related User Stories:
 * - US-09: Admin - Manage labs and equipment
 * - US-22: Lecturer - View room availability before approving booking
 */
const RoomDetail = ({ roomId, onNavigateBack, userRole = 'Student' }) => {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateEquipment, setShowCreateEquipment] = useState(false);

  const loadRoomDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const detail = await roomsApi.getRoomById(roomId);
      const data = (detail && (detail.data || detail.Data)) || detail;
      
      // Calculate active bookings from recentBookings
      // Active bookings = approved bookings (not cancelled/rejected)
      // Backend may calculate "active" as "currently happening", but we want to show all approved bookings
      if (data && data.recentBookings && Array.isArray(data.recentBookings)) {
        const approvedBookings = data.recentBookings.filter(booking => {
          const status = (booking.status || booking.Status || '').toLowerCase();
          // Count bookings that are approved (status = 'approved' or '1')
          return status === 'approved' || status === '1';
        });
        // Update activeBookings to reflect the actual number of approved bookings
        if (approvedBookings.length > 0) {
          data.activeBookings = approvedBookings.length;
        }
      }
      
      setRoom(data);
    } catch (err) {
      console.error('Error loading room details:', err);
      setError(err.message || 'Failed to load room details');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadRoomDetail();
  }, [roomId, loadRoomDetail]);

  const getStatusBadgeClass = (status) => {
    switch (status?.toString()) {
      case 'Available':
        return 'status-badge status-available';
      case 'Occupied':
        return 'status-badge status-occupied';
      case 'Maintenance':
        return 'status-badge status-maintenance';
      case 'Unavailable':
        return 'status-badge status-unavailable';
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
              title="Back to Room List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Room Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="loading">Loading room details...</div>
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
              title="Back to Room List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Room Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="error-message">
            {error}
            <div className="error-actions">
              <button onClick={loadRoomDetail} className="btn btn-primary">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="create-room-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={onNavigateBack}
              title="Back to Room List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Room Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="no-data">Room not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-room-page">
      <div className="page-header">
        <div className="header-content">
          <button 
            className="back-button"
            onClick={onNavigateBack}
            title="Back to Room List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1>Room Details</h1>
        </div>
      </div>

      <div className="page-content">
        <div className="room-detail-content">
        <div className="detail-card">
          <div className="detail-card-header">
            <h3>Basic Information</h3>
            <span className={getStatusBadgeClass(room.status)}>
              {room.status || 'Unknown'}
            </span>
          </div>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Room Name:</label>
              <span className="detail-value">{room.name}</span>
            </div>
            <div className="detail-item">
              <label>Capacity:</label>
              <span className="detail-value">{room.capacity} people</span>
            </div>
            <div className="detail-item">
              <label>Equipment Count:</label>
              <span className="detail-value">{room.equipmentCount || 0}</span>
            </div>
            <div className="detail-item">
              <label>Active Bookings:</label>
              <span className="detail-value">{room.activeBookings || 0}</span>
            </div>
            <div className="detail-item">
              <label>Created At:</label>
              <span className="detail-value">{formatDate(room.createdAt)}</span>
            </div>
            <div className="detail-item">
              <label>Last Updated:</label>
              <span className="detail-value">{formatDate(room.lastUpdatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Equipment List */}
        <div className="detail-card">
          <div className="detail-card-header">
            <h3>Equipment</h3>
            {userRole === 'Admin' && (
              <button 
                className="btn-new-booking"
                onClick={() => setShowCreateEquipment(true)}
                style={{ margin: 0 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                Add Equipment to Room
              </button>
            )}
          </div>
          <div style={{ marginTop: '16px' }}>
            <EquipmentList 
              userRole={userRole}
              roomId={roomId}
              showCreatePage={showCreateEquipment}
              onCreatePageClose={() => setShowCreateEquipment(false)}
              onViewEquipment={(equipmentId) => {
                // Optional: Handle view equipment detail
                console.log('View equipment:', equipmentId);
              }}
              onEditEquipment={(equipmentId) => {
                // Optional: Handle edit equipment
                console.log('Edit equipment:', equipmentId);
              }}
            />
          </div>
        </div>

        {/* Recent Bookings - Only show for Admin */}
        {userRole === 'Admin' && room.recentBookings && room.recentBookings.length > 0 && (
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Recent Bookings ({room.recentBookings.length})</h3>
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
                  {room.recentBookings.map((booking) => (
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
    </div>
  );
};

export default RoomDetail;

