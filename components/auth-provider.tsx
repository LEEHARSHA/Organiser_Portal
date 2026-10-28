"use client";

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "@firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { firebaseConfigError, getCommunityAuth } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function authMessage(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "The email address or password is incorrect.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a little while, then try again.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/email-already-in-use":
      return "An account already exists for this email address. Sign in instead.";
    case "auth/weak-password":
      return "Choose a stronger password with at least 6 characters.";
    case "auth/operation-not-allowed":
      return "Email and password sign-in is not enabled for this Firebase project.";
    case "auth/network-request-failed":
      return "Firebase could not be reached. Check your connection and retry.";
    default:
      return error instanceof Error ? error.message : "Firebase Authentication failed.";
  }
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is missing.");
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!firebaseConfigError());
  const [configError] = useState(firebaseConfigError);

  useEffect(() => {
    if (configError) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void Promise.resolve()
      .then(() => getCommunityAuth())
      .then((auth) => {
        if (!active) return;
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (!active) return;
          setUser(currentUser);
          setLoading(false);
        }, () => {
          if (!active) return;
          setUser(null);
          setLoading(false);
        });
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [configError]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(getCommunityAuth(), email.trim(), password);
    } catch (error) {
      throw new Error(authMessage(error));
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(getCommunityAuth(), email.trim(), password);
    } catch (error) {
      throw new Error(authMessage(error));
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(getCommunityAuth());
    } catch (error) {
      throw new Error(authMessage(error));
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(getCommunityAuth(), email.trim());
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
      if (code === "auth/user-not-found") return;
      throw new Error(authMessage(error));
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, configError, signIn, signUp, signOut, resetPassword }),
    [user, loading, configError, signIn, signUp, signOut, resetPassword],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
