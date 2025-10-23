import React, { useState, useEffect, useRef } from 'react';
import { equipmentApi, roomsApi } from '../../../api';
import { EQUIPMENT_TYPE_OPTIONS } from '../../../constants/equipmentConstants';
import {
  uploadImage,
  validateImageFile,
  isStorageAvailable,
  createPreviewUrl,
  revokePreviewUrl,
  formatFileSize
} from '../../../utils/imageUpload';

/**
 * Edit Equipment Page Component - Admin Only
 * 
 * Dedicated page for editing existing equipment
 * 
 * Related Use Cases:
 * - UC-10: Manage Equipment (Admin)
 */
const EditEquipment = ({ equipmentId, onNavigateBack, onSuccess }) => {
  const [equipment, setEquipment] = useState(null);
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
  const [loading, setLoading] = useState(false);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Image upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [useUrlInput, setUseUrlInput] = useState(!isStorageAvailable());
  const fileInputRef = useRef(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        revokePreviewUrl(previewUrl);
      }
    };
  }, [previewUrl]);

  // Load equipment data
  useEffect(() => {
    const loadEquipment = async () => {
      if (!equipmentId) return;
      
      try {
        setEquipmentLoading(true);
        const equipmentData = await equipmentApi.getEquipmentById(equipmentId);
        const data = (equipmentData && (equipmentData.data || equipmentData.Data)) || equipmentData;
        setEquipment(data);
        
        // Initialize form data
        if (data) {
          setFormData({
            name: data.name || '',
            description: data.description || '',
            serialNumber: data.serialNumber || '',
            type: data.type || 0,
            imageUrl: data.imageUrl || '',
            roomId: data.roomId || '',
            lastMaintenanceDate: data.lastMaintenanceDate ? 
              new Date(data.lastMaintenanceDate).toISOString().slice(0, 16) : '',
            nextMaintenanceDate: data.nextMaintenanceDate ? 
              new Date(data.nextMaintenanceDate).toISOString().slice(0, 16) : ''
          });
          
          // If equipment has existing image, set it as current image
          if (data.imageUrl) {
            setUseUrlInput(true); // Start with URL mode to show current image
          }
        }
      } catch (err) {
        console.error('Error loading equipment:', err);
        setErrors({ submit: err.message || 'Failed to load equipment' });
      } finally {
        setEquipmentLoading(false);
      }
    };

    loadEquipment();
  }, [equipmentId]);

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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrors(prev => ({ ...prev, imageUrl: validation.error }));
      return;
    }

    // Clear any previous errors
    setErrors(prev => ({ ...prev, imageUrl: '' }));

    // Set selected file
    setSelectedFile(file);

    // Create preview
    const preview = createPreviewUrl(file);
    if (previewUrl) {
      revokePreviewUrl(previewUrl);
    }
    setPreviewUrl(preview);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      revokePreviewUrl(previewUrl);
      setPreviewUrl('');
    }
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleInputMode = () => {
    setUseUrlInput(!useUrlInput);
    handleRemoveImage();
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
      setLoading(true);

      // Upload image to Firebase if file is selected
      let imageUrl = formData.imageUrl.trim();
      if (selectedFile && !useUrlInput) {
        try {
          setIsUploading(true);
          imageUrl = await uploadImage(selectedFile, 'equipment', (progress) => {
            setUploadProgress(progress);
          });
          setIsUploading(false);
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
          setErrors({ imageUrl: uploadError.message || 'Failed to upload image' });
          setLoading(false);
          setIsUploading(false);
          return;
        }
      }

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        serialNumber: formData.serialNumber.trim(),
        type: parseInt(formData.type),
        imageUrl: imageUrl || null,
        roomId: formData.roomId.trim() || null,
        lastMaintenanceDate: formData.lastMaintenanceDate ?
          new Date(formData.lastMaintenanceDate).toISOString() : null,
        nextMaintenanceDate: formData.nextMaintenanceDate ?
          new Date(formData.nextMaintenanceDate).toISOString() : null
      };

      await equipmentApi.updateEquipment(equipmentId, submitData);

      // Navigate back to equipment list with success message
      if (onSuccess) {
        onSuccess();
      } else if (onNavigateBack) {
        onNavigateBack();
      }
    } catch (err) {
      console.error('Failed to update equipment:', err);
      setErrors({ submit: err.message || 'Failed to update equipment' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  if (equipmentLoading) {
    return (
      <div className="create-equipment-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={handleCancel}
              title="Back to Equipment List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Edit Equipment</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="form-container">
            <div className="loading">Loading equipment details...</div>
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
              onClick={handleCancel}
              title="Back to Equipment List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Edit Equipment</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="form-container">
            <div className="error-message">Equipment not found</div>
          </div>
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
            onClick={handleCancel}
            disabled={loading}
            title="Back to Equipment List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1>Edit Equipment: {equipment.name}</h1>
        </div>
      </div>

      <div className="page-content">
        <div className="form-container">
          {errors.submit && (
            <div className="error-message">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit}>
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

              {/* Equipment Image - File Upload or URL */}
              <div className="form-group">
                <div className="image-upload-header">
                  <label>Equipment Image</label>
                  {isStorageAvailable() && (
                    <button
                      type="button"
                      className="toggle-input-mode"
                      onClick={handleToggleInputMode}
                      disabled={loading || isUploading}
                    >
                      {useUrlInput ? 'Upload File Instead' : 'Use URL Instead'}
                    </button>
                  )}
                </div>

                {useUrlInput ? (
                  // URL Input Mode
                  <>
                    <input
                      type="url"
                      id="imageUrl"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/equipment-image.jpg"
                      disabled={loading || isUploading}
                      className={errors.imageUrl ? 'error' : ''}
                    />
                    {formData.imageUrl && !selectedFile && !previewUrl && (
                      <div className="current-image-section">
                        <div className="current-image-preview">
                          <img
                            src={formData.imageUrl}
                            alt="Current equipment"
                            className="current-image"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div className="current-image-info">
                            <span className="current-image-text">Current equipment image</span>
                            <button
                              type="button"
                              className="remove-current-image-btn"
                              onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                              disabled={loading || isUploading}
                              title="Remove current image"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // File Upload Mode
                  <>
                    <div className="file-upload-container">
                      <input
                        type="file"
                        ref={fileInputRef}
                        id="equipmentImage"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileSelect}
                        disabled={loading || isUploading}
                        className="file-input"
                      />
                      <label htmlFor="equipmentImage" className="file-upload-label compact">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <span className="upload-placeholder">
                          {selectedFile ? selectedFile.name : 'Choose an image or drag it here'}
                        </span>
                        {selectedFile && (
                          <span className="file-size">
                            {formatFileSize(selectedFile.size)}
                          </span>
                        )}
                      </label>
                    </div>

                    {isUploading && (
                      <div className="upload-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                        <span className="progress-text">{uploadProgress}%</span>
                      </div>
                    )}

                    {previewUrl && (
                      <div className="image-preview">
                        <img src={previewUrl} alt="Equipment preview" />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={handleRemoveImage}
                          disabled={loading || isUploading}
                          title="Remove image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    )}

                    <p className="file-upload-hint">
                      Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB
                    </p>
                  </>
                )}
                {errors.imageUrl && <span className="error-message">{errors.imageUrl}</span>}
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

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Equipment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEquipment;
