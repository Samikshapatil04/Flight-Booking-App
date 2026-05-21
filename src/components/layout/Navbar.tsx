'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plane, Menu, X, LogOut, Ticket, Search, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/store/userStore';
import { useFlightStore } from '@/store/flightStore';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { session, resetUser } = useUserStore();
  const { resetAll } = useFlightStore();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    resetUser();
    resetAll();
    router.push('/');
    setMenuOpen(false);
  };

  const navLinks = [
    { href: '/search', label: 'Search Flights', icon: Search },
    ...(session ? [{ href: '/my-bookings', label: 'My Bookings', icon: Ticket }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 glass-strong border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center
              group-hover:bg-sky-500 transition-colors duration-200">
              <Plane className="w-5 h-5 text-white -rotate-45" />
            </div>
            <span className="font-display text-xl font-bold text-white hidden sm:block">
              Sky<span className="text-sky-400">Wave</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  pathname === href
                    ? 'bg-sky-600/30 text-sky-300'
                    : 'text-sky-200/70 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Auth actions */}
          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                  text-sky-200/70 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-medium
                  text-sky-200/70 hover:text-white hover:bg-white/5 transition-all duration-200">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary text-sm py-2 px-4">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-xl text-sky-200 hover:bg-white/5 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 py-3 px-4 space-y-1 animate-slide-down">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                pathname === href
                  ? 'bg-sky-600/30 text-sky-300'
                  : 'text-sky-200/70 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/10 mt-2">
            {session ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  text-red-300 hover:bg-red-500/10 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center py-3 rounded-xl text-sm font-medium
                    text-sky-200 hover:bg-white/5 transition-all duration-200">
                  Sign In
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center btn-primary text-sm py-3">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
