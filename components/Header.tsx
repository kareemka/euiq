"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, LogOut } from "lucide-react";

export default function Header({ name }: { name?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/public/logout", { method: "POST" });
    } catch {}
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="header">
      <Link href="/auction" className="brand">
        <Crown />
        <div>
          <b>المتجر الأوربي في العراق</b>
          <small>EUROPEAN STORE IN IRAQ</small>
        </div>
      </Link>
      {name && (
        <nav>
          <span className="headerUser">
            <Crown size={14} />
            {name}
          </span>
          <button className="logoutBtn" onClick={logout} disabled={busy}>
            <LogOut size={15} />
            خروج
          </button>
        </nav>
      )}
    </header>
  );
}
