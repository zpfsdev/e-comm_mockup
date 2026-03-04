'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient, CSRF_TOKEN_KEY } from '@/lib/api-client';
import styles from '../auth.module.css';

interface RegisterPayload {
  firstName: string;
  middleName?: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
  contactNumber: string;
}

interface AuthResponse {
  accessToken: string;
  csrfToken?: string;
}

interface FormState {
  firstName: string;
  middleName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirm: string;
  dateOfBirth: string;
  contactNumber: string;
}

const INITIAL_FORM: FormState = {
  firstName: '',
  middleName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirm: '',
  dateOfBirth: '',
  contactNumber: '',
};

export default function SignUpClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState('');

  function updateField(field: keyof FormState, value: string): void {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const mutation = useMutation<AuthResponse, AxiosError<{ message?: string }>, RegisterPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      if (data.csrfToken) {
        sessionStorage.setItem(CSRF_TOKEN_KEY, data.csrfToken);
      }
      document.cookie = 'session=1; path=/; SameSite=Lax; max-age=86400';
      document.cookie = `at=${data.accessToken}; path=/; SameSite=Strict; max-age=900`;
      const from = searchParams.get('from') ?? '/';
      router.push(from);
    },
    onError: (err) => {
      setError(err.response?.data?.message ?? 'Registration failed. Please try again.');
    },
  });

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    mutation.mutate({
      firstName: form.firstName,
      ...(form.middleName ? { middleName: form.middleName } : {}),
      lastName: form.lastName,
      username: form.username,
      email: form.email,
      password: form.password,
      dateOfBirth: form.dateOfBirth,
      contactNumber: form.contactNumber,
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.layoutSignUp}>
        <h1 className={styles.titleSignUp}>CREATE AN ACCOUNT</h1>

        <div className={styles.formColumn}>
          {error && <p className={styles.errorBanner}>{error}</p>}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <label htmlFor="su-firstName" className={styles.srOnly}>
              First Name
            </label>
            <input
              id="su-firstName"
              type="text"
              placeholder="First Name"
              className={styles.input}
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              autoComplete="given-name"
              required
            />
            <label htmlFor="su-lastName" className={styles.srOnly}>
              Last Name
            </label>
            <input
              id="su-lastName"
              type="text"
              placeholder="Last Name"
              className={styles.input}
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              autoComplete="family-name"
              required
            />
            <label htmlFor="su-middleName" className={styles.srOnly}>
              Middle Name (optional)
            </label>
            <input
              id="su-middleName"
              type="text"
              placeholder="Middle Name (optional)"
              className={styles.input}
              value={form.middleName}
              onChange={(e) => updateField('middleName', e.target.value)}
              autoComplete="additional-name"
            />
            <label htmlFor="su-phone" className={styles.srOnly}>
              Phone Number
            </label>
            <input
              id="su-phone"
              type="tel"
              placeholder="Phone Number"
              className={styles.input}
              value={form.contactNumber}
              onChange={(e) => updateField('contactNumber', e.target.value)}
              autoComplete="tel"
              required
            />
            <label htmlFor="su-email" className={styles.srOnly}>
              Email Address
            </label>
            <input
              id="su-email"
              type="email"
              placeholder="Email Address"
              className={styles.input}
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              autoComplete="email"
              required
            />
            <label htmlFor="su-username" className={styles.srOnly}>
              Username
            </label>
            <input
              id="su-username"
              type="text"
              placeholder="Username"
              className={styles.input}
              value={form.username}
              onChange={(e) => updateField('username', e.target.value)}
              autoComplete="username"
              required
            />
            <label htmlFor="su-dob" className={styles.srOnly}>
              Date of Birth
            </label>
            <input
              id="su-dob"
              type="date"
              placeholder="Date of Birth"
              className={styles.input}
              value={form.dateOfBirth}
              onChange={(e) => updateField('dateOfBirth', e.target.value)}
              required
            />
            <label htmlFor="su-password" className={styles.srOnly}>
              Password
            </label>
            <input
              id="su-password"
              type="password"
              placeholder="Password"
              className={styles.input}
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              autoComplete="new-password"
              required
            />
            <label htmlFor="su-confirm" className={styles.srOnly}>
              Confirm Password
            </label>
            <input
              id="su-confirm"
              type="password"
              placeholder="Confirm Password"
              className={styles.input}
              value={form.confirm}
              onChange={(e) => updateField('confirm', e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Creating account...' : 'Create Account'}
            </button>

            <p className={styles.links}>
              Already have an account? <Link href="/auth/sign-in">Sign in</Link>
            </p>
          </form>
        </div>

        <div className={`${styles.decorColumn} ${styles.decorColumnSignUp}`}>
          <div className={styles.decorSignUp} aria-hidden>
            <Image
              src="/register-hero.png"
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 0vw"
              className={styles.decorImage}
            />
            <p className={styles.decorTitle}>
              Start Your Shopping
              <br />
              Journey!
            </p>
          </div>
          <p className={styles.goBack}>
            Not ready to create an account?
            <br />
            <Link href="/">Go back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

