import React, { useState, useEffect, useCallback } from 'react';
import { roomsApi, authApi } from '../../../api';
import RoomStatusForm from '../admin/RoomStatusForm';
import CreateRoom from '../admin/CreateRoom';
import EditRoom from '../admin/EditRoom';

/**
 * Room List Component - Common for both Admin and Lecturer
 *
 * For Admin: Full room management with create/edit/delete actions
 * For Lecturer: View room availability for booking approval
 *
 * Related User Stories:
 * - US-09: Admin - Manage labs and equipment
 * - US-22: Lecturer - View room availability before approving booking
 *
 * Related Use Cases:
 * - UC-10: Manage Rooms (Admin)
 * - UC-40: Room Status Update (Admin)
 */
const RoomList = ({ userRole = 'Student', onSelectRoom, onViewRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRooms, setTotalRooms] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [stats, setStats] = useState({ total: 0, available: 0 });
  const [toast, setToast] = useState(null);

  // Modal states
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [showEditPage, setShowEditPage] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState(null);

  // Local filter states (for input fields before applying)
  const [localFilters, setLocalFilters] = useState({
    searchTerm: '',
    status: '',
    minCapacity: '',
    maxCapacity: ''
  });

  // API filter states
  const [apiFilters, setApiFilters] = useState({
    name: '',
    location: '',
    status: '',
    minCapacity: '',
    maxCapacity: '',
    page: 1,
    pageSize: 8
  });

  const isAdmin = userRole === 'Admin';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };

  // Load room data with pagination
  const loadRooms = useCallback(async (page = currentPage, isPagination = false) => {
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
        page: page,
        pageSize: pageSize
      };
      
      // Clean up empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => 
          value !== '' && value !== null && value !== undefined
        )
      );

      // Try to get room list first, handle other calls separately
      let roomList;
      try {
        roomList = await roomsApi.getRooms(cleanFilters);
      } catch (authErr) {
        // If 401, try to refresh token and retry once
        if (authErr.status === 401) {
          try {
            await authApi.refreshAuthToken();
            roomList = await roomsApi.getRooms(cleanFilters);
          } catch (refreshErr) {
            throw authErr; // Throw original error if refresh fails
          }
        } else {
          throw authErr;
        }
      }
      
      // Get counts separately with error handling
      let totalCount = 0;
      let availableCount = 0;
      
      try {
        totalCount = await roomsApi.getRoomCount();
      } catch (countErr) {
        console.warn('Failed to get total count:', countErr);
        // Fallback: count from room list if it's an array
        if (Array.isArray(roomList)) {
          totalCount = roomList.length;
        }
      }
      
      try {
        availableCount = await roomsApi.getAvailableRoomCount();
      } catch (availableErr) {
        console.warn('Failed to get available count:', availableErr);
        // Fallback: count available rooms from list
        if (Array.isArray(roomList)) {
          availableCount = roomList.filter(room => room.status === 'Available').length;
        }
      }

      console.log('Room API responses:', { roomList, totalCount, availableCount });

      // Handle both array and paginated response formats
      let roomData = [];
      // eslint-disable-next-line no-unused-vars
      let totalPagesFromApi = 1;
      let totalCountFromApi = 0;
      const serverPaginatedRequested = filters.page !== undefined || filters.pageSize !== undefined;

      if (Array.isArray(roomList)) {
        // If backend is already paginating (we sent Page/PageSize), do NOT slice again
        if (serverPaginatedRequested) {
          roomData = roomList;
          // We'll compute total pages from the count endpoint below
          totalCountFromApi = roomList.length;
          totalPagesFromApi = 1; // temporary; will be overridden by derived calculation
        } else {
          // Backend ignored pagination; do client-side pagination
          roomData = roomList;
          totalCountFromApi = roomList.length;
          totalPagesFromApi = Math.max(1, Math.ceil(totalCountFromApi / pageSize));
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          roomData = roomList.slice(start, end);
        }
      } else if (roomList?.data && Array.isArray(roomList.data)) {
        roomData = roomList.data;
        totalPagesFromApi = roomList.totalPages || 1;
        totalCountFromApi = roomList.totalCount || roomList.data.length;
      } else if (roomList?.Data && Array.isArray(roomList.Data)) {
        roomData = roomList.Data;
        // eslint-disable-next-line no-unused-vars
        totalPagesFromApi = roomList.TotalPages || 1;
        totalCountFromApi = roomList.TotalCount || roomList.Data.length;
      }

      // Ensure counts are numbers
      const normalizedTotalCount = typeof totalCount === 'number' ? totalCount : 
        (totalCount?.count || totalCount?.Count || 0);
      const normalizedAvailableCount = typeof availableCount === 'number' ? availableCount : 
        (availableCount?.availableCount || availableCount?.AvailableCount || 0);

      // Determine if any filters (besides pagination) are applied
      const hasNonPagingFilters = !!(filters.name || filters.status !== '' || filters.minCapacity || filters.maxCapacity);

      // Prefer backend total count when no non-paging filters are applied
      const derivedTotalCount = (!hasNonPagingFilters && normalizedTotalCount) ? normalizedTotalCount : totalCountFromApi;
      const derivedTotalPages = Math.max(1, Math.ceil((derivedTotalCount || 0) / pageSize));

      console.log('Normalized counts:', { normalizedTotalCount, normalizedAvailableCount, derivedTotalCount, derivedTotalPages });

      setRooms(roomData);
      setTotalPages(derivedTotalPages);
      setTotalRooms(derivedTotalCount);
      setStats({ total: normalizedTotalCount, available: normalizedAvailableCount });
    } catch (err) {
      console.error('Error loading rooms:', err);
      
      // Handle specific error types
      if (err.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (err.status === 403) {
        setError('Access denied. You do not have permission to view rooms.');
      } else if (err.status === 0) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError(err.message || 'Unable to load room list');
      }
      
      setRooms([]);
      setTotalRooms(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [apiFilters, currentPage, pageSize]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Pagination handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      loadRooms(newPage, true);
    }
  };

  // CRUD operation handlers
  const handleCreateRoomSuccess = async () => {
    setShowCreatePage(false);
    showToast('Room created successfully!', 'success');
    await loadRooms(currentPage);
  };

  const handleEditRoomSuccess = async () => {
    setShowEditPage(false);
    setSelectedRoom(null);
    showToast('Room updated successfully!', 'success');
    await loadRooms(currentPage);
  };


  const handleDeleteRoom = async (roomId) => {
    const roomToDelete = rooms.find(r => r.id === roomId);
    
    // Remove from UI immediately
    setRooms(prev => prev.filter(room => room.id !== roomId));
    setTotalRooms(prev => prev - 1);

    try {
      await roomsApi.deleteRoom(roomId);
      setConfirmDeleteRoom(null);
      showToast('Room deleted successfully!', 'success');
    } catch (err) {
      // Restore room on error
      setRooms(prev => [...prev, roomToDelete]);
      setTotalRooms(prev => prev + 1);
      showToast(err.message || 'Failed to delete room', 'error');
    }
  };

  const handleStatusUpdate = async (statusData) => {
    const originalRoom = rooms.find(r => r.id === selectedRoom.id);
    
    // Create optimistic update
    const optimisticRoom = {
      ...originalRoom,
      status: statusData.status,
      isOptimistic: true
    };

    // Update UI immediately
    setRooms(prev => prev.map(room => 
      room.id === selectedRoom.id ? optimisticRoom : room
    ));

    try {
      setActionLoading(true);
      const updatedRoom = await roomsApi.updateRoomStatus(selectedRoom.id, statusData.status, statusData.notes || '');
      
      // Replace with real updated room
      setRooms(prev => prev.map(room => 
        room.id === selectedRoom.id 
          ? { ...updatedRoom, isOptimistic: false }
          : room
      ));
      
      setShowStatusModal(false);
      setSelectedRoom(null);
      showToast('Status updated successfully!', 'success');
    } catch (err) {
      // Revert to original room on error
      setRooms(prev => prev.map(room => 
        room.id === selectedRoom.id ? originalRoom : room
      ));
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open edit page
  const openEditPage = (room) => {
    setSelectedRoom(room);
    setShowEditPage(true);
  };

  // Open status modal
  const openStatusModal = (room) => {
    setSelectedRoom(room);
    setShowStatusModal(true);
  };

  // Apply filters
  const applyFilters = () => {
    // Copy local filters to API filters
    setApiFilters(prev => ({
      ...prev,
      name: localFilters.searchTerm,
      status: localFilters.status,
      minCapacity: localFilters.minCapacity,
      maxCapacity: localFilters.maxCapacity
    }));
    setCurrentPage(1);
    // loadRooms will be called automatically by useEffect when apiFilters changes
  };

  // Clear filters
  const clearFilters = () => {
    setLocalFilters({
      searchTerm: '',
      status: '',
      minCapacity: '',
      maxCapacity: ''
    });
    setApiFilters({
      name: '',
      status: '',
      minCapacity: '',
      maxCapacity: '',
      page: 1,
      pageSize: 8
    });
    setCurrentPage(1);
    // loadRooms will be called automatically by useEffect when apiFilters changes
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status?.toString()) {
      case 'Available':
        return 'status-badge status-available';
      case 'Occupied':
        return 'status-badge status-occupied';
      case 'Maintenance':
        return 'status-badge status-maintenance';
      case 'Unavailable':
        return 'status-badge status-unavailable';
      default:
        return 'status-badge unknown';
    }
  };

  if (loading) {
    return (
      <div className="room-list-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading rooms...
        </div>
      </div>
    );
  }

  return (
    <div className="room-list-container">
      {showCreatePage ? (
        <CreateRoom onNavigateBack={() => setShowCreatePage(false)} onSuccess={handleCreateRoomSuccess} />
      ) : showEditPage ? (
        <EditRoom room={selectedRoom} onNavigateBack={() => {
          setShowEditPage(false);
          setSelectedRoom(null);
        }} onSuccess={handleEditRoomSuccess} />
      ) : (
        <>
          <div className="room-list-header">
            <h2>Room Management</h2>
            {isAdmin && (
              <button 
                className="btn-new-booking"
                onClick={() => setShowCreatePage(true)}
                disabled={actionLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                Create New Room
              </button>
            )}
          </div>

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
                <button onClick={() => loadRooms()} className="btn btn-secondary">
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
            <span>Total rooms: {totalRooms}</span>
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
                  placeholder="Search by name..."
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
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
                <input
                  type="number"
                  placeholder="Min Capacity"
                  value={localFilters.minCapacity}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, minCapacity: e.target.value }))}
                  className="filter-input"
                />
                <input
                  type="number"
                  placeholder="Max Capacity"
                  value={localFilters.maxCapacity}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, maxCapacity: e.target.value }))}
                  className="filter-input"
                />
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
                  <th>ID</th>
                  <th className="col-name">Name</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Equipment Count</th>
                  <th>Active Bookings</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading && !paginationLoading ? (
                  <tr>
                    <td colSpan={isAdmin ? "7" : "6"} className="loading-cell">
                      <div className="loading-spinner"></div>
                      Loading rooms...
                    </td>
                  </tr>
                ) : paginationLoading ? (
                  // Show skeleton rows during pagination
                  Array.from({ length: pageSize }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="skeleton-row">
                      <td><div className="skeleton-text"></div></td>
                      <td><div className="skeleton-text"></div></td>
                      <td><div className="skeleton-text"></div></td>
                      <td><div className="skeleton-text"></div></td>
                      <td><div className="skeleton-text"></div></td>
                      <td><div className="skeleton-text"></div></td>
                      {isAdmin && <td><div className="skeleton-text"></div></td>}
                    </tr>
                  ))
                ) : rooms.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? "7" : "6"} className="no-data">
                      No room data
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => (
                    <tr key={room.id} className={room.isOptimistic ? 'optimistic-row' : ''}>
                      <td>
                        {room.id?.substring(0, 8)}...
                        {room.isOptimistic && (
                          <span className="optimistic-indicator" title="Saving...">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 12a9 9 0 11-6.219-8.56"/>
                            </svg>
                          </span>
                        )}
                      </td>
                      <td className="col-name">
                        <div>
                          <strong>{room.name}</strong>
                        </div>
                      </td>
                      <td>{room.capacity}</td>
                      <td>
                        <span className={getStatusBadgeClass(room.status)}>
                          {room.status || 'Unknown'}
                        </span>
                      </td>
                      <td>{room.equipmentCount || 0}</td>
                      <td>{room.activeBookings || 0}</td>
                      {isAdmin && (
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-icon btn-icon-outline color-yellow"
                              onClick={() => {
                                if (onViewRoom) {
                                  onViewRoom(room.id);
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
                              onClick={() => openEditPage(room)}
                              disabled={actionLoading}
                              aria-label="Edit room"
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9"/>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                              </svg>
                            </button>
                            <button
                              className="btn btn-sm btn-icon btn-icon-outline color-purple"
                              onClick={() => openStatusModal(room)}
                              disabled={actionLoading}
                              aria-label="Update status"
                              title="Update Status"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 12l2 2 4-4"/>
                                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                              </svg>
                            </button>
                            <button
                              className="btn btn-sm btn-icon btn-icon-outline color-red"
                              onClick={() => setConfirmDeleteRoom(room)}
                              disabled={actionLoading}
                              aria-label="Delete room"
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

      {/* Modals */}


      {showStatusModal && selectedRoom && (
        <RoomStatusForm
          room={selectedRoom}
          onSubmit={handleStatusUpdate}
          onCancel={() => {
            setShowStatusModal(false);
            setSelectedRoom(null);
          }}
          loading={actionLoading}
        />
      )}



      {/* Delete Confirmation Modal */}
      {confirmDeleteRoom && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete room <strong>{confirmDeleteRoom.name}</strong>?</p>
              <p className="text-muted small">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteRoom(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteRoom(confirmDeleteRoom.id)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomList;