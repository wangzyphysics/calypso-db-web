import { Suspense } from "react";
import { AuthGate } from "@/components/accounts/auth-gate";
import type { Metadata } from "next";
import { ContributionWorkspace } from "@/components/materials/contribution-workspace";
export const metadata: Metadata = { title: "Contribute Data" };
export default function ContributePage() {
  return (
    <Suspense>
      <AuthGate>
        <ContributionWorkspace />
      </AuthGate>
    </Suspense>
  );
}
