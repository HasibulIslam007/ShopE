"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function Register(){
  const router=useRouter();
  const [error,setError]=useState("");
  const [pending,setPending]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); setError(""); setPending(true);
    const form=new FormData(event.currentTarget);
    try {
      const response=await fetch("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:form.get("name"),email:form.get("email"),password:form.get("password")})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||"Unable to create your account");
      router.push("/login?registered=1");
    } catch (reason) { setError(reason instanceof Error?reason.message:"Unable to create your account"); }
    finally { setPending(false); }
  }
  return <main className="mx-auto max-w-md px-6 py-20"><p className="text-xs font-bold uppercase tracking-[.25em] text-coral">Join the club</p><h1 className="mt-4 text-6xl font-black tracking-[-.07em]">Create account<span className="text-coral">.</span></h1><form onSubmit={submit} className="mt-10 space-y-4"><input required name="name" minLength={2} autoComplete="name" placeholder="Your name" className="w-full rounded-xl border border-ink/15 bg-white px-4 py-4 outline-coral"/><input required name="email" type="email" autoComplete="email" placeholder="Email address" className="w-full rounded-xl border border-ink/15 bg-white px-4 py-4 outline-coral"/><input required name="password" minLength={8} type="password" autoComplete="new-password" placeholder="Password (8+ characters)" className="w-full rounded-xl border border-ink/15 bg-white px-4 py-4 outline-coral"/>{error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={pending} className="w-full rounded-full bg-ink px-6 py-4 font-bold text-white disabled:cursor-wait disabled:opacity-60">{pending?"Creating account…":"Create account ↗"}</button></form><p className="mt-7 text-sm text-ink/60">Already a member? <Link href="/login" className="font-bold underline">Sign in</Link></p></main>
}