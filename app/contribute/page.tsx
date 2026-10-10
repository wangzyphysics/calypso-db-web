import type { Metadata } from "next";
import { ContributionWorkspace } from "@/components/materials/contribution-workspace";
export const metadata: Metadata = { title: "Contribute Data" };
export default function ContributePage() {
  return <ContributionWorkspace />;
}
