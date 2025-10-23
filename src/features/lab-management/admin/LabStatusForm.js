import React, { useState } from 'react';

/**
 * Lab Status Form Component - Admin Only
 * 
 * Form for updating lab status
 * 
 * Related Use Cases:
 * - UC-40: Lab Status Update (Admin) - Medium Priority
 */
const LabStatusForm = ({ lab, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    status: lab?.status === 'Active' ? 0 : 1
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value)
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

    if (formData.status === undefined || formData.status === null || Number.isNaN(Number(formData.status))) {
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
      case 'Active':
        return '#10b981';
      case 'Inactive':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (statusValue) => {
    return statusValue === 0 ? 'Active' : 'Inactive';
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content status-update-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ marginBottom: '1rem' }}>Update Lab Status</h3>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="status-form-grid">
            <div className="form-group">
              <label>Current Status</label>
              <div className="current-status">
                <span 
                  className="status-badge"
                  style={{ 
                    backgroundColor: getStatusColor(lab?.status),
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {lab?.status || 'Unknown'}
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
                <option value={0}>Active</option>
                <option value={1}>Inactive</option>
              </select>
              {errors.status && <span className="error-message">{errors.status}</span>}
            </div>

            <div className="form-group">
              <label>Preview New Status</label>
              <div className="current-status">
                <span 
                  className="status-badge"
                  style={{ 
                    backgroundColor: getStatusColor(getStatusLabel(formData.status)),
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {getStatusLabel(formData.status)}
                </span>
              </div>
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

export default LabStatusForm;

