import { Suspense } from 'react';
import SignInClientPage from './sign-in-client';

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInClientPage />
    </Suspense>
  );
}
