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
    const response = await fetch(buildApiUrl('/api/categories'));
    if (!response.ok) throw new Error('Failed to fetch categories');
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
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
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch products');
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}
