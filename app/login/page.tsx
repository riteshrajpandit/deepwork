"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAppContext } from "@/components/AppProvider";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { login, users } = useAppContext();
  const [selectedUser, setSelectedUser] = useState(users[0]?.id || "");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      login(selectedUser);
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-6 relative">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 ambient-shadow relative z-10">
        <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center border border-outline-variant/30 mb-6 mx-auto">
          <div className="w-4 h-4 bg-primary rotate-45 rounded-sm" />
        </div>
        
        <h2 className="text-display-xl text-[28px] font-display-xl text-on-surface text-center mb-2">Welcome Back</h2>
        <p className="text-body-md text-on-surface-variant text-center mb-8">Sign in to continue your deep work.</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-2">Select Mock User (Demo Only)</label>
            <select 
              value={selectedUser} 
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-3 outline-none focus:border-primary text-body-md transition-colors cursor-pointer"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <p className="text-[12px] text-outline mt-2">In a real app, this would be an email/password or OAuth flow.</p>
          </div>

          <button type="submit" className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-sm text-label-sm shadow-sm hover:opacity-90 transition-opacity active:scale-[0.98]">
            Sign In to Dashboard
          </button>
        </form>

        <div className="mt-8 text-center text-label-sm font-label-sm text-on-surface-variant">
          Don't have an account? <Link href="/register" className="text-primary hover:underline">Register up</Link>
        </div>
      </div>
    </div>
  );
}
