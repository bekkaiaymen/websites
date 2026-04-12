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

// ============ CATEGORIES API ============
export async function getCategories() {
  try {
    const url = buildApiUrl('/api/categories');
    console.log('[DEBUG] Fetching categories from:', url);
    const response = await fetch(url);
    const responseText = await response.text();
    console.log('[DEBUG] Categories response status:', response.status);
    console.log('[DEBUG] Categories response body:', responseText);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${responseText}`);
    return JSON.parse(responseText);
  } catch (error) {
    console.error('[ERROR] Failed to fetch categories:', error.message, error);
    return [];
  }
}

// ============ PRODUCTS API ============
export async function getProducts(categoryId = null) {
  try {
    let url = buildApiUrl('/api/products');
    if (categoryId) {
      url += `?category=${categoryId}`;
    }
    console.log('[DEBUG] Fetching products from:', url);
    const response = await fetch(url);
    const responseText = await response.text();
    console.log('[DEBUG] Products response status:', response.status);
    console.log('[DEBUG] Products response body:', responseText);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${responseText}`);
    return JSON.parse(responseText);
  } catch (error) {
    console.error('[ERROR] Failed to fetch products:', error.message, error);
    return [];
  }
}
