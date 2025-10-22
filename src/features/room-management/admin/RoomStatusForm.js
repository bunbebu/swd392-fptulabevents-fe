import React, { useState } from 'react';

/**
 * Room Status Form Component
 * Used for updating room status
 */
const RoomStatusForm = ({ room, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    status: room?.status || 'Available',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const statusOptions = [
    { value: 'Available', label: 'Available' },
    { value: 'Occupied', label: 'Occupied' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Unavailable', label: 'Unavailable' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    if (!formData.status) {
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
      case 'Available':
        return '#10b981';
      case 'Occupied':
        return '#f59e0b';
      case 'Maintenance':
        return '#ef4444';
      case 'Unavailable':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content status-update-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ marginBottom: '1rem' }}>Update Room Status</h3>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="status-form-grid">
            <div className="form-group">
              <label>Current Status</label>
              <div className="current-status">
                <span 
                  className="status-badge"
                  style={{ 
                    backgroundColor: getStatusColor(room?.status),
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {room?.status || 'Unknown'}
                </span>
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
                placeholder="Add notes about the status change..."
                rows="3"
                disabled={loading}
              />
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

export default RoomStatusForm;
