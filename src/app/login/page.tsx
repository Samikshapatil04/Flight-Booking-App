'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plane, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/store/userStore';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/my-bookings';
  const { setSession } = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError(authError.message); return; }
      if (data.session) setSession(data.session);
      router.push(redirectTo);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-sky-600 flex items-center justify-center mx-auto mb-3">
            <Plane className="w-7 h-7 text-white -rotate-45" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sky-300/60 mt-1">Sign in to manage your bookings</p>
        </div>

        <div className="glass-strong rounded-3xl p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-sky-300/70 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400/50" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-sky-300/70 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400/50" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sky-400/50 hover:text-sky-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-sky-300/60">
              No account?{' '}
              <Link href="/register" className="text-sky-400 hover:text-sky-300 font-medium">
                Create one
              </Link>
            </p>
          </div>

          {/* Test credentials */}
          <div className="mt-4 p-3 rounded-xl bg-sky-800/20 border border-sky-700/30 text-xs text-sky-300/60">
            <p className="font-semibold text-sky-300/80 mb-1">Test Account</p>
            <p>Email: <span className="font-mono text-sky-300">test@skywave.dev</span></p>
            <p>Password: <span className="font-mono text-sky-300">Test@1234</span></p>
          </div>
        </div>

        <p className="text-center mt-4 text-xs text-sky-300/30">
          <Link href="/" className="hover:text-sky-300/60 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
