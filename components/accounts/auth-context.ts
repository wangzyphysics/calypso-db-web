"use client";
import { createContext, useContext } from "react";
import type {
  AccountUser,
  Profile,
  LoginMethod,
  Registration,
} from "@/lib/accounts/model";

export type Mode = "unconfigured" | "local-test" | "service";
export type AuthContextValue = {
  mode: Mode;
  loading: boolean;
  user: AccountUser | null;
  error: string;
  providers: LoginMethod[];
  csrf: string;
  ownerKey: string;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  signInTest: (id: string) => void;
  registerTest: (input: Registration) => Promise<void>;
  signInRegisteredTest: (identity: string, password: string) => Promise<void>;
  saveProfile: (
    profile: Profile,
    expectedVersion: string,
  ) => Promise<AccountUser>;
  acceptSession: (session: {
    user: AccountUser | null;
    csrfToken: string;
    expiresAt: string;
  }) => void;
};
export const AuthContext = createContext<AuthContextValue | null>(null);
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("Account context is unavailable.");
  return auth;
}
