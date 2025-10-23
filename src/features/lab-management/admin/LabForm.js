import React, { useState, useEffect } from 'react';
import { roomsApi } from '../../../api';

/**
 * Lab Form Component - Admin Only
 * 
 * Form for creating and editing labs
 * 
 * Related Use Cases:
 * - UC-10: Manage Labs (Admin)
 */
const LabForm = ({ lab, onSubmit, onCancel, loading }) => {
  const isEdit = !!lab;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    capacity: 0,
    roomId: '',
    status: 0
  });

  const [errors, setErrors] = useState({});
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  useEffect(() => {
    if (lab) {
      setFormData({
        name: lab.name || '',
        description: lab.description || '',
        location: lab.location || '',
        capacity: lab.capacity || 0,
        roomId: lab.roomId || '',
        status: lab.status === 'Active' ? 0 : 1
      });
    }
  }, [lab]);

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
      newErrors.name = 'Lab name is required';
    }

    if (!formData.capacity || formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
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
        location: formData.location.trim(),
        capacity: parseInt(formData.capacity),
        roomId: formData.roomId.trim() || null,
        status: parseInt(formData.status)
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
          <h3>{isEdit ? 'Edit Lab' : 'Add New Lab'}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              {/* Lab Name */}
              <div className="form-group">
                <label htmlFor="name">
                  Lab Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                  placeholder="E.g.: AI Research Lab"
                  disabled={loading}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
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
                  placeholder="E.g.: Building A, Floor 3"
                  disabled={loading}
                />
              </div>

              {/* Capacity */}
              <div className="form-group">
                <label htmlFor="capacity">
                  Capacity <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className={errors.capacity ? 'error' : ''}
                  placeholder="E.g.: 30"
                  min="1"
                  disabled={loading}
                />
                {errors.capacity && <span className="error-message">{errors.capacity}</span>}
              </div>

              {/* Room */}
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
                <small className="form-hint">Leave empty if not assigned to a specific room</small>
              </div>

              {/* Status */}
              <div className="form-group">
                <label htmlFor="status">
                  Status <span className="required">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value={0}>Active</option>
                  <option value={1}>Inactive</option>
                </select>
              </div>

              {/* Description */}
              <div className="form-group full-width">
                <label htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed description of the lab..."
                  rows="4"
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

export default LabForm;

