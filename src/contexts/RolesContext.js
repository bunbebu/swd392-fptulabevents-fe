import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAllRoles } from '../api';

const RolesContext = createContext();

export const useRoles = () => {
  const context = useContext(RolesContext);
  if (!context) {
    throw new Error('useRoles must be used within a RolesProvider');
  }
  return context;
};

export const RolesProvider = ({ children }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchRoles = useCallback(async (forceRefresh = false) => {
    // Cache for 5 minutes
    const CACHE_DURATION = 5 * 60 * 1000;
    const now = Date.now();
    
    if (!forceRefresh && lastFetch && (now - lastFetch) < CACHE_DURATION && roles.length > 0) {
      return roles;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('RolesContext - Fetching roles from API...');
      const response = await getAllRoles();
      console.log('RolesContext - API Response:', response);
      console.log('RolesContext - Response type:', typeof response);
      console.log('RolesContext - Is Array:', Array.isArray(response));
      console.log('RolesContext - Response keys:', response ? Object.keys(response) : 'null');
      
      // Handle different response structures
      let rolesData = [];
      if (Array.isArray(response)) {
        rolesData = response;
        console.log('RolesContext - Using direct array');
      } else if (response?.data && Array.isArray(response.data)) {
        rolesData = response.data;
        console.log('RolesContext - Using response.data');
      } else if (response?.Data && Array.isArray(response.Data)) {
        rolesData = response.Data;
        console.log('RolesContext - Using response.Data');
      } else {
        console.log('RolesContext - No valid roles data found in response');
      }
      
      console.log('RolesContext - Processed roles data:', rolesData);
      setRoles(rolesData);
      setLastFetch(now);
      return rolesData;
    } catch (error) {
      console.error('Error fetching roles:', error);
      
      // Handle 401 error specifically
      if (error.status === 401) {
        setError('Authentication expired. Please refresh the page and login again.');
      } else {
        setError(error.message || 'Failed to load roles');
      }
      
      // Return empty array as fallback
      setRoles([]);
      return [];
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastFetch]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const value = {
    roles,
    loading,
    error,
    fetchRoles,
    refreshRoles: () => fetchRoles(true)
  };

  return (
    <RolesContext.Provider value={value}>
      {children}
    </RolesContext.Provider>
  );
};
