"use client";
import { useEffect, type RefObject } from "react";
import { revealProgress } from "@/lib/materials/scroll-reveal";

export function useScrollReveal(
  root: RefObject<HTMLElement | null>,
  paused: boolean,
) {
  useEffect(() => {
    const page = root.current;
    if (!page) return;
    let items: HTMLElement[] = [];
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const paint = () => {
      frame = 0;
      const height = window.innerHeight;
      const active = !paused && !media.matches;
      const viewportTop =
        document.querySelector(".site-header")?.getBoundingClientRect()
          .bottom ?? 0;
      for (const item of items) {
        const bounds = item.getBoundingClientRect();
        // Remove our current translation from measurements, including CSS transitions.
        // Otherwise measuring the animated position creates a feedback loop on scroll.
        const transform = getComputedStyle(item).transform;
        const translation =
          transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42;
        const { entrance, opacity } = revealProgress({
          top: bounds.top - translation,
          bottom: bounds.bottom - translation,
          viewportTop,
          viewportBottom: height,
          step: Number(item.dataset.revealStep) || 0,
        });
        const visible = active ? opacity : 1;
        item.style.setProperty("--reveal-opacity", String(visible));
        item.style.setProperty(
          "--reveal-offset",
          `${active ? (1 - entrance) * 52 : 0}px`,
        );
        item.style.setProperty(
          "--reveal-blur",
          `${active ? (1 - visible) * 1.5 : 0}px`,
        );
        item.classList.toggle("reveal-active", active);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const resize = new ResizeObserver(schedule);
    const refresh = () => {
      const next = [...page.querySelectorAll<HTMLElement>("[data-reveal]")];
      for (const item of items)
        if (!next.includes(item)) resize.unobserve(item);
      items = next;
      items.forEach((item) => resize.observe(item));
      schedule();
    };
    // Route content, form feedback and API states may change after hydration.
    const changes = new MutationObserver(refresh);
    changes.observe(page, { childList: true, subtree: true });
    resize.observe(page);
    refresh();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      changes.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", schedule);
      items.forEach((item) => item.classList.remove("reveal-active"));
    };
  }, [root, paused]);
}
