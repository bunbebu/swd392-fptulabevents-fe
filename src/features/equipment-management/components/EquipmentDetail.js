import React, { useState, useEffect } from 'react';
import { equipmentApi } from '../../../api';

/**
 * Equipment Detail Component
 * Displays detailed information about a specific equipment
 * 
 * Related User Stories:
 * - US-09: Admin - Manage labs and equipment
 * - US-22: Lecturer - View equipment availability before approving booking
 */
const EquipmentDetail = ({ equipmentId, onNavigateBack }) => {
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEquipmentDetail();
  }, [equipmentId]);

  const loadEquipmentDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const detail = await equipmentApi.getEquipmentById(equipmentId);
      const data = (detail && (detail.data || detail.Data)) || detail;
      setEquipment(data);
    } catch (err) {
      console.error('Error loading equipment details:', err);
      setError(err.message || 'Failed to load equipment details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toString()) {
      case 'Available':
        return 'status-badge status-available';
      case 'Maintenance':
        return 'status-badge status-maintenance';
      case 'Broken':
        return 'status-badge status-unavailable';
      case 'Occupied':
        return 'status-badge status-occupied';
      case 'Unavailable':
        return 'status-badge status-unavailable';
      default:
        return 'status-badge unknown';
    }
  };

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
      <div className="create-equipment-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={onNavigateBack}
              title="Back to Equipment List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Equipment Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="loading">Loading equipment details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="create-equipment-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={onNavigateBack}
              title="Back to Equipment List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Equipment Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="error-message">
            {error}
            <div className="error-actions">
              <button onClick={loadEquipmentDetail} className="btn btn-primary">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="create-equipment-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={onNavigateBack}
              title="Back to Equipment List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Equipment Details</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="no-data">Equipment not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-equipment-page">
      <div className="page-header">
        <div className="header-content">
          <button 
            className="back-button"
            onClick={onNavigateBack}
            title="Back to Equipment List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1>Equipment Details</h1>
        </div>
      </div>

      <div className="page-content">
        <div className="room-detail-content">
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Basic Information</h3>
              <span className={getStatusBadgeClass(equipment.status)}>
                {equipment.status || 'Unknown'}
              </span>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Equipment Name:</label>
                <span className="detail-value">{equipment.name}</span>
              </div>
              <div className="detail-item">
                <label>Serial Number:</label>
                <span className="detail-value">{equipment.serialNumber}</span>
              </div>
              <div className="detail-item">
                <label>Type:</label>
                <span className="detail-value">{equipment.type}</span>
              </div>
              <div className="detail-item">
                <label>Room:</label>
                <span className="detail-value">{equipment.roomName || 'Not assigned'}</span>
              </div>
              <div className="detail-item">
                <label>Last Maintenance:</label>
                <span className="detail-value">{formatDate(equipment.lastMaintenanceDate)}</span>
              </div>
              <div className="detail-item">
                <label>Next Maintenance:</label>
                <span className="detail-value">{formatDate(equipment.nextMaintenanceDate)}</span>
              </div>
              <div className="detail-item">
                <label>Created At:</label>
                <span className="detail-value">{formatDate(equipment.createdAt)}</span>
              </div>
              <div className="detail-item">
                <label>Last Updated:</label>
                <span className="detail-value">{formatDate(equipment.lastUpdatedAt)}</span>
              </div>
              {equipment.description && (
                <div className="detail-item full-width">
                  <label>Description:</label>
                  <span className="detail-value">{equipment.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* Equipment Image */}
          {equipment.imageUrl && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Equipment Image</h3>
              </div>
              <div className="room-image-container">
                <img src={equipment.imageUrl} alt={equipment.name} className="room-image" />
              </div>
            </div>
          )}

          {/* Maintenance History */}
          {(equipment.lastMaintenanceDate || equipment.nextMaintenanceDate) && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Maintenance Information</h3>
              </div>
              <div className="detail-grid">
                {equipment.lastMaintenanceDate && (
                  <div className="detail-item">
                    <label>Last Maintenance Date:</label>
                    <span className="detail-value">{formatDate(equipment.lastMaintenanceDate)}</span>
                  </div>
                )}
                {equipment.nextMaintenanceDate && (
                  <div className="detail-item">
                    <label>Next Maintenance Date:</label>
                    <span className="detail-value">{formatDate(equipment.nextMaintenanceDate)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetail;
