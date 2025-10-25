import React, { useState } from 'react';

const UserStatusForm = ({ user, onSubmit, onClose, loading = false }) => {
  const [selectedStatus, setSelectedStatus] = useState(user?.status || 'Active');
  const [errors, setErrors] = useState({});

  const statusOptions = [
    { value: 'Active', label: 'Active', description: 'User can sign in and use the system' },
    { value: 'Inactive', label: 'Inactive', description: 'User cannot sign in' },
    { value: 'Locked', label: 'Locked', description: 'Account locked due to violations or security' }
  ];

  // Handle status change
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    if (errors.status) {
      setErrors(prev => ({
        ...prev,
        status: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!selectedStatus) {
      newErrors.status = 'Please select a status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(selectedStatus);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content status-modal">
        <div className="modal-header">
          <h3>Update user status</h3>
          <button 
            className="modal-close-btn"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="user-info">
          <h4>User info:</h4>
          <div className="user-details">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Full name:</strong> {user?.fullname}</p>
            <p><strong>Student ID:</strong> {user?.mssv}</p>
            <p><strong>Current status:</strong> 
              <span className={`current-status ${user?.status?.toLowerCase()}`}>
                {user?.status || 'Unknown'}
              </span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="status-form">
          <div className="form-group">
            <label>Select new status *</label>
            <div className="status-options">
              {statusOptions.map(option => (
                <label 
                  key={option.value} 
                  className={`status-option ${selectedStatus === option.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={selectedStatus === option.value}
                    onChange={() => handleStatusChange(option.value)}
                    disabled={loading}
                  />
                  <div className="status-content">
                    <div className="status-header">
                      <span className="status-label">{option.label}</span>
                      <span className="status-value">({option.value})</span>
                    </div>
                    <div className="status-description">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
            {errors.status && <span className="error-message">{errors.status}</span>}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-warning"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserStatusForm;
