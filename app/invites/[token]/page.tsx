"use client";
// ── Redirect shim — old path-based invite links → new query-param format ─────
// Backend now sends: /register/?token=X&email=Y&org=Z
// But if someone bookmarked /invites/<token>, we forward them gracefully.

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function InviteRedirectPage(props: { params: Promise<{ token: string }> }) {
  const { token } = use(props.params);
  const router = useRouter();

  useEffect(() => {
    // Forward to the canonical invite-acceptance page preserving the token.
    // Email and org name will be blank but the form will still work.
    router.replace(`/register/?token=${encodeURIComponent(token)}`);
  }, [token, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-on-surface-variant">
        <Loader2 size={24} className="animate-spin text-primary" />
        <p className="text-body-md">Redirecting to invitation…</p>
      </div>
    </div>
  );
}
