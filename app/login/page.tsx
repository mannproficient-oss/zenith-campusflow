"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithGoogle, loginWithEmail } from "@/lib/auth";

export default function LoginPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const router = useRouter();

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      router.push("/");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleEmail = async () => {
    try {
      await loginWithEmail(email, password);
      router.push("/");
    } catch (e: any) {
      setError("Invalid email or password");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07070f",
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "rgba(255,255,255,.05)",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 20, padding: 40, width: 360 }}>

        <h1 style={{ color: "#f8f8ff", fontFamily: "sans-serif",
          marginBottom: 8, textAlign: "center" }}>Zenith CampusFlow</h1>
        <p style={{ color: "#6b7280", fontFamily: "sans-serif",
          textAlign: "center", marginBottom: 24, fontSize: 14 }}>
          Sign in to continue
        </p>

        {error && <p style={{ color: "#f87171", fontSize: 13,
          marginBottom: 16, fontFamily: "sans-serif" }}>{error}</p>}

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.1)", borderRadius: 10,
            padding: "10px 14px", color: "white", marginBottom: 10,
            boxSizing: "border-box", fontFamily: "sans-serif" }}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.1)", borderRadius: 10,
            padding: "10px 14px", color: "white", marginBottom: 16,
            boxSizing: "border-box", fontFamily: "sans-serif" }}
        />

        <button onClick={handleEmail}
          style={{ width: "100%", background: "#7c3aed", color: "white",
            border: "none", borderRadius: 10, padding: "12px 0",
            cursor: "pointer", marginBottom: 12, fontWeight: 600,
            fontFamily: "sans-serif", fontSize: 15 }}>
          Sign In
        </button>

        <button onClick={handleGoogle}
          style={{ width: "100%", background: "rgba(255,255,255,.07)",
            color: "white", border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 10, padding: "12px 0", cursor: "pointer",
            fontFamily: "sans-serif", fontSize: 15 }}>
          Continue with Google
        </button>
      </div>
    </div>
  );
}