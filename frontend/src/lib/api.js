const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Ошибка запроса')
  }
  return res.json()
}

// AUTH
export const login = async (email, password) => {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  localStorage.setItem('email', data.email)
  return data
}

export const register = (email, password) =>
  request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

// SOURCES
export const getSources = () => request('/api/sources/')

export const uploadSource = (file) => {
  const token = localStorage.getItem('token')
  const form = new FormData()
  form.append('file', file)
  return fetch(`${BASE}/api/sources/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  }).then(r => r.json())
}

export const toggleSource = (id) =>
  request(`/api/sources/${id}/toggle`, { method: 'PATCH' })

export const deleteSource = (id) =>
  request(`/api/sources/${id}`, { method: 'DELETE' })

// CHAT
export const sendMessage = (message, source_ids) =>
  request('/api/chat/', {
    method: 'POST',
    body: JSON.stringify({ message, source_ids }),
  })

// STUDIO
export const generateArtifact = (artifact_type, source_ids) =>
  request('/api/studio/generate', {
    method: 'POST',
    body: JSON.stringify({ artifact_type, source_ids }),
  })