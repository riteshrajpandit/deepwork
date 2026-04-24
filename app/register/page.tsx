"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Simply push logic to login route to proceed the mock logic
    alert("This is a mock app. Please use the simulated demo login screen to select an existing user.");
    router.push("/login");
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
        
        <h2 className="text-display-xl text-[28px] font-display-xl text-on-surface text-center mb-2">Create Account</h2>
        <p className="text-body-md text-on-surface-variant text-center mb-8">Join the Trust & Peace workspaces.</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Jane Doe" 
              required
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2 outline-none focus:border-primary text-body-md transition-colors" 
            />
          </div>
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="jane@example.com" 
              required
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2 outline-none focus:border-primary text-body-md transition-colors" 
            />
          </div>
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2 outline-none focus:border-primary text-body-md transition-colors" 
            />
          </div>

          <button type="submit" className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-sm text-label-sm shadow-sm hover:opacity-90 transition-opacity active:scale-[0.98] mt-2">
            Register
          </button>
        </form>

        <div className="mt-8 text-center text-label-sm font-label-sm text-on-surface-variant">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
}
