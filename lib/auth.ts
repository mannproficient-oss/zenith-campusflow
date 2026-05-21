import {
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, db, googleProvider } from "./firebase";

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const userRef = ref(db, "users/" + user.uid);
  const snap = await get(userRef);

  if (!snap.exists()) {
    await set(userRef, {
      uid:      user.uid,
      name:     user.displayName,
      email:    user.email,
      role:     "intern",
      isOnDuty: false,
      photoURL: user.photoURL,
    });
  }
  return user;
};

export const loginWithEmail = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const logout = () => signOut(auth);