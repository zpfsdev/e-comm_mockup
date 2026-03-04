import { Suspense } from 'react';
import SignUpClientPage from './sign-up-client';

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpClientPage />
    </Suspense>
  );
}
