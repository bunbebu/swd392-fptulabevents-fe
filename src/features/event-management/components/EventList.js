import React, { useState, useEffect, useCallback } from 'react';
import { eventApi, authApi } from '../../../api';
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
  const [pageSize] = useState(8);
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
  const canCreateEvent = isAdmin; // Only Admin can create events

  // Helper function to normalize event data (handle both Title/title)
  const normalizeEvent = (event) => {
    return {
      ...event,
      id: event.id || event.Id,
      title: event.title || event.Title || 'Untitled Event',
      description: event.description || event.Description,
      location: event.location || event.Location,
      startDate: event.startDate || event.StartDate,
      endDate: event.endDate || event.EndDate,
      status: event.status !== undefined ? event.status : event.Status,
      createdBy: event.createdBy || event.CreatedBy,
      bookingCount: event.bookingCount || event.BookingCount || 0
    };
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
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

      setEvents(normalizedEvents);
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

          <div className="room-table-container">
            <table className="room-table">
              <thead>
                <tr>
                  {isAdmin && <th>ID</th>}
                  <th className="col-name">Title</th>
                  <th className="col-location">Location</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Bookings</th>
                  <th>Created By</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading && !paginationLoading ? (
                  <tr>
                    <td colSpan={isAdmin ? "9" : "7"} className="loading-cell">
                      <div className="loading-spinner"></div>
                      Loading events...
                    </td>
                  </tr>
                ) : paginationLoading ? (
                  // Show skeleton rows during pagination
                  Array.from({ length: pageSize }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="skeleton-row">
                      {isAdmin && <td><div className="skeleton-text"></div></td>}
                      <td><div className="skeleton-text"></div></td>
                      <td><div className="skeleton-text"></div></td>
                      <td><div className="skeleton-text"></div></td>
                      <td><div className="skeleton-text"></div></td>
                      <td><div className="skeleton-text"></div></td>
                      <td><div className="skeleton-text"></div></td>
                      <td><div className="skeleton-text"></div></td>
                      {isAdmin && <td><div className="skeleton-text"></div></td>}
                    </tr>
                  ))
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? "9" : "7"} className="no-data">
                      No event data
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id}>
                      {isAdmin && <td>{event.id?.substring(0, 8)}...</td>}
                      <td className="col-name">
                        <div>
                          <strong>{event.title}</strong>
                          {event.description && (
                            <div className="text-muted small">{event.description.substring(0, 50)}{event.description.length > 50 ? '...' : ''}</div>
                          )}
                        </div>
                      </td>
                      <td className="col-location">{event.location || 'N/A'}</td>
                      <td>{formatDate(event.startDate)}</td>
                      <td>{formatDate(event.endDate)}</td>
                      <td>
                        <span className={getStatusBadgeClass(event.status)}>
                          {event.status || 'Unknown'}
                        </span>
                      </td>
                      <td>{event.bookingCount || 0}</td>
                      <td>{event.createdBy || 'N/A'}</td>
                      {isAdmin && (
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-icon btn-icon-outline color-yellow"
                              onClick={() => {
                                if (onViewEvent) {
                                  onViewEvent(event.id);
                                }
                              }}
                              disabled={actionLoading}
                              aria-label="View details"
                              title="View"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            </button>
                            <button
                              className="btn btn-sm btn-icon btn-icon-outline color-blue"
                              onClick={() => openEditPage(event)}
                              disabled={actionLoading}
                              aria-label="Edit event"
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9"/>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                              </svg>
                            </button>
                            <button
                              className="btn btn-sm btn-icon btn-icon-outline color-red"
                              onClick={() => setConfirmDeleteEvent(event)}
                              disabled={actionLoading}
                              aria-label="Delete event"
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                                <path d="M10 11v6"/>
                                <path d="M14 11v6"/>
                                <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
    </div>
  );
};

export default EventList;

