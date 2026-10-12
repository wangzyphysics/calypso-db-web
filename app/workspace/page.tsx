import { Suspense } from "react";
import { AuthGate } from "@/components/accounts/auth-gate";
import type { Metadata } from "next";
import { MyContributions } from "@/components/materials/my-contributions";
export const metadata: Metadata = { title: "My Contributions" };
export default function WorkspacePage() {
  return (
    <Suspense>
      <AuthGate>
        <MyContributions />
      </AuthGate>
    </Suspense>
  );
}
