import React, { useState, useEffect } from 'react';
import { equipmentApi, roomsApi } from '../../../api';
import { EQUIPMENT_TYPE_OPTIONS } from '../../../constants/equipmentConstants';

/**
 * Equipment Form Component - Admin Only
 * 
 * Form for creating and editing equipment
 * 
 * Related Use Cases:
 * - UC-10: Manage Equipment (Admin)
 */
const EquipmentForm = ({ equipment, onSubmit, onCancel, loading }) => {
  const isEdit = !!equipment;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serialNumber: '',
    type: 0,
    imageUrl: '',
    roomId: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: ''
  });

  const [errors, setErrors] = useState({});
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name || '',
        description: equipment.description || '',
        serialNumber: equipment.serialNumber || '',
        type: equipment.type || 0,
        imageUrl: equipment.imageUrl || '',
        roomId: equipment.roomId || '',
        lastMaintenanceDate: equipment.lastMaintenanceDate ? 
          new Date(equipment.lastMaintenanceDate).toISOString().slice(0, 16) : '',
        nextMaintenanceDate: equipment.nextMaintenanceDate ? 
          new Date(equipment.nextMaintenanceDate).toISOString().slice(0, 16) : ''
      });
    }
  }, [equipment]);

  // Load rooms when component mounts
  useEffect(() => {
    const loadRooms = async () => {
      try {
        setRoomsLoading(true);
        const roomsData = await roomsApi.getRooms();
        setRooms(Array.isArray(roomsData) ? roomsData : []);
      } catch (err) {
        console.error('Failed to load rooms:', err);
        setRooms([]);
      } finally {
        setRoomsLoading(false);
      }
    };

    loadRooms();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Equipment name is required';
    }

    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'Serial number is required';
    }

    if (formData.type < 0 || formData.type > 6) {
      newErrors.type = 'Type must be between 0 and 6';
    }

    if (formData.roomId && !isValidUUID(formData.roomId)) {
      newErrors.roomId = 'Room ID must be a valid UUID';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        serialNumber: formData.serialNumber.trim(),
        type: parseInt(formData.type),
        imageUrl: formData.imageUrl.trim() || null,
        roomId: formData.roomId.trim() || null,
        lastMaintenanceDate: formData.lastMaintenanceDate ? 
          new Date(formData.lastMaintenanceDate).toISOString() : null,
        nextMaintenanceDate: formData.nextMaintenanceDate ? 
          new Date(formData.nextMaintenanceDate).toISOString() : null
      };

      await onSubmit(submitData);
    } catch (err) {
      // Error handled by parent component
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Equipment' : 'Add New Equipment'}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              {/* Equipment Name */}
              <div className="form-group">
                <label htmlFor="name">
                  Equipment Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                  placeholder="E.g.: Projector"
                  disabled={loading}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              {/* Serial Number */}
              <div className="form-group">
                <label htmlFor="serialNumber">
                  Serial Number <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="serialNumber"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className={errors.serialNumber ? 'error' : ''}
                  placeholder="E.g.: SN123456789"
                  disabled={loading}
                />
                {errors.serialNumber && <span className="error-message">{errors.serialNumber}</span>}
              </div>

              {/* Type */}
              <div className="form-group">
                <label htmlFor="type">
                  Type <span className="required">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={errors.type ? 'error' : ''}
                  disabled={loading}
                >
                  {EQUIPMENT_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.type && <span className="error-message">{errors.type}</span>}
              </div>

              {/* Image URL */}
              <div className="form-group">
                <label htmlFor="imageUrl">
                  Image URL
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  disabled={loading}
                />
              </div>

              {/* Room ID */}
              <div className="form-group">
                <label htmlFor="roomId">
                  Room
                </label>
                <select
                  id="roomId"
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleChange}
                  className={errors.roomId ? 'error' : ''}
                  disabled={loading || roomsLoading}
                >
                  <option value="">Select a room (optional)</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} - {room.location} (Capacity: {room.capacity})
                    </option>
                  ))}
                </select>
                {errors.roomId && <span className="error-message">{errors.roomId}</span>}
                <small className="form-hint">Leave empty if not assigned to room</small>
              </div>

              {/* Last Maintenance Date */}
              <div className="form-group">
                <label htmlFor="lastMaintenanceDate">
                  Last Maintenance Date
                </label>
                <input
                  type="datetime-local"
                  id="lastMaintenanceDate"
                  name="lastMaintenanceDate"
                  value={formData.lastMaintenanceDate}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Next Maintenance Date */}
              <div className="form-group">
                <label htmlFor="nextMaintenanceDate">
                  Next Maintenance Date
                </label>
                <input
                  type="datetime-local"
                  id="nextMaintenanceDate"
                  name="nextMaintenanceDate"
                  value={formData.nextMaintenanceDate}
                  onChange={handleChange}
                  disabled={loading}
                />
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
                  placeholder="Detailed description of equipment..."
                  rows="3"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isEdit ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipmentForm;

