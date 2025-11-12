import React, { useState, useEffect, useCallback } from 'react';
import { eventApi, authApi, bookingApi } from '../../../api';
import CreateEvent from '../admin/CreateEvent';
import EditEvent from '../admin/EditEvent';

const STATUS_MAP = {
  '0': 'Pending',
  '1': 'Active',
  '2': 'Inactive',
  '3': 'Cancelled',
  '4': 'Completed',
  '5': 'Rejected'
};

const normalizeStatus = (value) => {
  if (value === null || value === undefined) return '';
  const strValue = String(value);
  return STATUS_MAP[strValue] || strValue;
};

const filterLecturerEvents = (events, filters) => {
  let filtered = events;

  if (filters.title) {
    const term = filters.title.toLowerCase();
    filtered = filtered.filter(event => {
      const title = (event.title || '').toLowerCase();
      const location = (event.location || '').toLowerCase();
      return title.includes(term) || location.includes(term);
    });
  }

  if (filters.status !== '' && filters.status !== undefined) {
    const targetStatus = normalizeStatus(filters.status).toLowerCase();
    filtered = filtered.filter(event => normalizeStatus(event.status).toLowerCase() === targetStatus);
  }

  if (filters.startDateFrom) {
    const fromDate = new Date(filters.startDateFrom);
    filtered = filtered.filter(event => {
      if (!event.startDate) return false;
      const start = new Date(event.startDate);
      return !Number.isNaN(start.getTime()) && start >= fromDate;
    });
  }

  if (filters.startDateTo) {
    const toDate = new Date(filters.startDateTo);
    filtered = filtered.filter(event => {
      if (!event.startDate) return false;
      const start = new Date(event.startDate);
      return !Number.isNaN(start.getTime()) && start <= toDate;
    });
  }

  return filtered;
};

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
  const isLecturer = userRole === 'Lecturer';
  const canCreateEvent = isAdmin || isLecturer;
  const isStudent = userRole === 'Student';
  
  // State for registered events (for students)
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
  const [registeringEventId, setRegisteringEventId] = useState(null);
  const [confirmRegisterEvent, setConfirmRegisterEvent] = useState(null);
  const [selectedRoomForRegistration, setSelectedRoomForRegistration] = useState(null);
  const [availableRoomsForEvent, setAvailableRoomsForEvent] = useState([]);
  // Approval modal for event registrations
  const [approvalEvent, setApprovalEvent] = useState(null);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  
  // Event approval/rejection modals
  const [approveEventModal, setApproveEventModal] = useState(null);
  const [rejectEventModal, setRejectEventModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNote, setApprovalNote] = useState('');
  const [processingApproval, setProcessingApproval] = useState(false);

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
      createdAt: event.createdAt || event.CreatedAt || event.created_at || event.Created_At,
      bookingCount: event.bookingCount || event.BookingCount || 0,
      roomName: event.roomName || event.RoomName,
      labName: event.labName || event.LabName,
      roomSlots: event.roomSlots || event.RoomSlots || []
    };
  };

  // Load pending bookings for an event
  const openApprovalsForEvent = async (event) => {
    setApprovalEvent(event);
    setPendingBookings([]);
    setLoadingApprovals(true);
    try {
      const resp = await bookingApi.getBookings({
        eventId: event.id || event.Id,
        status: 0,
        pageSize: 100
      });
      const list = Array.isArray(resp) ? resp : (resp?.data || resp?.Data || []);
      setPendingBookings(list);
    } catch (e) {
      console.error('Failed to load pending bookings for event', event.id, e);
      setPendingBookings([]);
    } finally {
      setLoadingApprovals(false);
    }
  };

  // Group bookings by room
  const groupBookingsByRoom = (bookings) => {
    const grouped = {};
    bookings.forEach(booking => {
      const roomId = booking.roomId || booking.RoomId || 'unknown';
      const roomName = booking.roomName || booking.RoomName || 
                      (booking.room && (booking.room.name || booking.room.Name)) ||
                      (booking.Room && (booking.Room.name || booking.Room.Name)) ||
                      `Room ${roomId.substring(0, 8)}`;
      
      if (!grouped[roomId]) {
        grouped[roomId] = {
          roomId,
          roomName,
          bookings: []
        };
      }
      grouped[roomId].bookings.push(booking);
    });
    return Object.values(grouped);
  };

  const handleApproveRejectBooking = async (booking, action) => {
    const id = booking.id || booking.Id;
    const status = action === 'approve' ? 1 : 2;
    const confirmed = window.confirm(`Are you sure you want to ${action} this registration?`);
    if (!confirmed) return;
    try {
      await bookingApi.updateBookingStatus(id, status, action === 'reject' ? 'Rejected by event manager' : 'Approved by event manager');
      setPendingBookings(prev => prev.filter(b => (b.id || b.Id) !== id));
      showToast(`Booking ${action}d successfully`, 'success');
    } catch (err) {
      console.error('Failed to update booking status', err);
      showToast(err.message || `Failed to ${action} booking`, 'error');
    }
  };

  // Handle approve event
  const handleApproveEvent = async () => {
    if (!approveEventModal) return;
    
    setProcessingApproval(true);
    try {
      await eventApi.approveEvent(approveEventModal.id, approvalNote || null);
      setApproveEventModal(null);
      setApprovalNote('');
      showToast('Event approved successfully!', 'success');
      await loadEvents(currentPage);
    } catch (err) {
      console.error('Failed to approve event', err);
      showToast(err.message || 'Failed to approve event', 'error');
    } finally {
      setProcessingApproval(false);
    }
  };

  // Handle reject event
  const handleRejectEvent = async () => {
    if (!rejectEventModal) return;
    
    if (!rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }
    
    setProcessingApproval(true);
    try {
      await eventApi.rejectEvent(rejectEventModal.id, rejectionReason);
      setRejectEventModal(null);
      setRejectionReason('');
      showToast('Event rejected successfully', 'success');
      await loadEvents(currentPage);
    } catch (err) {
      console.error('Failed to reject event', err);
      showToast(err.message || 'Failed to reject event', 'error');
    } finally {
      setProcessingApproval(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    // No timeout - toast will remain visible until manually dismissed or replaced
  };

  // Load event data with pagination
  const loadEvents = useCallback(async (page = currentPage, isPagination = false) => {
    try {
      if (isPagination) {
        setPaginationLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const filters = {
        ...apiFilters,
        page: page - 1,
        pageSize: pageSize
      };

      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) =>
          value !== '' && value !== null && value !== undefined && value !== false
        )
      );

      // For students, only show Active events
      if (isStudent) {
        cleanFilters.status = '1'; // Active status
      }

      // Note: Admin should see ALL events (both Admin and Lecturer created events)
      // Do not add any creator/user filter for Admin - backend will return all events

      let eventList;
      if (isLecturer) {
        // Lecturer: Only show events created by this lecturer
        try {
          eventList = await eventApi.getMyEvents();
        } catch (myEventsErr) {
          console.warn('Failed to load lecturer events via /my-events, attempting fallback', myEventsErr);
          const storedUser = window.localStorage.getItem('user') || window.sessionStorage.getItem('user');
          const user = storedUser ? JSON.parse(storedUser) : null;
          const lecturerId = user?.id || user?.Id;
          if (lecturerId) {
            eventList = await eventApi.getEventsByUserId(lecturerId);
          } else {
            throw myEventsErr;
          }
        }
      } else {
        // Admin and Student: Get all events (Admin sees all, Student sees only Active)
        // Backend will handle role-based filtering (Admin sees all statuses, Student sees only Active)
        try {
          console.log('[EventList] Loading events for Admin/Student with filters:', cleanFilters);
          eventList = await eventApi.getEvents(cleanFilters);
          console.log('[EventList] Received events from API:', {
            isArray: Array.isArray(eventList),
            hasData: !!(eventList?.data || eventList?.Data),
            dataLength: Array.isArray(eventList) ? eventList.length : (eventList?.data?.length || eventList?.Data?.length || 0),
            rawResponse: eventList
          });
        } catch (authErr) {
          if (authErr.status === 401) {
            try {
              await authApi.refresh();
              eventList = await eventApi.getEvents(cleanFilters);
            } catch (refreshErr) {
              throw authErr;
            }
          } else {
            throw authErr;
          }
        }
      }

      let totalCount = 0;
      let activeCount = 0;
      let pendingCount = 0;
      let derivedTotalCount = 0;
      let derivedTotalPages = 1;

      if (!isLecturer) {
        try {
          const countResult = await eventApi.getEventCount();
          totalCount = countResult?.Count || countResult?.count || 0;
        } catch (countErr) {
          console.warn('Failed to get total count:', countErr);
          if (Array.isArray(eventList)) {
            totalCount = eventList.length;
          }
        }

        try {
          const activeCountResult = await eventApi.getActiveEventCount();
          activeCount = activeCountResult?.ActiveCount || activeCountResult?.activeCount || 0;
        } catch (activeErr) {
          console.warn('Failed to get active count:', activeErr);
          if (Array.isArray(eventList)) {
            activeCount = eventList.filter(event => normalizeStatus(event.status).toLowerCase() === 'active').length;
          }
        }

        // Get pending count if filtering by Pending status
        if (isAdmin && cleanFilters.status === '0') {
          try {
            const pendingCountResult = await eventApi.getPendingEventCount();
            pendingCount = pendingCountResult?.PendingCount || pendingCountResult?.pendingCount || 0;
            console.log('[EventList] Pending count from API:', pendingCount);
          } catch (pendingErr) {
            console.warn('Failed to get pending count:', pendingErr);
          }
        }
      }

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

      if (!isLecturer) {
        const hasNonPagingFilters = !!(filters.title || filters.location || filters.status !== '' || filters.startDateFrom || filters.startDateTo);
        
        // When there are filters, try to get accurate count from specific API endpoints
        // For Pending status: use getPendingEventCount API
        // For other filters: use heuristic estimation
        if (hasNonPagingFilters) {
          // If filtering by Pending status and we have the count from API, use it
          if (cleanFilters.status === '0' && pendingCount > 0) {
            derivedTotalCount = pendingCount;
            console.log('[EventList] Using pending count from API:', pendingCount);
          } else if (eventData.length === pageSize) {
            // Full page: assume there are at least (currentPage + 1) pages
            // This ensures "Next" button is enabled and user can navigate forward
            // The estimate will be corrected when we reach a non-full page
            derivedTotalCount = (page + 1) * pageSize;
          } else {
            // Non-full page: this is definitely the last page
            // Calculate exact total: all previous pages + current page items
            derivedTotalCount = ((page - 1) * pageSize) + eventData.length;
          }
        } else {
          // No filters: use the total count from API (accurate)
          derivedTotalCount = totalCount || totalCountFromApi;
        }
        
        derivedTotalPages = Math.max(1, Math.ceil((derivedTotalCount || 0) / pageSize));
        console.log('Normalized counts:', { 
          totalCount, 
          activeCount, 
          derivedTotalCount, 
          derivedTotalPages,
          hasNonPagingFilters,
          currentPageDataLength: eventData.length,
          pageSize,
          currentPage: page
        });
      } else {
        console.log('Lecturer event load:', { totalItems: eventData.length });
      }

      let normalizedEvents = eventData.map(event => normalizeEvent(event));
      
      // Debug: Log all events received (for Admin debugging)
      if (isAdmin) {
        const allCreators = [...new Set(normalizedEvents.map(e => e.createdBy || e.CreatedBy).filter(Boolean))];
        const pendingEvents = normalizedEvents.filter(e => normalizeStatus(e.status) === 'Pending');
        const pendingCreators = [...new Set(pendingEvents.map(e => e.createdBy || e.CreatedBy).filter(Boolean))];
        
        console.log('[EventList] Normalized events for Admin:', {
          total: normalizedEvents.length,
          allCreators: allCreators,
          events: normalizedEvents.map(e => ({
            id: e.id,
            title: e.title,
            status: e.status,
            normalizedStatus: normalizeStatus(e.status),
            createdBy: e.createdBy || e.CreatedBy
          })),
          pendingEvents: {
            total: pendingEvents.length,
            creators: pendingCreators,
            events: pendingEvents.map(e => ({
              id: e.id,
              title: e.title,
              createdBy: e.createdBy || e.CreatedBy
            }))
          }
        });
        
        // Warn if all pending events are from Admin/Administrator (possible backend filtering issue)
        if (pendingEvents.length > 0 && pendingCreators.every(c => c === 'Admin' || c === 'Administrator')) {
          console.warn('[EventList] WARNING: All pending events are from Admin/Administrator. No Lecturer events found. This might indicate a backend filtering issue.');
        }
      }
      
      // IMPORTANT: Do NOT filter events by creator/user for Admin
      // Admin should see ALL events (both Admin and Lecturer created events)
      // Only filter by status if needed (handled by backend API)
      
      // For students, filter to only show Active events (additional safety check)
      if (isStudent) {
        normalizedEvents = normalizedEvents.filter(event => {
          const eventStatus = normalizeStatus(event.status);
          return eventStatus === 'Active';
        });
      }
      
      // Sort by newest first (prefer createdAt if available, fallback to startDate)
      // This ensures newest events appear first for all roles (admin, lecturer, student)
      const sortByNewest = (a, b) => {
        // Try to get createdAt from various possible field names
        const aCreatedAt = a.createdAt || a.CreatedAt || a.created_at || a.Created_At || 
                          (a.originalEvent && (a.originalEvent.createdAt || a.originalEvent.CreatedAt));
        const bCreatedAt = b.createdAt || b.CreatedAt || b.created_at || b.Created_At || 
                          (b.originalEvent && (b.originalEvent.createdAt || b.originalEvent.CreatedAt));
        
        // If both have createdAt, use it for sorting
        if (aCreatedAt && bCreatedAt) {
          const aDate = new Date(aCreatedAt).getTime();
          const bDate = new Date(bCreatedAt).getTime();
          // Sort descending (newest first)
          return bDate - aDate;
        }
        
        // If only one has createdAt, prioritize it
        if (aCreatedAt && !bCreatedAt) return -1;
        if (!aCreatedAt && bCreatedAt) return 1;
        
        // Fallback to startDate if createdAt is not available
        const aStartDate = a.startDate || a.StartDate || a.start_date || a.Start_Date || 0;
        const bStartDate = b.startDate || b.StartDate || b.start_date || b.Start_Date || 0;
        const aDate = new Date(aStartDate).getTime();
        const bDate = new Date(bStartDate).getTime();
        
        // Sort descending (newest first)
        return bDate - aDate;
      };
      
      // Sort events by newest first
      normalizedEvents.sort(sortByNewest);
      
      if (isLecturer) {
        normalizedEvents = filterLecturerEvents(normalizedEvents, apiFilters);
        // Re-sort after filtering to ensure newest first order is maintained
        normalizedEvents.sort(sortByNewest);
      }

      // For Lecturer: client-side pagination (slice events)
      // For Admin/Student: backend already did pagination, use all events from response
      const startIndex = (page - 1) * pageSize;
      const eventsForDisplay = isLecturer
        ? normalizedEvents.slice(startIndex, startIndex + pageSize)
        : normalizedEvents; // Backend already paginated, use all events from response

      setEvents(eventsForDisplay);

      const loadLocationsForEvents = async () => {
        const eventsNeedingLocation = eventsForDisplay.filter(e => !e.location || e.location === 'N/A' || e.location === '');

        if (eventsNeedingLocation.length === 0) {
          return;
        }

        const eventsWithLocation = await Promise.all(
          eventsForDisplay.map(async (event) => {
            if (event.location && event.location !== 'N/A' && event.location !== '') {
              return event;
            }

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
              return event;
            }
          })
        );

        setEvents(eventsWithLocation);
      };

      loadLocationsForEvents();

      if (isLecturer) {
        const effectiveTotalCount = normalizedEvents.length;
        const effectiveTotalPages = Math.max(1, Math.ceil(effectiveTotalCount / pageSize));
        const lecturerActiveCount = normalizedEvents.filter(event => normalizeStatus(event.status).toLowerCase() === 'active').length;
        setTotalPages(effectiveTotalPages);
        setTotalEvents(effectiveTotalCount);
        setStats({ total: effectiveTotalCount, active: lecturerActiveCount });
      } else {
        setTotalPages(derivedTotalPages);
        setTotalEvents(derivedTotalCount);
        setStats({ total: totalCount, active: activeCount });
      }
    } catch (err) {
      console.error('Error loading events:', err);

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
  }, [apiFilters, currentPage, pageSize, isLecturer, isAdmin, isStudent]);

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
      
      // Get unique event IDs - normalize to lowercase strings for comparison
      const eventIds = new Set(
        eventBookings
          .map(b => {
            const id = b.eventId || b.EventId;
            return id ? String(id).toLowerCase() : null;
          })
          .filter(id => id != null)
      );
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
  const handleRegisterEvent = async (event) => {
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
    if (registeredEventIds.has(String(event.id).toLowerCase())) {
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
    
    // Get event details to check for multiple rooms
    try {
      const eventDetails = await eventApi.getEventById(event.id);
      const roomSlots = eventDetails.roomSlots || eventDetails.RoomSlots || [];
      
      // Extract unique rooms from roomSlots
      const roomsMap = new Map();
      roomSlots.forEach(slot => {
        const roomId = slot.roomId || slot.RoomId || 
                      (slot.room && (slot.room.id || slot.room.Id)) ||
                      (slot.Room && (slot.Room.id || slot.Room.Id));
        const roomName = slot.roomName || slot.RoomName ||
                        (slot.room && (slot.room.name || slot.room.Name)) ||
                        (slot.Room && (slot.Room.name || slot.Room.Name));
        
        if (roomId && !roomsMap.has(roomId)) {
          roomsMap.set(roomId, {
            id: roomId,
            name: roomName || `Room ${roomId.substring(0, 8)}`,
            capacity: slot.room?.capacity || slot.Room?.capacity || slot.capacity || null
          });
        }
      });
      
      const uniqueRooms = Array.from(roomsMap.values());
      
      // If multiple rooms, set available rooms and show selection in modal
      if (uniqueRooms.length > 1) {
        setAvailableRoomsForEvent(uniqueRooms);
        setSelectedRoomForRegistration(uniqueRooms[0]); // Default to first room
      } else {
        setAvailableRoomsForEvent([]);
        setSelectedRoomForRegistration(null);
      }
      
      // Show confirm modal
      console.log('Setting confirmRegisterEvent to:', event);
      setConfirmRegisterEvent(event);
    } catch (error) {
      console.error('Error loading event details:', error);
      showToast('Failed to load event details. Please try again.', 'error');
    }
  };

  // Handle confirmed registration
  const handleConfirmedRegister = async () => {
    if (!confirmRegisterEvent) return;
    
    // Check if room selection is required and not selected
    if (availableRoomsForEvent.length > 1 && !selectedRoomForRegistration) {
      showToast('Please select a room to register', 'error');
      return;
    }
    
    const event = confirmRegisterEvent;
    setRegisteringEventId(event.id);
    
    try {
      // Get event details to get room information
      const eventDetails = await eventApi.getEventById(event.id);
      
      console.log('Event details for registration:', eventDetails);
      console.log('Event details roomSlots:', eventDetails.roomSlots || eventDetails.RoomSlots);
      
      // Get roomId - use selected room if available, otherwise try to get from event
      let roomId = null;
      
      // If user selected a room, use it
      if (selectedRoomForRegistration) {
        roomId = selectedRoomForRegistration.id || selectedRoomForRegistration.Id;
      } else {
        // Fallback: try to get from event (for single room events)
        roomId = eventDetails.roomId || eventDetails.RoomId;
        
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
      }
      
      console.log('Extracted roomId:', roomId);
      console.log('Room slots count:', (eventDetails.roomSlots || eventDetails.RoomSlots || []).length);
      
      // Check if event has room slots (required by backend)
      const roomSlots = eventDetails.roomSlots || eventDetails.RoomSlots || [];
      if (roomSlots.length === 0) {
        console.log('Event has no room slots, showing error message and returning early');
        // Show a more user-friendly error message
        showToast('This event is not properly configured. It does not have any room slots assigned. Please contact the administrator to set up the event properly before registering.', 'error');
        setConfirmRegisterEvent(null);
        setSelectedRoomForRegistration(null);
        setAvailableRoomsForEvent([]);
        return; // Return early instead of throwing to avoid showing error toast twice
      }
      
      console.log('Event has room slots, proceeding with booking creation');
      
      // Create booking for event
      const bookingPayload = {
        eventId: event.id,
        startTime: event.startDate || event.StartDate,
        endTime: event.endDate || event.EndDate,
        purpose: `Event registration for ${event.title}`,
        notes: `Registered for event: ${event.title}`
      };
      
      // Include roomId if we have it
      if (roomId) {
        bookingPayload.roomId = roomId;
      }
      
      console.log('Creating booking with payload:', bookingPayload);
      await bookingApi.createBooking(bookingPayload);
      
      // Update registered events - normalize to lowercase
      setRegisteredEventIds(prev => new Set([...prev, String(event.id).toLowerCase()]));
      
      // Update event booking count
      setEvents(prevEvents => 
        prevEvents.map(e => 
          e.id === event.id 
            ? { ...e, bookingCount: (e.bookingCount || 0) + 1 }
            : e
        )
      );
      
      // Reset registration state
      setConfirmRegisterEvent(null);
      setSelectedRoomForRegistration(null);
      setAvailableRoomsForEvent([]);
      
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


  // Apply filters
  const applyFilters = () => {
    // Copy local filters to API filters
    // For students, always set status to Active (1)
    setApiFilters(prev => ({
      ...prev,
      title: localFilters.searchTerm,
      location: localFilters.searchTerm,
      status: isStudent ? '1' : localFilters.status, // Force Active status for students
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
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
      case 'Pending':
        return 'status-badge status-pending';
      case 'Active':
        return 'status-badge status-available';
      case 'Inactive':
        return 'status-badge status-unavailable';
      case 'Cancelled':
        return 'status-badge status-maintenance';
      case 'Completed':
        return 'status-badge status-occupied';
      case 'Rejected':
        return 'status-badge status-rejected';
      default:
        return 'status-badge unknown';
    }
  };

  // Format date (MMM dd, yyyy)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time (HH:mm)
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
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

              {/* Status filter - Hidden for students (only show Active events) */}
              {!isStudent && (
                <div className="filter-group">
                  <select
                    value={localFilters.status}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="0">Pending</option>
                    <option value="1">Active</option>
                    <option value="2">Inactive</option>
                    <option value="3">Cancelled</option>
                    <option value="4">Completed</option>
                    <option value="5">Rejected</option>
                  </select>
                </div>
              )}

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
                        <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span className={getStatusBadgeClass(event.status)}>{event.status || 'Unknown'}</span>
                          {event.visibility && (
                            <span style={{
                              padding: '4px 8px',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#3b82f6',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                              </svg>
                              Public
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <h3
                            onClick={() => onViewEvent && onViewEvent(event.id)}
                            style={{
                              fontSize: 16,
                              margin: 0,
                              color: '#0f172a',
                              cursor: onViewEvent ? 'pointer' : 'default',
                              textDecoration: onViewEvent ? 'underline' : 'none',
                              textUnderlineOffset: onViewEvent ? '2px' : undefined
                            }}
                            title={onViewEvent ? 'View details' : undefined}
                          >
                            {event.title}
                          </h3>
                          {isAdmin && (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>#{idShort}</span>
                          )}
                        </div>
                        {event.description && (
                          <div className="text-muted small" style={{ color: '#64748b', fontSize: '13px', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {event.description}
                          </div>
                        )}
                        {/* Lecturer info - Only show for Student and Admin, not for Lecturer */}
                        {(event.createdBy || event.CreatedBy) && (isStudent || isAdmin) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span style={{ fontWeight: '500' }}>Lecturer: {event.createdBy || event.CreatedBy || 'Unknown'}</span>
                          </div>
                        )}
                        {/* Date and Time */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap' }}>
                          {event.startDate && (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                  <line x1="16" y1="2" x2="16" y2="6"></line>
                                  <line x1="8" y1="2" x2="8" y2="6"></line>
                                  <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <span>{formatDate(event.startDate)}</span>
                              </div>
                              {event.startDate && event.endDate && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                  <span>{formatTime(event.startDate)} - {formatTime(event.endDate)}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        {/* Lab and Room info */}
                        {(event.labName || event.LabName || event.roomName || event.RoomName || (event.roomSlots && event.roomSlots.length > 0) || (event.RoomSlots && event.RoomSlots.length > 0)) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                            {event.labName || event.LabName ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#ea580c', fontWeight: '600' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                </svg>
                                <span>{event.labName || event.LabName}</span>
                              </div>
                            ) : null}
                            {(event.roomName || event.RoomName || (event.roomSlots && event.roomSlots.length > 0) || (event.RoomSlots && event.RoomSlots.length > 0)) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#1d4ed8', fontWeight: '600' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                                <span>
                                  {(() => {
                                    const roomSlots = event.roomSlots || event.RoomSlots || [];
                                    if (roomSlots.length > 0) {
                                      const roomNames = roomSlots
                                        .map(slot => slot.roomName || slot.RoomName || (slot.room && (slot.room.name || slot.room.Name)) || (slot.Room && (slot.Room.name || slot.Room.Name)))
                                        .filter(Boolean);
                                      const uniqueRooms = [...new Set(roomNames)];
                                      if (uniqueRooms.length === 1) {
                                        return uniqueRooms[0];
                                      } else if (uniqueRooms.length > 1) {
                                        return `${uniqueRooms.length} rooms: ${uniqueRooms.join(', ')}`;
                                      }
                                    }
                                    return event.roomName || event.RoomName || 'N/A';
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Capacity */}
                        {event.capacity != null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            <span>Capacity: {event.capacity} people</span>
                          </div>
                        )}
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
                            minWidth: 0,
                            marginLeft: 'auto'
                          }}>
                            {isStudent && (() => {
                              const eventStatus = normalizeStatus(event.status);
                              const isEventActive = eventStatus === 'Active';
                              
                              // Only show register button if event is Active
                              if (!isEventActive) {
                                return (
                                  <button
                                    className="btn btn-sm"
                                    style={{ 
                                      background: '#9ca3af', 
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
                                      cursor: 'not-allowed',
                                      opacity: 0.6
                                    }}
                                    disabled
                                    title={`Event is ${eventStatus}. Only Active events can be registered.`}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M5 12h14"></path>
                                      <path d="M12 5v14"></path>
                                    </svg>
                                    Register
                                  </button>
                                );
                              }
                              
                              return registeredEventIds.has(String(event.id).toLowerCase()) ? (
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
                              );
                            })()}
                            {/* Admin: Approve/Reject buttons for Pending events - on same line */}
                            {isAdmin && (() => {
                              const eventStatus = normalizeStatus(event.status);
                              if (eventStatus === 'Pending') {
                                return (
                                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                    <button
                                      className="btn btn-sm"
                                      onClick={() => setApproveEventModal(event)}
                                      disabled={processingApproval || actionLoading}
                                      title="Approve event"
                                      style={{
                                        background: '#10b981',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '4px 8px',
                                        height: '28px',
                                        fontSize: '11px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        whiteSpace: 'nowrap',
                                        borderRadius: 6
                                      }}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                      </svg>
                                      Approve
                                    </button>
                                    <button
                                      className="btn btn-sm"
                                      onClick={() => setRejectEventModal(event)}
                                      disabled={processingApproval || actionLoading}
                                      title="Reject event"
                                      style={{
                                        background: '#ef4444',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '4px 8px',
                                        height: '28px',
                                        fontSize: '11px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        whiteSpace: 'nowrap',
                                        borderRadius: 6
                                      }}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                      </svg>
                                      Reject
                                    </button>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            {/* Approvals button - Only for Lecturer, not for Admin */}
                            {isLecturer && (
                              <button
                                className="btn btn-sm"
                                onClick={() => openApprovalsForEvent(event)}
                                disabled={actionLoading}
                                title="Review registrations"
                                style={{
                                  background: '#06b6d4',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '6px 12px',
                                  height: '32px',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  whiteSpace: 'nowrap',
                                  flex: '0 0 auto',
                                  borderRadius: 8
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M8 2v4"></path>
                                  <path d="M16 2v4"></path>
                                  <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                                  <path d="M3 10h18"></path>
                                </svg>
                                Approvals
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
        <div className="modal-overlay" onClick={() => {
          setConfirmRegisterEvent(null);
          setSelectedRoomForRegistration(null);
          setAvailableRoomsForEvent([]);
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
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
              
              {/* Room Selection - Show if multiple rooms available */}
              {availableRoomsForEvent.length > 1 && (
                <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Select Room <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#fff'
                  }}>
                    {availableRoomsForEvent.map((room) => {
                      const isSelected = selectedRoomForRegistration?.id === room.id;
                      return (
                        <div
                          key={room.id}
                          onClick={() => setSelectedRoomForRegistration(room)}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#eff6ff' : '#fff',
                            borderBottom: room.id !== availableRoomsForEvent[availableRoomsForEvent.length - 1].id ? '1px solid #e5e7eb' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = '#fff';
                            }
                          }}
                        >
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? '#3b82f6' : '#d1d5db'}`,
                            backgroundColor: isSelected ? '#3b82f6' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontSize: '14px', 
                              fontWeight: isSelected ? '600' : '500',
                              color: '#111827',
                              marginBottom: '2px'
                            }}>
                              {room.name}
                            </div>
                            {room.capacity && (
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                Capacity: {room.capacity} seats
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                You will receive a confirmation once your registration is approved.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setConfirmRegisterEvent(null);
                  setSelectedRoomForRegistration(null);
                  setAvailableRoomsForEvent([]);
                }}
                disabled={registeringEventId === confirmRegisterEvent.id}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmedRegister}
                disabled={registeringEventId === confirmRegisterEvent.id || (availableRoomsForEvent.length > 1 && !selectedRoomForRegistration)}
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
      {/* Approvals Modal */}
      {approvalEvent && (
        <div className="modal-overlay" onClick={() => setApprovalEvent(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '880px', maxWidth: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header">
              <h3>Pending Registrations - {approvalEvent.title}</h3>
            </div>
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
              {loadingApprovals ? (
                <div className="loading" style={{ padding: '20px', textAlign: 'center' }}>
                  <div className="loading-spinner"></div>
                  Loading pending registrations...
                </div>
              ) : pendingBookings.length === 0 ? (
                <div className="no-data" style={{ color: '#64748b' }}>No pending registrations</div>
              ) : (() => {
                const groupedByRoom = groupBookingsByRoom(pendingBookings);
                const hasMultipleRooms = groupedByRoom.length > 1;
                
                return (
                  <div>
                    {hasMultipleRooms && (
                      <div style={{ 
                        marginBottom: '16px', 
                        padding: '12px', 
                        backgroundColor: '#eff6ff', 
                        borderRadius: '8px',
                        border: '1px solid #bfdbfe'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                          </svg>
                          <strong style={{ color: '#1e40af', fontSize: '14px' }}>
                            This event has {groupedByRoom.length} rooms. Registrations are grouped by room.
                          </strong>
                        </div>
                      </div>
                    )}
                    
                    {groupedByRoom.map((roomGroup, roomIndex) => (
                      <div key={roomGroup.roomId} style={{ marginBottom: roomIndex < groupedByRoom.length - 1 ? '24px' : '0' }}>
                        {hasMultipleRooms && (
                          <div style={{
                            padding: '10px 12px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '8px 8px 0 0',
                            border: '1px solid #e5e7eb',
                            borderBottom: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                              <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            <strong style={{ color: '#1d4ed8', fontSize: '14px' }}>
                              {roomGroup.roomName} ({roomGroup.bookings.length} {roomGroup.bookings.length === 1 ? 'registration' : 'registrations'})
                            </strong>
                          </div>
                        )}
                        <table className="room-table" style={{ marginTop: 0 }}>
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>Start</th>
                              <th>End</th>
                              {!hasMultipleRooms && <th>Room</th>}
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {roomGroup.bookings.map(b => {
                              const id = b.id || b.Id;
                              const userName = b.userName || b.UserName || 'Student';
                              const start = b.startTime || b.StartTime;
                              const end = b.endTime || b.EndTime;
                              const roomName = b.roomName || b.RoomName || 
                                            (b.room && (b.room.name || b.room.Name)) ||
                                            (b.Room && (b.Room.name || b.Room.Name)) ||
                                            'N/A';
                              return (
                                <tr key={id}>
                                  <td>{userName}</td>
                                  <td>{start ? new Date(start).toLocaleString() : 'N/A'}</td>
                                  <td>{end ? new Date(end).toLocaleString() : 'N/A'}</td>
                                  {!hasMultipleRooms && <td>{roomName}</td>}
                                  <td><span className="status-badge status-pending" style={{ fontSize: '0.625rem' }}>Pending</span></td>
                                  <td>
                                    <div className="action-buttons">
                                      <button
                                        className="btn btn-sm btn-icon btn-icon-outline color-green"
                                        onClick={() => handleApproveRejectBooking(b, 'approve')}
                                        title="Approve"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                      </button>
                                      <button
                                        className="btn btn-sm btn-icon btn-icon-outline color-red"
                                        onClick={() => handleApproveRejectBooking(b, 'reject')}
                                        title="Reject"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <line x1="18" y1="6" x2="6" y2="18"></line>
                                          <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setApprovalEvent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Event Modal */}
      {approveEventModal && (
        <div className="modal-overlay" onClick={() => {
          if (!processingApproval) {
            setApproveEventModal(null);
            setApprovalNote('');
          }
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve Event</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to approve the event <strong>"{approveEventModal.title || approveEventModal.Title}"</strong>?</p>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                This will change the event status to <strong>Active</strong> and allow students to register.
              </p>
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Approval Note (Optional):
                </label>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Add a note about this approval..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  disabled={processingApproval}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setApproveEventModal(null);
                  setApprovalNote('');
                }}
                disabled={processingApproval}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleApproveEvent}
                disabled={processingApproval}
                style={{ background: '#10b981' }}
              >
                {processingApproval ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Approving...
                  </>
                ) : (
                  'Approve Event'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Event Modal */}
      {rejectEventModal && (
        <div className="modal-overlay" onClick={() => {
          if (!processingApproval) {
            setRejectEventModal(null);
            setRejectionReason('');
          }
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Event</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to reject the event <strong>"{rejectEventModal.title || rejectEventModal.Title}"</strong>?</p>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                This will change the event status to <strong>Rejected</strong> and prevent students from registering.
              </p>
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#dc2626' }}>
                  Rejection Reason <span style={{ color: '#dc2626' }}>*</span>:
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this event..."
                  required
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  disabled={processingApproval}
                />
                {!rejectionReason.trim() && (
                  <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                    Rejection reason is required
                  </p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setRejectEventModal(null);
                  setRejectionReason('');
                }}
                disabled={processingApproval}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleRejectEvent}
                disabled={processingApproval || !rejectionReason.trim()}
              >
                {processingApproval ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Rejecting...
                  </>
                ) : (
                  'Reject Event'
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

