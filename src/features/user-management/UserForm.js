import React, { useState, useEffect } from 'react';

const UserForm = ({ 
  title, 
  user = null, 
  onSubmit, 
  onClose, 
  loading = false, 
  isEdit = false 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    fullname: '',
    mssv: '',
    roles: []
  });
  const [errors, setErrors] = useState({});
  const [availableRoles] = useState(['Admin', 'User', 'Student', 'Teacher']);

  // Initialize form data
  useEffect(() => {
    if (user && isEdit) {
      setFormData({
        email: user.email || '',
        username: user.username || '',
        password: '', // Don't pre-fill password
        fullname: user.fullname || '',
        mssv: user.mssv || '',
        roles: user.roles || []
      });
    } else {
      setFormData({
        email: '',
        username: '',
        password: '',
        fullname: '',
        mssv: '',
        roles: []
      });
    }
    setErrors({});
  }, [user, isEdit]);

  // Handle input change
  const handleInputChange = (e) => {
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

  // Handle role selection (single select, stored as array for API)
  const handleRolesSelectChange = (e) => {
    const selected = e.target.value ? [e.target.value] : [];
    setFormData(prev => ({ ...prev, roles: selected }));
    if (errors.roles) setErrors(prev => ({ ...prev, roles: '' }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!isEdit && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!isEdit && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Full name is required';
    }

    if (!formData.mssv.trim()) {
      newErrors.mssv = 'Student ID is required';
    }

    if (formData.roles.length === 0) {
      newErrors.roles = 'Select at least one role';
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

    // Prepare data for submission
    const submitData = isEdit
      ? { fullname: formData.fullname, mssv: formData.mssv, roles: formData.roles }
      : { ...formData };

    onSubmit(submitData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content form-modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button 
            className="modal-close-btn"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-group">
            <label htmlFor="email">Email <span className="required-asterisk">*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading || isEdit}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="username">Username <span className="required-asterisk">*</span></label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              disabled={loading || isEdit}
              className={errors.username ? 'error' : ''}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          {!isEdit && (
            <div className="form-group">
              <label htmlFor="password">
                Password {!isEdit && <span className="required-asterisk">*</span>}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="fullname">Full name <span className="required-asterisk">*</span></label>
            <input
              type="text"
              id="fullname"
              name="fullname"
              value={formData.fullname}
              onChange={handleInputChange}
              disabled={loading}
              className={errors.fullname ? 'error' : ''}
            />
            {errors.fullname && <span className="error-message">{errors.fullname}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="mssv">Student ID <span className="required-asterisk">*</span></label>
            <input
              type="text"
              id="mssv"
              name="mssv"
              value={formData.mssv}
              onChange={handleInputChange}
              disabled={loading}
              className={errors.mssv ? 'error' : ''}
            />
            {errors.mssv && <span className="error-message">{errors.mssv}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="roles">Roles <span className="required-asterisk">*</span></label>
            <select
              id="roles"
              name="roles"
              value={formData.roles[0] || ''}
              onChange={handleRolesSelectChange}
              disabled={loading}
              className={`pretty-select ${errors.roles ? 'error' : ''}`}
            >
              <option value="" disabled>Select a role</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {errors.roles && <span className="error-message">{errors.roles}</span>}
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
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isEdit ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
