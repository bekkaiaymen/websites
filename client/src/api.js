// If VITE_API_URL is not set, we use '' (empty string) in production,
// which makes requests relative (e.g., /api/orders). 
// In development, Vite proxy handles /api -> localhost:5000.
// This is better than defaulting to localhost:5000 which breaks in production.
const rawBaseUrl = import.meta.env.VITE_API_URL || '';

// Normalize any trailing slashes and accidental API suffixes from env vars.
const normalizedBaseUrl = rawBaseUrl
  .replace(/\/+$/, '')
  .replace(/\/api(?:\/orders)?$/, '');

export function buildApiUrl(path) {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBaseUrl}${safePath}`;
}
