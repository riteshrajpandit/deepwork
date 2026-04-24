"use client";
import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { useAppContext } from "@/components/AppProvider";
import { usePathname, useRouter } from "next/navigation";
import { tokenStore } from "@/lib/api";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, loginWithToken } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Rehydrate auth state from stored tokens on mount (survives page refresh)
    const access = tokenStore.getAccess();
    if (access && !currentUser) {
      try {
        // JWT payload is base64url — decode to get user info
        const payload = JSON.parse(atob(access.split(".")[1]));
        loginWithToken({
          id: payload.user_id ?? "api-user",
          name: payload.name ?? payload.email ?? "User",
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${payload.email ?? "user"}`,
          color: "bg-primary",
          role: payload.role ?? "Member",
          orgId: payload.organization_id ?? payload.org_id,
          orgRole: payload.role ?? payload.org_role,
        });
      } catch {
        tokenStore.clear();
      }
    }
    setIsMounted(true);
  }, []);

  const isAuthRoute = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname.startsWith('/invites');

  useEffect(() => {
    if (!isMounted) return;
    // Only redirect if there's no React state AND no stored token
    if (!isAuthRoute && !currentUser && !tokenStore.getAccess()) {
      router.push('/login');
    }
  }, [pathname, currentUser, isMounted, router]);

  if (!isMounted) {
    return null;
  }

  if (isAuthRoute) {
    return (
      <main className="min-h-screen bg-background w-full flex flex-col">
        {children}
      </main>
    );
  }

  // Still hydrating token into React state — don't flash redirect
  if (!currentUser && !tokenStore.getAccess()) {
    return null;
  }

  
  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-background h-screen overflow-y-auto w-full">
        <TopNav />
        <main className="flex-1 max-w-[1440px] px-6 py-6 lg:p-10 mx-auto w-full">
          {children}
        </main>
      </div>
    </>
  );
}
