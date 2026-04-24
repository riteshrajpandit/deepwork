"use client";
import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { orgApi, ApiError } from "@/lib/api";
import Link from "next/link";

export default function AcceptInvitePage(props: { params: Promise<{ token: string }> }) {
  const params = use(props.params);
  const token = params.token;
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await orgApi.acceptInvite(token, {
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        password,
        confirm_password: confirmPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. The invite link may be expired or already used.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-6">
        <div className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 ambient-shadow text-center">
          <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-secondary" />
          </div>
          <h2 className="text-[26px] font-display-xl text-on-surface mb-2">You're in!</h2>
          <p className="text-body-md text-on-surface-variant mb-8">
            Your account has been created and you've joined the organisation. Sign in to get started.
          </p>
          <Link
            href="/login"
            className="w-full block bg-primary text-on-primary py-3 rounded-xl font-label-sm text-label-sm shadow-sm hover:opacity-90 transition-opacity active:scale-[0.98] text-center"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-6 relative">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 ambient-shadow relative z-10">
        <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center border border-outline-variant/30 mb-6 mx-auto">
          <div className="w-4 h-4 bg-primary rotate-45 rounded-sm" />
        </div>

        <h2 className="text-[28px] font-display-xl text-on-surface text-center mb-2">Accept Invitation</h2>
        <p className="text-body-md text-on-surface-variant text-center mb-8">
          Complete your profile to join the workspace.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">First Name</label>
              <input
                autoFocus
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Jane"
                required
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2.5 outline-none focus:border-primary text-body-md transition-colors"
              />
            </div>
            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Doe"
                required
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2.5 outline-none focus:border-primary text-body-md transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
              Middle Name <span className="text-outline">(optional)</span>
            </label>
            <input
              type="text"
              value={middleName}
              onChange={e => setMiddleName(e.target.value)}
              placeholder="e.g. Marie"
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

          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full bg-surface-container-low border rounded-lg px-4 py-2.5 pr-10 outline-none focus:border-primary text-body-md transition-colors ${
                  confirmPassword && confirmPassword !== password
                    ? "border-error"
                    : "border-outline-variant/50"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-[11px] text-error mt-1">Passwords do not match.</p>
            )}
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
            {loading ? "Joining…" : "Join Workspace"}
          </button>
        </form>

        <p className="mt-6 text-center text-[12px] text-outline">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
