"use client";
import Link from "next/link";
import { ArrowRight, ArrowDown, Pause, Play } from "lucide-react";
import { useEffect, useRef } from "react";
import { Container } from "./foundations";

export function PressureHero({
  paused,
  onPausedChange,
}: {
  paused: boolean;
  onPausedChange: (paused: boolean) => void;
}) {
  const section = useRef<HTMLElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const paint = () => {
      frame = 0;
      if (!section.current || !scene.current) return;
      const bounds = section.current.getBoundingClientRect();
      const travel = section.current.offsetHeight - scene.current.offsetHeight;
      const headerHeight =
        parseFloat(
          getComputedStyle(scene.current).getPropertyValue("--nav-height"),
        ) || 78;
      const progress =
        paused || media.matches || travel <= 0
          ? 0
          : Math.max(0, Math.min(1, (headerHeight - bounds.top) / travel));
      scene.current.style.setProperty("--zoom", String(1 + progress * 2.5));
      scene.current.style.setProperty(
        "--intro-opacity",
        String(1 - Math.min(1, progress * 2)),
      );
      scene.current.style.setProperty(
        "--intro-visibility",
        progress > 0.5 ? "hidden" : "visible",
      );
      scene.current.style.setProperty(
        "--story-opacity",
        String(Math.max(0, Math.min(1, (progress - 0.48) * 3))),
      );
      scene.current.style.setProperty(
        "--light-scale",
        String(1 + progress * 15),
      );
      scene.current.style.setProperty(
        "--light-opacity",
        String(progress * 0.55),
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", schedule);
    };
  }, [paused]);
  return (
    <section
      className={`pressure-hero${paused ? " motion-paused" : ""}`}
      ref={section}
      aria-label="Discover materials under pressure"
    >
      <div className="pressure-scene" ref={scene}>
        <div className="anvil-image-layer" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- Optimized static JPEG; scroll transforms use one image without an image service. */}
          <img
            src="/images/diamond-anvil-cell.jpg"
            alt=""
            width={1672}
            height={941}
            fetchPriority="high"
            className="anvil-image"
          />
        </div>
        <div className="sample-light" aria-hidden="true" />
        <Container>
          <div className="pressure-intro">
            <span className="dark-eyebrow">
              CALYPSO · HIGH-PRESSURE MATERIALS
            </span>
            <h1>
              Discover materials.
              <br />
              <span>Under pressure.</span>
            </h1>
            <p>
              A different world, hidden in the same elements.
              <br className="desktop-break" /> Explore the structures and
              possibilities that pressure reveals.
            </p>
            <div className="pressure-hero-actions">
              <Link href="/explore" className="primary-link">
                Start exploring <ArrowRight size={17} />
              </Link>
              <a href="#pressure-science" className="dark-text-link">
                Why pressure? <ArrowDown size={15} />
              </a>
            </div>
            <span className="hero-discipline">
              CRYSTAL STRUCTURES / PHASES / THERMODYNAMICS
            </span>
          </div>
          <div className="pressure-story" aria-hidden="true">
            <span className="dark-eyebrow">
              A SMALL SAMPLE. A NEW PERSPECTIVE.
            </span>
            <h2>
              Change the pressure.
              <br />
              Expand the possible.
            </h2>
            <p>
              Between two diamond anvils, a tiny sample becomes a window into
              matter at extreme conditions.
            </p>
          </div>
        </Container>
        <div className="scene-caption">
          <span>
            Diamond anvil cell <span className="caption-divider">/</span>{" "}
            Conceptual illustration
          </span>
          <button
            type="button"
            onClick={() => onPausedChange(!paused)}
            aria-label={
              paused ? "Enable scroll animation" : "Pause scroll animation"
            }
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
            <span>{paused ? "Animation paused" : "Scroll to discover"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
