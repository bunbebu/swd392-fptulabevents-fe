import React, { useState } from 'react';
import { EQUIPMENT_STATUS_OPTIONS, getEquipmentStatusLabel, getEquipmentStatusValue } from '../../../constants/equipmentConstants';

/**
 * Equipment Status Form Component - Admin Only
 * 
 * Form for updating equipment status
 * 
 * Related Use Cases:
 * - UC-40: Equipment Status Update (Admin) - Medium Priority
 */
const EquipmentStatusForm = ({ equipment, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    status: getEquipmentStatusValue(equipment?.status),
    notes: ''
  });

  const [errors, setErrors] = useState({});

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
    const statusLabel = getEquipmentStatusLabel(status);
    switch (statusLabel) {
      case 'Available':
        return '#10b981';
      case 'In Use':
        return '#3b82f6';
      case 'Maintenance':
        return '#f59e0b';
      case 'Broken':
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
          <h3 style={{ marginBottom: '1rem' }}>Update Equipment Status</h3>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="status-form-grid">
            <div className="form-group">
              <label>Current Status</label>
              <div className="current-status">
                <span 
                  className="status-badge"
                  style={{ 
                    backgroundColor: getStatusColor(equipment?.status),
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {getEquipmentStatusLabel(equipment?.status) || 'Unknown'}
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
                {EQUIPMENT_STATUS_OPTIONS.map(option => (
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

export default EquipmentStatusForm;

