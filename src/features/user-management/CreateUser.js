import React, { useState, useEffect } from 'react';
import { useRoles } from '../../contexts/RolesContext';
import { userApi } from '../../api';

/**
 * Create User Page Component - Admin Only
 * 
 * Dedicated page for creating new users
 * 
 * Related Use Cases:
 * - UC-20: Manage Users (Admin)
 */
const CreateUser = ({ onNavigateBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    fullname: '',
    mssv: '',
    roles: []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { roles: availableRoles, loading: rolesLoading, error: rolesError } = useRoles();

  // Debug: Log roles data
  useEffect(() => {
    console.log('CreateUser - Roles Debug:', {
      availableRoles,
      rolesLoading,
      rolesError,
      rolesCount: availableRoles?.length || 0
    });
  }, [availableRoles, rolesLoading, rolesError]);

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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Full name is required';
    }

    if (!formData.mssv.trim()) {
      newErrors.mssv = 'MSSV is required';
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
      const filteredRoles = formData.roles.filter(roleId => 
        roleId && 
        roleId !== '00000000-0000-0000-0000-000000000000'
        // Removed the filter for 00000000-0000-0000-0000-000000000001 as it's a valid role ID
      );
      
      // Convert role IDs to role names for backend
      const roleNames = filteredRoles.map(roleId => {
        const role = availableRoles.find(r => r.id === roleId);
        return role ? role.name : null;
      }).filter(name => name !== null);
      
      console.log('CreateUser - Roles debug:', {
        originalRoles: formData.roles,
        filteredRoles: filteredRoles,
        roleNames: roleNames,
        availableRoles: availableRoles,
        rolesCount: availableRoles?.length || 0
      });
      
      const submitData = {
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password,
        fullname: formData.fullname.trim(),
        mssv: formData.mssv.trim(),
        roles: roleNames
      };

      console.log('CreateUser - About to call createUser API with:', {
        submitData: submitData,
        rolesToSubmit: submitData.roles
      });
      
      // Validate roles before submission
      if (submitData.roles.length === 0) {
        console.warn('CreateUser - No roles to submit, skipping roles update');
        // Remove roles from submitData if empty
        delete submitData.roles;
      }
      
      console.log('CreateUser - About to call createUser API with:', {
        submitData: submitData,
        rolesToSubmit: submitData.roles
      });
      
      // Validate roles before submission
      if (submitData.roles.length === 0) {
        console.warn('CreateUser - No roles to submit, skipping roles update');
        // Remove roles from submitData if empty
        delete submitData.roles;
      } else {
        // Check if roles are valid before submission
        const validRoles = submitData.roles.filter(roleName => {
          const isValid = availableRoles.some(role => role.name === roleName);
          if (!isValid) {
            console.warn(`CreateUser - Role name ${roleName} not found in available roles, skipping`);
          }
          return isValid;
        });
        
        if (validRoles.length === 0) {
          console.warn('CreateUser - No valid roles to submit, skipping roles update');
          delete submitData.roles;
        } else {
          submitData.roles = validRoles;
        }
      }
      
      try {
        await userApi.createUser(submitData);
      } catch (error) {
        // If roles cause error, try without roles
        if (error.message && error.message.includes('Roles not found')) {
          console.warn('CreateUser - Roles caused error, retrying without roles');
          const submitDataWithoutRoles = { ...submitData };
          delete submitDataWithoutRoles.roles;
          
          console.log('CreateUser - Retrying without roles:', submitDataWithoutRoles);
          await userApi.createUser(submitDataWithoutRoles);
        } else {
          throw error;
        }
      }
      
      // Navigate back to user list with success message
      if (onSuccess) {
        onSuccess();
      } else if (onNavigateBack) {
        onNavigateBack();
      }
    } catch (err) {
      console.error('Failed to create user:', err);
      setErrors({ submit: err.message || 'Failed to create user' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  return (
    <div className="create-user-page">
      <div className="page-header">
        <div className="header-content">
          <button 
            className="back-button"
            onClick={handleCancel}
            disabled={loading}
            title="Back to User List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1>Create New User</h1>
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
            <div className="form-grid single-column">
              {/* Email */}
              <div className="form-group">
                <label htmlFor="email">
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="user@fpt.edu.vn"
                  disabled={loading}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              {/* Username */}
              <div className="form-group">
                <label htmlFor="username">
                  Username <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={errors.username ? 'error' : ''}
                  placeholder="username"
                  disabled={loading}
                />
                {errors.username && <span className="error-message">{errors.username}</span>}
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password">
                  Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  placeholder="Enter password"
                  disabled={loading}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="fullname">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  className={errors.fullname ? 'error' : ''}
                  placeholder="Full Name"
                  disabled={loading}
                />
                {errors.fullname && <span className="error-message">{errors.fullname}</span>}
              </div>

              {/* MSSV */}
              <div className="form-group">
                <label htmlFor="mssv">
                  MSSV <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="mssv"
                  name="mssv"
                  value={formData.mssv}
                  onChange={handleChange}
                  className={errors.mssv ? 'error' : ''}
                  placeholder="Student ID"
                  disabled={loading}
                />
                {errors.mssv && <span className="error-message">{errors.mssv}</span>}
              </div>

              {/* Roles */}
              <div className="form-group">
                <label htmlFor="roles">
                  Roles
                </label>
                {rolesLoading ? (
                  <div className="loading">Loading roles...</div>
                ) : rolesError ? (
                  <div className="error-message">
                    {rolesError.includes('Authentication expired') ? (
                      <>
                        <strong>Authentication expired!</strong>
                        <br />
                        Please refresh the page and login again to load roles.
                        <br />
                        <small>You can still create the user and assign roles later.</small>
                      </>
                    ) : (
                      <>
                        Failed to load roles: {rolesError}
                        <br />
                        <small>You can still create the user and assign roles later.</small>
                      </>
                    )}
                  </div>
                ) : availableRoles.length === 0 ? (
                  <div className="text-muted">No roles available</div>
                ) : (
                  <select
                    id="roles"
                    name="roles"
                    value={formData.roles[0] || ''}
                    onChange={(e) => {
                      const roleId = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        roles: roleId ? [roleId] : []
                      }));
                    }}
                    disabled={loading}
                    className="form-select"
                  >
                    <option value="">Select a role (optional)</option>
                    {availableRoles.map(role => {
                      console.log('CreateUser - Role in dropdown:', role);
                      return (
                        <option key={role.id || role.Id || role.name || role.Name} value={role.id || role.Id || role.name || role.Name}>
                          {role.name || role.Name || role.id || role.Id}
                        </option>
                      );
                    })}
                  </select>
                )}
                <small className="form-hint">Select a role for the user</small>
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
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateUser;
