import { Suspense } from "react";
import type { Metadata } from "next";
import { SignupPage } from "@/components/accounts/signup-page";
export const metadata: Metadata = { title: "Sign up" };
export default function Page() {
  return (
    <Suspense>
      <SignupPage />
    </Suspense>
  );
}
