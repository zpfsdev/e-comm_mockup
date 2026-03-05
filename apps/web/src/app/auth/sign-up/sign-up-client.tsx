'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import type { AuthResponse } from '@/types/auth';
import styles from '../auth.module.css';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).+$/;

const signUpSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'Last name is required'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be 30 characters or fewer'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    contactNumber: z.string().min(7, 'Enter a valid phone number'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(PASSWORD_REGEX, 'Password must contain at least one uppercase letter and one number'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type SignUpFields = z.infer<typeof signUpSchema>;

export default function SignUpClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFields>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur',
  });

  const mutation = useMutation<AuthResponse, AxiosError<{ message?: string }>, Omit<SignUpFields, 'confirm'>>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
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
      setServerError(err.response?.data?.message ?? 'Registration failed. Please try again.');
    },
  });

  function onSubmit({ confirm: _confirm, ...fields }: SignUpFields): void {
    void _confirm;
    setServerError('');
    mutation.mutate({
      ...fields,
      ...(fields.middleName ? { middleName: fields.middleName } : { middleName: undefined }),
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.layoutSignUp}>
        <h1 className={styles.titleSignUp}>CREATE AN ACCOUNT</h1>

        <div className={styles.formColumn}>
          {serverError && <p className={styles.errorBanner} role="alert">{serverError}</p>}

          <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="su-firstName" className={styles.srOnly}>First Name</label>
              <input
                id="su-firstName"
                type="text"
                placeholder="First Name"
                className={styles.input}
                autoComplete="given-name"
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? 'su-firstName-error' : undefined}
                {...register('firstName')}
              />
              {errors.firstName && (
                <p id="su-firstName-error" className={styles.fieldError} role="alert">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="su-lastName" className={styles.srOnly}>Last Name</label>
              <input
                id="su-lastName"
                type="text"
                placeholder="Last Name"
                className={styles.input}
                autoComplete="family-name"
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? 'su-lastName-error' : undefined}
                {...register('lastName')}
              />
              {errors.lastName && (
                <p id="su-lastName-error" className={styles.fieldError} role="alert">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="su-middleName" className={styles.srOnly}>Middle Name (optional)</label>
              <input
                id="su-middleName"
                type="text"
                placeholder="Middle Name (optional)"
                className={styles.input}
                autoComplete="additional-name"
                {...register('middleName')}
              />
            </div>

            <div>
              <label htmlFor="su-phone" className={styles.srOnly}>Phone Number</label>
              <input
                id="su-phone"
                type="tel"
                placeholder="Phone Number"
                className={styles.input}
                autoComplete="tel"
                aria-invalid={!!errors.contactNumber}
                aria-describedby={errors.contactNumber ? 'su-phone-error' : undefined}
                {...register('contactNumber')}
              />
              {errors.contactNumber && (
                <p id="su-phone-error" className={styles.fieldError} role="alert">
                  {errors.contactNumber.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="su-email" className={styles.srOnly}>Email Address</label>
              <input
                id="su-email"
                type="email"
                inputMode="email"
                placeholder="Email Address"
                className={styles.input}
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'su-email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="su-email-error" className={styles.fieldError} role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="su-username" className={styles.srOnly}>Username</label>
              <input
                id="su-username"
                type="text"
                placeholder="Username"
                className={styles.input}
                autoComplete="username"
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? 'su-username-error' : undefined}
                {...register('username')}
              />
              {errors.username && (
                <p id="su-username-error" className={styles.fieldError} role="alert">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="su-dob" className={styles.srOnly}>Date of Birth</label>
              <input
                id="su-dob"
                type="date"
                className={styles.input}
                aria-invalid={!!errors.dateOfBirth}
                aria-describedby={errors.dateOfBirth ? 'su-dob-error' : undefined}
                {...register('dateOfBirth')}
              />
              {errors.dateOfBirth && (
                <p id="su-dob-error" className={styles.fieldError} role="alert">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="su-password" className={styles.srOnly}>Password</label>
              <input
                id="su-password"
                type="password"
                placeholder="Password"
                className={styles.input}
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'su-password-error' : undefined}
                {...register('password')}
              />
              {errors.password && (
                <p id="su-password-error" className={styles.fieldError} role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="su-confirm" className={styles.srOnly}>Confirm Password</label>
              <input
                id="su-confirm"
                type="password"
                placeholder="Confirm Password"
                className={styles.input}
                autoComplete="new-password"
                aria-invalid={!!errors.confirm}
                aria-describedby={errors.confirm ? 'su-confirm-error' : undefined}
                {...register('confirm')}
              />
              {errors.confirm && (
                <p id="su-confirm-error" className={styles.fieldError} role="alert">
                  {errors.confirm.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || mutation.isPending}
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
