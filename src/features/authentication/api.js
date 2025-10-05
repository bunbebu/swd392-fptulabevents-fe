// Nếu có REACT_APP_API_BASE_URL thì dùng (gọi trực tiếp với CORS)
// Nếu không có thì dùng '' (dùng proxy trong package.json)
const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

async function request(path, options) {
  let resp;
  try {
    resp = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
      ...options
    });
  } catch (networkErr) {
    const err = new Error('Không thể kết nối tới máy chủ');
    err.cause = networkErr;
    err.status = 0;
    throw err;
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

const authApi = { login, register };
export default authApi;