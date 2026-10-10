import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchWorkspace } from "@/components/materials/search-workspace";
import { Container, LoadingSkeleton } from "@/components/materials/foundations";
export const metadata: Metadata = { title: "Explore Materials" };
export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <main id="main-content" className="workspace-page">
          <Container>
            <LoadingSkeleton label="Loading the discovery workspace" />
          </Container>
        </main>
      }
    >
      <SearchWorkspace />
    </Suspense>
  );
}
