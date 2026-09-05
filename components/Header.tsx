"use client";
import Link from "next/link";
import { Crown, Shield } from "lucide-react";
export default function Header() {
  return <header className="header">
    <Link href="/auction" className="brand"><Crown /><div><b>المتجر الأوربي في العراق</b><small>EUROPEAN STORE IN IRAQ</small></div></Link>
  </header>;
}
