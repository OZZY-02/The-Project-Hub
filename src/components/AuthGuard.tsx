"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import supabase from '../lib/supabaseClient';

// `/mentorship` is intentionally absent: the homepage markets it to logged-out
// visitors, so browsing mentors must not require an account.
const protectedPrefixes = ['/matching', '/profile/settings'];

function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname === '/' || pathname.startsWith('/auth')) return true;
  if (/^\/profile\/[^/]+(\/portfolio)?$/.test(pathname) && !pathname.startsWith('/profile/settings')) {
    return true;
  }

  return !protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * TEMPORARY — remove before launch (along with NEXT_PUBLIC_FOUNDER_MODE in
 * .env.local and .env.local.example). Lets a demo run without signing in.
 *
 * The NODE_ENV check is deliberate: even if the flag is set on a deployment by
 * mistake, a production build can never disable the guard.
 */
const FOUNDER_MODE =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_FOUNDER_MODE === 'true';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(!FOUNDER_MODE);

  useEffect(() => {
    if (FOUNDER_MODE) return;

    let mounted = true;
    (async () => {
      if (isPublicPath(pathname)) {
        if (mounted) setChecking(false);
        return;
      }

      // Re-arm on client navigation into a protected route, otherwise the page
      // renders for a beat before the session check has run.
      if (mounted) setChecking(true);

      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user || null;
        if (!user) {
          router.replace('/auth/signin');
          return;
        }
      } catch {
        router.replace('/auth/signin');
        return;
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => { mounted = false; };
  }, [pathname, router]);

  if (checking && !isPublicPath(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-sm text-slate-500">
        Checking your session...
      </div>
    );
  }

  return <>{children}</>;
}
