'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Building,
  Smartphone,
  Languages,
  BarChart,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/db';

export default function LoginPage() {
  const router = useRouter();

  // Authentication State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email / Password Form
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');

  // Read URL query parameters for errors and prefetch dashboard for instant navigation
  useEffect(() => {
    router.prefetch('/dashboard');
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error_description') || params.get('error');
      if (err) {
        setError(decodeURIComponent(err));
      }
    }
  }, [router]);

  // --- Google Sign-In Handler ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isSupabaseConfigured && supabase) {
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
        if (oauthError) throw oauthError;
      } else {
        throw new Error('Supabase authentication is not configured in .env');
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to authenticate with Google. Please try again.');
      setLoading(false);
    }
  };

  // --- Traditional Email/Password Submit Handler ---
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isSupabaseConfigured && supabase) {
        if (isSignUp) {
          const { error: se } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                organization_name: orgName,
                role: 'owner',
              },
            },
          });
          if (se) throw se;
          setSuccessMessage('Registration successful! Please check your email for confirmation or sign in.');
          setIsSignUp(false);
        } else {
          const { error: le } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (le) throw le;
          router.push('/dashboard');
        }
      } else {
        throw new Error('Supabase authentication is not configured in .env');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-50 min-h-screen">
      {/* Left branding banner */}
      <div className="md:w-1/2 bg-white border-r border-slate-200 text-slate-800 flex flex-col justify-between p-8 md:p-16">
        {/* Top Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Star className="w-5 h-5 fill-current text-blue-600" />
          </div>
          <span className="font-bold text-2xl text-slate-900 tracking-tight">ReviewBee</span>
        </div>

        {/* Main Value Proposition */}
        <div className="my-auto max-w-lg py-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6">
            <Star className="w-3.5 h-3.5 fill-current text-blue-600" />
            <span>Business Feedback & Review Platform</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight text-slate-900">
            Manage your Google reviews and customer feedback.
          </h1>

          <p className="text-slate-600 mt-5 text-sm md:text-base leading-relaxed">
            Connect your verified business profile to manage branches, generate custom table QR posters, and make it seamless for satisfied customers to review you on Google.
          </p>

          {/* Feature list pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-medium">Direct Google Reviews redirect</span>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700">
              <Building className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-medium">Multi-branch management</span>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700">
              <Languages className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-medium">Multi-lingual customer surveys</span>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700">
              <BarChart className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-medium">Real-time scan analytics</span>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Compliance Footnote */}
        <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-6">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Secure Google OAuth 2.0 • ISO 27001 Certified Infrastructure</span>
        </div>
      </div>

      {/* Right Authentication Card */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-16 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* Header */}
          <div className="text-center md:text-left mb-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold mb-3">
              <Star className="w-3.5 h-3.5 fill-current text-blue-600" />
              <span>Business Console Access</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Sign in to ReviewBee
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Authenticate with your Google account or email to access your dashboard.
            </p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* PRIMARY CALL TO ACTION: GOOGLE SIGN-IN BUTTON */}
          <div className="space-y-3">
            <button
              id="google-login-button"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3.5 px-5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl font-semibold text-slate-700 shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 group"
            >
              {/* Google 4-Color Icon */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>

              <span className="text-sm font-semibold text-slate-800">
                {loading ? 'Connecting with Google...' : 'Continue with Google'}
              </span>

              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all ml-auto" />
            </button>

            <p className="text-[11px] text-center text-slate-500 font-normal leading-relaxed">
              By continuing, you agree to manage your ReviewBee profile in compliance with Google Review policies.
            </p>
          </div>

          {/* Collapsible Traditional Email / Password Option */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowEmailLogin(!showEmailLogin)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 transition py-1"
            >
              <span>Or sign in with email credentials</span>
              {showEmailLogin ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showEmailLogin && (
              <form onSubmit={handleEmailSubmit} className="mt-4 space-y-3.5 pt-2 border-t border-slate-100">
                {isSignUp && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-xs bg-white text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Business Name</label>
                      <input
                        type="text"
                        required
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g. Downtown Fitness"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-xs bg-white text-slate-900"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@business.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-xs bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-xs bg-white text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg text-xs hover:bg-blue-700 transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <span>{loading ? 'Processing...' : isSignUp ? 'Create Business Account' : 'Sign In with Email'}</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    {isSignUp ? 'Already have an account? Sign In' : 'Need a new business account? Register here'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>ReviewBee Platform</span>
            <span>Protected by Supabase Auth</span>
          </div>
        </div>
      </div>
    </div>
  );
}
