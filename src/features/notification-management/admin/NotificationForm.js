import React, { useState, useEffect } from 'react';

/**
 * Notification Form Component
 * 
 * Used for creating and editing notifications
 * Follows the same pattern as RoomForm and EquipmentForm
 */
const NotificationForm = ({ notification, onSubmit, onCancel, loading }) => {
  const isEditMode = !!notification;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetGroup: 'All',
    startDate: '',
    endDate: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (notification) {
      // Convert dates to local datetime-local format
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        title: notification.title || '',
        content: notification.content || '',
        targetGroup: notification.targetGroup || 'All',
        startDate: formatDateForInput(notification.startDate),
        endDate: formatDateForInput(notification.endDate)
      });
    }
  }, [notification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.targetGroup) {
      newErrors.targetGroup = 'Target group is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
      }
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
      // Convert to ISO format for API
      const submitData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        targetGroup: formData.targetGroup,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      };

      await onSubmit(submitData);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditMode ? 'Edit Notification' : 'Create New Notification'}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="title">
                Title <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={errors.title ? 'error' : ''}
                placeholder="Enter notification title"
                disabled={loading}
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="content">
                Content <span className="required">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                className={errors.content ? 'error' : ''}
                placeholder="Enter notification content"
                rows="5"
                disabled={loading}
              />
              {errors.content && <span className="error-message">{errors.content}</span>}
            </div>

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

            <div className="form-row">
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
            </div>

            <div className="form-info">
              <p className="text-muted small">
                <strong>Note:</strong> The notification will be active between the start and end dates.
              </p>
            </div>
          </div>

          <div className="modal-footer">
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
              {loading ? 'Saving...' : (isEditMode ? 'Update Notification' : 'Create Notification')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationForm;

