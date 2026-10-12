import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthGate } from "@/components/accounts/auth-gate";
import { AccountPage } from "@/components/accounts/account-page";
export const metadata: Metadata = { title: "My Account" };
export default function Page() {
  return (
    <Suspense>
      <AuthGate>
        <AccountPage />
      </AuthGate>
    </Suspense>
  );
}
