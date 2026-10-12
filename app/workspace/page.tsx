import type { Metadata } from "next";
import { MyContributions } from "@/components/materials/my-contributions";
export const metadata: Metadata = { title: "My Contributions" };
export default function WorkspacePage() {
  return <MyContributions />;
}
