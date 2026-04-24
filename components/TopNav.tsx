"use client";

import { Search, Bell, HelpCircle, Menu, Check } from "lucide-react";
import Image from "next/image";
import { useAppContext, formatFriendlyDate } from "@/components/AppProvider";
import { useState, useRef, useEffect } from "react";

export function TopNav() {
  const { currentUser, logout, notifications, markNotificationRead, clearNotifications } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const userNotifications = notifications.filter(n => n.userId === currentUser?.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-surface/80 backdrop-blur-md text-on-surface flex justify-between items-center w-full px-6 h-16 sticky top-0 z-40 border-b border-outline-variant/30 antialiased">
      <div className="flex items-center gap-4 lg:hidden">
        <button className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer active:opacity-70">
          <Menu size={24} />
        </button>
        <span className="text-lg font-semibold text-on-surface">Trust & Peace</span>
      </div>

      {/* Global Search */}
      <div className="hidden lg:flex flex-1 max-w-md mx-4 lg:mx-0 lg:ml-auto">
        <div className="relative w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input 
            type="text" 
            placeholder="Search tasks, projects..." 
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-transparent rounded-full text-body-md font-body-md text-on-surface focus:border-outline-variant focus:bg-surface-container-lowest focus:ring-0 focus:outline-none transition-all placeholder:text-outline"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto lg:ml-6">
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-on-surface-variant hover:text-on-surface transition-colors duration-200 cursor-pointer active:opacity-70 relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-on-error rounded-full flex items-center justify-center text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg overflow-hidden flex flex-col z-50">
              <div className="p-3 border-b border-outline-variant/30 flex justify-between items-center bg-surface">
                <h3 className="font-semibold text-label-md text-on-surface">Notifications</h3>
                {userNotifications.length > 0 && (
                  <button onClick={clearNotifications} className="text-[11px] text-outline hover:text-on-surface transition-colors cursor-pointer">Clear All</button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto no-scrollbar flex flex-col bg-surface-container-lowest">
                {userNotifications.length === 0 ? (
                  <div className="p-6 text-center text-label-sm text-outline-variant">No new notifications</div>
                ) : (
                  userNotifications.map(n => (
                    <div key={n.id} className={`p-3 border-b border-outline-variant/10 text-label-sm flex gap-3 ${!n.read ? 'bg-primary/5' : ''}`}>
                      <div className="flex-1">
                        <p className={`mb-1 ${!n.read ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>{n.message}</p>
                        <p className="text-[10px] text-outline-variant">{formatFriendlyDate(n.timestamp)}</p>
                      </div>
                      {!n.read && (
                        <button onClick={() => markNotificationRead(n.id)} className="text-primary hover:text-primary/70 cursor-pointer self-start p-1" title="Mark as read">
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <button className="text-on-surface-variant hover:text-on-surface transition-colors duration-200 cursor-pointer active:opacity-70">
          <HelpCircle size={20} />
        </button>
        
        <div className="pl-4 border-l border-outline-variant/30 ml-2">
            <button onClick={logout} title={`Logout ${currentUser?.name}`} className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden cursor-pointer border border-outline-variant/40 active:opacity-70 transition-opacity">
              <Image 
                  src={currentUser?.avatar || "https://picsum.photos/seed/user/100/100"} 
                  alt="User profile" 
                  width={32} 
                  height={32} 
                  className="w-full h-full object-cover" 
                  unoptimized
              />
            </button>
        </div>
      </div>
    </header>
  );
}
