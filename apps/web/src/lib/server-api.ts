/**
 * Server-side API client for React Server Components.
 *
 * Auth mechanism:
 *   The browser client writes the access token into a non-HttpOnly `at` cookie
 *   (max-age 900 s, SameSite=Strict) alongside localStorage on every successful
 *   login / register / token refresh.  Server components read that cookie via
 *   next/headers and forward it as a Bearer token to the NestJS API.
 *
 *   Limitations:
 *   - If the `at` cookie has expired before the page loads the RSC will receive
 *     a 401 and should redirect to /auth/sign-in.
 *   - This cookie is not HttpOnly (by design), so it is readable by JS.  The
 *     access token is already in localStorage, so there is no additional
 *     exposure.  The refresh token remains HttpOnly and is never accessible here.
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
