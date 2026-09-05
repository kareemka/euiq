"use client";
import { FormEvent, useState } from "react";
import { Crown, Phone, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [name,setName]=useState(""),[phone,setPhone]=useState(""),[error,setError]=useState("");
  const router=useRouter();
  async function submit(e:FormEvent){e.preventDefault();setError("");const r=await fetch("/api/public/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,phone})});const d=await r.json();if(!r.ok){setError(d.error||"تعذر التسجيل");return}router.push("/auction");router.refresh()}
  return <main className="loginPage"><div className="overlay"/><form className="loginBox" onSubmit={submit}><Crown className="crown"/><h1>المتجر الأوربي في العراق</h1><small>EUROPEAN STORE IN IRAQ</small><h2>ادخل الآن<br/><span>وانضم إلى المزاد</span></h2><p>تسجيل سريع بالاسم ورقم الهاتف</p><label><User/><input required minLength={2} value={name} onChange={e=>setName(e.target.value)} placeholder="الاسم الكامل"/></label><label><Phone/><input required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="07XXXXXXXXX" inputMode="tel" pattern="07\d{9}" maxLength={11}/></label><small className="phoneHint">مثال: 07701234567</small>{error&&<div className="error">{error}</div>}<button className="goldBtn">دخول إلى المزاد</button></form></main>
}