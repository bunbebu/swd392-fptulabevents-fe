import React, { useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../../../api';

/**
 * Notification Center for Lecturers
 *
 * Features:
 * - View notifications from Admin
 * - Mark as read/unread
 * - Mark all as read
 * - Filter by read/unread
 */
const LecturerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [notifData, countData] = await Promise.all([
        notificationApi.getUserNotifications(),
        notificationApi.getUnreadNotificationCount()
      ]);

      let notifList = [];
      if (Array.isArray(notifData)) {
        notifList = notifData;
      } else if (notifData?.data && Array.isArray(notifData.data)) {
        notifList = notifData.data;
      }

      setNotifications(notifList);
      setUnreadCount(countData?.count || countData?.Count || 0);

    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationApi.markNotificationAsRead(notificationId);
      await loadNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
      showToast('Failed to mark as read', 'error');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllNotificationsAsRead();
      showToast('All notifications marked as read', 'success');
      await loadNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
      showToast('Failed to mark all as read', 'error');
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    const isRead = notif.isRead || notif.IsRead;
    if (filter === 'unread') return !isRead;
    if (filter === 'read') return isRead;
    return true;
  });

  if (loading) {
    return (
      <div className="room-list-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading notifications...
        </div>
      </div>
    );
  }

  return (
    <div className="room-list-container">
      <div className="room-list-header">
        <div>
          <h2>Notifications</h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn btn-secondary"
            onClick={markAllAsRead}
          >
            Mark All as Read
          </button>
        )}
      </div>

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
            fontWeight: '500'
          }}
        >
          {toast.message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadNotifications} className="btn btn-secondary">Retry</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1rem',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '0.5rem'
      }}>
        <button
          className={filter === 'all' ? 'tab-active' : 'tab'}
          onClick={() => setFilter('all')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: filter === 'all' ? '600' : '400',
            color: filter === 'all' ? '#3b82f6' : '#6b7280',
            borderBottom: filter === 'all' ? '2px solid #3b82f6' : 'none',
            marginBottom: '-0.5rem'
          }}
        >
          All ({notifications.length})
        </button>
        <button
          className={filter === 'unread' ? 'tab-active' : 'tab'}
          onClick={() => setFilter('unread')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: filter === 'unread' ? '600' : '400',
            color: filter === 'unread' ? '#3b82f6' : '#6b7280',
            borderBottom: filter === 'unread' ? '2px solid #3b82f6' : 'none',
            marginBottom: '-0.5rem'
          }}
        >
          Unread ({unreadCount})
        </button>
        <button
          className={filter === 'read' ? 'tab-active' : 'tab'}
          onClick={() => setFilter('read')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: filter === 'read' ? '600' : '400',
            color: filter === 'read' ? '#3b82f6' : '#6b7280',
            borderBottom: filter === 'read' ? '2px solid #3b82f6' : 'none',
            marginBottom: '-0.5rem'
          }}
        >
          Read ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredNotifications.length === 0 ? (
          <div className="no-data" style={{ padding: '3rem', textAlign: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', color: '#9ca3af' }}>
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
            </svg>
            <p style={{ color: '#6b7280' }}>No notifications found</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const notifId = notif.id || notif.Id;
            const title = notif.title || notif.Title || 'Notification';
            const message = notif.message || notif.Message || '';
            const isRead = notif.isRead || notif.IsRead;
            const createdAt = notif.createdAt || notif.CreatedAt;
            const type = notif.type || notif.Type || 'info';

            const getTypeIcon = () => {
              switch (type.toLowerCase()) {
                case 'warning':
                  return (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#fef3c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                    </div>
                  );
                case 'error':
                  return (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#fee2e2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>
                  );
                case 'success':
                  return (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#d1fae5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  );
                default:
                  return (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#dbeafe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                    </div>
                  );
              }
            };

            return (
              <div
                key={notifId}
                onClick={() => !isRead && markAsRead(notifId)}
                style={{
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb',
                  background: isRead ? '#ffffff' : '#eff6ff',
                  cursor: isRead ? 'default' : 'pointer',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isRead) e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {getTypeIcon()}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.25rem'
                  }}>
                    <h4 style={{
                      margin: 0,
                      fontWeight: isRead ? '500' : '600',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>
                      {title}
                    </h4>
                    {!isRead && (
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        flexShrink: 0,
                        marginLeft: '0.5rem'
                      }}></span>
                    )}
                  </div>
                  <p style={{
                    margin: '0.25rem 0',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    {message}
                  </p>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                    marginTop: '0.5rem',
                    display: 'block'
                  }}>
                    {formatDate(createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LecturerNotifications;
