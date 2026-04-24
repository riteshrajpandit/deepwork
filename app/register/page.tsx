"use client";
import React, { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { authApi, ApiError } from "@/lib/api";

type Step = "register" | "verify";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("register");

  // Registration fields
  const [orgName, setOrgName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // OTP fields — 6 individual digit inputs
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Step 1: register ────────────────────────────────────────────────────────

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await authApi.register({ org_name: orgName, first_name: firstName, last_name: lastName, email, password, confirm_password: confirmPassword });
      setStep("verify");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ─────────────────────────────────────────────────────

  const handleOtpChange = (idx: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.verifyOtp(email, code);
      router.push("/login?verified=1");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Shared logo ─────────────────────────────────────────────────────────────

  const Logo = () => (
    <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center border border-outline-variant/30 mb-6 mx-auto">
      <div className="w-4 h-4 bg-primary rotate-45 rounded-sm" />
    </div>
  );

  // ── OTP Step ────────────────────────────────────────────────────────────────

  if (step === "verify") {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-6 relative">
        <div className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 ambient-shadow relative z-10">
          <Logo />

          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <MailCheck size={28} className="text-primary" />
          </div>

          <h2 className="text-[28px] font-display-xl text-on-surface text-center mb-2">Check your email</h2>
          <p className="text-body-md text-on-surface-variant text-center mb-1">
            We sent a 6-digit code to
          </p>
          <p className="text-body-md font-semibold text-on-surface text-center mb-8">{email}</p>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-3 text-center">
                Enter verification code
              </label>
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    autoFocus={idx === 0}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-headline-md font-bold bg-surface-container-low border border-outline-variant/50 rounded-lg outline-none focus:border-primary focus:bg-surface transition-colors"
                  />
                ))}
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-error bg-error-container/40 border border-error/20 rounded-lg px-3 py-2 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-sm text-label-sm shadow-sm hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Verifying…" : "Verify & Continue"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { setStep("register"); setOtp(["", "", "", "", "", ""]); setError(""); }}
            className="mt-6 w-full text-center text-label-sm font-label-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            ← Back to registration
          </button>
        </div>
      </div>
    );
  }

  // ── Register Step ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-6 relative">
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 ambient-shadow relative z-10">
        <Logo />

        <h2 className="text-[28px] font-display-xl text-on-surface text-center mb-2">Create Account</h2>
        <p className="text-body-md text-on-surface-variant text-center mb-8">
          Join the Trust &amp; Peace workspaces.
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Org name */}
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Organisation Name</label>
            <input
              autoFocus
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="e.g. Acme Inc."
              required
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2.5 outline-none focus:border-primary text-body-md transition-colors"
            />
          </div>

          {/* First / Last name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">First Name</label>
              <input
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

          {/* Email */}
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@example.com"
              required
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2.5 outline-none focus:border-primary text-body-md transition-colors"
            />
          </div>

          {/* Password */}
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

          {/* Confirm password */}
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
                    ? "border-error focus:border-error"
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
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center text-label-sm font-label-sm text-on-surface-variant">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
