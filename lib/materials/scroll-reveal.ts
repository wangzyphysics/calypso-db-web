type RevealBounds = {
  top: number;
  bottom: number;
  viewportTop: number;
  viewportBottom: number;
  step?: number;
};

function smooth(value: number) {
  const progress = Math.max(0, Math.min(1, value));
  return progress * progress * (3 - 2 * progress);
}

// A full viewport is the reading area. Only partially entering/leaving content
// transitions at its edges; a fully visible heading or card is always clear.
export function revealProgress({
  top,
  bottom,
  viewportTop,
  viewportBottom,
  step = 0,
}: RevealBounds) {
  if (top >= viewportTop && bottom <= viewportBottom)
    return { entrance: 1, opacity: 1 };
  const edge = Math.min(
    200,
    Math.max(120, (viewportBottom - viewportTop) * 0.22),
    Math.max(64, bottom - top),
  );
  const entrance = smooth(
    (viewportBottom - top) / (edge + Math.max(0, Math.min(3, step)) * 8),
  );
  const exit = smooth((bottom - viewportTop) / (edge * 0.65));
  return { entrance, opacity: Math.min(entrance, exit) };
}
