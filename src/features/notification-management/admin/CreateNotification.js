import React, { useState } from 'react';
import { notificationApi } from '../../../api';

/**
 * Create Notification Page Component - Admin Only
 *
 * Dedicated page for creating new notification
 *
 * Related Use Cases:
 * - UC-XX: Manage Notifications (Admin)
 */
const CreateNotification = ({ onNavigateBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetGroup: 'All',
    startDate: '',
    endDate: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Notification title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Notification content is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      // Convert datetime-local format to ISO 8601 format
      const startDate = new Date(formData.startDate).toISOString();
      const endDate = new Date(formData.endDate).toISOString();

      const submitData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        targetGroup: formData.targetGroup,
        startDate: startDate,
        endDate: endDate
      };

      console.log('Submitting notification creation:', submitData);

      await notificationApi.createNotification(submitData);

      // Navigate back to notification list with success message
      if (onSuccess) {
        onSuccess();
      } else if (onNavigateBack) {
        onNavigateBack();
      }
    } catch (err) {
      console.error('Failed to create notification:', err);
      // Display more detailed error message
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create notification';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  return (
    <div className="create-notification-page">
      <div className="page-header">
        <div className="header-content">
          <button 
            className="back-button"
            onClick={handleCancel}
            disabled={loading}
            title="Back to Notification List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1>Create New Notification</h1>
        </div>
      </div>

      <div className="page-content">
        <div className="form-container">
          {errors.submit && (
            <div className="error-message">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Notification Title */}
              <div className="form-group">
                <label htmlFor="title">
                  Notification Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={errors.title ? 'error' : ''}
                  placeholder="E.g.: System Maintenance Notice"
                  disabled={loading}
                />
                {errors.title && <span className="error-message">{errors.title}</span>}
              </div>

              {/* Target Group */}
              <div className="form-group">
                <label htmlFor="targetGroup">
                  Target Group <span className="required">*</span>
                </label>
                <select
                  id="targetGroup"
                  name="targetGroup"
                  value={formData.targetGroup}
                  onChange={handleChange}
                  className={errors.targetGroup ? 'error' : ''}
                  disabled={loading}
                >
                  <option value="All">All Users</option>
                  <option value="Lecturer">Lecturers Only</option>
                  <option value="Student">Students Only</option>
                </select>
                {errors.targetGroup && <span className="error-message">{errors.targetGroup}</span>}
              </div>

              {/* Start Date */}
              <div className="form-group">
                <label htmlFor="startDate">
                  Start Date <span className="required">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={errors.startDate ? 'error' : ''}
                  disabled={loading}
                />
                {errors.startDate && <span className="error-message">{errors.startDate}</span>}
              </div>

              {/* End Date */}
              <div className="form-group">
                <label htmlFor="endDate">
                  End Date <span className="required">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={errors.endDate ? 'error' : ''}
                  disabled={loading}
                />
                {errors.endDate && <span className="error-message">{errors.endDate}</span>}
              </div>

              {/* Content */}
              <div className="form-group">
                <label htmlFor="content">
                  Notification Content <span className="required">*</span>
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  className={errors.content ? 'error' : ''}
                  placeholder="Enter the notification content..."
                  rows="6"
                  disabled={loading}
                />
                {errors.content && <span className="error-message">{errors.content}</span>}
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Notification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateNotification;

