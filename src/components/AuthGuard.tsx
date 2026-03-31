"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import supabase from '../lib/supabaseClient';

const protectedPrefixes = ['/matching', '/profile/settings'];

function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname === '/' || pathname.startsWith('/auth')) return true;
  if (/^\/profile\/[^/]+(\/portfolio)?$/.test(pathname) && !pathname.startsWith('/profile/settings')) {
    return true;
  }

  return !protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (isPublicPath(pathname)) {
        if (mounted) setChecking(false);
        return;
      }

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
