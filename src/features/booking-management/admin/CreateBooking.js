import React, { useState, useEffect } from 'react';
import { bookingApi, roomsApi, userApi, eventApi } from '../../../api';
import { formatDateForInput } from '../../../constants/bookingConstants';

/**
 * Create Booking Component - Admin Only
 * 
 * Allows admin to manually create bookings for users
 * 
 * Related User Stories:
 * - US-24: Admin - Bulk approve multiple bookings
 */
const CreateBooking = ({ onNavigateBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    roomId: '',
    userId: '',
    startTime: '',
    endTime: '',
    purpose: '',
    eventId: '',
    notes: ''
  });

  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };

  // Load rooms, users, and events
  useEffect(() => {
    const loadData = async () => {
      try {
        const [roomsData, usersData, eventsData] = await Promise.all([
          roomsApi.getRooms(),
          userApi.getUsers(),
          eventApi.getEvents()
        ]);
        setRooms(roomsData || []);
        setUsers(usersData || []);
        setEvents(eventsData || []);
      } catch (err) {
        console.error('Failed to load data:', err);
        showToast('Failed to load form data', 'error');
      }
    };
    loadData();
  }, []);

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
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.roomId) {
      newErrors.roomId = 'Room is required';
    }

    if (!formData.userId) {
      newErrors.userId = 'User is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      
      if (end <= start) {
        newErrors.endTime = 'End time must be after start time';
      }

      if (start < new Date()) {
        newErrors.startTime = 'Start time cannot be in the past';
      }
    }

    if (!formData.purpose || formData.purpose.trim().length < 10) {
      newErrors.purpose = 'Purpose must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setLoading(true);

      const bookingData = {
        roomId: formData.roomId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        purpose: formData.purpose.trim(),
        eventId: formData.eventId || null,
        notes: formData.notes.trim() || null
      };

      await bookingApi.createBooking(bookingData);
      
      showToast('Booking created successfully!', 'success');
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else if (onNavigateBack) {
          onNavigateBack();
        }
      }, 1000);
    } catch (err) {
      console.error('Error creating booking:', err);
      showToast(err.message || 'Failed to create booking', 'error');
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
    <div className="create-booking-container">
      <div className="form-header">
        <button className="btn-back" onClick={handleCancel}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back
        </button>
        <h2>Create New Booking</h2>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-grid">
          {/* Room Selection */}
          <div className="form-group">
            <label htmlFor="roomId">
              Room <span className="required">*</span>
            </label>
            <select
              id="roomId"
              name="roomId"
              value={formData.roomId}
              onChange={handleChange}
              className={errors.roomId ? 'error' : ''}
              disabled={loading}
            >
              <option value="">Select a room</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name} - {room.building} (Capacity: {room.capacity})
                </option>
              ))}
            </select>
            {errors.roomId && <span className="error-message">{errors.roomId}</span>}
          </div>

          {/* User Selection */}
          <div className="form-group">
            <label htmlFor="userId">
              User <span className="required">*</span>
            </label>
            <select
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              className={errors.userId ? 'error' : ''}
              disabled={loading}
            >
              <option value="">Select a user</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.email})
                </option>
              ))}
            </select>
            {errors.userId && <span className="error-message">{errors.userId}</span>}
          </div>

          {/* Start Time */}
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
              className={errors.startTime ? 'error' : ''}
              disabled={loading}
            />
            {errors.startTime && <span className="error-message">{errors.startTime}</span>}
          </div>

          {/* End Time */}
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
              className={errors.endTime ? 'error' : ''}
              disabled={loading}
            />
            {errors.endTime && <span className="error-message">{errors.endTime}</span>}
          </div>

          {/* Event (Optional) */}
          <div className="form-group">
            <label htmlFor="eventId">Event (Optional)</label>
            <select
              id="eventId"
              name="eventId"
              value={formData.eventId}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">No event</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          {/* Purpose */}
          <div className="form-group full-width">
            <label htmlFor="purpose">
              Purpose <span className="required">*</span>
            </label>
            <textarea
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Enter the purpose of this booking (minimum 10 characters)"
              rows="3"
              className={errors.purpose ? 'error' : ''}
              disabled={loading}
            />
            {errors.purpose && <span className="error-message">{errors.purpose}</span>}
          </div>

          {/* Notes */}
          <div className="form-group full-width">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes..."
              rows="3"
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
            {loading ? 'Creating...' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBooking;

