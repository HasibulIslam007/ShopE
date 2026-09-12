"use client";
import Link from "next/link";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) Sentry.captureException(error);
  }, [error]);
  return (
    <main className="mx-auto grid max-w-5xl place-items-center px-6 py-32 md:px-10">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-coral">Oops</p>
        <h1 className="mt-3 text-6xl font-black tracking-[-.07em]">Something broke<span className="text-coral">.</span></h1>
        <p className="mt-4 text-ink/60">An unexpected error occurred while loading this page.</p>
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={reset} className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white">Try again</button>
          <Link href="/" className="rounded-full border border-ink/20 px-6 py-3 text-sm font-bold hover:bg-ink/5">Back to home</Link>
        </div>
      </div>
    </main>
  );
}
