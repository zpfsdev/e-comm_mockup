/**
 * In-memory access token store.
 *
 * The access token is intentionally kept in module-level memory only — never in
 * localStorage or any other persistent browser storage. Persistent storage makes
 * the token readable by any same-origin XSS payload. The token is restored on
 * each page load by silently calling the /auth/refresh endpoint, which authenticates
 * via the HttpOnly refresh-token cookie + CSRF token from sessionStorage.
 */
let _accessToken: string | null = null;

export const tokenStore = {
  get: (): string | null => _accessToken,
  set: (token: string): void => {
    _accessToken = token;
  },
  clear: (): void => {
    _accessToken = null;
  },
};
