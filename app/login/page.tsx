import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginPage } from "@/components/accounts/login-page";
export const metadata: Metadata = { title: "Sign in" };
export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
