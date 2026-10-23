import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthGate } from "@/components/accounts/auth-gate";
import { MaterialDetailPage } from "@/components/materials/material-detail-page";

export const metadata: Metadata = { title: "Structure record" };
export default async function RecordPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  return (
    <Suspense
      fallback={
        <main id="main-content" className="structure-page">
          <p role="status">Loading structure workspace…</p>
        </main>
      }
    >
      <AuthGate>
        <MaterialDetailPage recordId={recordId} />
      </AuthGate>
    </Suspense>
  );
}
