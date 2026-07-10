/**
 * Couture AI Atelier - Security Utility Module
 * Implements input sanitization and CSRF token coordination.
 */

// 1. Input Sanitization
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Strip HTML tags using regex to prevent basic XSS
  let sanitized = input.replace(/<\/?[^>]+(>|$)/g, '');
  
  // Escape potential malicious characters/scripts
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Remove common SQL injection indicators
  sanitized = sanitized.replace(/SELECT\s+.*\s+FROM/gi, '');
  sanitized = sanitized.replace(/UNION\s+ALL\s+SELECT/gi, '');
  sanitized = sanitized.replace(/--/g, '');

  return sanitized.trim();
}

// 2. CSRF Security Coordination
let cachedCsrfToken: string | null = null;

/**
 * Fetches a secure CSRF token from the backend and initializes it.
 */
export async function initCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;

  try {
    const response = await fetch('/api/csrf-token', { method: 'GET' });
    if (!response.ok) {
      throw new Error('Failed to retrieve security token.');
    }
    const data = await response.json();
    cachedCsrfToken = data.token;
    
    // Also save in sessionStorage for session survivability
    if (cachedCsrfToken) {
      sessionStorage.setItem('atelier_csrf_token', cachedCsrfToken);
    }
    return cachedCsrfToken || '';
  } catch (error) {
    console.error('CSRF Initialization Error:', error);
    // Fallback to session storage if api fails (e.g. offline/mock environment)
    const fallback = sessionStorage.getItem('atelier_csrf_token');
    if (fallback) {
      cachedCsrfToken = fallback;
      return fallback;
    }
    
    // Generate an in-memory fallback token if completely failed
    const randomToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    cachedCsrfToken = randomToken;
    sessionStorage.setItem('atelier_csrf_token', randomToken);
    return randomToken;
  }
}

/**
 * Retrieves the active CSRF token.
 */
export function getCsrfToken(): string {
  if (!cachedCsrfToken) {
    cachedCsrfToken = sessionStorage.getItem('atelier_csrf_token');
  }
  return cachedCsrfToken || '';
}

/**
 * Custom fetch wrapper that automatically injects CSRF headers and
 * sanitizes POST/PUT request bodies if they contain string payloads.
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Ensure token is initialized
  let token = getCsrfToken();
  if (!token) {
    token = await initCsrfToken();
  }

  // Set up headers
  const headers = new Headers(options.headers || {});
  headers.set('X-CSRF-Token', token);
  
  // Clone options and update headers
  const secureOptions: RequestInit = {
    ...options,
    headers
  };

  // Intercept and sanitize any JSON body
  if (secureOptions.body && typeof secureOptions.body === 'string') {
    try {
      const bodyData = JSON.parse(secureOptions.body);
      // Recursively sanitize all string fields in the body
      const sanitizeObj = (obj: any): any => {
        if (typeof obj === 'string') {
          return sanitizeInput(obj);
        } else if (Array.isArray(obj)) {
          return obj.map(item => sanitizeObj(item));
        } else if (obj !== null && typeof obj === 'object') {
          const sanitizedObj: any = {};
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              sanitizedObj[key] = sanitizeObj(obj[key]);
            }
          }
          return sanitizedObj;
        }
        return obj;
      };

      const sanitizedBody = sanitizeObj(bodyData);
      secureOptions.body = JSON.stringify(sanitizedBody);
    } catch (e) {
      // If it's not JSON, leave it as is or sanitize as raw string
    }
  }

  return fetch(url, secureOptions);
}
