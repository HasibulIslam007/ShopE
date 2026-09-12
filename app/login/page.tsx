"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Login(){
  const router=useRouter();
  const [error,setError]=useState("");
  const [pending,setPending]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); setError(""); setPending(true);
    const form=new FormData(event.currentTarget);
    const result=await signIn("credentials",{email:form.get("email"),password:form.get("password"),redirect:false});
    if(result?.error) setError("That email and password combination was not recognised.");
    else { router.refresh(); router.push("/profile"); }
    setPending(false);
  }
  return <main className="mx-auto max-w-md px-6 py-20"><p className="text-xs font-bold uppercase tracking-[.25em] text-coral">Welcome back</p><h1 className="mt-4 text-6xl font-black tracking-[-.07em]">Sign in<span className="text-coral">.</span></h1><form onSubmit={submit} className="mt-10 space-y-4"><input required name="email" autoComplete="email" type="email" placeholder="Email address" className="w-full rounded-xl border border-ink/15 bg-white px-4 py-4 outline-coral"/><input required name="password" autoComplete="current-password" type="password" placeholder="Password" className="w-full rounded-xl border border-ink/15 bg-white px-4 py-4 outline-coral"/>{error&&<p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}<button disabled={pending} className="w-full rounded-full bg-ink px-6 py-4 font-bold text-white disabled:cursor-wait disabled:opacity-60">{pending?"Signing in…":"Sign in ↗"}</button></form><p className="mt-7 text-sm text-ink/60">New to ShopE? <Link href="/register" className="font-bold underline">Create an account</Link></p></main>
}