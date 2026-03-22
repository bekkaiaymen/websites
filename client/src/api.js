const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Normalize any trailing slashes and accidental API suffixes from env vars.
const normalizedBaseUrl = rawBaseUrl
  .replace(/\/+$/, '')
  .replace(/\/api(?:\/orders)?$/, '');

export function buildApiUrl(path) {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBaseUrl}${safePath}`;
}
