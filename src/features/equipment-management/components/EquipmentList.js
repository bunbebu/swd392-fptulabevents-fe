import React, { useState, useEffect, useCallback } from 'react';
import { equipmentApi, authApi, roomsApi } from '../../../api';
import { EQUIPMENT_TYPE_OPTIONS, EQUIPMENT_STATUS_OPTIONS, getEquipmentStatusLabel } from '../../../constants/equipmentConstants';
import EquipmentForm from '../admin/EquipmentForm';
import EquipmentStatusForm from '../admin/EquipmentStatusForm';
import CreateEquipment from '../admin/CreateEquipment';

/**
 * Equipment List Component - Common for both Admin and Lecturer
 * 
 * For Admin: Full equipment management with create/edit/delete actions
 * For Lecturer: View equipment availability for booking approval (US-22)
 * 
 * Related User Stories:
 * - US-09: Admin - Manage labs and equipment
 * - US-22: Lecturer - View equipment availability before approving booking
 * 
 * Related Use Cases:
 * - UC-10: Manage Equipment (Admin)
 * - UC-40: Equipment Status Update (Admin)
 */
const EquipmentList = ({ userRole = 'Student', onSelectEquipment, onViewEquipment, onEditEquipment, initialToast, onToastShown, roomId: propRoomId, onCreateEquipmentClick, showCreatePage: externalShowCreatePage, onCreatePageClose }) => {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEquipments, setTotalEquipments] = useState(0);
  const [toast, setToast] = useState(null);
  const [roomOptions, setRoomOptions] = useState([]);
  const [roomOptionsLoading, setRoomOptionsLoading] = useState(false);

  // Show initial toast passed from parent once on mount
  useEffect(() => {
    if (initialToast) {
      setToast(initialToast);
      window.clearTimeout(EquipmentList._tid);
      EquipmentList._tid = window.setTimeout(() => {
        setToast(null);
        if (onToastShown) onToastShown();
      }, 3000);
    }
    // only run on first mount when initialToast comes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToast]);
  
  // Modal states
  const [showCreatePage, setShowCreatePage] = useState(externalShowCreatePage || false);
  
  // Sync with external showCreatePage prop
  useEffect(() => {
    if (externalShowCreatePage !== undefined) {
      setShowCreatePage(externalShowCreatePage);
    }
  }, [externalShowCreatePage]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDeleteEquipment, setConfirmDeleteEquipment] = useState(null);

  // Local filter states (for input fields before applying)
  const [localFilters, setLocalFilters] = useState({
    searchTerm: '',
    type: '',
    status: '',
    roomId: propRoomId || ''
  });

  // API filter states
  const [apiFilters, setApiFilters] = useState({
    name: '',
    serialNumber: '',
    type: '',
    status: '',
    roomId: propRoomId || '',
    page: 1,
    pageSize: 8
  });

  // Update filters when propRoomId changes
  useEffect(() => {
    if (propRoomId) {
      setLocalFilters(prev => ({ ...prev, roomId: propRoomId }));
      setApiFilters(prev => ({ ...prev, roomId: propRoomId }));
      setCurrentPage(1); // Reset to page 1 when room changes
    }
  }, [propRoomId]);

  const isAdmin = userRole === 'Admin';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };

  // Load equipment data with pagination
  const loadEquipments = useCallback(async (page = currentPage, isPagination = false) => {
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

      // Try to get equipment list first, handle other calls separately
      let equipmentList;
      try {
        console.log('[EquipmentList] Loading equipment with filters:', cleanFilters);
        equipmentList = await equipmentApi.getEquipments(cleanFilters);
        console.log('[EquipmentList] Equipment response:', {
          isArray: Array.isArray(equipmentList),
          hasData: !!equipmentList?.data,
          hasDataArray: !!equipmentList?.Data,
          length: Array.isArray(equipmentList) ? equipmentList.length : (equipmentList?.data?.length || equipmentList?.Data?.length || 0),
          firstItem: Array.isArray(equipmentList) ? equipmentList[0] : (equipmentList?.data?.[0] || equipmentList?.Data?.[0])
        });
      } catch (authErr) {
        // If 401, try to refresh token and retry once
        if (authErr.status === 401) {
          try {
            await authApi.refreshAuthToken();
            equipmentList = await equipmentApi.getEquipments(cleanFilters);
          } catch (refreshErr) {
            throw authErr; // Throw original error if refresh fails
          }
        } else {
          throw authErr;
        }
      }
      
      // Check if we have filters (roomId, name, type, status) that require filtered count
      const hasFilters = !!(cleanFilters.roomId || cleanFilters.name || cleanFilters.serialNumber || cleanFilters.type || cleanFilters.status);
      
      let allEquipmentData = [];
      let totalCountFromApi = 0;
      let totalPagesFromApi = 1;
      let equipmentData = [];

      if (hasFilters) {
        // When filters are applied, load ALL items without pagination and paginate on client-side
        // This ensures we get all filtered items correctly
        try {
          const allFilters = { ...cleanFilters };
          // Remove pagination params completely to get all items
          // Backend returns all items when page/pageSize are not provided
          delete allFilters.page;
          delete allFilters.pageSize;
          
          console.log('[EquipmentList] Loading ALL filtered equipment with filters:', allFilters);
          
          // Try to get all items by calling with large pageSize first
          let allFilteredEquipments = await equipmentApi.getEquipments(allFilters);
          
          // Extract equipment data from first call
          let firstBatch = [];
          if (Array.isArray(allFilteredEquipments)) {
            firstBatch = allFilteredEquipments;
          } else if (allFilteredEquipments?.data && Array.isArray(allFilteredEquipments.data)) {
            firstBatch = allFilteredEquipments.data;
          } else if (allFilteredEquipments?.Data && Array.isArray(allFilteredEquipments.Data)) {
            firstBatch = allFilteredEquipments.Data;
          }
          
          allEquipmentData = [...firstBatch];
          console.log('[EquipmentList] All filtered equipment received:', firstBatch.length, 'items');
          
          totalCountFromApi = allEquipmentData.length;
          totalPagesFromApi = Math.max(1, Math.ceil(totalCountFromApi / pageSize));
          
          // Paginate on client-side
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          equipmentData = allEquipmentData.slice(startIndex, endIndex);
          
          console.log('[EquipmentList] Client-side pagination - total:', totalCountFromApi, 'pages:', totalPagesFromApi, 'page:', page, 'showing:', equipmentData.length, 'items');
        } catch (filterErr) {
          console.warn('Failed to load filtered equipment:', filterErr);
          // Fallback to server-side pagination
          if (Array.isArray(equipmentList)) {
            equipmentData = equipmentList;
          } else if (equipmentList?.data && Array.isArray(equipmentList.data)) {
            equipmentData = equipmentList.data;
          } else if (equipmentList?.Data && Array.isArray(equipmentList.Data)) {
            equipmentData = equipmentList.Data;
          }
          totalCountFromApi = equipmentData.length;
          totalPagesFromApi = 1;
        }
      } else {
        // No filters - use server-side pagination
        // Get counts separately with error handling
        let totalCount = 0;
        try {
          totalCount = await equipmentApi.getEquipmentCount();
        } catch (countErr) {
          console.warn('Failed to get total count:', countErr);
        }

        // Extract equipment data from response (handle multiple formats)
        if (Array.isArray(equipmentList)) {
          equipmentData = equipmentList;
        } else if (equipmentList?.data && Array.isArray(equipmentList.data)) {
          equipmentData = equipmentList.data;
        } else if (equipmentList?.Data && Array.isArray(equipmentList.Data)) {
          equipmentData = equipmentList.Data;
        }

        // Calculate totalCount and totalPages
        if (totalCount > 0) {
          totalCountFromApi = totalCount;
          totalPagesFromApi = Math.max(1, Math.ceil(totalCountFromApi / pageSize));
        } else if (equipmentList?.totalPages !== undefined || equipmentList?.TotalPages !== undefined) {
          // Use pagination metadata from response if available
          totalPagesFromApi = equipmentList.totalPages || equipmentList.TotalPages || 1;
          totalCountFromApi = equipmentList.totalCount || equipmentList.TotalCount || equipmentData.length;
        } else {
          // Fallback: use current page data length
          totalCountFromApi = equipmentData.length;
          totalPagesFromApi = 1;
        }
      }

      console.log('[EquipmentList] Final values - totalCount:', totalCountFromApi, 'totalPages:', totalPagesFromApi, 'currentPage:', page, 'dataLength:', equipmentData.length);

      setEquipments(equipmentData);
      setTotalPages(totalPagesFromApi);
      setTotalEquipments(totalCountFromApi);
    } catch (err) {
      console.error('Error loading equipments:', err);
      
      // Handle specific error types
      if (err.status === 401) {
        setError('Authentication required. Please log in again.');
        // Optionally redirect to login or refresh token
      } else if (err.status === 403) {
        setError('Access denied. You do not have permission to view equipment.');
      } else if (err.status === 0) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError(err.message || 'Unable to load equipment list');
      }
      
      setEquipments([]);
      setTotalEquipments(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [apiFilters, currentPage, pageSize]);

  useEffect(() => {
    loadEquipments();
  }, [loadEquipments]);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setRoomOptionsLoading(true);
        const roomsData = await roomsApi.getRooms({ page: 1, pageSize: 500 });
        let normalizedRooms = [];
        if (Array.isArray(roomsData)) {
          normalizedRooms = roomsData;
        } else if (roomsData?.data && Array.isArray(roomsData.data)) {
          normalizedRooms = roomsData.data;
        } else if (roomsData?.Data && Array.isArray(roomsData.Data)) {
          normalizedRooms = roomsData.Data;
        }
        setRoomOptions(normalizedRooms);
      } catch (err) {
        console.error('Failed to load rooms for equipment filter:', err);
        setRoomOptions([]);
      } finally {
        setRoomOptionsLoading(false);
      }
    };

    loadRooms();
  }, []);

  // Pagination handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      loadEquipments(newPage, true);
    }
  };

  // CRUD operation handlers
  const handleCreateEquipmentSuccess = async () => {
    setShowCreatePage(false);
    if (onCreatePageClose) onCreatePageClose();
    showToast('Equipment created successfully!', 'success');
    await loadEquipments(currentPage);
  };
  
  const handleCreatePageBack = () => {
    setShowCreatePage(false);
    if (onCreatePageClose) onCreatePageClose();
  };

  const handleEditEquipment = async (equipmentData) => {
    try {
      setActionLoading(true);
      await equipmentApi.updateEquipment(selectedEquipment.id, equipmentData);
      setShowEditModal(false);
      setSelectedEquipment(null);
      showToast('Equipment updated successfully!', 'success');
      await loadEquipments(currentPage);
    } catch (err) {
      showToast(err.message || 'Failed to update equipment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEquipment = async (equipmentId) => {
    const equipmentToDelete = equipments.find(e => e.id === equipmentId);
    
    // Remove from UI immediately
    setEquipments(prev => prev.filter(equipment => equipment.id !== equipmentId));
    setTotalEquipments(prev => prev - 1);

    try {
      await equipmentApi.deleteEquipment(equipmentId);
      setConfirmDeleteEquipment(null);
      showToast('Equipment deleted successfully!', 'success');
    } catch (err) {
      // Restore equipment on error
      setEquipments(prev => [...prev, equipmentToDelete]);
      setTotalEquipments(prev => prev + 1);
      showToast(err.message || 'Failed to delete equipment', 'error');
    }
  };

  const handleStatusUpdate = async (formData) => {
    try {
      setActionLoading(true);
      await equipmentApi.updateEquipmentStatus(selectedEquipment.id, formData.status, formData.notes);
      setShowStatusModal(false);
      setSelectedEquipment(null);
      showToast('Status updated successfully!', 'success');
      await loadEquipments(currentPage);
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (equipment) => {
    setSelectedEquipment(equipment);
    setShowEditModal(true);
  };

  // Open status modal
  const openStatusModal = (equipment) => {
    setSelectedEquipment(equipment);
    setShowStatusModal(true);
  };

  // Apply filters
  const applyFilters = () => {
    // Copy local filters to API filters
    setApiFilters(prev => ({
      ...prev,
      name: localFilters.searchTerm,
      serialNumber: '', // Don't filter by serial number to avoid AND condition
      type: localFilters.type,
      status: localFilters.status,
      roomId: localFilters.roomId
    }));
    setCurrentPage(1);
    // loadEquipments will be called automatically by useEffect when apiFilters changes
  };

  // Clear filters
  const clearFilters = () => {
    setLocalFilters({
      searchTerm: '',
      type: '',
      status: '',
      roomId: ''
    });
    setApiFilters({
      name: '',
      serialNumber: '',
      type: '',
      status: '',
      roomId: '',
      page: 1,
      pageSize: 8
    });
    setCurrentPage(1);
    // loadEquipments will be called automatically by useEffect when apiFilters changes
  };


  // Get status badge class
  const getStatusBadgeClass = (status) => {
    // Normalize: accept values like 'BROKEN', 'InUse', 'in_use', etc.
    const normalized = String(status || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/_/g, '');

    switch (normalized) {
      case 'available':
        return 'status-badge status-available';
      case 'inuse':
        return 'status-badge status-occupied';
      case 'maintenance':
        return 'status-badge status-maintenance';
      case 'broken':
        return 'status-badge status-maintenance';
      case 'unavailable':
        return 'status-badge status-unavailable';
      default:
        // Fallback to label-based mapping just in case
        switch (getEquipmentStatusLabel(status)) {
          case 'Available':
            return 'status-badge status-available';
          case 'In Use':
            return 'status-badge status-occupied';
          case 'Maintenance':
            return 'status-badge status-maintenance';
          case 'Broken':
            return 'status-badge status-maintenance';
          case 'Unavailable':
            return 'status-badge status-unavailable';
          default:
            return 'status-badge unknown';
        }
    }
  };

  if (loading) {
    return (
      <div className="equipment-list-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading equipment...
        </div>
      </div>
    );
  }

    return (
    <div className="equipment-list-container">
      {showCreatePage ? (
        <CreateEquipment 
          onNavigateBack={handleCreatePageBack} 
          onSuccess={handleCreateEquipmentSuccess}
          initialRoomId={propRoomId}
        />
      ) : (
        <>
          {!propRoomId && (
            <div className="equipment-list-header">
              <h2>Equipment Management</h2>
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
                  Create New Equipment
                </button>
              )}
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
            <button onClick={() => loadEquipments()} className="btn btn-secondary">
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

      <div className="equipment-list-stats">
        <span>Total equipment: {totalEquipments}</span>
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
              placeholder="Search by name, serial number, or room name..."
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
              value={localFilters.type}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, type: e.target.value }))}
            className="filter-select"
          >
              <option value="">All Types</option>
              {EQUIPMENT_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
          <select
              value={localFilters.status}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, status: e.target.value }))}
            className="filter-select"
          >
              <option value="">All Status</option>
              {EQUIPMENT_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
            {!propRoomId && (
              <select
                value={localFilters.roomId}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, roomId: e.target.value }))}
                className="filter-select"
                disabled={roomOptionsLoading}
              >
                <option value="">{roomOptionsLoading ? 'Loading rooms...' : 'All Rooms'}</option>
                {roomOptions.map((room) => {
                  const id = room.id || room.Id;
                  const name = room.name || room.Name || 'Unnamed room';
                  const labName = room.labName || room.LabName;
                  return (
                    <option key={id} value={id}>
                      {labName ? `${name} (${labName})` : name}
                    </option>
                  );
                })}
              </select>
            )}
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

      <div className="equipment-table-container">
        <table className="equipment-table">
            <thead>
              <tr>
              <th className="col-name">Name</th>
              <th className="col-serial">Serial Number</th>
              <th>Type</th>
              <th>Status</th>
              <th>Room Name</th>
              <th>Description</th>
              {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
            {loading && !paginationLoading ? (
              <tr>
                <td colSpan={isAdmin ? "7" : "6"} className="loading-cell">
                  <div className="loading-spinner"></div>
                  Loading equipment...
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
            ) : equipments.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? "7" : "6"} className="no-data">
                  No equipment data
                </td>
              </tr>
            ) : (
              equipments.map((equipment) => (
                <tr key={equipment.id}>
                  <td className="col-name">{equipment.name}</td>
                  <td className="col-serial">{equipment.serialNumber || 'N/A'}</td>
                  <td>{equipment.type || 'N/A'}</td>
                  <td>
                    <span className={getStatusBadgeClass(equipment.status)} style={{ fontSize: '0.625rem' }}>
                      {equipment.status || 'Unknown'}
                    </span>
                  </td>
                  <td>{equipment.roomName || 'N/A'}</td>
                  <td>{equipment.description || 'N/A'}</td>
                  {isAdmin && (
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-icon btn-icon-outline color-yellow"
                          onClick={() => {
                            if (onViewEquipment) {
                              onViewEquipment(equipment.id);
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
                          onClick={() => {
                            if (onEditEquipment) {
                              onEditEquipment(equipment.id);
                            } else {
                              openEditModal(equipment);
                            }
                          }}
                          disabled={actionLoading}
                          aria-label="Edit equipment"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                          </svg>
                        </button>
                        <button
                          className="btn btn-sm btn-icon btn-icon-outline color-purple"
                          onClick={() => openStatusModal(equipment)}
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
                          onClick={() => setConfirmDeleteEquipment(equipment)}
                          disabled={actionLoading}
                          aria-label="Delete equipment"
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

      {showEditModal && selectedEquipment && (
        <EquipmentForm
          equipment={selectedEquipment}
          onSubmit={handleEditEquipment}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedEquipment(null);
          }}
          loading={actionLoading}
        />
      )}

      {showStatusModal && selectedEquipment && (
        <EquipmentStatusForm
          equipment={selectedEquipment}
          onSubmit={handleStatusUpdate}
          onCancel={() => {
            setShowStatusModal(false);
            setSelectedEquipment(null);
          }}
          loading={actionLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteEquipment && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete equipment <strong>{confirmDeleteEquipment.name}</strong>?</p>
              <p className="text-muted small">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteEquipment(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteEquipment(confirmDeleteEquipment.id)}
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

export default EquipmentList;

