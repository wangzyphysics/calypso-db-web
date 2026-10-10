import Link from "next/link";
import { Container, EmptyState } from "@/components/materials/foundations";
export default function NotFound() {
  return (
    <main id="main-content" className="workspace-page">
      <Container>
        <EmptyState
          title="This page is not available"
          description="Return to the homepage or explore material discovery."
        >
          <Link className="text-link" href="/">
            Return home
          </Link>
        </EmptyState>
      </Container>
    </main>
  );
}
