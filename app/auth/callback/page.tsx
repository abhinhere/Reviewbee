'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/db';
import { Star } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [statusText, setStatusText] = useState('Authenticating and verifying your session...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        if (typeof window === 'undefined') return;

        const currentUrl = new URL(window.location.href);

        // Check if provider returned an error in query params or hash
        const errorParam = currentUrl.searchParams.get('error') || currentUrl.searchParams.get('error_description');
        if (errorParam) {
          const desc = currentUrl.searchParams.get('error_description') || errorParam;
          if (isMounted) setErrorMessage(desc);
          setTimeout(() => router.replace(`/login?error=${encodeURIComponent(desc)}`), 1200);
          return;
        }

        if (window.location.hash.includes('error=')) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const desc = hashParams.get('error_description') || hashParams.get('error') || 'OAuth authorization failed';
          if (isMounted) setErrorMessage(desc);
          setTimeout(() => router.replace(`/login?error=${encodeURIComponent(desc)}`), 1200);
          return;
        }

        // Process PKCE code exchange or implicit token flow
        if (isSupabaseConfigured && supabase) {
          const code = currentUrl.searchParams.get('code');
          if (code) {
            setStatusText('Exchanging authentication credentials...');
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.warn('Code exchange warning:', exchangeError);
            }
          }

          // Verify session is active
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            if (isMounted) setStatusText('Session established! Entering ReviewBee Console...');
            router.replace('/dashboard');
            return;
          }
        }

        // Forward to dashboard
        router.replace('/dashboard');
      } catch (err: any) {
        console.error('Error in auth callback:', err);
        router.replace('/dashboard');
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
        <Star className="w-5 h-5 text-blue-600 absolute animate-pulse fill-current" />
      </div>
      {errorMessage ? (
        <div className="text-center max-w-sm">
          <p className="text-sm font-semibold text-red-600 mb-1">Authentication Problem</p>
          <p className="text-xs text-slate-500">{errorMessage}</p>
        </div>
      ) : (
        <p className="text-sm font-medium text-slate-600">{statusText}</p>
      )}
    </div>
  );
}
