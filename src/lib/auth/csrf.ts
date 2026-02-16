import { NextRequest } from 'next/server';

// CSRF protection for state-changing requests
export function validateCsrf(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const xForwardedHost = request.headers.get('x-forwarded-host');

  // Determine the expected host (supports reverse proxy)
  const expectedHost = xForwardedHost || host;

  // If no origin header (same-origin GET requests), allow
  if (!origin) return true;

  // Check if origin matches host
  try {
    const originUrl = new URL(origin);
    return originUrl.host === expectedHost;
  } catch {
    return false;
  }
}
