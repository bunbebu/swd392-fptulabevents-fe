import React, { useState, useEffect, useCallback } from 'react';
import { eventApi, authApi, bookingApi } from '../../../api';
import CreateEvent from '../admin/CreateEvent';
import EditEvent from '../admin/EditEvent';

/**
 * Event List Component - Common for both Admin and Users
 *
 * For Admin: Full event management with create/edit/delete actions
 * For Users: View events and upcoming events
 *
 * Related User Stories:
 * - US-XX: Admin - Manage events
 * - US-XX: User - View events
 *
 * Related Use Cases:
 * - UC-XX: Manage Events (Admin)
 * - UC-XX: View Events (All Users)
 */
const EventList = ({ userRole = 'Student', onSelectEvent, onViewEvent }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [toast, setToast] = useState(null);

  // Modal states
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [showEditPage, setShowEditPage] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState(null);

  // Local filter states (for input fields before applying)
  const [localFilters, setLocalFilters] = useState({
    searchTerm: '',
    status: '',
    startDateFrom: '',
    startDateTo: ''
  });

  // API filter states
  const [apiFilters, setApiFilters] = useState({
    title: '',
    location: '',
    status: '',
    startDateFrom: '',
    startDateTo: '',
    page: 0,
    pageSize: 8
  });

  const isAdmin = userRole === 'Admin';
  const canCreateEvent = isAdmin || userRole === 'Lecturer';
  const isStudent = userRole === 'Student';
  
  // State for registered events (for students)
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
  const [registeringEventId, setRegisteringEventId] = useState(null);
  const [confirmRegisterEvent, setConfirmRegisterEvent] = useState(null);

  // Helper function to normalize event data (handle both Title/title)
  const normalizeEvent = (event) => {
    // Get location from various sources
    let location = event.location || event.Location;
    
    // Debug: Log to see what data is available
    console.log('Normalizing event:', {
      id: event.id || event.Id,
      hasLocation: !!(event.location || event.Location),
      hasRoomName: !!(event.roomName || event.RoomName),
      hasLabName: !!(event.labName || event.LabName),
      hasRoomSlots: !!(event.roomSlots || event.RoomSlots),
      roomSlotsLength: (event.roomSlots || event.RoomSlots || []).length,
      allKeys: Object.keys(event)
    });
    
    // If no location, try to get from roomName, labName, or roomSlots
    if (!location || location === 'N/A' || location === '') {
      location = event.roomName || event.RoomName;
    }
    if (!location || location === 'N/A' || location === '') {
      location = event.labName || event.LabName;
    }
    if (!location || location === 'N/A' || location === '') {
      const roomSlots = event.roomSlots || event.RoomSlots || [];
      if (roomSlots.length > 0) {
        const firstSlot = roomSlots[0];
        location = firstSlot.roomName || firstSlot.RoomName || 
                   (firstSlot.room && (firstSlot.room.name || firstSlot.room.Name)) ||
                   (firstSlot.Room && (firstSlot.Room.name || firstSlot.Room.Name));
        console.log('Got location from roomSlots:', location);
      }
    }
    
    return {
      ...event,
      id: event.id || event.Id,
      title: event.title || event.Title || 'Untitled Event',
      description: event.description || event.Description,
      location: location || 'N/A',
      startDate: event.startDate || event.StartDate,
      endDate: event.endDate || event.EndDate,
      status: event.status !== undefined ? event.status : event.Status,
      createdBy: event.createdBy || event.CreatedBy,
      bookingCount: event.bookingCount || event.BookingCount || 0,
      roomName: event.roomName || event.RoomName,
      labName: event.labName || event.LabName,
      roomSlots: event.roomSlots || event.RoomSlots || []
    };
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    // No timeout - toast will remain visible until manually dismissed or replaced
  };

  // Load event data with pagination
  const loadEvents = useCallback(async (page = currentPage, isPagination = false) => {
    try {
      // Only show main loading on initial load, not on pagination
      if (isPagination) {
        setPaginationLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Use current API filters with pagination
      const filters = {
        ...apiFilters,
        page: page - 1, // Backend uses 0-based pagination
        pageSize: pageSize
      };
      
      // Clean up empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => 
          value !== '' && value !== null && value !== undefined && value !== false
        )
      );

      // Try to get event list first, handle other calls separately
      let eventList;
      try {
        eventList = await eventApi.getEvents(cleanFilters);
      } catch (authErr) {
        // If 401, try to refresh token and retry once
        if (authErr.status === 401) {
          try {
            await authApi.refresh();
            eventList = await eventApi.getEvents(cleanFilters);
          } catch (refreshErr) {
            throw authErr; // Throw original error if refresh fails
          }
        } else {
          throw authErr;
        }
      }
      
      // Get counts separately with error handling
      let totalCount = 0;
      let activeCount = 0;
      
      try {
        const countResult = await eventApi.getEventCount();
        totalCount = countResult?.Count || countResult?.count || 0;
      } catch (countErr) {
        console.warn('Failed to get total count:', countErr);
        // Fallback: count from event list if it's an array
        if (Array.isArray(eventList)) {
          totalCount = eventList.length;
        }
      }
      
      try {
        const activeCountResult = await eventApi.getActiveEventCount();
        activeCount = activeCountResult?.ActiveCount || activeCountResult?.activeCount || 0;
      } catch (activeErr) {
        console.warn('Failed to get active count:', activeErr);
        // Fallback: count active events from list
        if (Array.isArray(eventList)) {
          activeCount = eventList.filter(event => event.status === 'Active').length;
        }
      }

      console.log('Event API responses:', { eventList, totalCount, activeCount });

      // Handle array response format
      let eventData = [];
      let totalCountFromApi = 0;

      if (Array.isArray(eventList)) {
        eventData = eventList;
        totalCountFromApi = eventList.length;
      } else if (eventList?.data && Array.isArray(eventList.data)) {
        eventData = eventList.data;
        totalCountFromApi = eventList.totalCount || eventList.data.length;
      } else if (eventList?.Data && Array.isArray(eventList.Data)) {
        eventData = eventList.Data;
        totalCountFromApi = eventList.TotalCount || eventList.Data.length;
      }

      // Determine if any filters (besides pagination) are applied
      const hasNonPagingFilters = !!(filters.title || filters.location || filters.status !== '' || filters.startDateFrom || filters.startDateTo);

      // Prefer backend total count when no non-paging filters are applied
      const derivedTotalCount = (!hasNonPagingFilters && totalCount) ? totalCount : totalCountFromApi;
      const derivedTotalPages = Math.max(1, Math.ceil((derivedTotalCount || 0) / pageSize));

      console.log('Normalized counts:', { totalCount, activeCount, derivedTotalCount, derivedTotalPages });

      // Normalize event data to handle both Title/title properties
      const normalizedEvents = eventData.map(event => normalizeEvent(event));

      // Set events first (without location)
      setEvents(normalizedEvents);

      // Load location for events that don't have it (from event detail) - lazy load
      const loadLocationsForEvents = async () => {
        const eventsNeedingLocation = normalizedEvents.filter(e => !e.location || e.location === 'N/A' || e.location === '');
        
        if (eventsNeedingLocation.length === 0) {
          return;
        }

        // Load location for each event in parallel (limit to visible events only)
        const eventsWithLocation = await Promise.all(
          normalizedEvents.map(async (event) => {
            // If event already has location, return as is
            if (event.location && event.location !== 'N/A' && event.location !== '') {
              return event;
            }

            // Load event detail to get location
            try {
              const eventDetail = await eventApi.getEventById(event.id);
              const location = eventDetail.location || eventDetail.Location ||
                              eventDetail.roomName || eventDetail.RoomName ||
                              eventDetail.labName || eventDetail.LabName ||
                              (eventDetail.roomSlots && eventDetail.roomSlots.length > 0 
                                ? eventDetail.roomSlots[0].roomName || eventDetail.roomSlots[0].RoomName 
                                : null) ||
                              'N/A';
              
              return {
                ...event,
                location: location,
                roomName: eventDetail.roomName || eventDetail.RoomName,
                labName: eventDetail.labName || eventDetail.LabName,
                roomSlots: eventDetail.roomSlots || eventDetail.RoomSlots || []
              };
            } catch (error) {
              console.error(`Error loading location for event ${event.id}:`, error);
              return event; // Return event without location if error
            }
          })
        );

        // Update events with location
        setEvents(eventsWithLocation);
      };

      // Load locations asynchronously (don't block UI)
      loadLocationsForEvents();
      setTotalPages(derivedTotalPages);
      setTotalEvents(derivedTotalCount);
      setStats({ total: totalCount, active: activeCount });
    } catch (err) {
      console.error('Error loading events:', err);
      
      // Handle specific error types
      if (err.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (err.status === 403) {
        setError('Access denied. You do not have permission to view events.');
      } else if (err.status === 0) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError(err.message || 'Unable to load event list');
      }
      
      setEvents([]);
      setTotalEvents(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [apiFilters, currentPage, pageSize]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Load registered events for students
  const loadRegisteredEvents = useCallback(async () => {
    if (!isStudent) return;
    
    try {
      const storedUser = window.localStorage.getItem('user') || window.sessionStorage.getItem('user');
      if (!storedUser) return;
      
      const user = JSON.parse(storedUser);
      if (!user?.id) return;
      
      const response = await bookingApi.getBookings({
        userId: user.id,
        pageSize: 100
      });
      
      const bookings = Array.isArray(response) ? response : (response?.data || []);
      
      // Filter bookings that have EventId (event registrations)
      const eventBookings = bookings.filter(booking => {
        const eventId = booking.eventId || booking.EventId;
        return eventId != null && eventId !== '';
      });
      
      // Get unique event IDs
      const eventIds = new Set(eventBookings.map(b => b.eventId || b.EventId));
      setRegisteredEventIds(eventIds);
    } catch (error) {
      console.error('Error loading registered events:', error);
    }
  }, [isStudent]);

  useEffect(() => {
    if (isStudent) {
      loadRegisteredEvents();
    }
  }, [isStudent, loadRegisteredEvents]);

  // Debug: Log when confirmRegisterEvent changes
  useEffect(() => {
    console.log('confirmRegisterEvent state changed:', confirmRegisterEvent);
  }, [confirmRegisterEvent]);

  // Register for event
  const handleRegisterEvent = (event) => {
    console.log('handleRegisterEvent called with event:', event);
    
    if (!isStudent) {
      console.log('Not a student, returning');
      return;
    }
    
    const storedUser = window.localStorage.getItem('user') || window.sessionStorage.getItem('user');
    if (!storedUser) {
      showToast('Please log in to register for events', 'error');
      return;
    }
    
    const user = JSON.parse(storedUser);
    if (!user?.id) {
      showToast('User information not found', 'error');
      return;
    }
    
    // Check if already registered
    if (registeredEventIds.has(event.id)) {
      showToast('You have already registered for this event', 'error');
      return;
    }
    
    // Check event status
    if (event.status === 'Cancelled' || event.status === 2) {
      showToast('This event has been cancelled', 'error');
      return;
    }
    
    if (event.status === 'Completed' || event.status === 3) {
      showToast('This event has been completed', 'error');
      return;
    }
    
    // Check capacity
    if (event.capacity && event.bookingCount >= event.capacity) {
      showToast('This event has reached its capacity', 'error');
      return;
    }
    
    // Note: We don't check room slots here because event list items may not include this info
    // We'll check it in handleConfirmedRegister after fetching event details
    
    // Show confirm modal
    console.log('Setting confirmRegisterEvent to:', event);
    setConfirmRegisterEvent(event);
  };

  // Handle confirmed registration
  const handleConfirmedRegister = async () => {
    if (!confirmRegisterEvent) return;
    
    const event = confirmRegisterEvent;
    setConfirmRegisterEvent(null);
    setRegisteringEventId(event.id);
    
    try {
      // Get event details to get room information
      const eventDetails = await eventApi.getEventById(event.id);
      
      console.log('Event details for registration:', eventDetails);
      console.log('Event details roomSlots:', eventDetails.roomSlots || eventDetails.RoomSlots);
      
      // Get roomId from event (try multiple sources)
      let roomId = eventDetails.roomId || eventDetails.RoomId;
      
      // If not found, try to get from roomSlots
      if (!roomId && eventDetails.roomSlots && eventDetails.roomSlots.length > 0) {
        const firstSlot = eventDetails.roomSlots[0];
        console.log('First slot from roomSlots:', firstSlot);
        roomId = firstSlot.roomId || firstSlot.RoomId || 
                 (firstSlot.room && (firstSlot.room.id || firstSlot.room.Id)) ||
                 (firstSlot.Room && (firstSlot.Room.id || firstSlot.Room.Id));
      }
      
      // Also try RoomSlots (capital R)
      if (!roomId && eventDetails.RoomSlots && eventDetails.RoomSlots.length > 0) {
        const firstSlot = eventDetails.RoomSlots[0];
        console.log('First slot from RoomSlots:', firstSlot);
        roomId = firstSlot.roomId || firstSlot.RoomId || 
                 (firstSlot.room && (firstSlot.room.id || firstSlot.room.Id)) ||
                 (firstSlot.Room && (firstSlot.Room.id || firstSlot.Room.Id));
      }
      
      console.log('Extracted roomId:', roomId);
      console.log('Room slots count:', (eventDetails.roomSlots || eventDetails.RoomSlots || []).length);
      
      // Check if event has room slots (required by backend)
      const roomSlots = eventDetails.roomSlots || eventDetails.RoomSlots || [];
      if (roomSlots.length === 0) {
        console.log('Event has no room slots, showing error message and returning early');
        // Show a more user-friendly error message
        showToast('This event is not properly configured. It does not have any room slots assigned. Please contact the administrator to set up the event properly before registering.', 'error');
        return; // Return early instead of throwing to avoid showing error toast twice
      }
      
      console.log('Event has room slots, proceeding with booking creation');
      
      // Create booking for event
      // Backend will automatically get roomId from event's RoomSlots, so we don't need to send it
      // But we can include it if we found it (optional)
      const bookingPayload = {
        eventId: event.id,
        startTime: event.startDate || event.StartDate,
        endTime: event.endDate || event.EndDate,
        purpose: `Event registration for ${event.title}`,
        notes: `Registered for event: ${event.title}`
      };
      
      // Only include roomId if we found it (optional, backend will get it from event's RoomSlots)
      if (roomId) {
        bookingPayload.roomId = roomId;
      }
      
      console.log('Creating booking with payload:', bookingPayload);
      await bookingApi.createBooking(bookingPayload);
      
      // Update registered events
      setRegisteredEventIds(prev => new Set([...prev, event.id]));
      
      // Update event booking count
      setEvents(prevEvents => 
        prevEvents.map(e => 
          e.id === event.id 
            ? { ...e, bookingCount: (e.bookingCount || 0) + 1 }
            : e
        )
      );
      
      showToast('Successfully registered for event!', 'success');
    } catch (error) {
      console.error('Error registering for event:', error);
      
      // Handle specific error messages
      let errorMessage = error.message || error.data?.message || error.data?.Message || 'Failed to register for event';
      
      // Improve error messages for common cases
      if (errorMessage.includes('RoomSlots') || errorMessage.includes('room slots')) {
        errorMessage = 'This event is not properly configured. It does not have any room slots assigned. Please contact the administrator to set up the event properly.';
      } else if (errorMessage.includes('capacity')) {
        errorMessage = 'This event has reached its maximum capacity.';
      } else if (errorMessage.includes('already')) {
        errorMessage = 'You have already registered for this event.';
      } else if (errorMessage.includes('cancelled')) {
        errorMessage = 'This event has been cancelled and cannot accept registrations.';
      } else if (errorMessage.includes('completed')) {
        errorMessage = 'This event has been completed and cannot accept registrations.';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setRegisteringEventId(null);
    }
  };

  // Pagination handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      loadEvents(newPage, true);
    }
  };

  // CRUD operation handlers
  const handleCreateEventSuccess = async () => {
    setShowCreatePage(false);
    showToast('Event created successfully!', 'success');
    await loadEvents(currentPage);
  };

  const handleEditEventSuccess = async () => {
    setShowEditPage(false);
    setSelectedEvent(null);
    showToast('Event updated successfully!', 'success');
    await loadEvents(currentPage);
  };

  const handleDeleteEvent = async (eventId) => {
    const eventToDelete = events.find(e => e.id === eventId);
    
    // Set loading state
    setActionLoading(true);
    
    // Remove from UI immediately
    setEvents(prev => prev.filter(event => event.id !== eventId));
    setTotalEvents(prev => prev - 1);

    try {
      console.log('Attempting to delete event:', eventId);
      await eventApi.deleteEvent(eventId, true);
      setConfirmDeleteEvent(null);
      showToast('Event deleted successfully!', 'success');

      // Reload events to ensure consistency
      await loadEvents(currentPage);
    } catch (err) {
      // Restore event on error
      setEvents(prev => [...prev, eventToDelete]);
      setTotalEvents(prev => prev + 1);

      // Show specific error message
      console.error('Delete error full object:', err);
      console.error('Error status:', err.status);
      console.error('Error message:', err.message);
      console.error('Error data:', err.data);
      console.error('Error details:', err.details);

      let errorMessage = 'Failed to delete event';

      // Check for validation errors from backend
      if (err.data?.errors || err.details) {
        const errors = err.data?.errors || err.details;
        console.log('Parsing validation errors:', errors);

        // Extract error messages from validation errors
        const errorMessages = [];

        if (typeof errors === 'object') {
          Object.keys(errors).forEach(key => {
            const messages = errors[key];
            if (Array.isArray(messages)) {
              errorMessages.push(...messages);
            } else if (typeof messages === 'string') {
              errorMessages.push(messages);
            }
          });
        }

        if (errorMessages.length > 0) {
          // Use the first error message
          errorMessage = errorMessages[0];
          console.log('Extracted error message:', errorMessage);
        }
      }

      // Check err.data for backend message
      if (!errorMessage || errorMessage === 'Failed to delete event') {
        if (err.data?.title) {
          errorMessage = err.data.title;
        } else if (err.data?.Message || err.data?.message) {
          errorMessage = err.data.Message || err.data.message;
        } else if (err.message && err.message !== 'Request failed (400)') {
          errorMessage = err.message;
        }
      }

      // Check for specific error patterns and provide user-friendly messages
      if (
        errorMessage.includes('entity changes') ||
        errorMessage.includes('foreign key') ||
        errorMessage.includes('constraint') ||
        errorMessage.includes('booking') ||
        errorMessage.includes('related data')
      ) {
        errorMessage = 'Cannot delete event: This event has related data that must be removed first. This may include:\n• Bookings\n• Notifications\n• Reports\n• Other linked records\n\nPlease check and remove all dependencies through their respective management pages before deleting this event.';
      } else if (errorMessage.includes('validation error')) {
        // Keep validation error as is
        errorMessage = `Cannot delete event: ${errorMessage}`;
      } else if (err.status === 400) {
        // For generic 400, add helpful prefix
        if (errorMessage === 'Failed to delete event' || errorMessage.includes('Request failed')) {
          errorMessage = 'Cannot delete event: The server rejected this request. This event may have related data that needs to be removed first.';
        } else if (!errorMessage.includes('Cannot delete')) {
          errorMessage = `Cannot delete event: ${errorMessage}`;
        }
      } else if (err.status === 404) {
        errorMessage = 'Event not found';
      } else if (err.status === 401) {
        errorMessage = 'Authentication required';
      } else if (err.status === 403) {
        errorMessage = 'You do not have permission to delete this event';
      }

      showToast(errorMessage, 'error');
      setConfirmDeleteEvent(null); // Close modal on error
    } finally {
      setActionLoading(false);
    }
  };

  // Open edit page
  const openEditPage = (event) => {
    setSelectedEvent(event);
    setShowEditPage(true);
  };

  // Apply filters
  const applyFilters = () => {
    // Copy local filters to API filters
    setApiFilters(prev => ({
      ...prev,
      title: localFilters.searchTerm,
      location: localFilters.searchTerm,
      status: localFilters.status,
      startDateFrom: localFilters.startDateFrom,
      startDateTo: localFilters.startDateTo
    }));
    setCurrentPage(1);
    // loadEvents will be called automatically by useEffect when apiFilters changes
  };

  // Clear filters
  const clearFilters = () => {
    setLocalFilters({
      searchTerm: '',
      status: '',
      startDateFrom: '',
      startDateTo: ''
    });
    setApiFilters({
      title: '',
      location: '',
      status: '',
      startDateFrom: '',
      startDateTo: '',
      page: 0,
      pageSize: 8
    });
    setCurrentPage(1);
    // loadEvents will be called automatically by useEffect when apiFilters changes
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status?.toString()) {
      case 'Active':
        return 'status-badge status-available';
      case 'Inactive':
        return 'status-badge status-unavailable';
      case 'Cancelled':
        return 'status-badge status-maintenance';
      case 'Completed':
        return 'status-badge status-occupied';
      default:
        return 'status-badge unknown';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="room-list-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading events...
        </div>
      </div>
    );
  }

  return (
    <div className="room-list-container">
      {showCreatePage ? (
        <CreateEvent onNavigateBack={() => setShowCreatePage(false)} onSuccess={handleCreateEventSuccess} />
      ) : showEditPage ? (
        <EditEvent event={selectedEvent} onNavigateBack={() => {
          setShowEditPage(false);
          setSelectedEvent(null);
        }} onSuccess={handleEditEventSuccess} />
      ) : (
        <>
          {canCreateEvent && (
            <div className="room-list-header">
              <h2>Event Management</h2>
              <button
                className="btn-new-booking"
                onClick={() => setShowCreatePage(true)}
                disabled={actionLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                Create New Event
              </button>
            </div>
          )}

          {/* Success/Error Notification above table */}
          {toast && (
            <div 
              className="table-notification"
              style={{
                backgroundColor: toast.type === 'success' ? '#d1fae5' : '#fee2e2',
                color: toast.type === 'success' ? '#065f46' : '#dc2626',
                border: toast.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                {toast.type === 'success' ? (
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                ) : (
                  <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                )}
              </svg>
              {toast.message}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
              <div className="error-actions">
                <button onClick={() => loadEvents()} className="btn btn-secondary">
                  Retry
                </button>
                {error.includes('Authentication required') && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      // Clear tokens and redirect to login
                      localStorage.removeItem('accessToken');
                      localStorage.removeItem('refreshToken');
                      sessionStorage.removeItem('accessToken');
                      sessionStorage.removeItem('refreshToken');
                      window.location.href = '/login';
                    }}
                  >
                    Go to Login
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="room-list-stats">
            <span>Total events: {totalEvents}</span>
            <span>Page {currentPage} / {totalPages}</span>
          </div>

          {/* Filter Controls */}
          <div className="filter-controls">
            <div className="filter-row">
              <div className="search-bar">
                <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Search by title or location..."
                  value={localFilters.searchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocalFilters(prev => ({
                      ...prev,
                      searchTerm: value
                    }));
                  }}
                  className="search-input"
                />
                {localFilters.searchTerm && (
                  <button
                    className="clear-search"
                    onClick={() => setLocalFilters(prev => ({
                      ...prev,
                      searchTerm: ''
                    }))}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18"></path>
                      <path d="M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>

              <div className="filter-group">
                <select
                  value={localFilters.status}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All Status</option>
                  <option value="0">Active</option>
                  <option value="1">Inactive</option>
                  <option value="2">Cancelled</option>
                  <option value="3">Completed</option>
                </select>
              </div>

              <div className="filter-actions">
                <button
                  className="btn btn-primary"
                  onClick={applyFilters}
                  disabled={actionLoading}
                >
                  Apply Filters
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={clearFilters}
                  disabled={actionLoading}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          <div className="event-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {loading && !paginationLoading ? (
              Array.from({ length: pageSize }).map((_, idx) => (
                <div key={`skeleton-card-${idx}`} className="event-card" style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fff', minHeight: 220 }}>
                  <div style={{ height: 140, background: '#f1f5f9' }}></div>
                  <div style={{ padding: 12 }}>
                    <div className="skeleton-text" style={{ width: '60%', height: 12, marginBottom: 8, background: '#e2e8f0' }}></div>
                    <div className="skeleton-text" style={{ width: '40%', height: 10, background: '#e2e8f0' }}></div>
                  </div>
                </div>
              ))
            ) : events.length === 0 ? (
              <div className="no-data" style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b' }}>No event data</div>
            ) : (
              <>
                {events.map((event) => {
                  const idShort = event.id?.substring(0, 8) || '';
                  return (
                    <div key={event.id} className="event-card" style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', height: 140, background: '#f8fafc' }}>
                        {event.imageUrl ? (
                          <img src={event.imageUrl} alt={`${event.title} cover`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>No image</div>
                        )}
                        <span className={getStatusBadgeClass(event.status)} style={{ position: 'absolute', top: 8, left: 8 }}>{event.status || 'Unknown'}</span>
                      </div>
                      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <h3 style={{ fontSize: 16, margin: 0, color: '#0f172a' }}>{event.title}</h3>
                          {isAdmin && (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>#{idShort}</span>
                          )}
                        </div>
                        {event.description && (
                          <div className="text-muted small" style={{ color: '#64748b' }}>
                            {event.description.substring(0, 80)}{event.description.length > 80 ? '…' : ''}
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                          <div style={{ fontSize: 12, color: '#334155' }}>Start: <strong>{formatDate(event.startDate)}</strong></div>
                          <div style={{ fontSize: 12, color: '#334155' }}>End: <strong>{formatDate(event.endDate)}</strong></div>
                          <div style={{ fontSize: 12, color: '#334155' }}>Capacity: <strong>{typeof event.capacity === 'number' ? event.capacity : 'N/A'}</strong></div>
                          <div style={{ fontSize: 12, color: '#334155' }}>Registered: <strong>{event.bookingCount || 0}</strong></div>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: '1px solid #e5e7eb',
                          gap: 12
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b', flexShrink: 0 }}>
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {event.location || 'N/A'}
                            </span>
                          </div>
                          <div className="action-buttons" style={{ 
                            display: 'flex !important', 
                            flexDirection: 'row !important',
                            flexWrap: 'nowrap !important',
                            gap: 6, 
                            alignItems: 'center',
                            flexShrink: 0,
                            minWidth: 0
                          }}>
                            {isStudent && (
                              registeredEventIds.has(event.id) ? (
                                <button
                                  className="btn btn-sm"
                                  style={{ 
                                    background: '#10b981', 
                                    color: 'white',
                                    border: 'none',
                                    padding: '0 12px',
                                    height: '32px',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    whiteSpace: 'nowrap',
                                    lineHeight: '1',
                                    flexShrink: 0
                                  }}
                                  disabled
                                  title="Already registered"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6L9 17l-5-5"/>
                                  </svg>
                                  Registered
                                </button>
                              ) : (
                                (() => {
                                  // Check if event has room slots (if available in list)
                                  const eventRoomSlots = event.roomSlots || event.RoomSlots || [];
                                  const hasRoomSlots = eventRoomSlots.length > 0;
                                  const isDisabled = registeringEventId === event.id || actionLoading || !hasRoomSlots;
                                  
                                  return (
                                    <button
                                      className="btn btn-sm"
                                      style={{ 
                                        background: isDisabled && !hasRoomSlots ? '#9ca3af' : '#3b82f6', 
                                        color: 'white',
                                        border: 'none',
                                        padding: '0 12px',
                                        height: '32px',
                                        fontSize: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        whiteSpace: 'nowrap',
                                        lineHeight: '1',
                                        flexShrink: 0,
                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                        opacity: isDisabled ? 0.6 : 1
                                      }}
                                      onClick={() => handleRegisterEvent(event)}
                                      disabled={isDisabled}
                                      title={
                                        !hasRoomSlots 
                                          ? 'This event is not properly configured. It does not have any room slots assigned. Please contact the administrator.'
                                          : 'Register for event'
                                      }
                                    >
                                  {registeringEventId === event.id ? (
                                    <>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                                      </svg>
                                      Registering...
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14"></path>
                                        <path d="M12 5v14"></path>
                                      </svg>
                                      Register
                                    </>
                                  )}
                                    </button>
                                  );
                                })()
                              )
                            )}
                            {(isAdmin || userRole === 'Lecturer') && (
                              <button
                                className="btn btn-sm btn-icon btn-icon-outline color-blue"
                                onClick={() => openEditPage(event)}
                                disabled={actionLoading}
                                aria-label="Edit event"
                                title="Edit"
                                style={{ 
                                  width: '32px', 
                                  height: '32px', 
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 20h9"/>
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                                </svg>
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                className="btn btn-sm btn-icon btn-icon-outline color-red"
                                onClick={() => setConfirmDeleteEvent(event)}
                                disabled={actionLoading}
                                aria-label="Delete event"
                                title="Delete"
                                style={{ 
                                  width: '32px', 
                                  height: '32px', 
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                                  <path d="M10 11v6"/>
                                  <path d="M14 11v6"/>
                                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Add placeholder divs to fill the last row if needed */}
                {(() => {
                  const totalItems = events.length;
                  const remaining = totalItems % 3;
                  // If remaining is 0, all rows are full (no placeholders needed)
                  // If remaining is 1 or 2, we need to add placeholders to fill the last row
                  if (remaining === 0) return null;
                  const placeholdersNeeded = 3 - remaining;
                  console.log(`Events: ${totalItems}, Remaining: ${remaining}, Placeholders needed: ${placeholdersNeeded}`);
                  return Array.from({ length: placeholdersNeeded }).map((_, idx) => (
                    <div 
                      key={`placeholder-${idx}`} 
                      className="event-card"
                      style={{ 
                        opacity: 0,
                        pointerEvents: 'none',
                        border: '1px solid transparent',
                        minHeight: 220,
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%'
                      }} 
                      aria-hidden="true" 
                    />
                  ));
                })()}
              </>
            )}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              className="btn btn-secondary"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || actionLoading || paginationLoading}
            >
              {paginationLoading && currentPage > 1 ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Loading...
                </>
              ) : (
                'Previous'
              )}
            </button>
            <span className="page-info">
              Page {currentPage} / {totalPages}
              {paginationLoading && (
                <span className="pagination-loading-indicator">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                </span>
              )}
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || actionLoading || paginationLoading}
            >
              {paginationLoading && currentPage < totalPages ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Loading...
                </>
              ) : (
                'Next'
              )}
            </button>
          </div>

        </>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteEvent && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete event <strong>{normalizeEvent(confirmDeleteEvent).title}</strong>?</p>

              {/* Warning for any potential dependencies */}
              <div style={{
                padding: '12px',
                backgroundColor: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '6px',
                marginTop: '12px',
                marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#92400E', display: 'block', marginBottom: '4px' }}>Important Notice</strong>
                    {confirmDeleteEvent.bookingCount > 0 ? (
                      <p style={{ color: '#92400E', fontSize: '14px', margin: 0 }}>
                        This event has <strong>{confirmDeleteEvent.bookingCount} booking(s)</strong>. You must cancel or delete all bookings before deleting this event.
                      </p>
                    ) : (
                      <p style={{ color: '#92400E', fontSize: '14px', margin: 0 }}>
                        This event may have related data (notifications, reports, or other records). If deletion fails, you may need to remove these dependencies first through their respective management pages.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-muted small">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteEvent(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              {confirmDeleteEvent.bookingCount > 0 ? (
                <button
                  className="btn btn-danger"
                  disabled={true}
                  title="Cannot delete event with existing bookings"
                  style={{ cursor: 'not-allowed', opacity: 0.5 }}
                >
                  Cannot Delete (Has Bookings)
                </button>
              ) : (
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteEvent(confirmDeleteEvent.id || confirmDeleteEvent.Id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Register Event Modal */}
      {confirmRegisterEvent && (
        <div className="modal-overlay" onClick={() => setConfirmRegisterEvent(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Event Registration</h3>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '16px', color: '#374151', margin: 0, lineHeight: '1.5' }}>
                    Do you want to register for <strong style={{ color: '#111827' }}>"{confirmRegisterEvent.title || confirmRegisterEvent.Title}"</strong>?
                  </p>
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                      <strong style={{ color: '#374151' }}>Event Details:</strong>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>
                      <div>📅 <strong>Date:</strong> {confirmRegisterEvent.startDate ? new Date(confirmRegisterEvent.startDate).toLocaleDateString() : 'N/A'}</div>
                      {confirmRegisterEvent.location && confirmRegisterEvent.location !== 'N/A' && (
                        <div>📍 <strong>Location:</strong> {confirmRegisterEvent.location}</div>
                      )}
                      {confirmRegisterEvent.capacity > 0 && (
                        <div>👥 <strong>Capacity:</strong> {confirmRegisterEvent.bookingCount || 0} / {confirmRegisterEvent.capacity} registered</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                You will receive a confirmation once your registration is approved.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmRegisterEvent(null)}
                disabled={registeringEventId === confirmRegisterEvent.id}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmedRegister}
                disabled={registeringEventId === confirmRegisterEvent.id}
              >
                {registeringEventId === confirmRegisterEvent.id ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Registering...
                  </>
                ) : (
                  'Confirm Registration'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventList;

