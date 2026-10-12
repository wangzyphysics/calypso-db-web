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
  ["contribution-guide", "Contribution guide"],
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
                connected dataset. Integration with the existing VASP scripts is
                planned; the workflow stages, functional and numerical settings
                remain to be confirmed with the supplied protocol.
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
            <section
              id="contribution-guide"
              className="knowledge-section"
              data-reveal
            >
              <div className="knowledge-section-heading">
                <BookOpen size={23} />
                <h2>Contribution guide</h2>
              </div>
              <p>
                Prepare experimental spectra, physical-property curves or
                theoretical structures as one batch. Multiple files and ordinary
                ZIP archives are supported; original instrument files and images
                are retained as attachments.
              </p>
              <h3>Files, records and conditions</h3>
              <p>
                Use the downloadable CSV manifest to associate a file with a
                record ID, sample ID, formula, pressure in GPa, temperature in
                K, method and source. Include all files, using the attachment
                data type for unparsed originals. Phase assignment and structure
                association are optional; neither is inferred from filenames or
                composition.
              </p>
              <p>
                One original table may supply multiple curve records. Repeat its
                file path with distinct record IDs and choose X/Y columns by
                header name or zero-based index. Each curve keeps its own
                pressure, temperature, coordinate quantities, units and
                processing state. Raw and derived curves remain separately
                identified.
              </p>
              <p className="knowledge-note">
                Numeric previews accept CSV, TXT, TSV and XY, with up to 10,000
                points and 64 columns. No smoothing, fitting or structure
                interpolation is applied. ZIP import supports stored/deflated
                files with UTF-8 or ASCII paths; encrypted, multipart and ZIP64
                archives are unsupported.
              </p>
              <h3>Visibility and processing</h3>
              <p>
                New drafts default to private. A public-after-review selection
                records the contributor's intent: only approved, explicitly
                public records may enter public search. Private records, files,
                logs and metadata require owner or authorized-reviewer access.
                Processing authorization is separate and never makes private
                data public.
              </p>
              <p>
                Public theoretical contributions awaiting platform
                standardization will use a red star with text explaining their
                status. Experimental contributions retain their measurement
                origin. Approval, publication, VASP calculation, quality checks
                and standardized ingestion have independent states.
              </p>
              <h3>Local drafts and future workflows</h3>
              <p>
                Saving stores the batch in this browser's IndexedDB. JSON export
                includes original file bytes, SHA-256 checksums and scientific
                context. Import verifies checksums; earlier single-structure
                JSON drafts can also be opened. Browser data clearing may remove
                local drafts, so retain an exported copy.
              </p>
              <p>
                Account, submission, review and workflow services are not
                connected. The personal workspace shows saved drafts and honest
                not-submitted states. The VASP adapter will report real stage
                and attempt events; percentages describe completed required
                steps, not elapsed-time predictions or SCF-iteration ratios.
              </p>
              <Link href="/contribute" className="text-link">
                Prepare a batch <ArrowRight size={15} />
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
