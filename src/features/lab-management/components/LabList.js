import React, { useState, useEffect, useCallback } from 'react';
import { labsApi, authApi, roomsApi } from '../../../api';
import LabStatusForm from '../admin/LabStatusForm';

/**
 * Lab List Component - Common for both Admin and Lecturer
 *
 * For Admin: Full lab management with create/edit/delete actions
 * For Lecturer: View lab availability
 *
 * Related User Stories:
 * - US-09: Admin - Manage labs and equipment
 *
 * Related Use Cases:
 * - UC-10: Manage Labs (Admin)
 */
const LabList = ({ 
  userRole = 'Student', 
  onSelectLab, 
  onViewLab, 
  onCreateLab,
  onEditLab,
  initialToast,
  onToastShown
}) => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLabs, setTotalLabs] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [stats, setStats] = useState({ total: 0, available: 0 });
  const [toast, setToast] = useState(null);
  const [roomsCache, setRoomsCache] = useState({});

  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDeleteLab, setConfirmDeleteLab] = useState(null);
  
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

  // Enrich labs with room names by fetching room data if missing
  const enrichLabsWithRoomNames = useCallback(async (labsList) => {
    console.log('🔄 Enriching labs with room names...');
    console.log('   Input labs:', labsList.length);

    // Find labs that have RoomId but no RoomName
    const labsNeedingRoomData = labsList.filter(lab => {
      const roomId = lab.roomId || lab.RoomId;
      const roomName = lab.roomName || lab.RoomName || lab.room?.name || lab.room?.Name || lab.Room?.name || lab.Room?.Name;
      return roomId && !roomName;
    });

    console.log('   Labs needing room data:', labsNeedingRoomData.length);

    if (labsNeedingRoomData.length === 0) {
      console.log('   ✅ No enrichment needed');
      return labsList; // No need to fetch
    }

    // Get unique room IDs we need to fetch
    const roomIdsToFetch = [...new Set(
      labsNeedingRoomData
        .map(lab => lab.roomId || lab.RoomId)
        .filter(Boolean)
        .filter(id => !roomsCache[id]) // Skip already cached
    )];

    console.log('   Room IDs to fetch:', roomIdsToFetch.length);
    console.log('   Cached rooms:', Object.keys(roomsCache).length);

    // Fetch missing rooms
    const newRoomData = {};
    let successCount = 0;
    await Promise.all(
      roomIdsToFetch.map(async (roomId) => {
        try {
          const room = await roomsApi.getRoomById(roomId);
          newRoomData[roomId] = room;
          successCount++;
        } catch (err) {
          console.warn(`   ⚠️ Failed to fetch room ${roomId}:`, err.message);
          newRoomData[roomId] = null;
        }
      })
    );

    console.log('   ✅ Successfully fetched:', successCount, 'rooms');

    // Update cache
    if (Object.keys(newRoomData).length > 0) {
      setRoomsCache(prev => ({ ...prev, ...newRoomData }));
    }

    // Merge room names into labs
    return labsList.map(lab => {
      const roomId = lab.roomId || lab.RoomId;
      if (!roomId) return lab;

      const existingRoomName = lab.roomName || lab.RoomName || lab.room?.name || lab.room?.Name || lab.Room?.name || lab.Room?.Name;
      if (existingRoomName) return lab;

      const roomData = newRoomData[roomId] || roomsCache[roomId];
      if (roomData) {
        return {
          ...lab,
          roomName: roomData.name || roomData.Name,
          room: roomData
        };
      }

      return lab;
    });
  }, [roomsCache]);

  // Handle initialToast prop
  useEffect(() => {
    if (initialToast) {
      setToast(initialToast);
      if (onToastShown) {
        onToastShown();
      }
    }
  }, [initialToast, onToastShown]);

  // Load lab data with pagination
  const loadLabs = useCallback(async (page = currentPage, isPagination = false) => {
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

      // Try to get lab list first, handle other calls separately
      let labList;
      try {
        // Use getAvailableLabs for student/lecturer, getLabs for admin
        if (isAdmin) {
          labList = await labsApi.getLabs(cleanFilters);
        } else {
          labList = await labsApi.getAvailableLabs();
        }
      } catch (authErr) {
        // If 401, try to refresh token and retry once
        if (authErr.status === 401) {
          try {
            await authApi.refreshAuthToken();
            if (isAdmin) {
              labList = await labsApi.getLabs(cleanFilters);
            } else {
              labList = await labsApi.getAvailableLabs();
            }
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
        totalCount = await labsApi.getLabCount();
      } catch (countErr) {
        console.warn('Failed to get total count:', countErr);
        // Fallback: count from lab list if it's an array
        if (Array.isArray(labList)) {
          totalCount = labList.length;
        }
      }
      
      try {
        availableCount = await labsApi.getActiveLabCount();
      } catch (availableErr) {
        console.warn('Failed to get available count:', availableErr);
        // Fallback: count available labs from list
        if (Array.isArray(labList)) {
          availableCount = labList.filter(lab => lab.status === 'Active').length;
        }
      }

      console.log('Lab API responses:', { labList, totalCount, availableCount });
      console.log('Sample lab data:', labList && (Array.isArray(labList) ? labList[0] : labList.data?.[0] || labList.Data?.[0]));

      // Handle both array and paginated response formats
      let labData = [];
      // eslint-disable-next-line no-unused-vars
      let totalPagesFromApi = 1;
      let totalCountFromApi = 0;
      const serverPaginatedRequested = filters.page !== undefined || filters.pageSize !== undefined;

      if (Array.isArray(labList)) {
        // If backend is already paginating (we sent Page/PageSize), do NOT slice again
        if (serverPaginatedRequested) {
          labData = labList;
          // We'll compute total pages from the count endpoint below
          totalCountFromApi = labList.length;
          totalPagesFromApi = 1; // temporary; will be overridden by derived calculation
        } else {
          // Backend ignored pagination; do client-side pagination
          labData = labList;
          totalCountFromApi = labList.length;
          totalPagesFromApi = Math.max(1, Math.ceil(totalCountFromApi / pageSize));
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          labData = labList.slice(start, end);
        }
      } else if (labList?.data && Array.isArray(labList.data)) {
        labData = labList.data;
        totalPagesFromApi = labList.totalPages || 1;
        totalCountFromApi = labList.totalCount || labList.data.length;
      } else if (labList?.Data && Array.isArray(labList.Data)) {
        labData = labList.Data;
        // eslint-disable-next-line no-unused-vars
        totalPagesFromApi = labList.TotalPages || 1;
        totalCountFromApi = labList.TotalCount || labList.Data.length;
      }

      // Ensure counts are numbers
      const normalizedTotalCount = typeof totalCount === 'number' ? totalCount : 
        (totalCount?.count || totalCount?.Count || 0);
      const normalizedAvailableCount = typeof availableCount === 'number' ? availableCount : 
        (availableCount?.availableCount || availableCount?.AvailableCount || 0);

      // Determine if any filters (besides pagination) are applied
      const hasNonPagingFilters = !!(filters.name || filters.location || filters.status !== '' || filters.minCapacity || filters.maxCapacity);

      // Prefer backend total count when no non-paging filters are applied
      const derivedTotalCount = (!hasNonPagingFilters && normalizedTotalCount) ? normalizedTotalCount : totalCountFromApi;
      const derivedTotalPages = Math.max(1, Math.ceil((derivedTotalCount || 0) / pageSize));

      console.log('Normalized counts:', { normalizedTotalCount, normalizedAvailableCount, derivedTotalCount, derivedTotalPages });

      // Enrich labs with room names if missing
      const enrichedLabs = await enrichLabsWithRoomNames(labData);

      setLabs(enrichedLabs);
      setTotalPages(derivedTotalPages);
      setTotalLabs(derivedTotalCount);
      setStats({ total: normalizedTotalCount, available: normalizedAvailableCount });
    } catch (err) {
      console.error('Error loading labs:', err);
      
      // Handle specific error types
      if (err.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (err.status === 403) {
        setError('Access denied. You do not have permission to view labs.');
      } else if (err.status === 0) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError(err.message || 'Unable to load lab list');
      }
      
      setLabs([]);
      setTotalLabs(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [apiFilters, currentPage, pageSize, enrichLabsWithRoomNames, isAdmin]);

  useEffect(() => {
    loadLabs();
  }, [loadLabs]);

  // Pagination handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      loadLabs(newPage, true);
    }
  };

  // CRUD operation handlers

  const handleDeleteLab = async (labId) => {
    const labToDelete = labs.find(l => l.id === labId);

    // Remove from UI immediately
    setLabs(prev => prev.filter(lab => lab.id !== labId));
    setTotalLabs(prev => prev - 1);

    try {
      await labsApi.deleteLab(labId, true);
      setConfirmDeleteLab(null);
      showToast('Lab deleted successfully!', 'success');
    } catch (err) {
      // Restore lab on error
      setLabs(prev => [...prev, labToDelete]);
      setTotalLabs(prev => prev + 1);
      showToast(err.message || 'Failed to delete lab', 'error');
    }
  };

  const handleStatusUpdate = async (statusData) => {
    const originalLab = labs.find(l => l.id === selectedLab.id);
    
    // Create optimistic update
    const optimisticLab = {
      ...originalLab,
      status: statusData.status,
      isOptimistic: true
    };

    // Update UI immediately
    setLabs(prev => prev.map(lab => 
      lab.id === selectedLab.id ? optimisticLab : lab
    ));

    try {
      setActionLoading(true);
      const updatedLab = await labsApi.updateLabStatus(selectedLab.id, statusData.status, statusData.notes || '');
      
      // Replace with real updated lab
      setLabs(prev => prev.map(lab => 
        lab.id === selectedLab.id 
          ? { ...updatedLab, isOptimistic: false }
          : lab
      ));
      
      setShowStatusModal(false);
      setSelectedLab(null);
      showToast('Status updated successfully!', 'success');
    } catch (err) {
      // Revert to original lab on error
      setLabs(prev => prev.map(lab => 
        lab.id === selectedLab.id ? originalLab : lab
      ));
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open edit page
  const openEditPage = (lab) => {
    if (onEditLab) {
      onEditLab(lab.id);
    }
  };

  // Open status modal
  const openStatusModal = (lab) => {
    setSelectedLab(lab);
    setShowStatusModal(true);
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    loadLabs(1);
  };

  // Clear filters
  const clearFilters = () => {
    setApiFilters({
      name: '',
      location: '',
      status: '',
      minCapacity: '',
      maxCapacity: '',
      page: 1,
      pageSize: 8
    });
    setCurrentPage(1);
    loadLabs(1);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status?.toString()) {
      case 'Active':
        return 'status-badge status-available';
      case 'Inactive':
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
          Loading labs...
        </div>
      </div>
    );
  }

  return (
    <div className="lab-list-container">
      <>
          <div className="lab-list-header">
            <h2>Lab Management</h2>
            {isAdmin && (
              <button 
                className="btn-new-booking"
                onClick={() => onCreateLab && onCreateLab()}
                disabled={actionLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                Create New Lab
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
              <button onClick={() => loadLabs()} className="btn btn-secondary">
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

          <div className="lab-list-stats">
            <span>Total labs: {totalLabs}</span>
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
                  placeholder="Search by name or location..."
                  value={apiFilters.name || apiFilters.location || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setApiFilters(prev => ({
                      ...prev,
                      name: value,
                      location: value
                    }));
                  }}
                  className="search-input"
                />
                {(apiFilters.name || apiFilters.location) && (
                  <button
                    className="clear-search"
                    onClick={() => setApiFilters(prev => ({
                      ...prev,
                      name: '',
                      location: ''
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
                  value={apiFilters.status}
                  onChange={(e) => setApiFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <input
                  type="number"
                  placeholder="Min Capacity"
                  value={apiFilters.minCapacity}
                  onChange={(e) => setApiFilters(prev => ({ ...prev, minCapacity: e.target.value }))}
                  className="filter-input"
                />
                <input
                  type="number"
                  placeholder="Max Capacity"
                  value={apiFilters.maxCapacity}
                  onChange={(e) => setApiFilters(prev => ({ ...prev, maxCapacity: e.target.value }))}
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

          <div className="lab-table-container">
            <table className="lab-table">
              <thead>
                <tr>
                  {isAdmin && <th>ID</th>}
                  <th className="col-name">Name</th>
                  <th className="col-location">Location</th>
                  <th>Room</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Equipment Count</th>
                  <th>Members</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && !paginationLoading ? (
                  <tr>
                    <td colSpan={isAdmin ? "9" : "8"} className="loading-cell">
                      <div className="loading-spinner"></div>
                      Loading labs...
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
                      <td><div className="skeleton-text"></div></td>
                    </tr>
                  ))
                ) : labs.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? "9" : "8"} className="no-data">
                      No lab data
                    </td>
                  </tr>
                ) : (
                  labs.map((lab) => (
                    <tr key={lab.id} className={lab.isOptimistic ? 'optimistic-row' : ''}>
                      {isAdmin && (
                        <td>
                          {lab.id?.substring(0, 8)}...
                          {lab.isOptimistic && (
                            <span className="optimistic-indicator" title="Saving...">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12a9 9 0 11-6.219-8.56"/>
                              </svg>
                            </span>
                          )}
                        </td>
                      )}
                      <td className="col-name">
                        <div>
                          <strong>{lab.name}</strong>
                          {lab.description && (
                            <div className="text-muted small">{lab.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="col-location">{lab.location || 'N/A'}</td>
                      <td>
                        {(lab.roomName || lab.RoomName || lab.room?.name || lab.room?.Name || lab.Room?.Name || lab.Room?.name) ? (
                          <div>
                            <strong>{lab.roomName || lab.RoomName || lab.room?.name || lab.room?.Name || lab.Room?.Name || lab.Room?.name}</strong>
                          </div>
                        ) : (
                          <span className="text-muted">No Room</span>
                        )}
                      </td>
                      <td>{lab.capacity}</td>
                      <td>
                        <span className={getStatusBadgeClass(lab.status)}>
                          {lab.status || 'Unknown'}
                        </span>
                      </td>
                      <td>{lab.equipmentCount || 0}</td>
                      <td>{lab.memberCount || 0}</td>
                      <td>
                        <div className="action-buttons">
                          {/* View button - visible for all roles */}
                          <button
                            className="btn btn-sm btn-icon btn-icon-outline color-yellow"
                            onClick={() => {
                              if (onViewLab) {
                                onViewLab(lab.id);
                              }
                            }}
                            disabled={actionLoading}
                            aria-label="View details"
                            title="View Lab Details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          
                          {/* Admin-only buttons */}
                          {isAdmin && (
                            <>
                              <button
                                className="btn btn-sm btn-icon btn-icon-outline color-blue"
                                onClick={() => openEditPage(lab)}
                                disabled={actionLoading}
                                aria-label="Edit lab"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 20h9"/>
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                                </svg>
                              </button>
                              <button
                                className="btn btn-sm btn-icon btn-icon-outline color-purple"
                                onClick={() => openStatusModal(lab)}
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
                                onClick={() => setConfirmDeleteLab(lab)}
                                disabled={actionLoading}
                                aria-label="Delete lab"
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
                            </>
                          )}
                        </div>
                      </td>
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
      {/* Modals */}

      {showStatusModal && selectedLab && (
        <LabStatusForm
          lab={selectedLab}
          onSubmit={handleStatusUpdate}
          onCancel={() => {
            setShowStatusModal(false);
            setSelectedLab(null);
          }}
          loading={actionLoading}
        />
      )}



      {/* Delete Confirmation Modal */}
      {confirmDeleteLab && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete lab <strong>{confirmDeleteLab.name}</strong>?</p>
              <p className="text-muted small">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteLab(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteLab(confirmDeleteLab.id)}
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

export default LabList;

