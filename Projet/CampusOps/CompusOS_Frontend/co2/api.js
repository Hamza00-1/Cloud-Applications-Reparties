// API base URL — override by setting window.CAMPUS_API_URL before this script loads.
// Example: <script>window.CAMPUS_API_URL = 'https://api.myschool.ma/api'</script>
const API_URL = window.CAMPUS_API_URL || 'http://localhost:3000/api';

const api = {
  getToken: () => localStorage.getItem('co2_access'),
  
  setTokens: (access, refresh) => {
    localStorage.setItem('co2_access', access);
    localStorage.setItem('co2_refresh', refresh);
  },
  
  clearTokens: () => {
    localStorage.removeItem('co2_access');
    localStorage.removeItem('co2_refresh');
  },

  async refreshAccessToken() {
    const rt = localStorage.getItem('co2_refresh');
    if (!rt) return null;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) { this.clearTokens(); return null; }
      const json = await res.json();
      this.setTokens(json.data.accessToken, json.data.refreshToken);
      return json.data.accessToken;
    } catch {
      this.clearTokens();
      return null;
    }
  },

  async request(path, opts = {}) {
    const { method = 'GET', body, noAuth } = opts;
    const headers = { 'Content-Type': 'application/json' };

    if (!noAuth) {
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    let res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && !noAuth) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${API_URL}${path}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
      } else {
        // If refresh fails, fire a global event so app.jsx can redirect to login
        window.dispatchEvent(new Event('auth_expired'));
        throw new Error('Authentication expired');
      }
    }

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `API error ${res.status}`);
    return json;
  }
};

window.api = api;
