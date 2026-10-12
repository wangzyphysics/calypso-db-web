"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Files, LogOut, Settings2, ShieldCheck, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "./auth-context";
export function AccountMenu() {
  const auth = useAuth(),
    router = useRouter(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (!auth.user)
    return (
      <div className="guest-account-links">
        <Link
          className="header-sign-in"
          href="/login?returnTo=%2Faccount"
          aria-label="Sign in"
        >
          <UserRound size={18} />
          <span>{auth.loading ? "Account" : "Sign in"}</span>
        </Link>
        {!auth.loading && (
          <Link href="/signup" className="header-sign-up">
            Sign up
          </Link>
        )}
      </div>
    );
  async function logout() {
    if (
      document.querySelector('[data-unsaved="true"]') &&
      !window.confirm(
        "Discard unsaved changes and sign out? Export or save your draft first to keep a copy.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await auth.signOut();
      router.push("/");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="account-menu-trigger"
        aria-label="Open account menu"
      >
        <span>{auth.user.profile.displayName.slice(0, 1).toUpperCase()}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="account-dropdown">
        <DropdownMenuLabel>
          <strong>{auth.user.profile.displayName}</strong>
          <small>
            {auth.mode === "local-test"
              ? "LOCAL TEST ACCOUNT"
              : auth.user.email || auth.user.loginLabel || "CALYPSO account"}
          </small>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserRound />
            My profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/workspace">
            <Files />
            My contributions
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account?tab=settings">
            <Settings2 />
            Account settings
          </Link>
        </DropdownMenuItem>
        {auth.user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldCheck />
              Administration
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={busy}
          onSelect={(e) => {
            e.preventDefault();
            void logout();
          }}
        >
          <LogOut />
          {busy ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
        {error && (
          <p role="alert" className="account-menu-error">
            {error}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
