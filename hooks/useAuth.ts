"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { auth, db } from "@/lib/firebase";

export function useAuth() {
  const [user,    setUser]    = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const userRef = ref(db, "users/" + firebaseUser.uid);
      onValue(userRef, (snap) => {
        setProfile(snap.exists() ? snap.val() : null);
        setLoading(false);
      });
    });
    return unsub;
  }, []);

  return { user, profile, loading, role: profile?.role };
}