"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  contactEmail,
  contactHref,
  placeholderTeam,
} from "@/lib/materials/site-information";
import { useScrollReveal } from "./scroll-reveal";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  ChartNoAxesCombined,
  Network,
  ScanLine,
  Atom,
  Layers3,
  Orbit,
  Mail,
  UserRoundPlus,
  Handshake,
  MessageSquare,
} from "lucide-react";
import { Container, FeatureCard, SectionHeader } from "./foundations";
import { DatabaseOverview, useDatabaseStatistics } from "./data-sections";
import { PressureHero } from "./pressure-hero";
import { CommunityMap } from "./community-map";

export function Homepage() {
  const root = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  useScrollReveal(root, paused);
  const resource = useDatabaseStatistics();
  const data = resource.state.status === "ready" ? resource.state.data : null;
  return (
    <main id="main-content" className="discovery-home" ref={root}>
      <PressureHero paused={paused} onPausedChange={setPaused} />
      <Container>
        <DatabaseOverview resource={resource} />
        <section
          className="pressure-science content-section"
          id="pressure-science"
        >
          <div className="science-introduction" data-reveal>
            <span className="eyebrow">PRESSURE AS A DISCOVERY DIMENSION</span>
            <h2>
              The same elements.
              <br />
              <span>New possibilities.</span>
            </h2>
            <p>
              Pressure changes interatomic distances and can alter bonding,
              symmetry and electronic behavior. Exploring those changes opens
              another dimension of materials research.
            </p>
            <Link href="/explore" className="text-link">
              Explore the materials workspace <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="science-topics">
            <article data-reveal>
              <span className="topic-icon">
                <Atom size={24} />
              </span>
              <div>
                <span className="topic-index">01 / STRUCTURE</span>
                <h3>Look beyond ambient conditions.</h3>
                <p>
                  Discover how atomic arrangements respond to compression, with
                  each structure anchored to its recorded pressure.
                </p>
              </div>
            </article>
            <article data-reveal>
              <span className="topic-icon">
                <Layers3 size={24} />
              </span>
              <div>
                <span className="topic-index">02 / PHASES</span>
                <h3>Understand what can change.</h3>
                <p>
                  Compare candidate phases. Reliable stability conclusions
                  require thermodynamic evidence, beyond the existence of a
                  record.
                </p>
              </div>
            </article>
            <article data-reveal>
              <span className="topic-icon">
                <Orbit size={24} />
              </span>
              <div>
                <span className="topic-index">03 / PROPERTIES</span>
                <h3>Connect structure to behavior.</h3>
                <p>
                  Bring crystal geometry and physical properties into one
                  scientific context, from compression to diffraction.
                </p>
              </div>
            </article>
          </div>
        </section>
        <section
          className="content-section tools-section"
          id="scientific-tools"
        >
          <div data-reveal>
            <SectionHeader
              number="02"
              title="Explore Scientific Data"
              description="A foundation for understanding materials under extreme conditions."
            />
          </div>
          <div className="feature-grid">
            <FeatureCard
              icon={Box}
              revealStep={0}
              title="Crystal Structures"
              description="Explore lattice geometry, atomic positions and crystal symmetry."
              href="/explore"
              action="Explore structure records →"
            />
            <FeatureCard
              icon={Network}
              revealStep={1}
              title="Pressure-Dependent Phase Stability"
              description="Follow phase relationships using verified comparative evidence."
            />
            <FeatureCard
              icon={ChartNoAxesCombined}
              revealStep={2}
              title="Enthalpy & Equation of State"
              description="Compare thermodynamics and compression at recorded conditions."
            />
            <FeatureCard
              icon={ScanLine}
              revealStep={3}
              title="X-ray Diffraction"
              description="Connect crystal structures to simulated diffraction signatures."
            />
          </div>
          <div
            className="discovery-invitation"
            aria-label="Start a materials exploration"
            data-reveal
          >
            <div>
              <h3>Begin with a question.</h3>
              <p>
                Find a composition. Choose a symmetry. Explore a pressure range.
              </p>
            </div>
            <Link href="/explore" className="text-link">
              Start exploring <ArrowRight size={16} />
            </Link>
          </div>
        </section>
        <CommunityMap community={data?.community} demoCommunity={data?.communityDemo} />
        <section className="team-section content-section" id="team" data-reveal>
          <SectionHeader number="03" title="About Us" />
          <div className="team-names" aria-label="Placeholder team names">
            {placeholderTeam.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
          <p className="placeholder-note">
            Placeholder names · the team roster will be updated.
          </p>
        </section>
        <section className="join-section contact-section" id="join-us">
          <div data-reveal>
            <span className="eyebrow">JOIN US / GET IN TOUCH</span>
            <h2>
              Good science starts
              <br />
              with a conversation.
            </h2>
            <a className="contact-email" href={`mailto:${contactEmail}`}>
              <Mail size={19} />
              {contactEmail}
            </a>
          </div>
          <div className="contact-channels" data-reveal data-reveal-step="1">
            <a href={contactHref("Join the team")}>
              <UserRoundPlus size={19} />
              <span>
                <strong>Join the team</strong>
                <small>Methods, materials and scientific software.</small>
              </span>
              <ArrowUpRight size={16} />
            </a>
            <a href={contactHref("Research collaboration")}>
              <Handshake size={19} />
              <span>
                <strong>Research collaboration</strong>
                <small>Questions and ideas worth exploring together.</small>
              </span>
              <ArrowUpRight size={16} />
            </a>
            <a href={contactHref("Website feedback")}>
              <MessageSquare size={19} />
              <span>
                <strong>Feedback & support</strong>
                <small>Report an issue or suggest an improvement.</small>
              </span>
              <ArrowUpRight size={16} />
            </a>
          </div>
        </section>
      </Container>
    </main>
  );
}
