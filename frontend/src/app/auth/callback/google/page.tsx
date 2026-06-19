'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import * as linkService from '@/services/linkService';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        router.push('/login?error=' + error);
        return;
      }

      if (!code || !state) {
        router.push('/login?error=missing_params');
        return;
      }

      try {
        const response = await linkService.handleGoogleCallback(code, state);
        if (response?.token && response?.user) {
          login(response.token, response.user);
          router.push('/links');
        }
      } catch (error) {
        console.error('Google callback error:', error);
        router.push('/login?error=auth_failed');
      }
    };

    handleCallback();
  }, [searchParams, router, login]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
        <p className="text-gray-600">Authenticating with Google...</p>
      </div>
    </div>
  );
}
