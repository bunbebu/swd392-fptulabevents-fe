import React, { useState, useEffect } from 'react';
import { authApi } from '../../../api';

/**
 * User Profile Component
 * Displays the current logged-in user's profile information
 * Allows users to view their personal details
 */
const UserProfile = ({ onNavigateBack }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use getMe() API to get current user's profile
      const profile = await authApi.me();

      // Handle different response formats
      const data = (profile && (profile.data || profile.Data)) || profile;
      console.log('User profile data:', data);

      setUser(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

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

  const getAvatarInitials = (name) => {
    if (!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="home-content">
        <div className="user-profile-page">
          <div className="profile-loading">
            <div className="loading-spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-content">
        <div className="user-profile-page">
          <div className="profile-error">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>{error}</p>
            <button onClick={loadProfile} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="home-content">
        <div className="user-profile-page">
          <div className="profile-error">
            <p>Profile not found</p>
          </div>
        </div>
      </div>
    );
  }

  const displayName = user.fullname || user.username || 'User';
  const avatarInitials = getAvatarInitials(displayName);

  return (
    <div className="home-content">
      <div className="user-profile-page">
        <div className="profile-content">
          {/* Profile Header Card */}
          <div className="profile-hero-card">
            <div className="profile-hero-background"></div>
            <div className="profile-hero-info">
              <div className="profile-avatar-large">{avatarInitials}</div>
              <div className="profile-hero-details">
                <h2>{displayName}</h2>
                <p className="profile-email">{user.email}</p>
                <div className="profile-meta">
                  <span className={getStatusBadgeClass(user.status)}>
                    {user.status || 'Active'}
                  </span>
                  {user.roles && user.roles.length > 0 && (
                    <span className="role-badge">
                      {user.roles.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information Card */}
          <div className="profile-info-card">
            <div className="profile-card-header">
              <h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Personal Information
              </h3>
            </div>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <label>Full Name</label>
                <span>{user.fullname || 'N/A'}</span>
              </div>
              <div className="profile-info-item">
                <label>Username</label>
                <span>{user.username || 'N/A'}</span>
              </div>
              <div className="profile-info-item">
                <label>Email Address</label>
                <span>{user.email || 'N/A'}</span>
              </div>
              <div className="profile-info-item">
                <label>Student ID (MSSV)</label>
                <span>{user.mssv || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Account Activity Card */}
          <div className="profile-info-card">
            <div className="profile-card-header">
              <h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Account Activity
              </h3>
            </div>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <label>Account Created</label>
                <span>{formatDate(user.createdAt)}</span>
              </div>
              <div className="profile-info-item">
                <label>Last Updated</label>
                <span>{formatDate(user.lastUpdatedAt || user.updatedAt)}</span>
              </div>
              {user.lastLoginAt && (
                <div className="profile-info-item">
                  <label>Last Login</label>
                  <span>{formatDate(user.lastLoginAt)}</span>
                </div>
              )}
              {user.loginCount !== undefined && (
                <div className="profile-info-item">
                  <label>Total Logins</label>
                  <span>{user.loginCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Roles & Permissions Card */}
          {user.roles && user.roles.length > 0 && (
            <div className="profile-info-card">
              <div className="profile-card-header">
                <h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 1 0 10 10H12V2Z"></path>
                    <path d="M12 2v10h10"></path>
                  </svg>
                  Roles & Permissions
                </h3>
              </div>
              <div className="profile-roles-list">
                {user.roles.map((role, index) => (
                  <div key={index} className="profile-role-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 1 0 10 10H12V2Z"></path>
                    </svg>
                    {role}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
