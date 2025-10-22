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

// Helper function to get auth headers
function getAuthHeaders() {
  const token = getAuthToken();
  console.log('API - Auth token exists:', !!token);
  console.log('API - Auth token preview:', token ? token.substring(0, 20) + '...' : 'null');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(path, options) {
  let resp;
  try {
    resp = await fetch(`${API_BASE}${path}`, {
      headers: { 
        'Content-Type': 'application/json', 
        ...getAuthHeaders(),
        ...(options?.headers || {}) 
      },
      ...options
    });
  } catch (networkErr) {
    const err = new Error('Unable to connect to server');
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
  return (data && (data.Data ?? data.data)) || data;
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
  if (!refreshToken) return null;
  const data = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  }).then(r => r.json()).catch(() => null);
  if (!data) return null;
  const accessToken = data.AccessToken || data.accessToken;
  const newRefresh = data.RefreshToken || data.refreshToken || refreshToken;
  if (accessToken) setTokens({ accessToken, refreshToken: newRefresh });
  return { accessToken, refreshToken: newRefresh };
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
  
  // Validate state parameter for CSRF protection
  const storedState = sessionStorage.getItem('google_oauth_state');
  if (!state || !storedState || state !== storedState) {
    throw new Error('Invalid state parameter - possible CSRF attack');
  }
  
  // Clear the stored state
  sessionStorage.removeItem('google_oauth_state');
  
  const payload = { code, state };
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

// Default export with all APIs
const api = {
  auth: authApi,
  user: userApi,
  equipment: equipmentApi,
  roles: rolesApi,
  request
};

export default api;
