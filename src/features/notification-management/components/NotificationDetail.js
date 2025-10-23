import React from 'react';

/**
 * Notification Detail Component
 * 
 * Displays detailed information about a notification
 * Can be used in both admin and user contexts
 */
const NotificationDetail = ({ notification, onClose }) => {
  if (!notification) return null;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
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

  return (
    <div className="notification-detail-container">
      <div className="notification-detail-header">
        <div className="notification-detail-title">
          <h2>{notification.title}</h2>
          <StatusBadge status={notification.status} />
        </div>
        <div className="notification-detail-meta">
          <span className="meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            {notification.targetGroup}
          </span>
          <span className="meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {formatDate(notification.createdAt)}
          </span>
        </div>
      </div>

      <div className="notification-detail-body">
        <div className="notification-content-section">
          <h3>Content</h3>
          <div className="notification-content-text">
            {notification.content}
          </div>
        </div>

        <div className="notification-info-grid">
          <div className="info-item">
            <label>Start Date</label>
            <span>{formatDate(notification.startDate)}</span>
          </div>
          <div className="info-item">
            <label>End Date</label>
            <span>{formatDate(notification.endDate)}</span>
          </div>
          {notification.createdBy && (
            <div className="info-item">
              <label>Created By</label>
              <span>{notification.createdBy}</span>
            </div>
          )}
          {notification.totalReaders !== undefined && (
            <div className="info-item">
              <label>Total Readers</label>
              <span>{notification.totalReaders}</span>
            </div>
          )}
          {notification.unreadCount !== undefined && (
            <div className="info-item">
              <label>Unread Count</label>
              <span>{notification.unreadCount}</span>
            </div>
          )}
        </div>
      </div>

      {onClose && (
        <div className="notification-detail-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      )}

      <style jsx>{`
        .notification-detail-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }

        .notification-detail-header {
          padding: 24px;
          border-bottom: 1px solid #e0e0e0;
        }

        .notification-detail-title {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }

        .notification-detail-title h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: #333;
        }

        .notification-detail-meta {
          display: flex;
          align-items: center;
          gap: 24px;
          color: #666;
          font-size: 14px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notification-detail-body {
          padding: 24px;
        }

        .notification-content-section {
          margin-bottom: 24px;
        }

        .notification-content-section h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .notification-content-text {
          padding: 16px;
          background: #f5f5f5;
          border-radius: 8px;
          white-space: pre-wrap;
          line-height: 1.6;
          color: #333;
        }

        .notification-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-item label {
          font-size: 12px;
          font-weight: 600;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-item span {
          font-size: 14px;
          color: #333;
        }

        .notification-detail-footer {
          padding: 16px 24px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
};

export default NotificationDetail;

