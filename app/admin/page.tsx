import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthGate } from "@/components/accounts/auth-gate";
import { AdminPage } from "@/components/accounts/admin-page";
export const metadata: Metadata = { title: "Account Administration" };
export default function Page() {
  return (
    <Suspense>
      <AuthGate admin>
        <AdminPage />
      </AuthGate>
    </Suspense>
  );
}
