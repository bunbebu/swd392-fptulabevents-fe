import React, { useState, useEffect } from 'react';
import { labsApi } from '../../../api';

/**
 * Edit Lab Page Component - Admin Only
 *
 * Dedicated page for editing existing lab
 *
 * Related Use Cases:
 * - UC-10: Manage Labs (Admin)
 */
const EditLab = ({ lab, labId, onNavigateBack, onSuccess }) => {
  const [labData, setLabData] = useState(lab);
  const [formData, setFormData] = useState({
    name: '',
    location: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingLab, setFetchingLab] = useState(false);

  // Fetch lab data if labId is provided
  useEffect(() => {
    const fetchLab = async () => {
      if (labId && !lab) {
        try {
          setFetchingLab(true);
          const fetchedLab = await labsApi.getLabById(labId);
          setLabData(fetchedLab);
        } catch (err) {
          console.error('Failed to fetch lab:', err);
          setErrors({ submit: 'Failed to load lab data' });
        } finally {
          setFetchingLab(false);
        }
      } else if (lab) {
        setLabData(lab);
      }
    };

    fetchLab();
  }, [labId, lab]);

  // Initialize form data
  useEffect(() => {
    if (labData) {
      setFormData({
        name: labData.name || '',
        location: labData.location || ''
      });
    }
  }, [labData]);

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

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        name: formData.name.trim(),
        location: formData.location.trim()
      };

      const targetLabId = labId || labData?.id;
      if (!targetLabId) {
        throw new Error('Lab ID is required');
      }

      await labsApi.updateLab(targetLabId, submitData);

      // Navigate back to lab list with success message
      if (onSuccess) {
        onSuccess();
      } else if (onNavigateBack) {
        onNavigateBack();
      }
    } catch (err) {
      console.error('Failed to update lab:', err);
      setErrors({ submit: err.message || 'Failed to update lab' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  if (fetchingLab) {
    return (
      <div className="create-lab-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={handleCancel}
              title="Back to Lab List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Edit Lab</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="form-container">
            <div className="loading">
              <div className="loading-spinner"></div>
              Loading lab data...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!labData) {
    return (
      <div className="create-lab-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={handleCancel}
              title="Back to Lab List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1>Edit Lab</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="form-container">
            <div className="error-message">Lab not found</div>
          </div>
        </div>
      </div>
    );
  }

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
          <h1>Edit Lab: {labData.name}</h1>
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
                {loading ? 'Updating...' : 'Update Lab'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditLab;
