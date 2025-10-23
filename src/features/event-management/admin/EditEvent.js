import React, { useState, useEffect } from 'react';
import { eventApi } from '../../../api';
import { EVENT_STATUS_OPTIONS } from '../../../constants/eventConstants';

/**
 * Edit Event Page Component - Admin Only
 *
 * Dedicated page for editing existing event
 *
 * Related Use Cases:
 * - UC-XX: Manage Events (Admin)
 * - UC-XX: Update Event (Admin)
 *
 * Features:
 * - Event editing with all fields
 * - Date/time validation
 * - Status selection
 * - Visibility toggle
 * - Recurrence rule support
 */
const EditEvent = ({ event, eventId, onNavigateBack, onSuccess }) => {
  const [eventData, setEventData] = useState(event);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    status: 0,
    visibility: true,
    recurrenceRule: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingEvent, setFetchingEvent] = useState(false);

  // Fetch event data if eventId is provided
  useEffect(() => {
    const fetchEvent = async () => {
      if (eventId && !event) {
        try {
          setFetchingEvent(true);
          const fetchedEvent = await eventApi.getEventById(eventId);
          setEventData(fetchedEvent);
        } catch (err) {
          console.error('Failed to fetch event:', err);
          setErrors({ submit: 'Failed to load event data' });
        } finally {
          setFetchingEvent(false);
        }
      } else if (event) {
        setEventData(event);
      }
    };

    fetchEvent();
  }, [eventId, event]);

  useEffect(() => {
    if (eventData) {
      // Convert dates to datetime-local format
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
        title: eventData.title || '',
        description: eventData.description || '',
        location: eventData.location || '',
        startDate: formatDateForInput(eventData.startDate),
        endDate: formatDateForInput(eventData.endDate),
        status: typeof eventData.status === 'string' 
          ? EVENT_STATUS_OPTIONS.find(opt => opt.label === eventData.status)?.value || 0
          : eventData.status || 0,
        visibility: eventData.visibility !== undefined ? eventData.visibility : true,
        recurrenceRule: eventData.recurrenceRule || ''
      });
    }
  }, [eventData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    // Validate end date is after start date
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

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        status: parseInt(formData.status),
        visibility: formData.visibility,
        recurrenceRule: formData.recurrenceRule.trim() || null
      };

      const targetEventId = eventId || eventData?.id;
      if (!targetEventId) {
        throw new Error('Event ID is required');
      }

      await eventApi.updateEvent(targetEventId, submitData);

      // Navigate back to event list with success message
      if (onSuccess) {
        onSuccess();
      } else if (onNavigateBack) {
        onNavigateBack();
      }
    } catch (err) {
      console.error('Failed to update event:', err);
      setErrors({ submit: err.message || 'Failed to update event' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  if (fetchingEvent) {
    return (
      <div className="create-room-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={handleCancel}
              title="Back to Event List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Edit Event</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="form-container">
            <div className="loading">
              <div className="loading-spinner"></div>
              Loading event data...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="create-room-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={handleCancel}
              title="Back to Event List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Edit Event</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="error-message">Event not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-room-page">
      <div className="page-header">
        <div className="header-content">
          <button 
            className="back-button"
            onClick={handleCancel}
            disabled={loading}
            title="Back to Event List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1>Edit Event</h1>
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
              {/* Event Title */}
              <div className="form-group">
                <label htmlFor="title">
                  Event Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={errors.title ? 'error' : ''}
                  placeholder="E.g.: Tech Workshop 2024"
                  disabled={loading}
                />
                {errors.title && <span className="error-message">{errors.title}</span>}
              </div>

              {/* Location */}
              <div className="form-group">
                <label htmlFor="location">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="E.g.: Lab A101, Building A"
                  disabled={loading}
                />
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

              {/* Status and Visibility */}
              <div className="form-group full-width">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.375rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label htmlFor="status" style={{ marginBottom: '0.5rem' }}>
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      {EVENT_STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <label className="checkbox-label" style={{ marginBottom: '0', paddingTop: '1.875rem' }}>
                      <input
                        type="checkbox"
                        name="visibility"
                        checked={formData.visibility}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <span>Public Event (visible to all users)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Recurrence Rule */}
              <div className="form-group">
                <label htmlFor="recurrenceRule">
                  Recurrence Rule (Optional)
                </label>
                <input
                  type="text"
                  id="recurrenceRule"
                  name="recurrenceRule"
                  value={formData.recurrenceRule}
                  onChange={handleChange}
                  placeholder="E.g.: FREQ=WEEKLY;BYDAY=MO,WE,FR"
                  disabled={loading}
                />
                {/* <p className="field-hint">
                  Use iCalendar RRULE format for recurring events
                </p> */}
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed description of the event..."
                  rows="4"
                  disabled={loading}
                />
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
                {loading ? 'Updating...' : 'Update Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEvent;

