"use client";
import Link from "next/link";
import { useAuth } from "./auth-context";
export function AccountNavigation({
  active,
}: {
  active: "profile" | "settings" | "contributions" | "admin";
}) {
  const { user } = useAuth();
  return (
    <nav className="account-tabs" aria-label="Account navigation">
      {[
        { id: "profile", href: "/account", label: "Profile" },
        { id: "contributions", href: "/workspace", label: "My contributions" },
        {
          id: "settings",
          href: "/account?tab=settings",
          label: "Account settings",
        },
        ...(user?.role === "admin"
          ? [{ id: "admin", href: "/admin", label: "Administration" }]
          : []),
      ].map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={active === item.id ? "active" : ""}
          aria-current={active === item.id ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
export function TestModeNotice() {
  const { mode } = useAuth();
  return mode === "local-test" ? (
    <p className="account-test-notice">
      Local test mode · Profiles and roles stay on this device. This mode does
      not authenticate a real user or protect a server.
    </p>
  ) : null;
}
