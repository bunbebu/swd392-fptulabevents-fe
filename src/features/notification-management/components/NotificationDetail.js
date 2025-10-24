import React, { useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../../../api';

/**
 * Notification Detail Component
 *
 * Displays detailed information about a notification in a full page
 * Similar to EquipmentDetail component
 */
const NotificationDetail = ({ notificationId, onNavigateBack }) => {
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotificationDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const detail = await notificationApi.getNotificationById(notificationId);
      const data = (detail && (detail.data || detail.Data)) || detail;
      setNotification(data);
    } catch (err) {
      console.error('Error loading notification details:', err);
      setError(err.message || 'Failed to load notification details');
    } finally {
      setLoading(false);
    }
  }, [notificationId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadNotificationDetail();
  }, [notificationId, loadNotificationDetail]);

  // Format date for display
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

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusStyles = {
      Active: 'status-badge status-available',
      Expired: 'status-badge status-broken',
      Scheduled: 'status-badge status-maintenance'
    };
    return <span className={statusStyles[status] || 'status-badge'}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="create-equipment-page">
        <div className="page-header">
          <div className="header-content">
            <button
              className="back-button"
              onClick={onNavigateBack}
              title="Back to Notification List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Notification Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="loading">Loading notification details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="create-equipment-page">
        <div className="page-header">
          <div className="header-content">
            <button
              className="back-button"
              onClick={onNavigateBack}
              title="Back to Notification List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Notification Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="error-message">
            {error}
            <div className="error-actions">
              <button onClick={loadNotificationDetail} className="btn btn-primary">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="create-equipment-page">
        <div className="page-header">
          <div className="header-content">
            <button
              className="back-button"
              onClick={onNavigateBack}
              title="Back to Notification List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Notification Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="no-data">Notification not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-equipment-page">
      <div className="page-header">
        <div className="header-content">
          <button
            className="back-button"
            onClick={onNavigateBack}
            title="Back to Notification List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1>Notification Details</h1>
        </div>
      </div>

      <div className="page-content">
        <div className="room-detail-content">
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>{notification.title}</h3>
              <StatusBadge status={notification.status} />
            </div>
            <div className="detail-grid">
              <div className="detail-item full-width">
                <label>Content:</label>
                <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>
                  {notification.content}
                </span>
              </div>
              <div className="detail-item">
                <label>Target Group:</label>
                <span className="detail-value">{notification.targetGroup}</span>
              </div>
              <div className="detail-item">
                <label>Status:</label>
                <span className="detail-value">{notification.status}</span>
              </div>
              <div className="detail-item">
                <label>Start Date:</label>
                <span className="detail-value">{formatDate(notification.startDate)}</span>
              </div>
              <div className="detail-item">
                <label>End Date:</label>
                <span className="detail-value">{formatDate(notification.endDate)}</span>
              </div>
              <div className="detail-item">
                <label>Created By:</label>
                <span className="detail-value">{notification.createdBy || 'Admin'}</span>
              </div>
              <div className="detail-item">
                <label>Created At:</label>
                <span className="detail-value">{formatDate(notification.createdAt)}</span>
              </div>
              {notification.totalReaders !== undefined && (
                <div className="detail-item">
                  <label>Total Readers:</label>
                  <span className="detail-value">{notification.totalReaders}</span>
                </div>
              )}
              {notification.unreadCount !== undefined && (
                <div className="detail-item">
                  <label>Unread Count:</label>
                  <span className="detail-value">{notification.unreadCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetail;

