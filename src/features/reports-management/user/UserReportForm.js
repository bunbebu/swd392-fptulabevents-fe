import React, { useState, useEffect } from 'react';

/**
 * User Report Form Component
 * Used for creating and editing user reports
 */
const UserReportForm = ({ report, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Lab',
    imageUrl: ''
  });

  const [errors, setErrors] = useState({});

  // Initialize form data when editing
  useEffect(() => {
    if (report) {
      setFormData({
        title: report.title || '',
        description: report.description || '',
        type: report.type || 'Lab',
        imageUrl: report.imageUrl || ''
      });
    }
  }, [report]);

  const typeOptions = [
    { value: 'Lab', label: 'Lab/Room Issue' },
    { value: 'Equipment', label: 'Equipment Issue' }
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

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.type) {
      newErrors.type = 'Report type is required';
    }

    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
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

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{report ? 'Edit Report' : 'Create New Report'}</h3>
          <button className="modal-close" onClick={onCancel} disabled={loading}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-group">
            <label htmlFor="title">Report Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={errors.title ? 'form-input error' : 'form-input'}
              placeholder="Enter a brief title for the report"
              disabled={loading}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="type">Report Type *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={errors.type ? 'form-input error' : 'form-input'}
              disabled={loading}
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.type && <span className="error-message">{errors.type}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={errors.description ? 'form-input error' : 'form-input'}
              placeholder="Describe the issue in detail..."
              rows="5"
              disabled={loading}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl">Image URL (Optional)</label>
            <input
              type="text"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className={errors.imageUrl ? 'form-input error' : 'form-input'}
              placeholder="https://example.com/image.jpg"
              disabled={loading}
            />
            {errors.imageUrl && <span className="error-message">{errors.imageUrl}</span>}
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Provide a URL to an image showing the issue (optional)
            </small>
          </div>

          {formData.imageUrl && isValidUrl(formData.imageUrl) && (
            <div className="form-group">
              <label>Image Preview</label>
              <div style={{ marginTop: '8px', maxWidth: '300px' }}>
                <img 
                  src={formData.imageUrl} 
                  alt="Preview" 
                  style={{ 
                    width: '100%', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb' 
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

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
              {loading ? (report ? 'Updating...' : 'Creating...') : (report ? 'Update Report' : 'Create Report')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserReportForm;

