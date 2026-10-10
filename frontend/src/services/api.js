import axios from 'axios';

/**
 * Single API client for the whole app.
 *
 * Base URL is empty by default, so every call is a same-origin relative
 * request to `/api/...`:
 *   - in development, Vite proxies /api to the Express server (vite.config.js)
 *   - in production, the frontend and the API are served from one origin
 * That removes the hardcoded `http://localhost:5001` the app used to carry,
 * which is what made it impossible to deploy. Set VITE_API_URL only if the API
 * ever lives on a different origin.
 *
 * Two shapes are exported on purpose, because the components were written
 * against two different clients:
 *   - default export: an axios instance (responses expose `.data`)
 *   - `api`:          a fetch wrapper (responses expose `.ok` / `.json()`)
 * Both talk to the same base URL, so the two styles can coexist without
 * rewriting every component's response handling.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export default http;

const jsonRequest = (endpoint, method, data) =>
  fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const api = {
  get: (endpoint) => fetch(`${BASE_URL}${endpoint}`),
  post: (endpoint, data) => jsonRequest(endpoint, 'POST', data),
  put: (endpoint, data) => jsonRequest(endpoint, 'PUT', data),
  patch: (endpoint, data) => jsonRequest(endpoint, 'PATCH', data),
  delete: (endpoint) => fetch(`${BASE_URL}${endpoint}`, { method: 'DELETE' }),
};
