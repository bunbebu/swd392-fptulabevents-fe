import React, { useState, useRef, useEffect } from 'react';
import { labsApi } from '../../../api';
import {
  uploadImage,
  validateImageFile,
  isStorageAvailable,
  createPreviewUrl,
  revokePreviewUrl,
  formatFileSize
} from '../../../utils/imageUpload';

/**
 * Create Lab Page Component - Admin Only
 *
 * Dedicated page for creating new lab with image upload support
 *
 * Related Use Cases:
 * - UC-10: Manage Labs (Admin)
 * - UC-16: Upload Event Cover Image (adapted for labs)
 *
 * Features:
 * - File upload to Firebase Storage
 * - Image preview
 * - Upload progress tracking
 * - File validation (type, size)
 * - Fallback to URL input if Firebase is not configured
 */
const CreateLab = ({ onNavigateBack, onSuccess }) => {

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    capacity: 1,
    imageUrl: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

    // Clear previous preview
    if (previewUrl) {
      revokePreviewUrl(previewUrl);
    }

    // Set selected file and create preview
    setSelectedFile(file);
    const preview = createPreviewUrl(file);
    setPreviewUrl(preview);

    // Clear any previous errors
    setErrors(prev => ({ ...prev, imageUrl: '' }));
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      revokePreviewUrl(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setUploadProgress(0);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleInputMode = () => {
    handleRemoveImage();
    setUseUrlInput(!useUrlInput);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Lab name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.capacity || formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }

    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      let imageUrl = formData.imageUrl.trim();

      // If a file is selected, upload it first
      if (selectedFile && !useUrlInput) {
        try {
          setIsUploading(true);
          imageUrl = await uploadImage(selectedFile, 'labs', (progress) => {
            setUploadProgress(progress);
          });
          setIsUploading(false);
        } catch (uploadError) {
          setIsUploading(false);
          setErrors({ submit: uploadError.message || 'Failed to upload image' });
          setLoading(false);
          return;
        }
      }

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        capacity: parseInt(formData.capacity),
        imageUrl: imageUrl || null
      };

      await labsApi.createLab(submitData);

      // Cleanup preview URL
      if (previewUrl) {
        revokePreviewUrl(previewUrl);
      }

      // Navigate back to lab list with success message
      if (onSuccess) {
        onSuccess();
      } else if (onNavigateBack) {
        onNavigateBack();
      }
    } catch (err) {
      console.error('Failed to create lab:', err);
      setErrors({ submit: err.message || 'Failed to create lab' });
    } finally {
      setLoading(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  return (
    <div className="create-lab-page">
      <div className="page-header">
        <div className="header-content">
          <button 
            className="back-button"
            onClick={handleCancel}
            disabled={loading}
            title="Back to Lab List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1>Create New Lab</h1>
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
                  placeholder="E.g.: Computer Lab A101"
                  disabled={loading}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              {/* Location */}
              <div className="form-group">
                <label htmlFor="location">
                  Location <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={errors.location ? 'error' : ''}
                  placeholder="E.g.: Building A, Floor 1"
                  disabled={loading}
                />
                {errors.location && <span className="error-message">{errors.location}</span>}
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

              {/* Image Upload / URL */}
              <div className="form-group">
                <div className="image-upload-header">
                  <label>Lab Image</label>
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
                      placeholder="https://example.com/lab-image.jpg"
                      disabled={loading || isUploading}
                      className={errors.imageUrl ? 'error' : ''}
                    />
                    {formData.imageUrl && (
                      <div className="image-preview">
                        <img
                          src={formData.imageUrl}
                          alt="Lab preview"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
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
                        id="imageFile"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileSelect}
                        disabled={loading || isUploading}
                        className="file-input"
                      />
                      <label htmlFor="imageFile" className="file-upload-label compact">
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

                    {/* Upload Progress */}
                    {isUploading && (
                      <div className="upload-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{uploadProgress}%</span>
                      </div>
                    )}

                    {/* Image Preview */}
                    {previewUrl && (
                      <div className="image-preview">
                        <img src={previewUrl} alt="Preview" />
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
                  placeholder="Detailed description of the lab..."
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
                disabled={loading || isUploading}
              >
                {isUploading ? `Uploading... ${uploadProgress}%` : loading ? 'Creating...' : 'Create Lab'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateLab;
