'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import * as linkService from '@/services/linkService';

function GitHubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const handle = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        router.replace("/login");
        return;
      }

      if (!code || !state) {
        router.replace("/login");
        return;
      }

      try {
        const response = await linkService.handleGitHubCallback(code, state);

        login(response.token, response.user);

        router.replace("/links");
      } catch (e) {
        console.error(e);
        router.replace("/login");
      }
    };

    handle();

  }, []);

  return <p>Signing in...</p>;
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <GitHubCallbackContent />
    </Suspense>
  );
}