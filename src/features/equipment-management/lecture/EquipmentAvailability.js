import React, { useState, useEffect, useCallback } from 'react';
import { equipmentApi } from '../../../api';

/**
 * Equipment Availability Component - Lecturer Only
 * 
 * View equipment availability for booking approval
 * 
 * Related User Stories:
 * - US-22: Lecturer - View equipment availability before approving booking (Medium Priority)
 * 
 * Use Case:
 * Lecturer needs to check equipment availability when reviewing booking requests
 * to ensure resources are available before approval
 */
const EquipmentAvailability = ({ roomId, onSelectEquipment }) => {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'available' | 'by-room'
  const [selectedRoomId, setSelectedRoomId] = useState(roomId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Load equipment data based on view mode
  const loadEquipments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let equipmentList;
      
      if (viewMode === 'available') {
        equipmentList = await equipmentApi.getAvailableEquipments();
      } else if (viewMode === 'by-room' && selectedRoomId) {
        equipmentList = await equipmentApi.getEquipmentsByRoom(selectedRoomId);
      } else {
        equipmentList = await equipmentApi.getEquipments();
      }

      setEquipments(Array.isArray(equipmentList) ? equipmentList : []);
    } catch (err) {
      console.error('Error loading equipments:', err);
      setError(err.message || 'Unable to load equipment list');
      setEquipments([]);
    } finally {
      setLoading(false);
    }
  }, [viewMode, selectedRoomId]);

  useEffect(() => {
    loadEquipments();
  }, [loadEquipments]);

  // Filter equipments
  const filteredEquipments = equipments.filter(eq => {
    const matchesCategory = categoryFilter === 'All' || eq.category === categoryFilter;
    const matchesSearch = !searchTerm || 
      eq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Get unique categories
  const categories = ['All', ...new Set(equipments.map(eq => eq.category).filter(Boolean))];

  // Calculate statistics
  const stats = {
    total: equipments.length,
    available: equipments.filter(eq => eq.status === 'Available' && eq.quantityAvailable > 0).length,
    maintenance: equipments.filter(eq => eq.status === 'Maintenance').length,
    broken: equipments.filter(eq => eq.status === 'Broken').length
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusStyles = {
      Available: 'status-badge status-available',
      Maintenance: 'status-badge status-maintenance',
      Broken: 'status-badge status-broken'
    };
    return <span className={statusStyles[status] || 'status-badge'}>{status}</span>;
  };

  // Availability indicator
  const AvailabilityIndicator = ({ equipment }) => {
    const getIndicatorStyle = (type) => {
      const baseStyle = {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500',
        display: 'inline-block'
      };

      const styles = {
        unavailable: { ...baseStyle, background: '#fee2e2', color: '#991b1b' },
        low: { ...baseStyle, background: '#fef3c7', color: '#92400e' },
        available: { ...baseStyle, background: '#d1fae5', color: '#065f46' }
      };

      return styles[type] || baseStyle;
    };

    if (equipment.status !== 'Available') {
      return <span style={getIndicatorStyle('unavailable')}>Unavailable</span>;
    }
    if (equipment.quantityAvailable === 0) {
      return <span style={getIndicatorStyle('unavailable')}>Out of Stock</span>;
    }
    if (equipment.quantityAvailable < equipment.quantity * 0.3) {
      return <span style={getIndicatorStyle('low')}>Low Stock</span>;
    }
    return <span style={getIndicatorStyle('available')}>In Stock</span>;
  };

  if (loading) {
    return (
      <div className="admin-content">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          minHeight: '400px'
        }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #4F46E5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{
            marginTop: '16px',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Loading equipment information...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-content">
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          margin: '20px 0'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ margin: '0 auto 16px' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3 style={{ color: '#991b1b', marginBottom: '8px' }}>Error</h3>
          <p style={{ color: '#7f1d1d', marginBottom: '16px' }}>{error}</p>
          <button className="btn-primary" onClick={loadEquipments}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content">
      {/* Header (align with admin list pages) */}
      <div className="content-header">
        <div>
          <h2>Equipment Status</h2>
          <p>View equipment availability for booking approval</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Total Equipment</h3>
              <p className="stat-number">{stats.total}</p>
            </div>
            <div className="stat-icon blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Available</h3>
              <p className="stat-number">{stats.available}</p>
            </div>
            <div className="stat-icon green">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Maintenance</h3>
              <p className="stat-number">{stats.maintenance}</p>
            </div>
            <div className="stat-icon orange">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Broken</h3>
              <p className="stat-number">{stats.broken}</p>
            </div>
            <div className="stat-icon red">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '0'
      }}>
        <button
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: viewMode === 'all' ? '2px solid #4F46E5' : '2px solid transparent',
            background: 'transparent',
            color: viewMode === 'all' ? '#4F46E5' : '#6b7280',
            fontWeight: viewMode === 'all' ? '600' : '400',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => setViewMode('all')}
        >
          All Equipment
        </button>
        <button
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: viewMode === 'available' ? '2px solid #4F46E5' : '2px solid transparent',
            background: 'transparent',
            color: viewMode === 'available' ? '#4F46E5' : '#6b7280',
            fontWeight: viewMode === 'available' ? '600' : '400',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => setViewMode('available')}
        >
          Available Only
        </button>
        <button
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: viewMode === 'by-room' ? '2px solid #4F46E5' : '2px solid transparent',
            background: 'transparent',
            color: viewMode === 'by-room' ? '#4F46E5' : '#6b7280',
            fontWeight: viewMode === 'by-room' ? '600' : '400',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => setViewMode('by-room')}
        >
          By Room
        </button>
      </div>

      {/* Room ID Input (shown when by-room mode is selected) */}
      {viewMode === 'by-room' && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <label htmlFor="roomId" style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: '#374151'
          }}>
            Room ID:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              id="roomId"
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              placeholder="Enter room ID..."
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <button className="btn-primary" onClick={loadEquipments}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              Search
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="table-controls">
        <div className="search-box">
          <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <input
            type="text"
            placeholder="Search by name, equipment code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="table-container">
        {filteredEquipments.length === 0 ? (
          <div className="empty-state">
            <p>No equipment found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Equipment Code</th>
                <th>Equipment Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Available</th>
                <th>Status</th>
                <th>Availability</th>
                {onSelectEquipment && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredEquipments.map((equipment) => (
                <tr key={equipment.id}>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      background: '#f3f4f6',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      color: '#374151'
                    }}>
                      {equipment.code}
                    </span>
                  </td>
                  <td>
                    <div>
                      <strong style={{ color: '#111827' }}>{equipment.name}</strong>
                      {equipment.description && (
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginTop: '2px'
                        }}>
                          {equipment.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{equipment.category}</td>
                  <td style={{ textAlign: 'center' }}>{equipment.quantity}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      color: equipment.quantityAvailable > 0 ? '#059669' : '#dc2626',
                      fontWeight: '600'
                    }}>
                      {equipment.quantityAvailable}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={equipment.status} />
                  </td>
                  <td>
                    <AvailabilityIndicator equipment={equipment} />
                  </td>
                  {onSelectEquipment && (
                    <td>
                      <button
                        className="btn-primary"
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          opacity: (equipment.status !== 'Available' || equipment.quantityAvailable === 0) ? 0.5 : 1,
                          cursor: (equipment.status !== 'Available' || equipment.quantityAvailable === 0) ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => onSelectEquipment(equipment)}
                        disabled={equipment.status !== 'Available' || equipment.quantityAvailable === 0}
                      >
                        Select
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Results count */}
      <div className="table-footer" style={{
        marginTop: '16px',
        padding: '12px 0',
        borderTop: '1px solid #e5e7eb'
      }}>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Showing {filteredEquipments.length} / {equipments.length} equipment
        </p>
      </div>
    </div>
  );
};

export default EquipmentAvailability;

