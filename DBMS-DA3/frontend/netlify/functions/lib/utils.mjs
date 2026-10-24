/**
 * SwiftShip Netlify Functions - Utilities and Response Helpers
 */

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

export function json(data, statusCode = 200, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      ...extraHeaders
    },
    body: JSON.stringify(data)
  };
}

export function noContent(extraHeaders = {}) {
  return {
    statusCode: 204,
    headers: {
      ...CORS_HEADERS,
      ...extraHeaders
    },
    body: ''
  };
}

export function error(message, statusCode = 400, details = null) {
  const payload = {
    error: message,
    status: statusCode,
    timestamp: new Date().toISOString()
  };
  if (details) {
    payload.details = details;
  }
  return json(payload, statusCode);
}

export function parseEvent(event) {
  // Normalize method
  const method = (event.httpMethod || event.method || 'GET').toUpperCase();

  // Normalize path & query parameters
  let path = event.path || '';
  let queryStringParameters = event.queryStringParameters || {};

  // If path contains raw URL or full URL, extract path
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const parsedUrl = new URL(path);
      path = parsedUrl.pathname;
      if (!event.queryStringParameters) {
        queryStringParameters = Object.fromEntries(parsedUrl.searchParams.entries());
      }
    } catch (_) {}
  }

  // Handle Netlify rewrite / query parameter 'route'
  if (queryStringParameters.route) {
    path = queryStringParameters.route;
  }

  // Clean path (strip trailing slashes, ensure starts with '/')
  path = '/' + path.replace(/^\/+|\/+$/g, '');

  // Strip /.netlify/functions/api prefix if called directly
  if (path.startsWith('/.netlify/functions/api')) {
    path = path.slice('/.netlify/functions/api'.length);
    if (!path.startsWith('/')) path = '/' + path;
  }

  // If path was resolved to root or empty, check headers or rawUrl for original path
  if (path === '/' || path === '') {
    const originalUri = event.headers?.['x-forwarded-uri'] || event.headers?.['x-original-uri'] || event.headers?.['x-rewrite-original-uri'];
    if (originalUri) {
      try {
        const u = new URL(originalUri, 'http://localhost');
        if (u.pathname && !u.pathname.startsWith('/.netlify/functions')) {
          path = u.pathname;
        }
      } catch (_) {
        if (originalUri.startsWith('/') && !originalUri.startsWith('/.netlify/functions')) {
          path = originalUri;
        }
      }
    } else if (event.rawUrl) {
      try {
        const u = new URL(event.rawUrl);
        if (u.pathname && !u.pathname.startsWith('/.netlify/functions')) {
          path = u.pathname;
        }
      } catch (_) {}
    }
  }

  path = '/' + path.replace(/^\/+|\/+$/g, '');

  // Parse body
  let body = {};
  if (event.body) {
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (e) {
      body = null; // Mark invalid JSON
    }
  }

  return {
    method,
    path,
    query: queryStringParameters,
    body
  };
}

export function paginate(list, page = 0, size = 10, totalCount = null) {
  const p = Math.max(0, parseInt(page, 10) || 0);
  const s = Math.max(1, parseInt(size, 10) || 10);
  const total = totalCount !== null ? totalCount : list.length;
  const totalPages = Math.ceil(total / s);
  return {
    content: list,
    page: p,
    size: s,
    totalElements: total,
    totalPages,
    first: p === 0,
    last: p >= totalPages - 1
  };
}
