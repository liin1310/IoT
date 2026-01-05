import { API_BASE } from './api';

const TOKEN_KEY = 'token';

export async function login({ username, password }) {
  const res = await fetch('https://iot-smarthome-pyvi.onrender.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => 'Login failed');
    throw new Error(msg);
  }

  const data = await res.json(); 

  if (data.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem('username', data.username);
  }
  return data;
}


export async function register({ username, password, email }) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || 'Register failed');
  }

  return await res.json();
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('username');
}
