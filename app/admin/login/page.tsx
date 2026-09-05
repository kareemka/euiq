"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
export default function AdminLogin(){
  const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState("");const router=useRouter();
  async function submit(e:FormEvent){e.preventDefault();setError("");const r=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok){setError(d.error||"فشل تسجيل الدخول");return}router.replace("/admin");router.refresh()}
  return <main className="adminLogin"><form className="adminLoginBox" onSubmit={submit}><ShieldCheck size={58}/><h1>دخول الإدارة</h1><p>لوحة التحكم محمية</p><label><Mail/><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="البريد الإلكتروني"/></label><label><LockKeyhole/><input type="password" required minLength={10} value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة المرور"/></label>{error&&<div className="error">{error}</div>}<button className="goldBtn">تسجيل الدخول</button></form></main>
}
