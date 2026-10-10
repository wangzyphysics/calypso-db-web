"use client";
import { useRef } from "react";
import { useScrollReveal } from "./scroll-reveal";

export function ScrollRevealPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  const root = useRef<HTMLElement>(null);
  useScrollReveal(root, false);
  return (
    <main id="main-content" className={className} ref={root}>
      {children}
    </main>
  );
}
