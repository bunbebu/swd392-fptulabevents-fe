import React, { useEffect, useMemo, useState, useRef } from 'react';
import { eventApi, labsApi, roomsApi } from '../../../api';
import {
  uploadImage,
  validateImageFile,
  isStorageAvailable,
  createPreviewUrl,
  revokePreviewUrl,
  formatFileSize
} from '../../../utils/imageUpload';
import {
  BOOKING_MODES,
  DEFAULT_BOOKING_MODE,
  ensureArray,
  toDateTimeLocal,
  parseDateTimeLocal,
  startOfDay,
  endOfDay,
  normalizeLab,
  normalizeRoom,
  normalizeSlot,
  formatDateDisplay,
  formatTimeDisplay,
  groupSlotsByRoom
} from './eventBookingHelpers';

/**
 * Create Event Page Component - Admin Only
 *
 * Dedicated page for creating new event
 *
 * Related Use Cases:
 * - UC-XX: Manage Events (Admin)
 * - UC-XX: Create Event (Admin)
 *
 * Features:
 * - Event creation with all required fields
 * - Date/time validation
 * - Status selection
 * - Visibility toggle
 * - Recurrence rule support
 * - Booking mode selection (Lab vs Room)
 */
const CreateEvent = ({ onNavigateBack, onSuccess }) => {

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    status: 0, // Active by default
    visibility: true,
    recurrenceRule: '',
    capacity: 1,
    imageUrl: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Booking mode & selections
  const [bookingMode, setBookingMode] = useState(DEFAULT_BOOKING_MODE);
  const [labs, setLabs] = useState([]);
  const [labsLoading, setLabsLoading] = useState(false);
  const [labsError, setLabsError] = useState('');
  const [selectedLabId, setSelectedLabId] = useState('');

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');

  const [slotDate, setSlotDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [selectedSlotIds, setSelectedSlotIds] = useState(() => new Set());

  const groupedSlots = useMemo(() => groupSlotsByRoom(slots), [slots]);
  const slotMap = useMemo(() => {
    const map = new Map();
    slots.forEach((slot) => {
      map.set(slot.id, slot);
    });
    return map;
  }, [slots]);

  const selectedRoomsCount = useMemo(() => {
    const roomsSet = new Set();
    selectedSlotIds.forEach((id) => {
      const slot = slotMap.get(id);
      if (slot?.roomId) {
        roomsSet.add(slot.roomId);
      }
    });
    return roomsSet.size;
  }, [selectedSlotIds, slotMap]);

  const isSlotBooked = (slot) => Boolean(slot?.eventId);

  const canSelectSlot = (slot) => {
    // Only check if slot is booked, allow selecting from multiple rooms
    return !isSlotBooked(slot);
  };

  // Image upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [useUrlInput, setUseUrlInput] = useState(!isStorageAvailable());
  const fileInputRef = useRef(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        revokePreviewUrl(previewUrl);
      }
    };
  }, [previewUrl]);

  // Load labs on mount
  useEffect(() => {
    let isMounted = true;
    const loadLabs = async () => {
      setLabsLoading(true);
      setLabsError('');
      try {
        const response = await labsApi.getLabs();
        if (!isMounted) return;
        const normalized = ensureArray(response).map(normalizeLab);
        setLabs(normalized);
        if (!selectedLabId && normalized.length === 1) {
          setSelectedLabId(normalized[0].id);
        }
      } catch (error) {
        if (isMounted) {
          setLabsError(error?.message || 'Failed to load labs');
        }
      } finally {
        if (isMounted) {
          setLabsLoading(false);
        }
      }
    };

    loadLabs();
    return () => {
      isMounted = false;
    };
  }, [selectedLabId]);

  // Update slot date when start date changes (only if slot date is not already set by user)
  useEffect(() => {
    if (!formData.startDate) return;
    // Only auto-set slot date if user hasn't manually selected one yet
    if (!slotDate) {
      const datePart = formData.startDate.split('T')[0];
      if (datePart) {
        setSlotDate(datePart);
      }
    }
  }, [formData.startDate, slotDate]);

  // Fetch rooms when lab changes
  useEffect(() => {
    if (!selectedLabId) {
      setRooms([]);
      setSelectedRoomId('');
      return;
    }

    let isMounted = true;
    const loadRooms = async () => {
      setRoomsLoading(true);
      setRoomsError('');
      try {
        const response = await roomsApi.getRooms({ labId: selectedLabId });
        if (!isMounted) return;
        const normalized = ensureArray(response).map(normalizeRoom);
        setRooms(normalized);
        if (bookingMode === BOOKING_MODES.ROOM) {
          // Reset selection if current room not in list
          if (!normalized.find((room) => room.id === selectedRoomId)) {
            setSelectedRoomId('');
          }
        }
      } catch (error) {
        if (isMounted) {
          setRoomsError(error?.message || 'Failed to load rooms');
          setRooms([]);
        }
      } finally {
        if (isMounted) {
          setRoomsLoading(false);
        }
      }
    };

    loadRooms();

    return () => {
      isMounted = false;
    };
  }, [selectedLabId, bookingMode, selectedRoomId]);

  // Fetch available slots when room/date changes (room booking mode only)
  useEffect(() => {
    if (bookingMode !== BOOKING_MODES.ROOM) {
      setSlots([]);
      setSelectedSlotIds(new Set());
      return;
    }

    if (!selectedRoomId || !slotDate) {
      setSlots([]);
      setSelectedSlotIds(new Set());
      return;
    }

    let isMounted = true;
    const loadSlots = async () => {
      setSlotsLoading(true);
      setSlotsError('');
      try {
        const startDateObj = startOfDay(slotDate);
        const endDateObj = endOfDay(slotDate);
        const response = await roomsApi.getRoomSlotsByDateRange(selectedRoomId, startDateObj, endDateObj);
        if (!isMounted) return;
        const currentRoom = rooms.find((room) => room.id === selectedRoomId);
        const normalized = ensureArray(response)
          .map((item) => {
            const slot = normalizeSlot(item);
            return {
              ...slot,
              roomId: slot.roomId || selectedRoomId,
              roomName: slot.roomName || currentRoom?.name || ''
            };
          });
        setSlots(normalized);
        setSelectedSlotIds((prev) => {
          const next = new Set();
          normalized.forEach((slot) => {
            if (!slot.eventId && prev.has(slot.id)) {
              next.add(slot.id);
            }
          });
          return next;
        });
      } catch (error) {
        if (isMounted) {
          setSlotsError(error?.message || 'Failed to load room slots');
          setSlots([]);
          setSelectedSlotIds(new Set());
        }
      } finally {
        if (isMounted) {
          setSlotsLoading(false);
        }
      }
    };

    loadSlots();

    return () => {
      isMounted = false;
    };
  }, [bookingMode, selectedRoomId, slotDate, rooms]);

  // Fetch slots for all rooms in lab mode
  useEffect(() => {
    if (bookingMode !== BOOKING_MODES.LAB) {
      return;
    }

    if (!selectedLabId || !slotDate || rooms.length === 0) {
      setSlots([]);
      setSelectedSlotIds(new Set());
      return;
    }

    let isMounted = true;
    const loadLabSlots = async () => {
      setSlotsLoading(true);
      setSlotsError('');
      try {
        const startDateObj = startOfDay(slotDate);
        const endDateObj = endOfDay(slotDate);
        const requests = rooms.map(async (room) => {
          try {
            const res = await roomsApi.getRoomSlotsByDateRange(room.id, startDateObj, endDateObj);
            const normalized = ensureArray(res)
              .map((item) => {
                const slot = normalizeSlot(item);
                return {
                  ...slot,
                  roomId: room.id,
                  roomName: room.name
                };
              });
            return normalized;
          } catch (error) {
            console.error('Failed to load slots for room', room.id, error);
            return [];
          }
        });

        const results = await Promise.all(requests);
        if (!isMounted) return;
        const flattened = results.flat();
        setSlots(flattened);
        setSelectedSlotIds((prev) => {
          const next = new Set();
          flattened.forEach((slot) => {
            if (!slot.eventId && prev.has(slot.id)) {
              next.add(slot.id);
            }
          });
          return next;
        });
      } catch (error) {
        if (isMounted) {
          setSlotsError(error?.message || 'Failed to load room slots');
          setSlots([]);
          setSelectedSlotIds(new Set());
        }
      } finally {
        if (isMounted) {
          setSlotsLoading(false);
        }
      }
    };

    loadLabSlots();

    return () => {
      isMounted = false;
    };
  }, [bookingMode, selectedLabId, slotDate, rooms]);

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

    if (name === 'startDate' && value) {
      const datePart = value.split('T')[0];
      if (datePart && !slotDate) {
        setSlotDate(datePart);
      }
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrors(prev => ({ ...prev, imageUrl: validation.error }));
      return;
    }

    // Clear any previous errors
    setErrors(prev => ({ ...prev, imageUrl: '' }));

    // Set selected file
    setSelectedFile(file);

    // Create preview
    const preview = createPreviewUrl(file);
    if (previewUrl) {
      revokePreviewUrl(previewUrl);
    }
    setPreviewUrl(preview);
  };

  // Handle removing selected image
  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      revokePreviewUrl(previewUrl);
      setPreviewUrl('');
    }
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Toggle between file upload and URL input
  const handleToggleInputMode = () => {
    setUseUrlInput(!useUrlInput);
    handleRemoveImage();
  };

  const handleBookingModeChange = (mode) => {
    if (mode === bookingMode) return;
    setBookingMode(mode);
    setErrors((prev) => ({ ...prev, roomSlotIds: '', roomId: '' }));
    setSelectedSlotIds(new Set());
    if (mode === BOOKING_MODES.LAB) {
      setSelectedRoomId('');
      setSlots([]);
      setSlotDate('');
    }
  };

  const handleLabChange = (labId) => {
    setSelectedLabId(labId);
    setErrors((prev) => ({ ...prev, labId: '' }));
    setSelectedRoomId('');
    setSelectedSlotIds(new Set());
    setSlots([]);
    setSlotDate('');
  };

  const handleRoomChange = (roomId) => {
    setSelectedRoomId(roomId);
    setErrors((prev) => ({ ...prev, roomId: '' }));
    setSelectedSlotIds(new Set());
    setSlots([]);
  };

  const handleSlotDateChange = (value) => {
    setSlotDate(value);
    setSelectedSlotIds(new Set());
    setSlots([]);
  };

  const handleToggleSlot = (slotId) => {
    const slot = slotMap.get(slotId);
    if (!slot || !canSelectSlot(slot)) {
      return;
    }

    const next = new Set(selectedSlotIds);
    if (next.has(slotId)) {
      next.delete(slotId);
    } else {
      next.add(slotId);
    }

    setSelectedSlotIds(next);
    if (next.size > 0) {
      const selectedSlots = Array.from(next)
        .map((id) => slotMap.get(id))
        .filter(Boolean)
        .sort((a, b) => {
          const aTime = a.startDateTime?.getTime() ?? 0;
          const bTime = b.startDateTime?.getTime() ?? 0;
          return aTime - bTime;
        });

      const first = selectedSlots[0];
      const last = selectedSlots[selectedSlots.length - 1];

      if (first?.startDateTime && last?.endDateTime) {
        setFormData((prev) => {
          // Only update start/end dates if they are within the same date as slotDate
          // This prevents overwriting user's manually set dates
          const slotDateObj = new Date(slotDate);

          // Check if current formData dates are on the same day as slotDate
          const currentStartDate = prev.startDate ? new Date(prev.startDate) : null;
          const currentEndDate = prev.endDate ? new Date(prev.endDate) : null;

          const isSameDay = (date1, date2) => {
            return date1.getFullYear() === date2.getFullYear() &&
                   date1.getMonth() === date2.getMonth() &&
                   date1.getDate() === date2.getDate();
          };

          // Only update if formData dates are empty or on the same day as slotDate
          const shouldUpdateStart = !currentStartDate || isSameDay(currentStartDate, slotDateObj);
          const shouldUpdateEnd = !currentEndDate || isSameDay(currentEndDate, slotDateObj);

          return {
            ...prev,
            startDate: shouldUpdateStart ? toDateTimeLocal(first.startDateTime) : prev.startDate,
            endDate: shouldUpdateEnd ? toDateTimeLocal(last.endDateTime) : prev.endDate
          };
        });
      }
    }

    if (errors.roomSlotIds) {
      setErrors((prev) => ({ ...prev, roomSlotIds: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!selectedLabId) {
      newErrors.labId = 'Please select a lab';
    }

    if (bookingMode === BOOKING_MODES.LAB) {
      if (selectedLabId && !roomsLoading && rooms.length === 0) {
        newErrors.labId = 'Selected lab has no rooms available';
      }

      if (!selectedSlotIds.size) {
        newErrors.roomSlotIds = 'Please select at least one time slot';
      }
    }

    if (bookingMode === BOOKING_MODES.ROOM) {
      if (!selectedRoomId) {
        newErrors.roomId = 'Please select a room';
      }

      if (!selectedSlotIds.size) {
        newErrors.roomSlotIds = 'Please select at least one time slot';
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

      // Upload image to Cloudinary if file is selected
      let imageUrl = formData.imageUrl.trim();
      if (selectedFile && !useUrlInput) {
        try {
          setIsUploading(true);
          imageUrl = await uploadImage(selectedFile, 'events', (progress) => {
            setUploadProgress(progress);
          });
          setIsUploading(false);
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
          setErrors({ imageUrl: uploadError.message || 'Failed to upload image' });
          setLoading(false);
          setIsUploading(false);
          return;
        }
      }

      const parsedStart = parseDateTimeLocal(formData.startDate);
      const parsedEnd = parseDateTimeLocal(formData.endDate);

      let effectiveStart = parsedStart;
      let effectiveEnd = parsedEnd;
      let roomSlotIdsPayload = null;
      let slotsByRoom = [];
      let roomsCount = 0;

      if (bookingMode === BOOKING_MODES.ROOM || bookingMode === BOOKING_MODES.LAB) {
        const selectedSlots = slots
          .filter((slot) => selectedSlotIds.has(slot.id))
          .sort((a, b) => {
            const aTime = a.startDateTime?.getTime() ?? 0;
            const bTime = b.startDateTime?.getTime() ?? 0;
            return aTime - bTime;
          });

        if (selectedSlots.length > 0) {
          effectiveStart = selectedSlots[0].startDateTime || effectiveStart;
          effectiveEnd = selectedSlots[selectedSlots.length - 1].endDateTime || effectiveEnd;
          
          // For Book Entire Lab or Book Specific Room: use all selected slots
          // Backend supports multiple rooms as long as they belong to the same Lab (when roomId is null)
          roomSlotIdsPayload = selectedSlots.map((slot) => slot.id);
          
          // Group slots by roomId for logging purposes
          const grouped = {};
          selectedSlots.forEach(slot => {
            const roomId = slot.roomId || 'unknown';
            if (!grouped[roomId]) {
              grouped[roomId] = [];
            }
            grouped[roomId].push(slot);
          });
          
          slotsByRoom = Object.values(grouped);
          roomsCount = slotsByRoom.length;
        }
      }

      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        startDate: (effectiveStart || parsedStart || new Date()).toISOString(),
        endDate: (effectiveEnd || parsedEnd || new Date()).toISOString(),
        status: parseInt(formData.status),
        visibility: formData.visibility,
        recurrenceRule: formData.recurrenceRule.trim() || null,
        capacity: parseInt(formData.capacity),
        imageUrl: imageUrl || null,
        labId: selectedLabId || null,
        roomId: bookingMode === BOOKING_MODES.ROOM ? (selectedRoomId || null) : null,
        roomSlotIds: roomSlotIdsPayload && roomSlotIdsPayload.length ? roomSlotIdsPayload : null
      };

      console.log('Submitting event creation:', submitData);
      console.log('Slots grouped by room:', slotsByRoom?.map(group => ({
        roomId: group[0]?.roomId,
        roomName: group[0]?.roomName,
        slotCount: group.length
      })));

      // Create event with all selected slots
      // Backend supports Book Entire Lab with multiple rooms (roomId=null, slots from multiple rooms in same Lab)
      await eventApi.createEvent(submitData);
      
      console.log('✅ Event created successfully with', roomSlotIdsPayload?.length || 0, 'slots');
      if (roomsCount > 1) {
        console.log(`   Event spans ${roomsCount} rooms:`, slotsByRoom?.map(group => ({
          roomName: group[0]?.roomName,
          slotCount: group.length
        })));
      }

      // Cleanup preview URL
      if (previewUrl) {
        revokePreviewUrl(previewUrl);
      }

      // Navigate back to event list with success message
      if (onSuccess) {
        console.log('Event created successfully, calling onSuccess callback');
        onSuccess();
      } else if (onNavigateBack) {
        onNavigateBack();
      }
    } catch (err) {
      console.error('Failed to create event:', err);
      // Display more detailed error message
      let errorMessage = 'Failed to create event';

      if (err.data?.Message || err.data?.message) {
        errorMessage = err.data.Message || err.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Check for specific error details
      if (err.details) {
        console.error('Error details:', err.details);
        if (typeof err.details === 'string') {
          errorMessage += `: ${err.details}`;
        }
      }

      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

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
          <h1>Create New Event</h1>
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

              {/* Booking Mode */}
              <div className="form-group full-width">
                <label>Booking Mode</label>
                <div className="booking-mode-toggle">
                  <button
                    type="button"
                    className={`mode-button ${bookingMode === BOOKING_MODES.LAB ? 'active' : ''}`}
                    onClick={() => handleBookingModeChange(BOOKING_MODES.LAB)}
                    disabled={loading}
                  >
                    <span className="mode-title">Book Entire Lab</span>
                    <span className="mode-desc">Reserve the lab without selecting a specific room</span>
                  </button>
                  <button
                    type="button"
                    className={`mode-button ${bookingMode === BOOKING_MODES.ROOM ? 'active' : ''}`}
                    onClick={() => handleBookingModeChange(BOOKING_MODES.ROOM)}
                    disabled={loading}
                  >
                    <span className="mode-title">Book Specific Room</span>
                    <span className="mode-desc">Select a room and time slots for the event</span>
                  </button>
                </div>
              </div>

              {/* Lab Selection */}
              <div className="form-group full-width">
                <label htmlFor="labId">
                  Lab <span className="required">*</span>
                </label>
                {labsLoading ? (
                  <div className="loading-inline">Loading labs...</div>
                ) : (
                  <select
                    id="labId"
                    name="labId"
                    value={selectedLabId}
                    onChange={(e) => handleLabChange(e.target.value)}
                    disabled={loading || labs.length === 0}
                    className={errors.labId ? 'error' : ''}
                  >
                    <option value="">Select a lab</option>
                    {labs.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.name}{lab.location ? ` — ${lab.location}` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {labsError && <span className="error-message">{labsError}</span>}
                {errors.labId && <span className="error-message">{errors.labId}</span>}
              </div>

              {bookingMode === BOOKING_MODES.ROOM ? (
                <>
                  <div className="form-group">
                    <label htmlFor="roomId">
                      Room <span className="required">*</span>
                    </label>
                    {roomsLoading ? (
                      <div className="loading-inline">Loading rooms...</div>
                    ) : (
                      <select
                        id="roomId"
                        name="roomId"
                        value={selectedRoomId}
                        onChange={(e) => handleRoomChange(e.target.value)}
                        disabled={loading || rooms.length === 0}
                        className={errors.roomId ? 'error' : ''}
                      >
                        <option value="">Select a room</option>
                        {rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.name} — {room.capacity} seats
                          </option>
                        ))}
                      </select>
                    )}
                    {roomsError && <span className="error-message">{roomsError}</span>}
                    {errors.roomId && <span className="error-message">{errors.roomId}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="slotDate">Slot Date <span className="required">*</span></label>
                    <input
                      type="date"
                      id="slotDate"
                      name="slotDate"
                      value={slotDate}
                      onChange={(e) => handleSlotDateChange(e.target.value)}
                      disabled={loading || !selectedRoomId}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Available Slots</label>
                    {slotsLoading ? (
                      <div className="slot-container loading-inline">Loading slots...</div>
                    ) : !selectedRoomId ? (
                      <div className="slot-container info">Select a room to view available slots.</div>
                    ) : !slotDate ? (
                      <div className="slot-container info">Choose a slot date to view available slots.</div>
                    ) : slotsError ? (
                      <div className="slot-container error-message">{slotsError}</div>
                    ) : slots.length === 0 ? (
                      <div className="slot-container info">No available slots for the selected date.</div>
                    ) : (
                      <div className="slot-grid">
                        {slots.map((slot) => {
                          const isSelected = selectedSlotIds.has(slot.id);
                          const booked = isSlotBooked(slot);
                          const classNames = ['slot-card'];
                          if (isSelected) classNames.push('selected');
                          if (booked) classNames.push('booked');

                          return (
                            <button
                              key={slot.id}
                              type="button"
                              className={classNames.join(' ')}
                              onClick={() => handleToggleSlot(slot.id)}
                              disabled={loading || booked}
                            >
                              <span className="slot-time">{slot.timeRange || `${formatTimeDisplay(slot.startDateTime)} - ${formatTimeDisplay(slot.endDateTime)}`}</span>
                              <span className="slot-date">{slot.dateFormatted || formatDateDisplay(slot.startDateTime)}</span>
                              {booked && <span className="slot-status booked">Booked</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {selectedSlotIds.size > 0 && (
                      <div className="slot-summary">
                        Selected {selectedSlotIds.size} slot{selectedSlotIds.size > 1 ? 's' : ''}
                      </div>
                    )}
                    {errors.roomSlotIds && <span className="error-message">{errors.roomSlotIds}</span>}
                  </div>
                </>
              ) : (
                <>
                  {selectedLabId ? (
                    roomsLoading ? (
                      <div className="loading-inline">Loading rooms...</div>
                    ) : rooms.length > 0 ? (
                      <div className="form-group full-width">
                        <div className="info" style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '8px',
                          padding: '12px',
                          backgroundColor: '#eff6ff',
                          borderRadius: '8px',
                          border: '1px solid #bfdbfe',
                          marginBottom: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '2px', flexShrink: 0 }}>
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="16" x2="12" y2="12"></line>
                              <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontWeight: '600', color: '#1e40af', fontSize: '14px' }}>
                                You can select slots from multiple rooms in this lab.
                              </p>
                              <p style={{ margin: '4px 0 0 0', color: '#1e40af', fontSize: '13px' }}>
                                Select time slots from any room below. All selected slots will be included in your event.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="info" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <p>Available rooms in this lab:</p>
                          <div className="lab-room-list">
                            {rooms.map((room) => (
                              <span key={room.id} className="lab-room-chip">
                                {room.name}
                                <span style={{ fontSize: '11px', color: '#1e40af' }}>• {room.capacity} seats</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="slot-container info">No rooms found for this lab. Please add rooms first.</div>
                    )
                  ) : (
                    <div className="slot-container info">Select a lab to manage room slots.</div>
                  )}

                  <div className="form-group">
                    <label htmlFor="slotDate">Slot Date <span className="required">*</span></label>
                    <input
                      type="date"
                      id="slotDate"
                      name="slotDate"
                      value={slotDate}
                      onChange={(e) => handleSlotDateChange(e.target.value)}
                      disabled={loading || !selectedLabId || rooms.length === 0}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Available Slots</label>
                    {slotsLoading ? (
                      <div className="slot-container loading-inline">Loading slots...</div>
                    ) : !selectedLabId ? (
                      <div className="slot-container info">Select a lab to view slots.</div>
                    ) : rooms.length === 0 ? (
                      <div className="slot-container info">No rooms available for this lab.</div>
                    ) : !slotDate ? (
                      <div className="slot-container info">Choose a slot date to view available slots.</div>
                    ) : slotsError ? (
                      <div className="slot-container error-message">{slotsError}</div>
                    ) : slots.length === 0 ? (
                      <div className="slot-container info">No available slots for the selected date.</div>
                    ) : (
                      <div className="slot-group-list">
                        {groupedSlots.map((group) => (
                          <div key={group.roomId} className="slot-group-card">
                            <div className="slot-group-header">
                              <span>{group.roomName}</span>
                            </div>
                            <div className="slot-group-body">
                              <div className="slot-grid">
                                {group.slots.map((slot) => {
                                  const isSelected = selectedSlotIds.has(slot.id);
                                  const booked = isSlotBooked(slot);
                                  const canSelect = canSelectSlot(slot);
                                  const isDisabled = loading || booked || !canSelect;
                                  const classNames = ['slot-card'];
                                  if (isSelected) classNames.push('selected');
                                  if (booked) classNames.push('booked');

                                  return (
                                    <button
                                      key={slot.id}
                                      type="button"
                                      className={classNames.join(' ')}
                                      onClick={() => handleToggleSlot(slot.id)}
                                      disabled={isDisabled}
                                      title={booked ? 'This slot is already booked' : undefined}
                                    >
                                      <span className="slot-time">{slot.timeRange || `${formatTimeDisplay(slot.startDateTime)} - ${formatTimeDisplay(slot.endDateTime)}`}</span>
                                      <span className="slot-date">{slot.dateFormatted || formatDateDisplay(slot.startDateTime)}</span>
                                      {booked && <span className="slot-status booked">Booked</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedSlotIds.size > 0 && (
                      <div className="slot-summary">
                        Selected {selectedSlotIds.size} slot{selectedSlotIds.size > 1 ? 's' : ''} across {selectedRoomsCount || 0} room{selectedRoomsCount === 1 ? '' : 's'}
                      </div>
                    )}
                    {errors.roomSlotIds && <span className="error-message">{errors.roomSlotIds}</span>}
                  </div>
                </>
              )}

              {/* Event Image */}
              <div className="form-group">
                <div className="image-upload-header">
                  <label>Event Cover Image</label>
                  {isStorageAvailable() && (
                    <button
                      type="button"
                      className="toggle-input-mode"
                      onClick={handleToggleInputMode}
                      disabled={loading || isUploading}
                    >
                      {useUrlInput ? 'Upload File Instead' : 'Use URL Instead'}
                    </button>
                  )}
                </div>

                {useUrlInput ? (
                  <>
                    <input
                      type="url"
                      id="imageUrl"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/event-cover.jpg"
                      disabled={loading || isUploading}
                      className={errors.imageUrl ? 'error' : ''}
                    />
                  </>
                ) : (
                  <>
                    <div className="file-upload-container">
                      <input
                        type="file"
                        ref={fileInputRef}
                        id="eventImage"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileSelect}
                        disabled={loading || isUploading}
                        className="file-input"
                      />
                      <label htmlFor="eventImage" className="file-upload-label compact">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <span className="upload-placeholder">
                          {selectedFile ? selectedFile.name : 'Choose an image or drag it here'}
                        </span>
                        {selectedFile && (
                          <span className="file-size">
                            {formatFileSize(selectedFile.size)}
                          </span>
                        )}
                      </label>
                    </div>

                    {isUploading && (
                      <div className="upload-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                        <span className="progress-text">{uploadProgress}%</span>
                      </div>
                    )}

                    {previewUrl && (
                      <div className="image-preview">
                        <img src={previewUrl} alt="Event preview" />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={handleRemoveImage}
                          disabled={loading || isUploading}
                          title="Remove image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    )}

                    <p className="file-upload-hint">
                      Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB
                    </p>
                  </>
                )}

                {errors.imageUrl && <span className="error-message">{errors.imageUrl}</span>}
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
                disabled={loading || isUploading}
              >
                {isUploading ? `Uploading... ${uploadProgress}%` : loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;

