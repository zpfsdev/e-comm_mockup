 'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient, CSRF_TOKEN_KEY } from '@/lib/api-client';
import styles from '../auth.module.css';

interface SignInPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  csrfToken?: string;
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function SignInClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation<AuthResponse, AxiosError<{ message?: string }>, SignInPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      if (data.csrfToken) {
        sessionStorage.setItem(CSRF_TOKEN_KEY, data.csrfToken);
      }
      document.cookie = 'session=1; path=/; SameSite=Lax; max-age=86400';
      document.cookie = `at=${data.accessToken}; path=/; SameSite=Strict; max-age=900; Secure`;
      const rawFrom = searchParams.get('from') ?? '/';
      const from = rawFrom.startsWith('/') && !rawFrom.startsWith('//') ? rawFrom : '/';
      router.push(from);
    },
    onError: (err) => {
      setError(err.response?.data?.message ?? 'Invalid email or password.');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    mutation.mutate({ email, password });
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.formColumn}>
          <div className={styles.logoBlock}>
            <Link href="/" className={styles.logoLink} aria-label="Artistryx home">
              <Image
                src="/logo.png"
                alt="Artistryx"
                width={240}
                height={195}
                priority
                style={{ height: 'auto' }}
              />
            </Link>
            <h1 className={styles.title}>Welcome Back!</h1>
          </div>

          <p className={styles.tagline}>
            Sign in to explore features and enjoy quicker, smoother purchases
          </p>

          <div className={styles.formBlock}>
            <p className={styles.subtitle}>Sign in to your account</p>

            {error && <p className={styles.errorBanner}>{error}</p>}

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <label htmlFor="sign-in-email" className={styles.srOnly}>
                Email address
              </label>
              <input
                id="sign-in-email"
                type="text"
                placeholder="Email / Phone Number"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <div className={styles.inputWrap}>
                <label htmlFor="sign-in-password" className={styles.srOnly}>
                  Password
                </label>
                <input
                  id="sign-in-password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  placeholder="Password"
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.revealBtn}
                  onClick={() => setIsPasswordVisible((prev) => !prev)}
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                >
                  {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className={styles.links}>
              <p>
                Don&apos;t have an account? <Link href="/auth/sign-up">Sign up</Link>
              </p>
            </div>
          </div>
        </div>

        <div className={styles.decorColumn}>
          <div className={styles.decor} aria-hidden>
            <Image
              src="/sign-in-hero.png"
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 0vw"
              loading="eager"
              className={styles.decorImage}
            />
          </div>
          <p className={styles.goBack}>
            Don&apos;t want to sign in? <Link href="/">Go back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

