"use client";
import Link from "next/link";
import { Fragment, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "./auth-context";
import { Container } from "@/components/materials/foundations";
import { loginHref } from "@/lib/accounts/model";
export function AuthGate({
  children,
  admin = false,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) {
  const auth = useAuth(),
    router = useRouter(),
    pathname = usePathname();
  useEffect(() => {
    if (!auth.loading && !auth.user && !auth.error)
      router.replace(
        loginHref(
          window.location.pathname +
            window.location.search +
            window.location.hash,
        ),
      );
  }, [auth.loading, auth.user, auth.error, pathname, router]);
  if (auth.loading || !auth.user)
    return (
      <main id="main-content" className="account-page">
        <Container>
          <div className="account-state" role={auth.error ? "alert" : "status"}>
            <LockKeyhole size={24} />
            <h1>
              {auth.error
                ? "Sign-in service unavailable"
                : "Checking your access…"}
            </h1>
            <p>
              {auth.error ||
                "Sign in to explore materials and manage your contributions."}
            </p>
            {auth.error && (
              <button
                className="primary-link"
                onClick={() => void auth.refresh()}
              >
                Try again
              </button>
            )}
            <Link className="text-link" href="/">
              Return home
            </Link>
          </div>
        </Container>
      </main>
    );
  if (admin && auth.user.role !== "admin")
    return (
      <main id="main-content" className="account-page">
        <Container>
          <div className="account-state">
            <LockKeyhole size={28} />
            <h1>Administrator access required</h1>
            <p>
              Your account can explore materials and manage its own
              contributions. Contact database@calypso.cn to discuss
              administrative access.
            </p>
            <Link className="primary-link" href="/account">
              My account
            </Link>
          </div>
        </Container>
      </main>
    );
  return <Fragment key={auth.ownerKey}>{children}</Fragment>;
}
