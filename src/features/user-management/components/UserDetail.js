import React, { useState, useEffect, useCallback } from 'react';
import { userApi } from '../../../api';

/**
 * User Detail Component
 * Displays detailed information about a specific user
 * 
 * Related User Stories:
 * - US-08: Admin - Manage users
 * - US-21: Lecturer - View user information
 */
const UserDetail = ({ userId, onNavigateBack }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUserDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const detail = await userApi.getUserById(userId);
      const data = (detail && (detail.data || detail.Data)) || detail;
      setUser(data);
    } catch (err) {
      console.error('Error loading user details:', err);
      setError(err.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadUserDetail();
  }, [userId, loadUserDetail]);

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'status-badge active';
      case 'inactive':
        return 'status-badge inactive';
      case 'locked':
        return 'status-badge locked';
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
              title="Back to User List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>User Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="loading">Loading user details...</div>
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
              title="Back to User List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>User Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="error-message">
            {error}
            <div className="error-actions">
              <button onClick={loadUserDetail} className="btn btn-primary">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="create-room-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={onNavigateBack}
              title="Back to User List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>User Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="no-data">User not found</div>
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
            title="Back to User List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1>User Details</h1>
        </div>
      </div>

      <div className="page-content">
        <div className="room-detail-content">
          {/* User Information Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Basic Information</h3>
              <span className={getStatusBadgeClass(user.status)}>
                {user.status || 'Unknown'}
              </span>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <label>User ID:</label>
                <span className="detail-value">{user.id?.substring(0, 8)}...</span>
              </div>
              <div className="detail-item">
                <label>Email:</label>
                <span className="detail-value">{user.email}</span>
              </div>
              <div className="detail-item">
                <label>Username:</label>
                <span className="detail-value">{user.username}</span>
              </div>
              <div className="detail-item">
                <label>Full Name:</label>
                <span className="detail-value">{user.fullname}</span>
              </div>
              <div className="detail-item">
                <label>Student ID (MSSV):</label>
                <span className="detail-value">{user.mssv || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Status:</label>
                <span className="detail-value">{user.status || 'Unknown'}</span>
              </div>
              <div className="detail-item">
                <label>Created At:</label>
                <span className="detail-value">{formatDate(user.createdAt)}</span>
              </div>
              <div className="detail-item">
                <label>Last Updated:</label>
                <span className="detail-value">{formatDate(user.lastUpdatedAt)}</span>
              </div>
            </div>
          </div>


          {/* Account Activity Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Account Activity</h3>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Account Status:</label>
                <span className="detail-value">
                  <span className={getStatusBadgeClass(user.status)}>
                    {user.status || 'Unknown'}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <label>Last Login:</label>
                <span className="detail-value">{formatDate(user.lastLoginAt)}</span>
              </div>
              <div className="detail-item">
                <label>Login Count:</label>
                <span className="detail-value">{user.loginCount || 0}</span>
              </div>
              <div className="detail-item">
                <label>Account Created:</label>
                <span className="detail-value">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
