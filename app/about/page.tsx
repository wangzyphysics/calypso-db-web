import type { Metadata } from "next";
import { ScrollRevealPage } from "@/components/materials/scroll-reveal-page";
import Link from "next/link";
import { Box, Layers, Gauge } from "lucide-react";
import { Container } from "@/components/materials/foundations";
export const metadata: Metadata = { title: "About the Database" };
export default function AboutPage() {
  return (
    <ScrollRevealPage className="about-page">
      <Container>
        <header className="about-heading" data-reveal>
          <span className="eyebrow">CALYPSO MATERIALS DATABASE</span>
          <h1>
            A pressure-centered view
            <br />
            of materials science.
          </h1>
          <p>
            The CALYPSO High-Pressure Materials Database is being developed as a
            research platform for exploring computational crystal structures and
            their pressure-dependent properties.
          </p>
        </header>
        <div className="about-principles">
          <article data-reveal>
            <Box size={25} />
            <h2>Structure in context</h2>
            <p>
              A structure belongs to a specific material, phase, and calculation
              record. Its pressure and provenance are part of the scientific
              result.
            </p>
          </article>
          <article data-reveal>
            <Layers size={25} />
            <h2>Evidence before stability</h2>
            <p>
              The existence of a crystal structure record does not establish
              thermodynamic stability. Stability requires reliable comparative
              evidence.
            </p>
          </article>
          <article data-reveal>
            <Gauge size={25} />
            <h2>Pressure with precision</h2>
            <p>
              Pressure-dependent information must refer to an available
              structure record. Requested pressure and recorded pressure are
              distinct.
            </p>
          </article>
        </div>
        <section data-reveal className="about-copy" id="data-and-citation">
          <h2>Data &amp; Citation</h2>
          <div>
            <p>
              This independent platform currently has no connected materials
              dataset. Database counts, material previews, and scientific
              analyses will become available when verified data and their
              provenance are supplied.
            </p>
            <p>
              Dataset-specific citation guidance, publications, ownership, and
              licensing will be published after they are verified. Calculation
              methods, source information and release notes are grouped in the
              documentation space. Homepage team names are placeholders.
            </p>
            <Link href="/docs#citation" className="text-link">
              Documentation &amp; citation
            </Link>
          </div>
        </section>
        <section data-reveal className="about-copy">
          <h2>Available in this release</h2>
          <div>
            <p>
              Composition and identifier search, a synchronized periodic table,
              pressure and symmetry filters, and a shared design system
              establish the foundation for future scientific tools. Search
              execution awaits a verified backend.
            </p>
            <p>
              Crystal viewers, linked pressure exploration, phase comparisons,
              enthalpy and equation-of-state plots, and simulated diffraction
              are planned for subsequent phases.
            </p>
            <Link href="/explore" className="text-link">
              Explore Materials
            </Link>
            <Link href="/#team" className="text-link about-team-link">
              Meet the team
            </Link>
          </div>
        </section>
      </Container>
    </ScrollRevealPage>
  );
}
