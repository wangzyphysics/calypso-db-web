import type { Metadata } from "next";
import { ScrollRevealPage } from "@/components/materials/scroll-reveal-page";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  FlaskConical,
  Database,
  Quote,
  History,
  ArrowRight,
} from "lucide-react";
import { Container } from "@/components/materials/foundations";
import { platformUpdates } from "@/lib/materials/site-information";
import {
  elementReferenceRetrieved,
  elementReferenceSource,
} from "@/lib/materials/element-reference";

export const metadata: Metadata = { title: "Documentation & Updates" };
const sections = [
  ["methods", "Calculation methods"],
  ["sources", "Data sources"],
  ["citation", "Citation & reuse"],
  ["updates", "Updates"],
];
export default function DocumentationPage() {
  return (
    <ScrollRevealPage className="knowledge-page">
      <Container>
        <header className="knowledge-heading" data-reveal>
          <span className="eyebrow">THE SCIENCE BEHIND THE DATA</span>
          <h1>Context makes data useful.</h1>
          <p>
            Methods, provenance and updates. A clear record of what the database
            contains and how its scientific information is produced.
          </p>
        </header>
        <div className="knowledge-layout">
          <aside className="knowledge-navigation">
            <span>ON THIS PAGE</span>
            <nav aria-label="Documentation sections">
              {sections.map(([id, label]) => (
                <a href={`#${id}`} key={id}>
                  {label}
                </a>
              ))}
            </nav>
            <Link href="/contribute">
              Contribute data <ArrowUpRight size={14} />
            </Link>
          </aside>
          <div className="knowledge-content">
            <section id="methods" className="knowledge-section" data-reveal>
              <div className="knowledge-section-heading">
                <FlaskConical size={23} />
                <h2>Calculation methods</h2>
                <span className="publication-status">To be published</span>
              </div>
              <p>
                Verified calculation protocols will be published with the
                connected dataset. No calculation software, functional or
                numerical setting is assumed at this stage.
              </p>
              <div className="method-fields">
                <span>Software & version</span>
                <span>Exchange-correlation treatment</span>
                <span>Pseudopotentials / basis</span>
                <span>Cutoff & sampling</span>
                <span>Relaxation & convergence</span>
                <span>Pressure & provenance</span>
              </div>
              <p className="knowledge-note">
                Each structure will retain its exact recorded conditions. The
                existence of a record does not establish phase stability.
              </p>
            </section>
            <section id="sources" className="knowledge-section" data-reveal>
              <div className="knowledge-section-heading">
                <Database size={23} />
                <h2>Data sources</h2>
                <span className="publication-status">To be published</span>
              </div>
              <p>
                No materials dataset has been connected yet. Dataset origin,
                contributor attribution, calculation provenance and release
                coverage will be documented here when confirmed.
              </p>
              <article className="reference-source">
                <BookOpen size={20} />
                <div>
                  <h3>Periodic-table reference information</h3>
                  <p>
                    Element identities, reference atomic masses, electron
                    configurations, electronegativity and oxidation states come
                    from NCBI PubChem. Missing values and prediction qualifiers
                    are retained.
                  </p>
                  <a
                    href={elementReferenceSource}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PubChem periodic table <ArrowUpRight size={13} />
                  </a>
                  <small>
                    Reference snapshot: {elementReferenceRetrieved}. This
                    reference information is separate from the materials
                    database.
                  </small>
                </div>
              </article>
            </section>
            <section id="citation" className="knowledge-section" data-reveal>
              <div className="knowledge-section-heading">
                <Quote size={23} />
                <h2>Citation & reuse</h2>
                <span className="publication-status">To be published</span>
              </div>
              <p>
                Dataset-specific citations, licensing and permitted reuse will
                be published after verification. A platform name alone cannot
                replace the attribution required by a scientific record.
              </p>
              <Link href="/contribute" className="text-link">
                Preparing a contribution? Include its source.{" "}
                <ArrowRight size={15} />
              </Link>
            </section>
            <section id="updates" className="knowledge-section">
              <div className="knowledge-section-heading" data-reveal>
                <History size={23} />
                <h2>Updates</h2>
              </div>
              <div className="database-update-pending" data-reveal>
                <span className="publication-status">
                  Database releases pending
                </span>
                <h3>Scientific data release log</h3>
                <p>
                  Dataset additions, corrections, methods changes and record
                  counts will be listed here after a verified data release.
                </p>
              </div>
              <h3 className="platform-update-label">Platform updates</h3>
              <p className="knowledge-note">
                Local interface development. These entries do not represent new
                scientific data.
              </p>
              <ol className="release-list">
                {platformUpdates.map((release, index) => (
                  <li key={`${release.date}-${index}`} data-reveal>
                    <time dateTime={release.date}>{release.date}</time>
                    <div>
                      <h4>{release.title}</h4>
                      <ul>
                        {release.changes.map((change) => (
                          <li key={change}>{change}</li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </Container>
    </ScrollRevealPage>
  );
}
