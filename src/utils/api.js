const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// Auth
export const register = (email, password, displayName) =>
  apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) });

export const login = (email, password) =>
  apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

// Registry
export const getRegistryConfig = (slug) =>
  apiFetch(`/r/${slug}`);

export const createRegistry = (data) =>
  apiFetch('/registries', { method: 'POST', body: JSON.stringify(data) });

export const updateRegistrySettings = (slug, data) =>
  apiFetch(`/r/${slug}/settings`, { method: 'PUT', body: JSON.stringify(data) });

export const getMyRegistries = () =>
  apiFetch('/my/registries');

// Gifts
export const getGifts = (slug) =>
  apiFetch(`/r/${slug}/gifts`);

export const reserveGift = (slug, giftId, data) =>
  apiFetch(`/r/${slug}/gifts/${giftId}/reserve`, { method: 'POST', body: JSON.stringify(data) });

export const unreserveGift = (slug, giftId) =>
  apiFetch(`/r/${slug}/gifts/${giftId}/reserve`, { method: 'DELETE' });

// M-Pesa payments
export const initiatePayment = (slug, giftId, data) =>
  apiFetch(`/r/${slug}/gifts/${giftId}/mpesa`, { method: 'POST', body: JSON.stringify(data) });

export const getPaymentStatus = (checkoutId) =>
  apiFetch(`/payments/${checkoutId}/status`);

// Admin gifts
export const getReservations = (slug) =>
  apiFetch(`/r/${slug}/admin/reservations`);

export const addGift = (slug, data) =>
  apiFetch(`/r/${slug}/admin/gifts`, { method: 'POST', body: JSON.stringify(data) });

export const updateGift = (slug, giftId, data) =>
  apiFetch(`/r/${slug}/admin/gifts/${giftId}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteGift = (slug, giftId) =>
  apiFetch(`/r/${slug}/admin/gifts/${giftId}`, { method: 'DELETE' });
