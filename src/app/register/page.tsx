'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plane, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name } },
      });
      if (authError) { setError(authError.message); return; }
      setSuccess('Account created! Check your email to confirm, then sign in.');
      setTimeout(() => router.push('/login'), 3000);
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
          <h1 className="font-display text-2xl font-bold text-white">Create account</h1>
          <p className="text-sky-300/60 mt-1">Join SkyWave to start booking</p>
        </div>

        <div className="glass-strong rounded-3xl p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4 text-sm text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 mb-4 text-sm text-emerald-300">
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-sky-300/70 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400/50" />
                <input
                  type="text"
                  required
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-sky-300/70 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400/50" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                  minLength={6}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
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

            <div className="space-y-1">
              <label className="text-xs text-sky-300/70 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400/50" />
                <input
                  type="password"
                  required
                  placeholder="Repeat password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-sky-300/60">
              Already have an account?{' '}
              <Link href="/login" className="text-sky-400 hover:text-sky-300 font-medium">Sign in</Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-4 text-xs text-sky-300/30">
          <Link href="/" className="hover:text-sky-300/60 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
