"use client";

import { Search, Bell, Menu, Check, X } from "lucide-react";
import Image from "next/image";
import { useAppContext, formatFriendlyDate } from "@/components/AppProvider";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";

type TopNavProps = {
  onMenuClick: () => void;
};

export function TopNav({ onMenuClick }: TopNavProps) {
  const { currentUser, notifications, markNotificationRead, clearNotifications } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Memoized — avoids two O(n) filters on every render
  const userNotifications = useMemo(
    () => notifications.filter(n => n.userId === currentUser?.id),
    [notifications, currentUser?.id],
  );
  const unreadCount = useMemo(
    () => userNotifications.filter(n => !n.read).length,
    [userNotifications],
  );

  const toggleNotifications = useCallback(() => setShowNotifications(p => !p), []);
  const toggleSearch = useCallback(() => setShowSearch(p => !p), []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  return (
    <header className="bg-surface/90 backdrop-blur-md text-on-surface flex items-center w-full px-4 lg:px-6 h-14 sticky top-0 z-40 border-b border-outline-variant/30">

      {/* Mobile: hamburger + brand */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="p-2 -ml-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer active:scale-95"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
            <div className="w-2.5 h-2.5 bg-primary rotate-45 rounded-[2px]" />
          </div>
          <span className="text-body-lg font-semibold text-on-surface tracking-tight">Trust &amp; Peace</span>
        </div>
      </div>

      {/* Desktop search */}
      <div className="hidden lg:flex flex-1 max-w-sm">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks, projects…"
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface focus:border-outline-variant/60 focus:bg-surface focus:outline-none transition-all placeholder:text-outline"
          />
        </div>
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-1 ml-auto">

        {/* Mobile search toggle */}
        <button
          onClick={toggleSearch}
          className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
          aria-label="Search"
        >
          {showSearch ? <X size={20} /> : <Search size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={toggleNotifications}
            aria-label="Notifications"
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-outline-variant/30 rounded-2xl shadow-xl overflow-hidden flex flex-col z-50">
              <div className="px-4 py-3 border-b border-outline-variant/20 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-body-md text-on-surface">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                  )}
                </div>
                {userNotifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-[11px] text-outline hover:text-on-surface transition-colors cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto no-scrollbar">
                {userNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell size={28} className="text-outline-variant mx-auto mb-2 opacity-40" />
                    <p className="text-label-sm text-outline-variant">No notifications</p>
                  </div>
                ) : (
                  userNotifications.map(n => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-outline-variant/10 flex gap-3 items-start ${!n.read ? "bg-primary/5" : ""}`}
                    >
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className={`text-body-md leading-snug mb-0.5 ${!n.read ? "text-on-surface font-medium" : "text-on-surface-variant"}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-outline-variant">{formatFriendlyDate(n.timestamp)}</p>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => markNotificationRead(n.id)}
                          title="Mark as read"
                          className="p-1 text-primary hover:text-primary/70 cursor-pointer shrink-0"
                        >
                          <Check size={13} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="ml-1 pl-3 border-l border-outline-variant/30">
          <div className="flex items-center gap-2.5 cursor-default select-none">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-label-sm font-medium text-on-surface">{currentUser?.name?.split(" ")[0]}</span>
              <span className="text-[10px] text-outline-variant capitalize">{currentUser?.orgRole ?? currentUser?.role}</span>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/40 shrink-0">
              <Image
                src={currentUser?.avatar || "https://api.dicebear.com/7.x/initials/svg?seed=user"}
                alt={currentUser?.name ?? "User"}
                width={32} height={32}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search bar — slides down when active */}
      {showSearch && (
        <div className="lg:hidden absolute top-14 left-0 right-0 bg-surface border-b border-outline-variant/30 px-4 py-2.5 z-30 shadow-sm">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search tasks, projects…"
              className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-full text-body-md text-on-surface focus:border-primary/50 focus:bg-surface focus:outline-none transition-all placeholder:text-outline"
            />
          </div>
        </div>
      )}
    </header>
  );
}
