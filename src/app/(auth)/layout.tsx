'use client'

import { useAuth } from '@/context/AuthProvider';
import { redirect } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      redirect('/dashboard');
    }
  }, [user]);

  return !user ? <>{children}</> : null;
}