import React, { useEffect, useMemo, useState } from 'react';
import { eventApi } from '../../../api';
import { ensureArray, normalizeSlot, formatDateDisplay, formatTimeDisplay, groupSlotsByRoom } from '../../event-management/admin/eventBookingHelpers';

/**
 * Booking Form Component
 * A popup form for creating lab/room bookings
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Object} props.roomInfo - Room information (id, name) [optional when booking by event slot]
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
  const [eventSlots, setEventSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');

  // Load events when modal opens
  useEffect(() => {
    const loadEvents = async () => {
      if (isOpen) {
        try {
          setLoadingEvents(true);
          const eventsData = await eventApi.getEvents({ isUpcoming: true });
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
      setEventSlots([]);
      setSelectedSlotId('');
    }
  }, [isOpen]);

  // Load selected event detail and its slots
  useEffect(() => {
    const loadEventDetail = async () => {
      if (!formData.eventId) {
        setEventSlots([]);
        setSelectedSlotId('');
        return;
      }

      try {
        const detail = await eventApi.getEventById(formData.eventId);
        const slotsRaw = ensureArray(detail?.roomSlots || detail?.RoomSlots);
        const normalized = slotsRaw.map(normalizeSlot);
        setEventSlots(normalized);
      } catch (err) {
        console.error('Failed to load event detail:', err);
        setEventSlots([]);
      }
    };

    loadEventDetail();
  }, [formData.eventId]);

  const groupedSlots = useMemo(() => groupSlotsByRoom(eventSlots), [eventSlots]);

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

    if (!formData.eventId) {
      newErrors.eventId = 'Please select an event';
    }

    if (!selectedSlotId) {
      newErrors.slot = 'Please select a time slot of the event';
    }

    if (!formData.purpose || formData.purpose.trim().length === 0) {
      newErrors.purpose = 'Purpose is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Map from selected slot -> start/end times & roomId
    const slot = eventSlots.find(s => s.id === selectedSlotId);
    const startTimeIso = slot?.startDateTime ? new Date(slot.startDateTime).toISOString() : undefined;
    const endTimeIso = slot?.endDateTime ? new Date(slot.endDateTime).toISOString() : undefined;

    const bookingData = {
      roomId: slot?.roomId || roomInfo?.id,
      startTime: startTimeIso,
      endTime: endTimeIso,
      purpose: formData.purpose.trim(),
      notes: formData.notes.trim() || undefined,
      eventId: formData.eventId.trim()
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
            <label htmlFor="eventId">
              Event <span className="required">*</span>
            </label>
            <select
              id="eventId"
              name="eventId"
              value={formData.eventId}
              onChange={handleChange}
              disabled={isSubmitting || loadingEvents}
              className={errors.eventId ? 'error' : ''}
            >
              <option value="">
                {loadingEvents ? 'Loading events...' : 'Select an upcoming event'}
              </option>
              {events.map(event => (
                <option key={event.id || event.Id} value={event.id || event.Id}>
                  {event.title || event.Title}
                </option>
              ))}
            </select>
            {errors.eventId && (
              <span className="error-message">{errors.eventId}</span>
            )}
          </div>

          {/* Slots of selected event */}
          {formData.eventId && (
            <div className="form-group full-width">
              <label>Available Slots</label>
              {eventSlots.length === 0 ? (
                <div className="slot-container info">This event has no available slots.</div>
              ) : (
                <div className="slot-group-list">
                  {groupedSlots.map(group => (
                    <div key={group.roomId || 'room'} className="slot-group-card">
                      <div className="slot-group-header">
                        <span>{group.roomName || 'Room'}</span>
                      </div>
                      <div className="slot-group-body">
                        <div className="slot-grid">
                          {group.slots.map(slot => {
                            const isSelected = selectedSlotId === slot.id;
                            const classNames = ['slot-card'];
                            if (isSelected) classNames.push('selected');
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                className={classNames.join(' ')}
                                onClick={() => {
                                  setSelectedSlotId(slot.id);
                                  // Autofill read-only times to show preview
                                  setFormData(prev => ({
                                    ...prev,
                                    startTime: slot.startDateTime ? new Date(slot.startDateTime).toISOString() : '',
                                    endTime: slot.endDateTime ? new Date(slot.endDateTime).toISOString() : ''
                                  }));
                                  if (errors.slot) setErrors(prev => ({ ...prev, slot: null }));
                                }}
                                disabled={isSubmitting}
                              >
                                <span className="slot-time">{slot.timeRange || `${formatTimeDisplay(slot.startDateTime)} - ${formatTimeDisplay(slot.endDateTime)}`}</span>
                                <span className="slot-date">{slot.dateFormatted || formatDateDisplay(slot.startDateTime)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {errors.slot && (
                <span className="error-message">{errors.slot}</span>
              )}
            </div>
          )}

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

          {/* Purpose & Notes */}

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

