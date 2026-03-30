// JWT token management — login on startup, auto-refresh before expiry
import { login } from './graphql.js';

const CMS_USERNAME = process.env.CMS_ADMIN_USERNAME || 'admin';
const CMS_PASSWORD = process.env.CMS_ADMIN_PASSWORD || '';

let cachedToken = null;
let tokenExpiry = 0; // Unix timestamp in ms

/**
 * Decode JWT payload without verification (we trust our own backend)
 * @param {string} token
 * @returns {object} decoded payload
 */
function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
  return JSON.parse(payload);
}

/**
 * Get a valid JWT token, refreshing if needed
 * Refreshes 5 minutes before actual expiry
 * @returns {Promise<string>} valid JWT token
 */
export async function getToken() {
  const now = Date.now();
  const refreshBuffer = 5 * 60 * 1000; // 5 minutes

  if (cachedToken && tokenExpiry - refreshBuffer > now) {
    return cachedToken;
  }

  console.log('[Auth] Logging in to CMS backend...');

  if (!CMS_PASSWORD) {
    throw new Error('CMS_ADMIN_PASSWORD environment variable is not set');
  }

  const result = await login(CMS_USERNAME, CMS_PASSWORD);
  cachedToken = result.token;

  // Decode token to get expiry
  try {
    const payload = decodeJwtPayload(cachedToken);
    // exp is in seconds, convert to ms
    tokenExpiry = payload.exp * 1000;
    const expiresIn = Math.round((tokenExpiry - now) / 1000 / 60);
    console.log(`[Auth] Login successful. Token expires in ${expiresIn} minutes.`);
  } catch {
    // If decode fails, assume 24h expiry (backend default)
    tokenExpiry = now + 24 * 60 * 60 * 1000;
    console.log('[Auth] Login successful. Could not decode expiry, assuming 24h.');
  }

  return cachedToken;
}

/**
 * Force a fresh login (e.g., after a 401 error)
 * @returns {Promise<string>} new JWT token
 */
export async function refreshToken() {
  cachedToken = null;
  tokenExpiry = 0;
  return getToken();
}
