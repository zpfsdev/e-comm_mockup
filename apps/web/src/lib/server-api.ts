/**
 * Server-side API client for React Server Components.
 *
 * Auth mechanism:
 *   The NestJS API sets the access token in an HttpOnly `at` cookie
 *   (max-age 900 s, SameSite=Strict, Secure) on every successful
 *   login / register / token refresh.  Server components read that cookie via
 *   next/headers and forward it as a Bearer token to the NestJS API.
 *
 *   Client components use the in-memory tokenStore (see token-store.ts) which
 *   is populated by the silent /auth/refresh call in AuthProvider on mount.
 *
 *   If the `at` cookie has expired before the page loads the RSC will receive
 *   a 401 and redirect to /auth/sign-in.
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_BASE_URL } from './constants';

interface FetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
}

/**
 * Fetches a resource from the NestJS API using the access token stored in the
 * `at` cookie.  Redirects to `/auth/sign-in` when no token is present.
 * Throws on non-2xx responses other than 401 (which also redirects).
 */
export async function serverFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('at')?.value;

  if (!accessToken) {
    redirect('/auth/sign-in');
  }

  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
    cache: 'no-store',
  });

  if (response.status === 401) {
    redirect('/auth/sign-in');
  }

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${path}`);
  }

  return response.json() as Promise<T>;
}
