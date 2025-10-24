import React, { useState } from 'react';

/**
 * Report Status Form Component
 * Used for updating report status with admin response
 */
const ReportStatusForm = ({ report, onSubmit, onCancel, loading = false }) => {
  // Normalize report data to handle both camelCase and PascalCase from backend
  const normalizedReport = {
    id: report?.id || report?.Id,
    title: report?.title || report?.Title,
    status: report?.status || report?.Status,
    adminResponse: report?.adminResponse || report?.AdminResponse || ''
  };

  const [formData, setFormData] = useState({
    status: normalizedReport.status || 'Open',
    adminResponse: normalizedReport.adminResponse
  });

  const [errors, setErrors] = useState({});

  const statusOptions = [
    { value: 'Open', label: 'Open' },
    { value: 'InProgress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' }
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

    if ((formData.status === 'Resolved' || formData.status === 'Closed') && !formData.adminResponse) {
      newErrors.adminResponse = 'Admin response is required when resolving or closing a report';
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
      case 'Open':
      case 'Pending':
        return '#f59e0b';
      case 'InProgress':
        return '#3b82f6';
      case 'Resolved':
        return '#10b981';
      case 'Closed':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content status-update-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Update Report Status</h3>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="status-form-grid">
            {/* Report Info */}
            <div className="form-group">
              <label>Report Title</label>
              <div style={{ padding: '8px 0', fontWeight: '500' }}>
                {normalizedReport.title || 'N/A'}
              </div>
            </div>

            <div className="form-group">
              <label>Current Status</label>
              <div className="current-status">
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: getStatusColor(normalizedReport.status),
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {normalizedReport.status || 'Unknown'}
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

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="adminResponse">
                Admin Response {(formData.status === 'Resolved' || formData.status === 'Closed') && '*'}
              </label>
              <textarea
                id="adminResponse"
                name="adminResponse"
                value={formData.adminResponse}
                onChange={handleChange}
                className={errors.adminResponse ? 'form-input error' : 'form-input'}
                placeholder="Provide details about the resolution or status update..."
                rows="4"
                disabled={loading}
              />
              {errors.adminResponse && <span className="error-message">{errors.adminResponse}</span>}
              <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                This response will be visible to the user who submitted the report.
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

export default ReportStatusForm;

