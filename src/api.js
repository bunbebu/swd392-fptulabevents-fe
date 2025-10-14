// Global API Service
// Centralized API functions for the entire application

// Nếu có REACT_APP_API_BASE_URL thì dùng (gọi trực tiếp với CORS)
// Nếu không có thì dùng '' (dùng proxy trong package.json)
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
    const err = new Error('Không thể kết nối tới máy chủ');
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
    const message = possibleMessages[0] || `Yêu cầu thất bại (${resp.status})`;

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

// ============================================================================
// USER MANAGEMENT API
// ============================================================================

/**
 * Get paginated list of users
 * GET /api/users
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Number of items per page (default: 10)
 * @returns {Promise<Object>} Paginated user list
 */
export async function getUsers(page = 1, pageSize = 5) {
  // Prefer requesting with explicit pagination first (pageSize=5)
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
    fullname: userData.fullname,
    mssv: userData.mssv,
    roles: userData.roles || []
  };
  
  return await request(`/api/users/${id}`, {
    method: 'PUT',
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
// EXPORT ORGANIZED API FUNCTIONS
// ============================================================================

// Authentication API
export const authApi = {
  login,
  register,
  refresh: refreshAuthToken,
  me: getMe,
  logout
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

// Default export with all APIs
export default {
  auth: authApi,
  user: userApi,
  request
};
