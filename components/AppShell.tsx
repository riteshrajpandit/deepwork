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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const access = tokenStore.getAccess();
    if (access && !currentUser) {
      try {
        const payload = JSON.parse(atob(access.split(".")[1]));
        loginWithToken({
          id: payload.user_id ?? "api-user",
          name: payload.name ?? payload.email ?? "User",
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${payload.email ?? "user"}`,
          color: "bg-primary",
          role: payload.role ?? "member",
          orgId: payload.organization_id ?? payload.org_id,
          orgRole: payload.role ?? payload.org_role,
        });
      } catch {
        tokenStore.clear();
      }
    }
    setIsMounted(true);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isAuthRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/invites");

  useEffect(() => {
    if (!isMounted) return;
    if (!isAuthRoute && !currentUser && !tokenStore.getAccess()) {
      router.push("/login");
    }
  }, [pathname, currentUser, isMounted, router]);

  if (!isMounted) return null;

  if (isAuthRoute) {
    return (
      <main className="min-h-screen bg-background w-full flex flex-col">
        {children}
      </main>
    );
  }

  if (!currentUser && !tokenStore.getAccess()) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] px-4 py-6 lg:px-10 lg:py-10 mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
