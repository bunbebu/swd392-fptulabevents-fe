import React, { useState, useEffect, useCallback } from 'react';
import { labsApi } from '../../../api';

/**
 * Lab Detail Component
 * Displays detailed information about a specific lab on a separate page
 *
 * Related User Stories:
 * - US-09: Admin - Manage labs and equipment
 */
const LabDetail = ({ labId, onNavigateBack }) => {
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadLabDetail();
  }, [labId, loadLabDetail]);

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
        <div className="page-content">
          <div className="loading">Loading lab details...</div>
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
        <div className="page-content">
          <div className="no-data">Lab not found</div>
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

      <div className="page-content">
        <div className="room-detail-content">
        <div className="detail-card">
          <div className="detail-card-header">
            <h3>Basic Information</h3>
            <span className={getStatusBadgeClass(lab.status)}>
              {lab.status || 'Unknown'}
            </span>
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
        {lab.room && (
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Room Information</h3>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Room Name:</label>
                <span className="detail-value">{lab.room.name}</span>
              </div>
              <div className="detail-item">
                <label>Room Location:</label>
                <span className="detail-value">{lab.room.location}</span>
              </div>
              <div className="detail-item">
                <label>Room Capacity:</label>
                <span className="detail-value">{lab.room.capacity} people</span>
              </div>
              <div className="detail-item">
                <label>Room Status:</label>
                <span className={getStatusBadgeClass(lab.room.status)}>
                  {lab.room.status}
                </span>
              </div>
              {lab.room.description && (
                <div className="detail-item full-width">
                  <label>Room Description:</label>
                  <span className="detail-value">{lab.room.description}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Members List */}
        {lab.members && lab.members.length > 0 && (
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Lab Members ({lab.members.length})</h3>
            </div>
            <div className="bookings-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined At</th>
                  </tr>
                </thead>
                <tbody>
                  {lab.members.map((member) => (
                    <tr key={member.id}>
                      <td>{member.userName}</td>
                      <td>{member.userEmail}</td>
                      <td>{member.role}</td>
                      <td>
                        <span className={`status-badge status-${member.status.toLowerCase()}`}>
                          {member.status}
                        </span>
                      </td>
                      <td>{formatDate(member.joinedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    </div>
  );
};

export default LabDetail;

