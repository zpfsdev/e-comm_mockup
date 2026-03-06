'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import type { AuthResponse } from '@/types/auth';
import styles from '../auth.module.css';

const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInFields = z.infer<typeof signInSchema>;

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
  const { login } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFields>({
    resolver: zodResolver(signInSchema),
    mode: 'onBlur',
  });

  const mutation = useMutation<AuthResponse, AxiosError<{ message?: string }>, SignInFields>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
      return data;
    },
    onSuccess: (data) => {
      setServerError('');
      login(data);
      const rawFrom = searchParams.get('from') ?? '/';
      const from = rawFrom.startsWith('/') && !rawFrom.startsWith('//') ? rawFrom : '/';
      router.push(from);
    },
    onError: (err) => {
      setServerError(err.response?.data?.message ?? 'Invalid email or password.');
    },
  });

  function onSubmit(fields: SignInFields): void {
    setServerError('');
    mutation.mutate(fields);
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

            {searchParams.get('reason') === 'session_expired' && (
              <p className={styles.sessionExpiredBanner} role="alert" aria-live="polite">
                Your session expired. Please sign in again.
              </p>
            )}
            {serverError && (
              <p className={styles.errorBanner} role="alert">{serverError}</p>
            )}

            <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
              <div>
                <label htmlFor="sign-in-email" className={styles.srOnly}>
                  Email address
                </label>
                <input
                  id="sign-in-email"
                  type="email"
                  inputMode="email"
                  placeholder="Email address"
                  className={styles.input}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'sign-in-email-error' : undefined}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="sign-in-email-error" className={styles.fieldError} role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className={styles.inputWrap}>
                <label htmlFor="sign-in-password" className={styles.srOnly}>
                  Password
                </label>
                <input
                  id="sign-in-password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  placeholder="Password"
                  className={styles.input}
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'sign-in-password-error' : undefined}
                  {...register('password')}
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
              {errors.password && (
                <p id="sign-in-password-error" className={styles.fieldError} role="alert">
                  {errors.password.message}
                </p>
              )}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting || mutation.isPending}
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
