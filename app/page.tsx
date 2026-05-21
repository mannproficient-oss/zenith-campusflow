"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user)                  router.push("/login");
    else if (role === "admin")      router.push("/dashboard/admin");
    else if (role === "counsellor") router.push("/dashboard/counsellor");
    else                            router.push("/dashboard/intern");
  }, [user, role, loading]);

  return (
    <div style={{ background: "#07070f", minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#6b7280", fontFamily: "sans-serif" }}>Loading...</p>
    </div>
  );
}