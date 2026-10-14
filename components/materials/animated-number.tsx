"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/** Animate on viewport entry; assistive technology reads only the final value. */
export function useViewportAnimation<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(([entry]) => {
      if (media.matches || entry.intersectionRatio >= 0.35) setActive(true);
      else if (!entry.isIntersecting) setActive(false);
    }, { threshold: [0, 0.35] });
    const changed = () => { if (media.matches) setActive(true); };
    observer.observe(element);
    media.addEventListener("change", changed);
    return () => { observer.disconnect(); media.removeEventListener("change", changed); };
  }, []);
  return { ref, active };
}

export function AnimatedNumber({ value, sequence = 0 }: { value: number; sequence?: number }) {
  const { ref, active } = useViewportAnimation<HTMLSpanElement>();
  const label = new Intl.NumberFormat("en-US", { maximumFractionDigits: 20 }).format(value);
  return <span ref={ref} className="rolling-number" data-active={active} role="img" aria-label={label}>
    <span aria-hidden="true" className="rolling-number-digits">
      {[...label].map((character, index) => {
        if (!/\d/.test(character)) return <span key={index}>{character}</span>;
        const steps = 20 + (index % 3) * 10 + Number(character);
        return <span className="rolling-digit" key={index}>
          <span className="rolling-digit-track" style={{ "--digit-steps": steps, "--digit-delay": `${sequence * 165 + index * 95}ms`, "--digit-duration": `${1180 + (index % 3) * 230 + (sequence % 3) * 130}ms` } as CSSProperties}>
            {Array.from({ length: steps + 1 }, (_, step) => <span key={step}>{step % 10}</span>)}
          </span>
        </span>;
      })}
    </span>
  </span>;
}
