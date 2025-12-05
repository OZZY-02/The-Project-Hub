"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import supabase from '../lib/supabaseClient';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // allow auth pages
      if (pathname?.startsWith('/auth')) {
        if (mounted) setChecking(false);
        return;
      }

      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user || null;
        if (!user) {
          // redirect to signin if not on an auth page
          router.replace('/auth/signin');
          return;
        }
      } catch (err) {
        router.replace('/auth/signin');
        return;
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => { mounted = false; };
  }, [pathname, router]);

  if (checking) return null;
  return <>{children}</>;
}
