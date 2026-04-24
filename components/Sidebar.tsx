"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "./AppProvider";
import { 
  LayoutDashboard, 
  FolderOpen, 
  ListTodo, 
  FileText, 
  Calendar,
  Settings,
  Archive,
  Plus,
  Activity
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { setProjectModalOpen } = useAppContext();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderOpen },
    { href: "/todos", label: "Todos", icon: ListTodo },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/discussions", label: "Discussions", icon: Activity },
  ];

  return (
    <nav className="hidden lg:flex lg:flex-col bg-surface dark:bg-zinc-900 border-r border-outline-variant/30 h-screen w-64 p-4 sticky top-0 shrink-0 z-50">
      <div className="flex items-center gap-3 px-3 py-4 mb-4">
        <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 border border-outline-variant/30">
          {/* Abstract brand icon */}
          <div className="w-4 h-4 bg-primary rotate-45 rounded-sm" />
        </div>
        <div>
          <h1 className="text-on-background font-bold text-headline-md font-headline-md tracking-tight">Trust & Peace</h1>
          <p className="text-on-surface-variant font-label-sm text-label-sm">Deep Work Workspace</p>
        </div>
      </div>

      <button onClick={() => setProjectModalOpen(true)} className="w-full bg-primary text-on-primary hover:opacity-90 transition-opacity rounded-lg py-2.5 px-4 mb-6 flex items-center justify-center gap-2 font-label-sm text-label-sm shadow-sm active:scale-95 cursor-pointer">
        <Plus size={18} />
        New Project
      </button>

      <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          const Icon = link.icon;
          
          return (
            <Link key={link.href} href={link.href}>
              <span className={`flex items-center gap-3 px-3 py-2.5 rounded-lg active:scale-[0.98] transition-all duration-200 ${isActive ? 'bg-secondary-container/50 text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'}`}>
                <Icon size={20} className={isActive ? "text-primary" : ""} strokeWidth={isActive ? 2.5 : 2} />
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-outline-variant/30 flex flex-col gap-1">
        <Link href="/settings">
          <span className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${pathname.startsWith('/settings') ? 'bg-secondary-container/50 text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'}`}>
            <Settings size={20} className={pathname.startsWith('/settings') ? "text-primary" : "opacity-70"} strokeWidth={pathname.startsWith('/settings') ? 2.5 : 2}  />
            Settings
          </span>
        </Link>
        <Link href="/archive">
          <span className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${pathname.startsWith('/archive') ? 'bg-secondary-container/50 text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'}`}>
            <Archive size={20} className={pathname.startsWith('/archive') ? "text-primary" : "opacity-70"} strokeWidth={pathname.startsWith('/archive') ? 2.5 : 2} />
            Archive
          </span>
        </Link>
      </div>
    </nav>
  );
}
