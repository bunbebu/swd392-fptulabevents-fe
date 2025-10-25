import React, { useState, useEffect } from 'react';
import { eventApi } from '../../../api';

/**
 * Booking Form Component
 * A popup form for creating lab/room bookings
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Object} props.roomInfo - Room information (id, name)
 * @param {boolean} props.isSubmitting - Whether the form is being submitted
 */
const BookingForm = ({ isOpen, onClose, onSubmit, roomInfo, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    purpose: '',
    eventId: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Load events when modal opens
  useEffect(() => {
    const loadEvents = async () => {
      if (isOpen) {
        try {
          setLoadingEvents(true);
          const eventsData = await eventApi.getEvents();
          const eventsList = Array.isArray(eventsData) ? eventsData : (eventsData?.data || []);
          setEvents(eventsList);
        } catch (err) {
          console.error('Failed to load events:', err);
          setEvents([]);
        } finally {
          setLoadingEvents(false);
        }
      }
    };
    loadEvents();
  }, [isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        startTime: '',
        endTime: '',
        purpose: '',
        eventId: '',
        notes: ''
      });
      setErrors({});
    }
  }, [isOpen]);

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

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (!formData.purpose || formData.purpose.trim().length === 0) {
      newErrors.purpose = 'Purpose is required';
    }

    // Validate that end time is after start time
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      
      if (end <= start) {
        newErrors.endTime = 'End time must be after start time';
      }

      // Validate that start time is not in the past
      const now = new Date();
      if (start < now) {
        newErrors.startTime = 'Start time cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare booking data
    const bookingData = {
      roomId: roomInfo.id,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      purpose: formData.purpose.trim(),
      notes: formData.notes.trim() || undefined,
      eventId: formData.eventId.trim() || undefined
    };

    onSubmit(bookingData);
  };

  if (!isOpen) return null;

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="booking-modal-header">
          <h2>Booking Form - {roomInfo?.name || 'Room'}</h2>
          <button 
            className="booking-modal-close" 
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="booking-modal-form">
          <div className="form-group">
            <label htmlFor="startTime">
              Start Time <span className="required">*</span>
            </label>
            <input
              type="datetime-local"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              disabled={isSubmitting}
              className={errors.startTime ? 'error' : ''}
            />
            {errors.startTime && (
              <span className="error-message">{errors.startTime}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="endTime">
              End Time <span className="required">*</span>
            </label>
            <input
              type="datetime-local"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              disabled={isSubmitting}
              className={errors.endTime ? 'error' : ''}
            />
            {errors.endTime && (
              <span className="error-message">{errors.endTime}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="purpose">
              Purpose <span className="required">*</span>
            </label>
            <textarea
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g., Lab session for SWD392 project"
              rows="3"
              className={errors.purpose ? 'error' : ''}
            />
            {errors.purpose && (
              <span className="error-message">{errors.purpose}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="eventId">
              Event (Optional)
            </label>
            <select
              id="eventId"
              name="eventId"
              value={formData.eventId}
              onChange={handleChange}
              disabled={isSubmitting || loadingEvents}
            >
              <option value="">
                {loadingEvents ? 'Loading events...' : 'No event (regular booking)'}
              </option>
              {events.map(event => (
                <option key={event.id || event.Id} value={event.id || event.Id}>
                  {event.title || event.Title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Additional notes or requirements"
              rows="2"
            />
          </div>

          <div className="booking-modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;

