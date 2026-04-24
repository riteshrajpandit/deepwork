"use client";
import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { useAppContext } from "@/components/AppProvider";
import { usePathname, useRouter } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAuthRoute = pathname === '/' || pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (!isMounted) return;
    if (!isAuthRoute && !currentUser) {
      router.push('/login');
    }
  }, [pathname, currentUser, isMounted, router]);

  if (!isMounted) {
    return null; // Avoid hydration mismatch visually
  }

  if (isAuthRoute) {
    return (
      <main className="min-h-screen bg-background w-full flex flex-col">
        {children}
      </main>
    );
  }

  // Prevent flash of content logic check
  if (!currentUser) {
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
