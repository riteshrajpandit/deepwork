"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { useAppContext } from "@/components/AppProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi, tokenStore, userStore, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justVerified = searchParams.get("verified") === "1";
  const { loginWithToken } = useAppContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { tokens, user } = res.data;
      tokenStore.set(tokens.access, tokens.refresh);
      userStore.set({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        organization_id: user.organization_id,
      });

      // Decode JWT for any extra claims the response body may not include
      const payload = JSON.parse(atob(tokens.access.split(".")[1]));
      const displayName = user.full_name?.trim() || email.split("@")[0];

      loginWithToken({
        id: user.id ?? payload.user_id ?? "api-user",
        name: displayName,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
        color: "bg-primary",
        role: user.role ?? payload.role ?? "member",
        orgId: user.organization_id ?? payload.organization_id,
        orgRole: user.role ?? payload.role,
      });

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-6 relative">
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 ambient-shadow relative z-10">
        <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center border border-outline-variant/30 mb-6 mx-auto">
          <div className="w-4 h-4 bg-primary rotate-45 rounded-sm" />
        </div>

        <h2 className="text-[28px] font-display-xl text-on-surface text-center mb-2">Welcome Back</h2>
        <p className="text-body-md text-on-surface-variant text-center mb-8">Sign in to continue your deep work.</p>

        {justVerified && (
          <div className="flex items-center gap-2 bg-secondary-container/40 border border-secondary/20 text-on-secondary-container rounded-lg px-3 py-2.5 mb-4 text-[13px]">
            <CheckCircle2 size={15} className="text-secondary shrink-0" />
            Email verified! You can now sign in.
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Email</label>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2.5 outline-none focus:border-primary text-body-md transition-colors"
            />
          </div>

          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2.5 pr-10 outline-none focus:border-primary text-body-md transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[12px] text-error bg-error-container/40 border border-error/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-sm text-label-sm shadow-sm hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center text-label-sm font-label-sm text-on-surface-variant">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
