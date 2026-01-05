const HOST = 'https://iot-smarthome-pyvi.onrender.com';

const API_BASE = `${HOST}`;

async function apiFetch(path, options = {}) {
  const url = API_BASE + path;
  const token = localStorage.getItem('token');
  const headers = Object.assign({}, options.headers || {});

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, Object.assign({}, options, { headers }));
  return res;
}

export { HOST, API_BASE, apiFetch };
