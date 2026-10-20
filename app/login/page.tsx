'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Star,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  User,
  Building,
  Mail,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  QrCode,
  Globe,
  Settings as SettingsIcon,
} from 'lucide-react';
import { mockDb, isSupabaseConfigured, supabase } from '@/lib/db';

export default function LoginPage() {
  const router = useRouter();

  // Authentication State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Demo Google Account Preset
  const [demoGoogleEmail, setDemoGoogleEmail] = useState('john.fit@gmail.com');
  const [demoGoogleName, setDemoGoogleName] = useState('John Fit');
  const [demoOrgName, setDemoOrgName] = useState('MadeFit Gym');
  const [isEditingDemoAccount, setIsEditingDemoAccount] = useState(false);

  // Email / Password Fallback Accordion
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('owner@madefit.com');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('John Fit');
  const [orgName, setOrgName] = useState('MadeFit Gym');

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

  // --- 1-Click Demo / Quick Test Handler ---
  const handleDemoLogin = () => {
    setLoading(true);
    setError(null);
    setSuccessMessage('Authenticated! Entering ReviewBee Console...');
    mockDb.loginWithGoogle({
      email: demoGoogleEmail,
      name: demoGoogleName,
      organizationName: demoOrgName,
    });
    router.push('/dashboard');
  };

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
        // In Supabase mode, browser redirects automatically to Google OAuth page
      } else {
        handleDemoLogin();
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to authenticate with Google. You can use the Quick Test Login to explore.');
      setLoading(false);
    }
  };

  // --- Traditional Email/Password Submit Handler ---
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
          alert('Registration successful! Please check your email for confirmation.');
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
        // Local storage demo auth
        if (isSignUp) {
          mockDb.signup(email, fullName, orgName);
        } else {
          mockDb.login(email);
        }
        router.push('/dashboard');
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
      <div className="md:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex flex-col justify-between p-8 md:p-16 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full opacity-20 blur-3xl transform translate-x-20 -translate-y-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full opacity-25 blur-3xl transform -translate-x-20 translate-y-20 pointer-events-none"></div>

        {/* Top Logo */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
            <Star className="w-5 h-5 fill-current text-amber-300" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight">ReviewBee</span>
        </div>

        {/* Main Value Proposition */}
        <div className="my-auto relative z-10 max-w-lg py-12">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md text-blue-100 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI-Driven Google Reviews Generation</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight text-white">
            Connect with Google. Multiply your 5-star reviews.
          </h1>

          <p className="text-blue-100/90 mt-5 text-sm md:text-base leading-relaxed">
            Sign in with your Google account to manage your branches, generate print-ready QR codes, and empower happy customers with instant, localized review drafts.
          </p>

          {/* Feature list pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3 text-xs backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">Direct Google Reviews link</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3 text-xs backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">Multi-branch management</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3 text-xs backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">Multi-lingual AI drafting</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3 text-xs backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">Real-time scan analytics</span>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Compliance Footnote */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-blue-200/80 border-t border-white/10 pt-6">
          <ShieldCheck className="w-4 h-4 text-blue-300" />
          <span>Secure Google OAuth 2.0 • ISO 27001 Certified Infrastructure</span>
        </div>
      </div>

      {/* Right Authentication Card */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-16 bg-slate-50/50">
        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
          
          {/* Header */}
          <div className="text-center md:text-left mb-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold mb-3">
              <Star className="w-3.5 h-3.5 fill-current text-blue-600" />
              <span>Business Owner Access</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Sign in to ReviewBee
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Authenticate with your Google account to access your business console.
            </p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Mode Indicator & Demo Details */}
          {/* Demo Account Box & Mode Status */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Demo Preset Workspace
              </span>
              <button
                type="button"
                onClick={() => setIsEditingDemoAccount(!isEditingDemoAccount)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
              >
                {isEditingDemoAccount ? 'Done' : 'Change Preset'}
              </button>
            </div>

            {isEditingDemoAccount ? (
              <div className="space-y-2.5 pt-2 border-t border-blue-200/60 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Google Name</label>
                  <input
                    type="text"
                    value={demoGoogleName}
                    onChange={(e) => setDemoGoogleName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Google Email</label>
                  <input
                    type="email"
                    value={demoGoogleEmail}
                    onChange={(e) => setDemoGoogleEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Business Name</label>
                  <input
                    type="text"
                    value={demoOrgName}
                    onChange={(e) => setDemoOrgName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-sm shadow-sm">
                    {demoGoogleName.charAt(0)}
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 leading-tight">{demoGoogleName}</p>
                    <p className="text-slate-500 font-mono text-[11px]">{demoGoogleEmail}</p>
                    <p className="text-blue-700 font-medium text-[11px]">Business: {demoOrgName}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition shrink-0"
                >
                  1-Click Test
                </button>
              </div>
            )}
          </div>

          {/* PRIMARY CALL TO ACTION: GOOGLE SIGN-IN BUTTON */}
          <div className="space-y-3">
            <button
              id="google-login-button"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 px-5 bg-white border-2 border-slate-200 hover:border-slate-300 active:scale-[0.99] rounded-2xl font-bold text-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3.5 cursor-pointer disabled:opacity-60 group relative overflow-hidden"
            >
              {/* Google 4-Color Icon */}
              <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
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

              <span className="text-sm font-bold text-slate-800 tracking-tight">
                {loading ? 'Connecting with Google...' : 'Continue with Google'}
              </span>

              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all ml-auto" />
            </button>

            <p className="text-[11px] text-center text-slate-400 font-medium leading-relaxed">
              By continuing with Google, you agree to connect your ReviewBee dashboard with your verified business profile.
            </p>
          </div>

          {/* Collapsible Traditional Email / Password Option */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowEmailLogin(!showEmailLogin)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1"
            >
              <span>Or sign in with email credentials</span>
              {showEmailLogin ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showEmailLogin && (
              <form onSubmit={handleEmailSubmit} className="mt-4 space-y-3.5 pt-2 border-t border-slate-100">
                {isSignUp && (
                  <>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Organization Name</label>
                      <input
                        type="text"
                        required
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g. MadeFit Gym"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@madefit.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-black transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Processing...' : isSignUp ? 'Register with Email' : 'Sign In with Email'}</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-[11px] text-blue-600 font-bold hover:underline"
                  >
                    {isSignUp ? 'Already have an email account? Sign In' : 'Need a new business profile? Register here'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Demo Shortcut */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>ReviewBee v1.0 • Multi-tenant</span>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="text-blue-600 font-bold hover:underline"
            >
              Quick Test Login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
