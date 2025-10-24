import React, { useState } from 'react';

/**
 * Booking Status Form Component
 * Used for updating booking status by admin
 *
 * API Endpoint: PATCH /api/bookings/{id}/status
 * Status values: 0 (Pending), 1 (Approved), 2 (Rejected), 3 (Cancelled), 4 (Completed)
 */
const BookingStatusForm = ({ booking, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    status: booking?.status !== undefined ? booking.status : 0,
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const statusOptions = [
    { value: 0, label: 'Pending' },
    { value: 1, label: 'Approved' },
    { value: 2, label: 'Rejected' },
    { value: 3, label: 'Cancelled' },
    { value: 4, label: 'Completed' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'status' ? parseInt(value) : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.status === undefined || formData.status === null) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0: // Pending
        return '#f59e0b';
      case 1: // Approved
        return '#10b981';
      case 2: // Rejected
        return '#ef4444';
      case 3: // Cancelled
        return '#6b7280';
      case 4: // Completed
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : 'Unknown';
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content status-update-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ marginBottom: '1rem' }}>Update Booking Status</h3>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="status-form-grid">
            <div className="form-group">
              <label>Current Status</label>
              <div className="current-status">
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: getStatusColor(booking?.status),
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {getStatusLabel(booking?.status)}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Booking Information</label>
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                <div><strong>Room:</strong> {booking?.roomName || 'Unknown'}</div>
                <div><strong>User:</strong> {booking?.userName || 'Unknown'}</div>
                <div><strong>Time:</strong> {booking?.startTime ? new Date(booking.startTime).toLocaleString() : 'N/A'}</div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="status">New Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={errors.status ? 'form-input error' : 'form-input'}
                disabled={loading}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.status && <span className="error-message">{errors.status}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-input"
                placeholder="Add notes about the status change (e.g., reason for rejection, approval notes)..."
                rows="3"
                disabled={loading}
              />
              <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                These notes will be stored with the booking status update.
              </small>
            </div>

          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingStatusForm;
