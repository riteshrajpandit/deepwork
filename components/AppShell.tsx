"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { useAppContext } from "@/components/AppProvider";
import { usePathname, useRouter } from "next/navigation";
import { tokenStore, userStore } from "@/lib/api";

const SIDEBAR_COLLAPSED_KEY = "tp_sidebar_collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, loginWithToken, coreLoading } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Restore stored collapsed preference
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "1") setSidebarCollapsed(true);

    const access = tokenStore.getAccess();
    if (access && !currentUser) {
      const stored = userStore.get();
      if (stored) {
        loginWithToken({
          id: stored.id,
          name: stored.full_name ?? stored.email,
          email: stored.email,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${stored.email ?? "user"}`,
          color: "bg-primary",
          role: stored.role ?? "member",
          orgId: stored.organization_id,
          orgRole: stored.role,
        });
      } else {
        try {
          const payload = JSON.parse(atob(access.split(".")[1]));
          loginWithToken({
            id: payload.user_id ?? "api-user",
            name: payload.name ?? payload.email ?? "User",
            email: payload.email,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${payload.email ?? "user"}`,
            color: "bg-primary",
            role: payload.role ?? "member",
            orgId: payload.organization_id ?? payload.org_id,
            orgRole: payload.role ?? payload.org_role,
          });
        } catch {
          tokenStore.clear();
          userStore.clear();
        }
      }
    }
    setIsMounted(true);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleCollapsedChange = useCallback((v: boolean) => {
    setSidebarCollapsed(v);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, v ? "1" : "0");
  }, []);

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
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapsedChange={handleCollapsedChange}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Loading progress bar — full width, above everything */}
        {coreLoading && (
          <div className="shrink-0 h-0.5 bg-primary/20 relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1/3 bg-primary animate-[shimmer_1.5s_ease-in-out_infinite]" />
          </div>
        )}

        {/* TopNav border spans full width; inner content is width-constrained to match page content */}
        <div className="shrink-0 border-b border-outline-variant/30 bg-surface/95 backdrop-blur-md sticky top-0 z-40">
          <div className="w-full px-4 lg:px-8 h-14 flex items-center">
            <TopNav
              onMenuClick={() => setSidebarOpen(true)}
              sidebarCollapsed={sidebarCollapsed}
            />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <div className="flex-1 flex flex-col px-4 py-6 lg:px-8 lg:py-8 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
