// Global API Service
// Centralized API functions for the entire application

// If REACT_APP_API_BASE_URL exists, use it (direct call with CORS)
// If not, use '' (use proxy in package.json)
const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

// Helper function to get auth token
function getAuthToken() {
  return window.localStorage.getItem('accessToken') || window.sessionStorage.getItem('accessToken');
}

function getRefreshToken() {
  return window.localStorage.getItem('refreshToken') || window.sessionStorage.getItem('refreshToken');
}

function getTokenStorage() {
  // Determine which storage currently holds the tokens (prefer where refreshToken exists)
  const inLocal = window.localStorage.getItem('refreshToken');
  const storage = inLocal ? window.localStorage : (window.sessionStorage.getItem('refreshToken') ? window.sessionStorage : window.localStorage);
  return storage;
}

function setTokens({ accessToken, refreshToken }) {
  const storage = getTokenStorage();
  if (accessToken) storage.setItem('accessToken', accessToken);
  if (refreshToken) storage.setItem('refreshToken', refreshToken);
}

function clearTokens() {
  // Clear tokens from both localStorage and sessionStorage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
}

// Helper function to get auth headers
function getAuthHeaders() {
  const token = getAuthToken();
  console.log('API - Auth token exists:', !!token);
  console.log('API - Auth token preview:', token ? token.substring(0, 20) + '...' : 'null');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(path, options) {
  let resp;
  const fullUrl = `${API_BASE}${path}`;
  console.log('API Request - URL:', fullUrl);
  console.log('API Request - Method:', options?.method || 'GET');
  console.log('API Request - API_BASE:', API_BASE);

  try {
    resp = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options?.headers || {})
      },
      ...options
    });
  } catch (networkErr) {
    console.error('Network Error:', networkErr);
    console.error('Network Error Name:', networkErr.name);
    console.error('Network Error Message:', networkErr.message);

    const err = new Error('Unable to connect to server. Please check your network connection.');
    err.cause = networkErr;
    err.status = 0;
    throw err;
  }
  // If unauthorized, try refresh flow once
  if (resp.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // retry once with new token
      const retryResp = await fetch(`${API_BASE}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
          ...(options?.headers || {})
        },
        ...options
      });
      resp = retryResp;
    }
  }

  const text = await resp.text().catch(() => '');
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!resp.ok) {
    const serverData = data?.Data ?? data;
    const possibleMessages = [
      serverData?.Message,
      serverData?.message,
      serverData?.Error,
      serverData?.error,
    ].filter(Boolean);
    const message = possibleMessages[0] || `Request failed (${resp.status})`;

    const err = new Error(message);
    err.status = resp.status;
    err.data = serverData;
    err.details = serverData?.Errors || serverData?.errors || serverData?.detail || serverData?.Raw || null;
    throw err;
  }

  // Normalize successful response shape: unwrap { data/code/message } or { Data/Code/Message }
  const result = (data && (data.Data ?? data.data)) || data;
  
  // Debug logging for events API
  if (path.includes('/events/upcoming')) {
    console.log('API Debug - Path:', path);
    console.log('API Debug - Raw response:', data);
    console.log('API Debug - Normalized result:', result);
  }
  
  return result;
}

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export async function login({ identifier, password }) {
  const payload = { Identifier: identifier, Password: password };
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return {
    accessToken: data.AccessToken || data.accessToken,
    refreshToken: data.RefreshToken || data.refreshToken,
    user: data.User || data.user
  };
}

export async function refreshAuthToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.log('No refresh token found');
    return null;
  }
  
  try {
    console.log('Attempting to refresh token...');
    const resp = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ RefreshToken: refreshToken })
    });
    
    console.log('Refresh token response status:', resp.status);
    
    if (!resp.ok) {
      const errorText = await resp.text().catch(() => '');
      console.log('Refresh token failed with status:', resp.status, 'Error:', errorText);
      
      // If refresh token is invalid, clear tokens and redirect to login
      if (resp.status === 401) {
        console.log('Refresh token is invalid, clearing tokens...');
        clearTokens();
        // Redirect to login after a short delay to allow any ongoing operations to complete
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }, 1000);
      }
      
      return null;
    }
    
    const text = await resp.text().catch(() => '');
    console.log('Refresh token raw response:', text);
    
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    
    console.log('Parsed response:', data);
    
    // Normalize response like request function does
    const normalizedData = (data && (data.Data ?? data.data)) || data;
    
    console.log('Normalized data:', normalizedData);
    
    const accessToken = normalizedData.AccessToken || normalizedData.accessToken;
    const newRefresh = normalizedData.RefreshToken || normalizedData.refreshToken || refreshToken;
    
    console.log('Extracted tokens:', { accessToken: !!accessToken, newRefresh: !!newRefresh });
    
    if (accessToken) setTokens({ accessToken, refreshToken: newRefresh });
    return { accessToken, refreshToken: newRefresh };
  } catch (error) {
    console.log('Refresh token failed:', error);
    return null;
  }
}

async function tryRefreshToken() {
  try {
    const res = await refreshAuthToken();
    return !!(res && res.accessToken);
  } catch {
    return false;
  }
}

export async function getMe() {
  return await request('/api/auth/me', { method: 'GET' });
}

export async function logout() {
  return await request('/api/auth/logout', { method: 'POST' });
}

export async function register({ email, username, password, fullname, mssv }) {
  const payload = {
    Email: email,
    Username: username,
    Password: password,
    Fullname: fullname,
    MSSV: mssv
  };
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return {
    accessToken: data.AccessToken || data.accessToken,
    refreshToken: data.RefreshToken || data.refreshToken,
    user: data.User || data.user
  };
}

// Google OAuth Functions
export function getGoogleLoginUrl() {
  // GET /api/auth/google/start - Returns redirect URL to Google OAuth
  // For OAuth redirect, we need the full backend URL (proxy doesn't work for window.location.href)
  const backendUrl = process.env.REACT_APP_API_BASE_URL || 'http://swd392group6.runasp.net';
  
  // Generate a random state parameter for CSRF protection
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Store state in sessionStorage for validation later
  sessionStorage.setItem('google_oauth_state', state);
  
  // Determine the redirect URI based on environment
  const currentOrigin = window.location.origin;
  // Use production redirect URI if available, otherwise use current origin
  const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${currentOrigin}/auth/google/callback`;
  
  // Build the URL with required parameters
  const params = new URLSearchParams({
    state: state,
    redirectUri: redirectUri
  });
  
  return `${backendUrl}/api/auth/google/start?${params.toString()}`;
}

export async function loginWithGoogleToken(googleToken) {
  // POST /api/auth/google/token - Simple Google token login
  const payload = { token: googleToken };
  const data = await request('/api/auth/google/token', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return {
    accessToken: data.AccessToken || data.accessToken,
    refreshToken: data.RefreshToken || data.refreshToken,
    user: data.User || data.user
  };
}

export async function handleGoogleCallback(code, state) {
  // POST /api/auth/google/callback - Convert Google code to our tokens

  // Note: Backend doesn't validate state parameter currently
  // Clear the stored state anyway for cleanup
  sessionStorage.removeItem('google_oauth_state');

  // Get the redirect URI (must match what was sent to Google)
  const currentOrigin = window.location.origin;
  const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${currentOrigin}/auth/google/callback`;

  const payload = {
    code,
    redirectUri
  };
  const data = await request('/api/auth/google/callback', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return {
    accessToken: data.AccessToken || data.accessToken,
    refreshToken: data.RefreshToken || data.refreshToken,
    user: data.User || data.user
  };
}

// ============================================================================
// USER MANAGEMENT API
// ============================================================================

/**
 * Get paginated list of users
 * GET /api/users
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Number of items per page (default: 8)
 * @returns {Promise<Object>} Paginated user list
 */
export async function getUsers(page = 1, pageSize = 8) {
  // Prefer requesting with explicit pagination first (pageSize=8)
  try {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize)
    });
    const data = await request(`/api/users?${params}`);
    if (Array.isArray(data) ? true : Array.isArray(data?.data)) {
      return data;
    }
  } catch (_e) {}

  // Fallback 2: Uppercase param names
  try {
    const upperParams = new URLSearchParams({
      Page: String(page),
      PageSize: String(pageSize)
    });
    const data = await request(`/api/users?${upperParams}`);
    if (Array.isArray(data) ? true : Array.isArray(data?.data)) {
      return data;
    }
  } catch (_e) {}

  // Fallback 3: No params (some backends ignore pagination)
  return await request(`/api/users`);
}

// Get all users without pagination (used to compute accurate totals)
export async function getAllUsersUnpaged() {
  return await request(`/api/users`);
}

/**
 * Create a new user
 * POST /api/users
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.username - Username
 * @param {string} userData.password - Password
 * @param {string} userData.fullname - Full name
 * @param {string} userData.mssv - Student ID
 * @param {string[]} userData.roles - Array of roles
 * @returns {Promise<Object>} Created user data
 */
export async function createUser(userData) {
  const payload = {
    email: userData.email,
    username: userData.username,
    password: userData.password,
    fullname: userData.fullname,
    mssv: userData.mssv,
    roles: userData.roles || []
  };
  
  return await request('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Get user details by ID
 * GET /api/users/{id}
 * @param {string} id - User UUID
 * @returns {Promise<Object>} User details
 */
export async function getUserById(id) {
  return await request(`/api/users/${id}`);
}

/**
 * Update user
 * PUT /api/users/{id}
 * @param {string} id - User UUID
 * @param {Object} userData - Updated user data
 * @param {string} userData.fullname - Full name
 * @param {string} userData.mssv - Student ID
 * @param {string[]} userData.roles - Array of roles
 * @returns {Promise<Object>} Updated user data
 */
export async function updateUser(id, userData) {
  const payload = {
    Fullname: userData.fullname,
    MSSV: userData.mssv,
    Roles: userData.roles || []
  };
  
  return await request(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

/**
 * Delete user
 * DELETE /api/users/{id}
 * @param {string} id - User UUID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteUser(id) {
  return await request(`/api/users/${id}`, {
    method: 'DELETE'
  });
}

/**
 * Update user status
 * PATCH /api/users/{id}/status
 * @param {string} id - User UUID
 * @param {string} status - New status (Active/Inactive/Locked)
 * @returns {Promise<Object>} Updated user data
 */
export async function updateUserStatus(id, status) {
  const payload = { status };
  
  return await request(`/api/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

// ============================================================================
// EQUIPMENT MANAGEMENT API
// ============================================================================

/**
 * Get all equipments with filtering and pagination
 * GET /api/equipments
 * @param {Object} filters - Filter parameters
 * @param {string} filters.name - Equipment name filter
 * @param {string} filters.serialNumber - Serial number filter
 * @param {number} filters.type - Equipment type (0-6)
 * @param {number} filters.status - Equipment status (0-4)
 * @param {string} filters.roomId - Room ID filter (UUID)
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.pageSize - Items per page (default: 10)
 * @returns {Promise<Object>} Paginated equipment list
 */
export async function getEquipments(filters = {}) {
  const params = new URLSearchParams();

  // Add filter parameters if provided
  if (filters.name) params.append('Name', filters.name);
  if (filters.serialNumber) params.append('SerialNumber', filters.serialNumber);
  if (filters.type !== undefined) params.append('Type', String(filters.type));
  if (filters.status !== undefined) params.append('Status', String(filters.status));
  if (filters.roomId) params.append('RoomId', filters.roomId);
  // Backend expects 0-based page index, but we use 1-based in frontend
  if (filters.page) params.append('Page', String(filters.page - 1));
  if (filters.pageSize) params.append('PageSize', String(filters.pageSize));

  const queryString = params.toString();
  const url = queryString ? `/api/equipments?${queryString}` : '/api/equipments';

  return await request(url, { method: 'GET' });
}

/**
 * Create a new equipment (Admin only)
 * POST /api/equipments
 * @param {Object} equipmentData - Equipment data
 * @param {string} equipmentData.code - Equipment code
 * @param {string} equipmentData.name - Equipment name
 * @param {string} equipmentData.category - Equipment category
 * @param {number} equipmentData.quantity - Total quantity
 * @param {number} equipmentData.quantityAvailable - Available quantity
 * @param {string} equipmentData.status - Status (Available/Maintenance/Broken)
 * @param {string} equipmentData.roomId - Room/Lab ID (optional)
 * @param {string} equipmentData.description - Description (optional)
 * @returns {Promise<Object>} Created equipment data
 */
export async function createEquipment(equipmentData) {
  const payload = {
    name: equipmentData.name,
    description: equipmentData.description || '',
    serialNumber: equipmentData.serialNumber,
    type: equipmentData.type,
    imageUrl: equipmentData.imageUrl || null,
    roomId: equipmentData.roomId || null,
    lastMaintenanceDate: equipmentData.lastMaintenanceDate || null,
    nextMaintenanceDate: equipmentData.nextMaintenanceDate || null
  };

  return await request('/api/equipments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Get equipment by ID
 * GET /api/equipments/{id}
 * @param {string} id - Equipment UUID
 * @returns {Promise<Object>} Equipment details
 */
export async function getEquipmentById(id) {
  return await request(`/api/equipments/${id}`, { method: 'GET' });
}

/**
 * Update equipment (Admin only)
 * PUT /api/equipments/{id}
 * @param {string} id - Equipment UUID
 * @param {Object} equipmentData - Updated equipment data
 * @param {string} equipmentData.code - Equipment code
 * @param {string} equipmentData.name - Equipment name
 * @param {string} equipmentData.category - Equipment category
 * @param {number} equipmentData.quantity - Total quantity
 * @param {number} equipmentData.quantityAvailable - Available quantity
 * @param {string} equipmentData.status - Status (Available/Maintenance/Broken)
 * @param {string} equipmentData.roomId - Room/Lab ID (optional)
 * @param {string} equipmentData.description - Description (optional)
 * @returns {Promise<Object>} Updated equipment data
 */
export async function updateEquipment(id, equipmentData) {
  const payload = {
    Code: equipmentData.code,
    Name: equipmentData.name,
    Category: equipmentData.category,
    Quantity: equipmentData.quantity,
    QuantityAvailable: equipmentData.quantityAvailable,
    Status: equipmentData.status,
    RoomId: equipmentData.roomId || null,
    Description: equipmentData.description || ''
  };

  return await request(`/api/equipments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

/**
 * Delete equipment (Admin only)
 * DELETE /api/equipments/{id}
 * @param {string} id - Equipment UUID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteEquipment(id) {
  return await request(`/api/equipments/${id}`, {
    method: 'DELETE'
  });
}

/**
 * Update equipment status (Admin only)
 * PATCH /api/equipments/{id}/status
 * @param {string} id - Equipment UUID
 * @param {string} status - New status (Available/Maintenance/Broken)
 * @param {string} notes - Optional notes about status change
 * @returns {Promise<Object>} Updated equipment data
 */
export async function updateEquipmentStatus(id, status, notes = '') {
  const payload = {
    Status: parseInt(status), // Convert to integer for backend enum
    Notes: notes
  };

  return await request(`/api/equipments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

/**
 * Get equipments by room/lab ID
 * GET /api/equipments/by-room/{roomId}
 * @param {string} roomId - Room/Lab UUID
 * @returns {Promise<Array>} List of equipments in the specified room
 */
export async function getEquipmentsByRoom(roomId) {
  return await request(`/api/equipments/by-room/${roomId}`, { method: 'GET' });
}

/**
 * Get available equipments only
 * GET /api/equipments/available
 * @returns {Promise<Array>} List of available equipments
 */
export async function getAvailableEquipments() {
  return await request('/api/equipments/available', { method: 'GET' });
}

/**
 * Get equipments that need maintenance
 * GET /api/equipments/maintenance-needed
 * @returns {Promise<Array>} List of equipments needing maintenance
 */
export async function getMaintenanceNeededEquipments() {
  return await request('/api/equipments/maintenance-needed', { method: 'GET' });
}

/**
 * Get total equipment count
 * GET /api/equipments/count
 * @returns {Promise<number>} Total number of equipments
 */
export async function getEquipmentCount() {
  const result = await request('/api/equipments/count', { method: 'GET' });
  return typeof result === 'number' ? result : (result?.count || result?.Count || 0);
}

/**
 * Get available equipment count
 * GET /api/equipments/available-count
 * @returns {Promise<number>} Number of available equipments
 */
export async function getAvailableEquipmentCount() {
  const result = await request('/api/equipments/available-count', { method: 'GET' });
  return typeof result === 'number' ? result : (result?.count || result?.Count || 0);
}

// ============================================================================
// ROOMS API
// ============================================================================

/**
 * Get all rooms with optional filters
 * GET /api/rooms
 * @param {Object} filters - Filter parameters
 * @param {string} filters.name - Room name filter
 * @param {string} filters.location - Location filter
 * @param {string|number} filters.status - Status filter (string: "Available", "Occupied", "Maintenance", "Unavailable" or number: 0-3)
 * @param {number} filters.minCapacity - Minimum capacity
 * @param {number} filters.maxCapacity - Maximum capacity
 * @param {number} filters.page - Page number (1-based)
 * @param {number} filters.pageSize - Items per page
 * @returns {Promise<Array>} List of rooms
 */
export async function getRooms(filters = {}) {
  const params = new URLSearchParams();

  // Map status string to enum number if needed
  const statusMap = {
    'Available': 0,
    'Occupied': 1,
    'Maintenance': 2,
    'Unavailable': 3
  };

  // Add filter parameters if provided
  if (filters.name) params.append('Name', filters.name);
  if (filters.location) params.append('Location', filters.location);
  if (filters.status !== undefined && filters.status !== '') {
    // Convert string status to number if it's a string
    const statusValue = typeof filters.status === 'string'
      ? statusMap[filters.status]
      : filters.status;
    if (statusValue !== undefined) {
      params.append('Status', String(statusValue));
    }
  }
  if (filters.minCapacity !== undefined) params.append('MinCapacity', String(filters.minCapacity));
  if (filters.maxCapacity !== undefined) params.append('MaxCapacity', String(filters.maxCapacity));
  // Backend expects 0-based page index, but we use 1-based in frontend
  if (filters.page) params.append('Page', String(filters.page - 1));
  if (filters.pageSize) params.append('PageSize', String(filters.pageSize));

  const queryString = params.toString();
  const url = queryString ? `/api/rooms?${queryString}` : '/api/rooms';

  return await request(url, { method: 'GET' });
}

/**
 * Get room by ID
 * GET /api/rooms/{id}
 * @param {string} id - Room UUID
 * @returns {Promise<Object>} Room details
 */
export async function getRoomById(id) {
  return await request(`/api/rooms/${id}`, { method: 'GET' });
}

/**
 * Get available rooms
 * GET /api/rooms/available
 * @returns {Promise<Array>} List of available rooms
 */
export async function getAvailableRooms() {
  return await request('/api/rooms/available', { method: 'GET' });
}

/**
 * Get room count
 * GET /api/rooms/count
 * @returns {Promise<number>} Total room count
 */
export async function getRoomCount() {
  const result = await request('/api/rooms/count', { method: 'GET' });
  return typeof result === 'number' ? result : (result?.count || result?.Count || 0);
}

/**
 * Get available room count
 * GET /api/rooms/available-count
 * @returns {Promise<number>} Available room count
 */
export async function getAvailableRoomCount() {
  const result = await request('/api/rooms/available-count', { method: 'GET' });
  return typeof result === 'number' ? result : (result?.availableCount || result?.AvailableCount || 0);
}

/**
 * Check if a specific room is available
 * GET /api/rooms/{id}/available
 * @param {string} id - Room UUID
 * @param {string|Date} startTime - Start time (ISO string or Date)
 * @param {string|Date} endTime - End time (ISO string or Date)
 * @returns {Promise<boolean>} True if room is available
 */
export async function isRoomAvailable(id, startTime, endTime) {
  const params = new URLSearchParams();
  
  // Convert dates to ISO strings if needed
  const startTimeStr = startTime instanceof Date ? startTime.toISOString() : startTime;
  const endTimeStr = endTime instanceof Date ? endTime.toISOString() : endTime;
  
  params.append('startTime', startTimeStr);
  params.append('endTime', endTimeStr);
  
  const result = await request(`/api/rooms/${id}/available?${params.toString()}`, { method: 'GET' });
  return result?.isAvailable || result?.IsAvailable || false;
}

/**
 * Create a new room (Admin only)
 * POST /api/rooms
 * @param {Object} roomData - Room data
 * @param {string} roomData.name - Room name
 * @param {string} roomData.description - Room description
 * @param {string} roomData.location - Room location
 * @param {number} roomData.capacity - Room capacity
 * @param {string} roomData.imageUrl - Room image URL (optional)
 * @returns {Promise<Object>} Created room data
 */
export async function createRoom(roomData) {
  const payload = {
    Name: roomData.name,
    Description: roomData.description || '',
    Location: roomData.location,
    Capacity: roomData.capacity,
    ImageUrl: roomData.imageUrl || null
  };

  return await request('/api/rooms', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Update room (Admin only)
 * PUT /api/rooms/{id}
 * @param {string} id - Room UUID
 * @param {Object} roomData - Updated room data
 * @param {string} roomData.name - Room name
 * @param {string} roomData.description - Room description
 * @param {string} roomData.location - Room location
 * @param {number} roomData.capacity - Room capacity
 * @param {string} roomData.imageUrl - Room image URL (optional)
 * @returns {Promise<Object>} Updated room data
 */
export async function updateRoom(id, roomData) {
  const payload = {
    Name: roomData.name,
    Description: roomData.description || '',
    Location: roomData.location,
    Capacity: roomData.capacity,
    ImageUrl: roomData.imageUrl || null
  };

  return await request(`/api/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

/**
 * Update room status (Admin only)
 * PATCH /api/rooms/{id}/status
 * @param {string} id - Room UUID
 * @param {string|number} status - New status (string: "Available", "Occupied", "Maintenance", "Unavailable" or number: 0-3)
 * @param {string} notes - Optional notes about status change
 * @returns {Promise<Object>} Updated room data
 */
export async function updateRoomStatus(id, status, notes = '') {
  // Map status string to enum number if needed
  const statusMap = {
    'Available': 0,
    'Occupied': 1,
    'Maintenance': 2,
    'Unavailable': 3
  };

  // Convert string status to number if it's a string
  const statusValue = typeof status === 'string'
    ? statusMap[status]
    : status;

  const payload = {
    Status: statusValue
  };

  return await request(`/api/rooms/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

/**
 * Delete room (Admin only)
 * DELETE /api/rooms/{id}
 * @param {string} id - Room UUID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteRoom(id) {
  return await request(`/api/rooms/${id}`, {
    method: 'DELETE'
  });
}

// ============================================================================
// ROLES MANAGEMENT API
// ============================================================================

/**
 * Get paginated list of roles
 * GET /api/roles
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Number of items per page (default: 8)
 * @returns {Promise<Object>} Paginated roles list
 */
export async function getRoles(page = 1, pageSize = 10) {
  const params = new URLSearchParams({
    Page: String(page),
    PageSize: String(pageSize)
  });
  console.log('API - getRoles called with:', { page, pageSize });
  console.log('API - Request URL:', `/api/roles?${params}`);
  const result = await request(`/api/roles?${params}`);
  console.log('API - getRoles result:', result);
  return result;
}

/**
 * Get all roles without pagination
 * GET /api/roles
 * @returns {Promise<Array>} List of all roles
 */
export async function getAllRoles() {
  // Get a large page size to get all roles
  return await getRoles(1, 1000);
}

/**
 * Get role by ID
 * GET /api/roles/{id}
 * @param {string} id - Role UUID
 * @returns {Promise<Object>} Role details
 */
export async function getRoleById(id) {
  return await request(`/api/roles/${id}`);
}

/**
 * Create a new role
 * POST /api/roles
 * @param {Object} roleData - Role data
 * @param {string} roleData.name - Role name
 * @param {string} roleData.description - Role description
 * @returns {Promise<Object>} Created role data
 */
export async function createRole(roleData) {
  const payload = {
    Name: roleData.name,
    Description: roleData.description
  };
  
  return await request('/api/roles', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Update role
 * PUT /api/roles/{id}
 * @param {string} id - Role UUID
 * @param {Object} roleData - Updated role data
 * @param {string} roleData.name - Role name
 * @param {string} roleData.description - Role description
 * @returns {Promise<Object>} Updated role data
 */
export async function updateRole(id, roleData) {
  const payload = {
    Name: roleData.name,
    Description: roleData.description
  };
  
  return await request(`/api/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

/**
 * Delete role
 * DELETE /api/roles/{id}
 * @param {string} id - Role UUID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteRole(id) {
  return await request(`/api/roles/${id}`, {
    method: 'DELETE'
  });
}

// ============================================================================
// EVENT MANAGEMENT API
// ============================================================================

/**
 * Get all events with optional filters
 * GET /api/events
 * @param {Object} filters - Filter parameters
 * @param {string} filters.title - Event title filter
 * @param {string} filters.location - Location filter
 * @param {number} filters.status - Status filter (0: Active, 1: Inactive, 2: Cancelled, 3: Completed)
 * @param {string} filters.startDateFrom - Start date from (ISO string)
 * @param {string} filters.startDateTo - Start date to (ISO string)
 * @param {boolean} filters.isUpcoming - Filter for upcoming events
 * @param {number} filters.page - Page number (0-based for backend)
 * @param {number} filters.pageSize - Items per page
 * @returns {Promise<Array>} List of events
 */
export async function getEvents(filters = {}) {
  const params = new URLSearchParams();

  if (filters.title) params.append('Title', filters.title);
  if (filters.location) params.append('Location', filters.location);
  if (filters.status !== undefined) params.append('Status', String(filters.status));
  if (filters.startDateFrom) params.append('StartDateFrom', filters.startDateFrom);
  if (filters.startDateTo) params.append('StartDateTo', filters.startDateTo);
  if (filters.isUpcoming !== undefined) params.append('IsUpcoming', String(filters.isUpcoming));
  if (filters.page !== undefined) params.append('Page', String(filters.page));
  if (filters.pageSize) params.append('PageSize', String(filters.pageSize));

  const queryString = params.toString();
  const url = queryString ? `/api/events?${queryString}` : '/api/events';

  return await request(url, { method: 'GET' });
}

/**
 * Get event by ID
 * GET /api/events/{id}
 * @param {string} id - Event UUID
 * @returns {Promise<Object>} Event details
 */
export async function getEventById(id) {
  return await request(`/api/events/${id}`, { method: 'GET' });
}

/**
 * Get upcoming events
 * GET /api/events/upcoming
 * @returns {Promise<Array>} List of upcoming events
 */
export async function getUpcomingEvents() {
  return await request('/api/events/upcoming', { method: 'GET' });
}

/**
 * Get events by date range
 * GET /api/events/date-range
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @returns {Promise<Array>} List of events in the date range
 */
export async function getEventsByDateRange(startDate, endDate) {
  const params = new URLSearchParams({
    startDate: startDate,
    endDate: endDate
  });
  return await request(`/api/events/date-range?${params}`, { method: 'GET' });
}

/**
 * Get total event count
 * GET /api/events/count
 * @returns {Promise<Object>} Object with Count property
 */
export async function getEventCount() {
  return await request('/api/events/count', { method: 'GET' });
}

/**
 * Get active event count
 * GET /api/events/active-count
 * @returns {Promise<Object>} Object with ActiveCount property
 */
export async function getActiveEventCount() {
  return await request('/api/events/active-count', { method: 'GET' });
}

/**
 * Create a new event (Admin only)
 * POST /api/events
 * @param {Object} eventData - Event data
 * @param {string} eventData.title - Event title (required)
 * @param {string} eventData.description - Event description
 * @param {string} eventData.startDate - Start date (ISO string, required)
 * @param {string} eventData.endDate - End date (ISO string, required)
 * @param {string} eventData.location - Event location
 * @param {number} eventData.status - Event status (0: Active, 1: Inactive, 2: Cancelled, 3: Completed)
 * @param {boolean} eventData.visibility - Event visibility (default: true)
 * @param {string} eventData.recurrenceRule - Recurrence rule (optional)
 * @returns {Promise<Object>} Created event data
 */
export async function createEvent(eventData) {
  const payload = {
    Title: eventData.title,
    Description: eventData.description || '',
    StartDate: eventData.startDate,
    EndDate: eventData.endDate,
    Location: eventData.location || '',
    Status: eventData.status !== undefined ? eventData.status : 0, // Default: Active
    Visibility: eventData.visibility !== undefined ? eventData.visibility : true,
    RecurrenceRule: eventData.recurrenceRule || null
  };

  return await request('/api/events', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Update event (Admin only)
 * PUT /api/events/{id}
 * @param {string} id - Event UUID
 * @param {Object} eventData - Updated event data
 * @param {string} eventData.title - Event title
 * @param {string} eventData.description - Event description
 * @param {string} eventData.startDate - Start date (ISO string)
 * @param {string} eventData.endDate - End date (ISO string)
 * @param {string} eventData.location - Event location
 * @param {number} eventData.status - Event status
 * @param {boolean} eventData.visibility - Event visibility
 * @param {string} eventData.recurrenceRule - Recurrence rule
 * @returns {Promise<Object>} Updated event data
 */
export async function updateEvent(id, eventData) {
  const payload = {};

  if (eventData.title !== undefined) payload.Title = eventData.title;
  if (eventData.description !== undefined) payload.Description = eventData.description;
  if (eventData.startDate !== undefined) payload.StartDate = eventData.startDate;
  if (eventData.endDate !== undefined) payload.EndDate = eventData.endDate;
  if (eventData.location !== undefined) payload.Location = eventData.location;
  if (eventData.status !== undefined) payload.Status = eventData.status;
  if (eventData.visibility !== undefined) payload.Visibility = eventData.visibility;
  if (eventData.recurrenceRule !== undefined) payload.RecurrenceRule = eventData.recurrenceRule;

  return await request(`/api/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

/**
 * Delete event (Admin only)
 * DELETE /api/events/{id}
 * @param {string} id - Event UUID
 * @param {boolean} confirmDeletion - Confirmation flag (default: true)
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteEvent(id, confirmDeletion = true) {
  // Backend requires a non-empty request body for DELETE
  const url = `/api/events/${id}`;

  // Send confirmDeletion in body instead of query parameter
  const body = {
    confirmDeletion: confirmDeletion
  };

  console.log('Deleting event:', { id, url, body });

  return await request(url, {
    method: 'DELETE',
    body: JSON.stringify(body)
  });
}

// ============================================================================
// NOTIFICATION MANAGEMENT API
// ============================================================================

/**
 * Get all notifications (Admin only)
 * GET /api/notifications/admin/all
 * @param {Object} filters - Filter parameters
 * @param {string} filters.targetGroup - Target group filter (All, Lecturer, Student)
 * @param {string} filters.status - Status filter (Active, Expired, Scheduled)
 * @param {string} filters.startDate - Start date filter
 * @param {string} filters.endDate - End date filter
 * @param {number} filters.page - Page number (1-based in frontend, converted to 0-based for backend)
 * @param {number} filters.pageSize - Items per page
 * @returns {Promise<Array>} List of notifications
 */
export async function getAllNotifications(filters = {}) {
  const params = new URLSearchParams();

  if (filters.targetGroup) params.append('TargetGroup', filters.targetGroup);
  if (filters.status) params.append('Status', filters.status);
  if (filters.startDate) params.append('StartDate', filters.startDate);
  if (filters.endDate) params.append('EndDate', filters.endDate);
  // Backend expects 0-based page index, but frontend uses 1-based
  if (filters.page) params.append('Page', String(filters.page - 1));
  if (filters.pageSize) params.append('PageSize', String(filters.pageSize));

  const queryString = params.toString();
  const url = queryString ? `/api/notifications/admin/all?${queryString}` : '/api/notifications/admin/all';

  return await request(url, { method: 'GET' });
}

/**
 * Get notification by ID (Admin only)
 * GET /api/notifications/admin/{id}
 * @param {string} id - Notification UUID
 * @returns {Promise<Object>} Notification details
 */
export async function getNotificationById(id) {
  return await request(`/api/notifications/admin/${id}`, { method: 'GET' });
}

/**
 * Create notification (Admin only)
 * POST /api/notifications/admin
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.content - Notification content
 * @param {string} notificationData.targetGroup - Target group (All, Lecturer, Student)
 * @param {string} notificationData.startDate - Start date (ISO format)
 * @param {string} notificationData.endDate - End date (ISO format)
 * @returns {Promise<Object>} Created notification
 */
export async function createNotification(notificationData) {
  const payload = {
    Title: notificationData.title,
    Content: notificationData.content,
    TargetGroup: notificationData.targetGroup,
    StartDate: notificationData.startDate,
    EndDate: notificationData.endDate
  };

  return await request('/api/notifications/admin', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Update notification (Admin only)
 * PUT /api/notifications/admin/{id}
 * @param {string} id - Notification UUID
 * @param {Object} notificationData - Notification data to update
 * @returns {Promise<Object>} Updated notification
 */
export async function updateNotification(id, notificationData) {
  const payload = {};

  if (notificationData.title !== undefined) payload.Title = notificationData.title;
  if (notificationData.content !== undefined) payload.Content = notificationData.content;
  if (notificationData.targetGroup !== undefined) payload.TargetGroup = notificationData.targetGroup;
  if (notificationData.startDate !== undefined) payload.StartDate = notificationData.startDate;
  if (notificationData.endDate !== undefined) payload.EndDate = notificationData.endDate;

  return await request(`/api/notifications/admin/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

/**
 * Delete notification (Admin only)
 * DELETE /api/notifications/admin/{id}
 * @param {string} id - Notification UUID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteNotification(id) {
  return await request(`/api/notifications/admin/${id}`, {
    method: 'DELETE'
  });
}

/**
 * Get user notifications
 * GET /api/notifications/user
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Array>} List of user notifications
 */
export async function getUserNotifications(filters = {}) {
  const params = new URLSearchParams();

  if (filters.targetGroup) params.append('TargetGroup', filters.targetGroup);
  if (filters.status) params.append('Status', filters.status);
  if (filters.startDate) params.append('StartDate', filters.startDate);
  if (filters.endDate) params.append('EndDate', filters.endDate);
  if (filters.page) params.append('Page', String(filters.page));
  if (filters.pageSize) params.append('PageSize', String(filters.pageSize));

  const queryString = params.toString();
  const url = queryString ? `/api/notifications/user?${queryString}` : '/api/notifications/user';

  return await request(url, { method: 'GET' });
}

/**
 * Mark notification as read
 * POST /api/notifications/mark-read
 * @param {string} notificationId - Notification UUID
 * @returns {Promise<Object>} Result
 */
export async function markNotificationAsRead(notificationId) {
  const payload = {
    NotificationId: notificationId
  };

  return await request('/api/notifications/mark-read', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Mark all notifications as read
 * POST /api/notifications/mark-all-read
 * @returns {Promise<Object>} Result
 */
export async function markAllNotificationsAsRead() {
  return await request('/api/notifications/mark-all-read', {
    method: 'POST'
  });
}

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 * @returns {Promise<number>} Unread count
 */
export async function getUnreadNotificationCount() {
  const result = await request('/api/notifications/unread-count', { method: 'GET' });
  return result?.unreadCount || result?.UnreadCount || 0;
}

/**
 * Update notification status (Admin only - scheduled task)
 * POST /api/notifications/update-status
 * @returns {Promise<Object>} Result
 */
export async function updateNotificationStatus() {
  return await request('/api/notifications/update-status', {
    method: 'POST'
  });
}

// ============================================================================
// EXPORT ORGANIZED API FUNCTIONS
// ============================================================================

// Authentication API
export const authApi = {
  login,
  register,
  refresh: refreshAuthToken,
  me: getMe,
  logout,
  // Google OAuth
  getGoogleLoginUrl,
  loginWithGoogleToken,
  handleGoogleCallback
};

// User Management API
export const userApi = {
  getUsers,
  getAllUsersUnpaged,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus
};

// ============================================================================
// Lab Management API
// ============================================================================

/**
 * Get all labs with optional filters
 * GET /api/labs
 * @param {Object} filters - Filter parameters
 * @param {string} filters.name - Lab name filter
 * @param {string} filters.location - Location filter
 * @param {string|number} filters.status - Status filter (0: Active, 1: Inactive)
 * @param {number} filters.minCapacity - Minimum capacity
 * @param {number} filters.maxCapacity - Maximum capacity
 * @param {number} filters.page - Page number (1-based)
 * @param {number} filters.pageSize - Items per page
 * @returns {Promise<Array>} List of labs
 */
export async function getLabs(filters = {}) {
  const params = new URLSearchParams();

  // Add filter parameters if provided
  if (filters.name) params.append('Name', filters.name);
  if (filters.location) params.append('Location', filters.location);
  if (filters.status !== undefined) params.append('Status', String(filters.status));
  if (filters.minCapacity !== undefined) params.append('MinCapacity', String(filters.minCapacity));
  if (filters.maxCapacity !== undefined) params.append('MaxCapacity', String(filters.maxCapacity));
  // Backend expects 0-based page index, but we use 1-based in frontend
  if (filters.page) params.append('Page', String(filters.page - 1));
  if (filters.pageSize) params.append('PageSize', String(filters.pageSize));

  const queryString = params.toString();
  const url = queryString ? `/api/labs?${queryString}` : '/api/labs';

  return await request(url, { method: 'GET' });
}

/**
 * Get lab by ID
 * GET /api/labs/{id}
 * @param {string} id - Lab UUID
 * @returns {Promise<Object>} Lab details
 */
export async function getLabById(id) {
  return await request(`/api/labs/${id}`, { method: 'GET' });
}

/**
 * Get available labs
 * GET /api/labs/available
 * @returns {Promise<Array>} List of available labs
 */
export async function getAvailableLabs() {
  return await request('/api/labs/available', { method: 'GET' });
}

/**
 * Check if lab is available
 * GET /api/labs/{id}/available
 * @param {string} id - Lab UUID
 * @returns {Promise<Object>} Object with isAvailable boolean
 */
export async function isLabAvailable(id) {
  const result = await request(`/api/labs/${id}/available`, { method: 'GET' });
  return result?.isAvailable || result?.IsAvailable || false;
}

/**
 * Get lab count
 * GET /api/labs/count
 * @returns {Promise<number>} Total lab count
 */
export async function getLabCount() {
  const result = await request('/api/labs/count', { method: 'GET' });
  return typeof result === 'number' ? result : (result?.count || result?.Count || 0);
}

/**
 * Get active lab count
 * GET /api/labs/active-count
 * @returns {Promise<number>} Active lab count
 */
export async function getActiveLabCount() {
  const result = await request('/api/labs/active-count', { method: 'GET' });
  return typeof result === 'number' ? result : (result?.activeCount || result?.ActiveCount || 0);
}

/**
 * Create a new lab (Admin only)
 * POST /api/labs
 * @param {Object} labData - Lab data
 * @param {string} labData.name - Lab name
 * @param {string} labData.description - Lab description (optional)
 * @param {string} labData.location - Lab location (optional)
 * @param {number} labData.capacity - Lab capacity
 * @param {string} labData.roomId - Room ID (optional)
 * @param {number} labData.status - Status (0: Active, 1: Inactive)
 * @returns {Promise<Object>} Created lab data
 */
export async function createLab(labData) {
  const payload = {
    Name: labData.name,
    Description: labData.description || '',
    Location: labData.location || '',
    Capacity: labData.capacity,
    RoomId: labData.roomId || null,
    Status: labData.status !== undefined ? labData.status : 0
  };

  return await request('/api/labs', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Update lab (Admin only)
 * PUT /api/labs/{id}
 * @param {string} id - Lab UUID
 * @param {Object} labData - Lab data to update
 * @returns {Promise<Object>} Updated lab data
 */
export async function updateLab(id, labData) {
  const payload = {
    Name: labData.name,
    Description: labData.description || '',
    Location: labData.location || '',
    Capacity: labData.capacity,
    RoomId: labData.roomId || null,
    Status: labData.status
  };

  return await request(`/api/labs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

/**
 * Update lab status (Admin only)
 * PATCH /api/labs/{id}/status
 * @param {string} id - Lab UUID
 * @param {number} status - New status (0: Active, 1: Inactive)
 * @returns {Promise<Object>} Updated lab data
 */
export async function updateLabStatus(id, status) {
  const payload = {
    Status: status
  };

  return await request(`/api/labs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

/**
 * Delete lab (Admin only)
 * DELETE /api/labs/{id}
 * @param {string} id - Lab UUID
 * @param {boolean} confirmDeletion - Confirmation flag
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteLab(id, confirmDeletion = true) {
  const payload = {
    ConfirmDeletion: confirmDeletion
  };

  return await request(`/api/labs/${id}`, {
    method: 'DELETE',
    body: JSON.stringify(payload)
  });
}

// ============================================================================
// LAB MEMBERS MANAGEMENT API
// ============================================================================

/**
 * Get lab members by lab ID
 * GET /api/labs/{labId}/members
 * @param {string} labId - Lab UUID
 * @returns {Promise<Array>} List of members in the lab
 */
export async function getLabMembers(labId) {
  return await request(`/api/labs/${labId}/members`, { method: 'GET' });
}

/**
 * Add member to lab
 * POST /api/labs/{labId}/members
 * @param {string} labId - Lab UUID
 * @param {string} userId - User UUID to add as member
 * @returns {Promise<Object>} Created lab member relationship
 */
export async function addLabMember(labId, userId) {
  const payload = {
    UserId: userId
  };

  return await request(`/api/labs/${labId}/members`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Update lab member role/status
 * PATCH /api/labs/{labId}/members/{id}
 * @param {string} labId - Lab UUID
 * @param {string} memberId - Member relationship UUID (not user ID)
 * @param {Object} memberData - Member data to update
 * @returns {Promise<Object>} Updated lab member
 */
export async function updateLabMember(labId, memberId, memberData) {
  const payload = {};

  if (memberData.role !== undefined) payload.Role = memberData.role;
  if (memberData.status !== undefined) payload.Status = memberData.status;

  return await request(`/api/labs/${labId}/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

/**
 * Remove member from lab
 * DELETE /api/labs/{labId}/members/{id}
 * @param {string} labId - Lab UUID
 * @param {string} memberId - Member relationship UUID (not user ID)
 * @returns {Promise<Object>} Deletion result
 */
export async function removeLabMember(labId, memberId) {
  return await request(`/api/labs/${labId}/members/${memberId}`, {
    method: 'DELETE'
  });
}

// Lab Members API
export const labMembersApi = {
  getLabMembers,
  addLabMember,
  updateLabMember,
  removeLabMember
};

// Lab Management API
export const labsApi = {
  getLabs,
  getLabById,
  getAvailableLabs,
  isLabAvailable,
  getLabCount,
  getActiveLabCount,
  createLab,
  updateLab,
  updateLabStatus,
  deleteLab,
  // Include lab members methods for convenience
  members: labMembersApi
};

// Equipment Management API
export const equipmentApi = {
  getEquipments,
  createEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  updateEquipmentStatus,
  getEquipmentsByRoom,
  getAvailableEquipments,
  getMaintenanceNeededEquipments,
  getEquipmentCount,
  getAvailableEquipmentCount
};

// Rooms Management API
export const roomsApi = {
  getRooms,
  getRoomById,
  getAvailableRooms,
  getRoomCount,
  getAvailableRoomCount,
  isRoomAvailable,
  createRoom,
  updateRoom,
  updateRoomStatus,
  deleteRoom
};

// Roles Management API
export const rolesApi = {
  getRoles,
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
};

// Event Management API
export const eventApi = {
  getEvents,
  getEventById,
  getUpcomingEvents,
  getEventsByDateRange,
  getEventCount,
  getActiveEventCount,
  createEvent,
  updateEvent,
  deleteEvent
};

// Notification Management API
export const notificationApi = {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  updateNotificationStatus
};

// ============================================================================
// REPORTS MANAGEMENT API
// ============================================================================

/**
 * Get all reports (Admin only)
 * GET /api/reports/admin/all
 * @param {Object} filter - Filter options
 * @returns {Promise<Array>} List of all reports
 */
export async function getAllReports(filter = {}) {
  const params = new URLSearchParams();

  if (filter.title) params.append('Title', filter.title);
  if (filter.type) params.append('Type', filter.type);
  if (filter.status) params.append('Status', filter.status);
  if (filter.startDate) params.append('StartDate', filter.startDate);
  if (filter.endDate) params.append('EndDate', filter.endDate);
  if (filter.page !== undefined) params.append('Page', filter.page);
  if (filter.pageSize !== undefined) params.append('PageSize', filter.pageSize);

  const queryString = params.toString();
  const url = queryString ? `/api/reports/admin/all?${queryString}` : '/api/reports/admin/all';

  return await request(url, { method: 'GET' });
}

/**
 * Get report by ID (Admin only)
 * GET /api/reports/admin/{id}
 * @param {string} id - Report UUID
 * @returns {Promise<Object>} Report details
 */
export async function getReportByIdAdmin(id) {
  return await request(`/api/reports/admin/${id}`, { method: 'GET' });
}

/**
 * Update report status (Admin only)
 * PUT /api/reports/admin/{id}/status
 * @param {string} id - Report UUID
 * @param {string} status - New status (Open, InProgress, Resolved, Closed)
 * @param {string} adminResponse - Admin response message
 * @returns {Promise<Object>} Updated report
 */
export async function updateReportStatus(id, status, adminResponse = '') {
  // Map status string to enum number
  const statusMap = {
    'Open': 0,
    'InProgress': 1,
    'Resolved': 2,
    'Closed': 3
  };

  // Convert string status to number if it's a string
  const statusValue = typeof status === 'string' 
    ? statusMap[status] 
    : status;

  const payload = {
    Status: statusValue,
    AdminResponse: adminResponse
  };

  return await request(`/api/reports/admin/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

/**
 * Get pending reports count (Admin only)
 * GET /api/reports/admin/pending-count
 * @returns {Promise<number>} Count of pending reports
 */
export async function getPendingReportsCount() {
  const result = await request('/api/reports/admin/pending-count', { method: 'GET' });
  return typeof result === 'number' ? result : (result?.pendingCount || result?.PendingCount || 0);
}

/**
 * Get user's reports
 * GET /api/reports/user
 * @param {Object} filter - Filter options
 * @returns {Promise<Array>} List of user's reports
 */
export async function getUserReports(filter = {}) {
  const params = new URLSearchParams();

  if (filter.title) params.append('Title', filter.title);
  if (filter.type) params.append('Type', filter.type);
  if (filter.status) params.append('Status', filter.status);
  if (filter.startDate) params.append('StartDate', filter.startDate);
  if (filter.endDate) params.append('EndDate', filter.endDate);
  if (filter.page !== undefined) params.append('Page', filter.page);
  if (filter.pageSize !== undefined) params.append('PageSize', filter.pageSize);

  const queryString = params.toString();
  const url = queryString ? `/api/reports/user?${queryString}` : '/api/reports/user';

  return await request(url, { method: 'GET' });
}

/**
 * Get user's report by ID
 * GET /api/reports/user/{id}
 * @param {string} id - Report UUID
 * @returns {Promise<Object>} Report details
 */
export async function getUserReportById(id) {
  return await request(`/api/reports/user/${id}`, { method: 'GET' });
}

/**
 * Create new report
 * POST /api/reports/user
 * @param {Object} reportData - Report data
 * @returns {Promise<Object>} Created report
 */
export async function createReport(reportData) {
  // Convert string type to enum integer
  const typeMapping = {
    'Lab': 0,
    'Equipment': 1
  };
  
  const payload = {
    Title: reportData.title,
    Description: reportData.description,
    Type: typeMapping[reportData.type] ?? 0, // Default to Lab if unknown
    ImageUrl: reportData.imageUrl || null
  };

  return await request('/api/reports/user', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Update user's report
 * PUT /api/reports/user/{id}
 * @param {string} id - Report UUID
 * @param {Object} reportData - Updated report data
 * @returns {Promise<Object>} Updated report
 */
export async function updateReport(id, reportData) {
  // Convert string type to enum integer
  const typeMapping = {
    'Lab': 0,
    'Equipment': 1
  };
  
  const payload = {
    Title: reportData.title,
    Description: reportData.description,
    Type: reportData.type ? typeMapping[reportData.type] : undefined,
    ImageUrl: reportData.imageUrl || null
  };

  return await request(`/api/reports/user/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

/**
 * Delete user's report
 * DELETE /api/reports/user/{id}
 * @param {string} id - Report UUID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteReport(id) {
  return await request(`/api/reports/user/${id}`, { method: 'DELETE' });
}

/**
 * Get user's reports count
 * GET /api/reports/user/count
 * @returns {Promise<number>} Count of user's reports
 */
export async function getUserReportsCount() {
  const result = await request('/api/reports/user/count', { method: 'GET' });
  return typeof result === 'number' ? result : (result?.count || result?.Count || 0);
}

// Reports Management API
export const reportsApi = {
  // Admin functions
  getAllReports,
  getReportByIdAdmin,
  updateReportStatus,
  getPendingReportsCount,
  // User functions
  getUserReports,
  getUserReportById,
  createReport,
  updateReport,
  deleteReport,
  getUserReportsCount
};

// ============================================================================
// BOOKING MANAGEMENT API
// ============================================================================

/**
 * Get all bookings with optional filters
 * GET /api/bookings
 * @param {Object} filters - Filter parameters
 * @param {string} filters.roomId - Room ID filter (UUID)
 * @param {string} filters.userId - User ID filter (UUID)
 * @param {number} filters.status - Status filter (0: Pending, 1: Approved, 2: Rejected, 3: Cancelled)
 * @param {string} filters.from - Start date filter (ISO string)
 * @param {string} filters.to - End date filter (ISO string)
 * @param {number} filters.page - Page number (1-based in frontend, converted to 0-based for backend)
 * @param {number} filters.pageSize - Items per page
 * @returns {Promise<Array>} List of bookings
 */
export async function getBookings(filters = {}) {
  const params = new URLSearchParams();

  if (filters.roomId) params.append('RoomId', filters.roomId);
  if (filters.userId) params.append('UserId', filters.userId);
  if (filters.status !== undefined) params.append('Status', String(filters.status));
  if (filters.from) params.append('From', filters.from);
  if (filters.to) params.append('To', filters.to);
  // Backend expects 0-based page index, but frontend uses 1-based
  if (filters.page !== undefined) params.append('Page', String(filters.page - 1));
  if (filters.pageSize) params.append('PageSize', String(filters.pageSize));

  const queryString = params.toString();
  const url = queryString ? `/api/Bookings?${queryString}` : '/api/Bookings';

  console.log('[Booking API] Request URL:', url);
  console.log('[Booking API] Filters:', filters);

  return await request(url, { method: 'GET' });
}

/**
 * Get booking by ID
 * GET /api/bookings/{id}
 * @param {string} id - Booking UUID
 * @returns {Promise<Object>} Booking details
 */
export async function getBookingById(id) {
  return await request(`/api/Bookings/${id}`, { method: 'GET' });
}

/**
 * Create a new booking
 * POST /api/bookings
 * @param {Object} bookingData - Booking data
 * @param {string} bookingData.roomId - Room ID (UUID)
 * @param {string} bookingData.startTime - Start time (ISO string)
 * @param {string} bookingData.endTime - End time (ISO string)
 * @param {string} bookingData.purpose - Booking purpose
 * @param {string} [bookingData.eventId] - Optional event ID (UUID)
 * @param {string} [bookingData.notes] - Optional notes
 * @returns {Promise<Object>} Created booking data
 */
export async function createBooking(bookingData) {
  const payload = {
    RoomId: bookingData.roomId,
    StartTime: bookingData.startTime,
    EndTime: bookingData.endTime,
    Purpose: bookingData.purpose,
    EventId: bookingData.eventId || null,
    Notes: bookingData.notes || null
  };

  console.log('CreateBooking - API_BASE:', API_BASE);
  console.log('CreateBooking - Full URL:', `${API_BASE}/api/Bookings`);
  console.log('CreateBooking - Payload:', payload);

  return await request('/api/Bookings', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Update booking status
 * PATCH /api/bookings/{id}/status
 * @param {string} id - Booking UUID
 * @param {number} status - New status (0: Pending, 1: Approved, 2: Rejected, 3: Cancelled, 4: Completed)
 * @param {string} notes - Optional notes about status change
 * @returns {Promise<Object>} Updated booking data
 */
export async function updateBookingStatus(id, status, notes = '') {
  const payload = {
    Status: status
  };

  // Only add Notes if it's not empty
  if (notes && notes.trim()) {
    payload.Notes = notes;
  }

  console.log('updateBookingStatus - Sending payload:', payload);

  return await request(`/api/Bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

/**
 * Delete booking
 * DELETE /api/bookings/{id}
 * @param {string} id - Booking UUID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteBooking(id) {
  return await request(`/api/Bookings/${id}`, { method: 'DELETE' });
}

// Booking Management API
export const bookingApi = {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  deleteBooking
};

// Default export with all APIs
const api = {
  auth: authApi,
  user: userApi,
  labs: labsApi,
  labMembers: labMembersApi,
  equipment: equipmentApi,
  rooms: roomsApi,
  roles: rolesApi,
  events: eventApi,
  notifications: notificationApi,
  reports: reportsApi,
  bookings: bookingApi,
  request
};

export default api;
