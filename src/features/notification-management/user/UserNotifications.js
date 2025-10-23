import React, { useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../../../api';

/**
 * User Notifications Component
 * 
 * Displays notifications for the current user
 * Allows marking notifications as read
 */
const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [notificationList, count] = await Promise.all([
        notificationApi.getUserNotifications(),
        notificationApi.getUnreadNotificationCount()
      ]);

      setNotifications(Array.isArray(notificationList) ? notificationList : []);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err.message || 'Unable to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationApi.markNotificationAsRead(notificationId);
      await loadNotifications();
      showToast('Notification marked as read', 'success');
    } catch (err) {
      showToast(err.message || 'Unable to mark as read', 'error');
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllNotificationsAsRead();
      await loadNotifications();
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      showToast(err.message || 'Unable to mark all as read', 'error');
    }
  };

  // View notification details
  const handleViewDetails = async (notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
    
    // Mark as read when viewing
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'Unread') return !notif.isRead;
    if (filter === 'Read') return notif.isRead;
    return true;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="admin-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-content">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={loadNotifications}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="content-header">
        <div>
          <h2>My Notifications</h2>
          <p>View and manage your notifications</p>
        </div>
        {unreadCount > 0 && (
          <button 
            className="btn-primary"
            onClick={handleMarkAllAsRead}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Mark All as Read
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Total Notifications</h3>
              <p className="stat-number">{notifications.length}</p>
            </div>
            <div className="stat-icon blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Unread</h3>
              <p className="stat-number">{unreadCount}</p>
            </div>
            <div className="stat-icon orange">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Read</h3>
              <p className="stat-number">{notifications.length - unreadCount}</p>
            </div>
            <div className="stat-icon green">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="table-controls">
        <div className="filter-group">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Notifications</option>
            <option value="Unread">Unread Only</option>
            <option value="Read">Read Only</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <p>No notifications found</p>
          </div>
        ) : (
          <div className="notification-items">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleViewDetails(notification)}
                style={{ cursor: 'pointer' }}
              >
                <div className="notification-icon">
                  {!notification.isRead && <span className="unread-dot"></span>}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                <div className="notification-content">
                  <h4>{notification.title}</h4>
                  <p className="notification-preview">
                    {notification.content.length > 100 
                      ? notification.content.substring(0, 100) + '...' 
                      : notification.content}
                  </p>
                  <div className="notification-meta">
                    <span className="notification-time">{formatDate(notification.createdAt)}</span>
                    <span className="notification-badge">{notification.targetGroup}</span>
                  </div>
                </div>
                {!notification.isRead && (
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                    title="Mark as read"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="table-footer">
        <p className="text-muted">
          Showing {filteredNotifications.length} / {notifications.length} notifications
        </p>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedNotification && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedNotification.title}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="notification-detail">
                <div className="detail-meta">
                  <span className="notification-badge">{selectedNotification.targetGroup}</span>
                  <span className="text-muted">{formatDate(selectedNotification.createdAt)}</span>
                </div>
                <div className="detail-content" style={{ marginTop: '16px', whiteSpace: 'pre-wrap' }}>
                  {selectedNotification.content}
                </div>
                <div className="detail-footer" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
                  <p className="text-muted small">
                    Valid from {new Date(selectedNotification.startDate).toLocaleString()} 
                    {' '}to {new Date(selectedNotification.endDate).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .notification-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .notification-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-color: #2196F3;
        }

        .notification-item.unread {
          background: #f0f7ff;
          border-left: 4px solid #2196F3;
        }

        .notification-icon {
          position: relative;
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e3f2fd;
          border-radius: 50%;
          color: #2196F3;
        }

        .unread-dot {
          position: absolute;
          top: 0;
          right: 0;
          width: 10px;
          height: 10px;
          background: #f44336;
          border: 2px solid white;
          border-radius: 50%;
        }

        .notification-content {
          flex: 1;
        }

        .notification-content h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .notification-preview {
          margin: 0 0 8px 0;
          color: #666;
          font-size: 14px;
          line-height: 1.5;
        }

        .notification-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
        }

        .notification-time {
          color: #999;
        }

        .notification-badge {
          padding: 2px 8px;
          background: #e0e0e0;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          color: #666;
        }

        .detail-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }
      `}</style>
    </div>
  );
};

export default UserNotifications;

