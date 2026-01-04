import { API_BASE } from './api';

export async function login({ username, password }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || 'Login failed');
  }

  const data = await res.json();
  if (data.token) localStorage.setItem('iot_token', data.token);
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
  localStorage.removeItem('iot_token');
}
