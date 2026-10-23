"use client";
import { useId, useMemo, useRef, useState } from "react";
import { Expand, RotateCcw, Tags, ZoomIn, ZoomOut, Move } from "lucide-react";
import {
  elementColor,
  fractionalToCartesian,
  magnitude,
  rotatePoint,
  orientForView,
  type StructureCell,
  type Vector3,
} from "@/lib/materials/detail";

const corners: Vector3[] = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [1, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 1],
];
const edges = corners.flatMap((v, i) =>
  corners.flatMap((w, j) =>
    j > i && v.reduce((n, x, k) => n + (x !== w[k] ? 1 : 0), 0) === 1
      ? [[i, j]]
      : [],
  ),
);
export function CrystalViewer({ cell }: { cell: StructureCell }) {
  const id = useId().replace(/:/g, ""),
    [yaw, setYaw] = useState(-0.65),
    [pitch, setPitch] = useState(0.4),
    [zoom, setZoom] = useState(1),
    [labels, setLabels] = useState(false),
    [showCell, setShowCell] = useState(true),
    [selected, setSelected] = useState<number | null>(null);
  const drag = useRef<{
    x: number;
    y: number;
    yaw: number;
    pitch: number;
    moved: boolean;
    site: number | null;
  } | null>(null);
  const geometry = useMemo(() => {
    const center = fractionalToCartesian([0.5, 0.5, 0.5], cell.lattice);
    const centered = (frac: Vector3): Vector3 =>
      orientForView(
        fractionalToCartesian(frac, cell.lattice).map(
          (v, i) => v - center[i],
        ) as Vector3,
        cell.lattice,
      );
    const vertices = corners.map(centered),
      radius = Math.max(...vertices.map(magnitude), 0.1);
    return {
      vertices,
      positions:
        cell.siteCount <= 2000
          ? cell.sites.map((s) => centered(s.frac_coords))
          : [],
      radius,
    };
  }, [cell]);
  const rotatedCorners = geometry.vertices.map((v) =>
    rotatePoint(v, yaw, pitch),
  );
  const spanX =
    Math.max(...rotatedCorners.map((v) => v[0])) -
    Math.min(...rotatedCorners.map((v) => v[0]));
  const spanY =
    Math.max(...rotatedCorners.map((v) => v[1])) -
    Math.min(...rotatedCorners.map((v) => v[1]));
  const scale =
    Math.min(460 / Math.max(spanX, 0.1), 260 / Math.max(spanY, 0.1)) * zoom;
  const project = (v: Vector3) => {
    const r = rotatePoint(v, yaw, pitch);
    return {
      x: 300 + r[0] * scale,
      y: 190 - r[1] * scale,
      depth: r[2] / geometry.radius,
    };
  };
  const vertices = geometry.vertices.map(project);
  const sites = geometry.positions
    .map((p, i) => ({ ...project(p), i, species: cell.sites[i].species }))
    .sort((a, b) => a.depth - b.depth);
  const elements = Object.keys(cell.composition).sort();
  const clampZoom = (value: number) =>
    setZoom(Math.max(0.55, Math.min(2.3, value)));
  function reset() {
    setYaw(-0.65);
    setPitch(0.4);
    setZoom(1);
    setSelected(null);
  }
  return (
    <div className="crystal-viewer">
      <div className="crystal-toolbar" aria-label="Crystal viewing controls">
        <span className="viewer-drag-hint">
          <Move size={13} /> Drag to rotate
        </span>
        <div>
          <button
            aria-label="Zoom out"
            onClick={() => clampZoom(zoom - 0.15)}
            disabled={zoom <= 0.55}
          >
            <ZoomOut size={16} />
          </button>
          <button
            aria-label="Zoom in"
            onClick={() => clampZoom(zoom + 0.15)}
            disabled={zoom >= 2.3}
          >
            <ZoomIn size={16} />
          </button>
          <button
            aria-label="Toggle atom labels"
            aria-pressed={labels}
            onClick={() => setLabels(!labels)}
          >
            <Tags size={16} />
          </button>
          <button
            aria-label="Toggle unit cell"
            aria-pressed={showCell}
            onClick={() => setShowCell(!showCell)}
          >
            <Expand size={16} />
          </button>
          <button aria-label="Reset crystal view" onClick={reset}>
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      {cell.siteCount > 2000 ? (
        <div className="detail-empty">
          This cell has {cell.siteCount.toLocaleString()} sites. Use coordinates
          and structure downloads to inspect the complete cell.
        </div>
      ) : (
        <svg
          className="crystal-stage"
          viewBox="0 0 600 380"
          role="img"
          aria-label={`Interactive crystal cell with ${cell.siteCount} atomic sites. Drag to rotate; arrow keys rotate; plus and minus zoom.`}
          tabIndex={0}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.currentTarget.focus();
            e.currentTarget.setPointerCapture(e.pointerId);
            const atom = (e.target as Element).closest("[data-site-index]");
            drag.current = {
              x: e.clientX,
              y: e.clientY,
              yaw,
              pitch,
              moved: false,
              site: atom ? Number(atom.getAttribute("data-site-index")) : null,
            };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            const dx = e.clientX - d.x,
              dy = e.clientY - d.y;
            if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
            setYaw(d.yaw + dx * 0.009);
            setPitch(d.pitch + dy * 0.009);
          }}
          onPointerUp={() => {
            const d = drag.current;
            if (d && !d.moved && d.site !== null) setSelected(d.site);
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onLostPointerCapture={() => {
            drag.current = null;
          }}
          onKeyDown={(e) => {
            if (
              [
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown",
                "+",
                "=",
                "-",
                "0",
              ].includes(e.key)
            )
              e.preventDefault();
            if (e.key === "ArrowLeft") setYaw(yaw - 0.12);
            if (e.key === "ArrowRight") setYaw(yaw + 0.12);
            if (e.key === "ArrowUp") setPitch(pitch - 0.12);
            if (e.key === "ArrowDown") setPitch(pitch + 0.12);
            if (e.key === "+" || e.key === "=") clampZoom(zoom + 0.15);
            if (e.key === "-") clampZoom(zoom - 0.15);
            if (e.key === "0") reset();
          }}
        >
          <defs>
            {elements.map((el) => (
              <radialGradient key={el} id={`${id}-${el}`} cx="30%" cy="24%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.85" />
                <stop offset="40%" stopColor={elementColor(el)} />
                <stop
                  offset="100%"
                  stopColor={elementColor(el)}
                  stopOpacity="0.9"
                />
              </radialGradient>
            ))}
          </defs>
          <ellipse
            cx="300"
            cy="334"
            rx="140"
            ry="9"
            fill="#dce6ef"
            opacity="0.25"
          />
          {showCell &&
            edges.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={vertices[a].x}
                y1={vertices[a].y}
                x2={vertices[b].x}
                y2={vertices[b].y}
                stroke="#86a3b9"
                strokeWidth="1.2"
                opacity="0.65"
              />
            ))}
          {sites.map((s) => (
            <g key={s.i} data-site-index={s.i} className="crystal-atom">
              <title>{`Site ${s.i + 1}: ${s.species.map((sp) => `${sp.element} (occupancy ${sp.occupancy})`).join(", ")}; fractional ${cell.sites[s.i].frac_coords.join(", ")}`}</title>
              <circle
                cx={s.x}
                cy={s.y}
                r={
                  (s.species[0].element === "H" ? 6.8 : 10.5) *
                  (1 + s.depth * 0.08) *
                  Math.sqrt(zoom)
                }
                fill={
                  s.species.length > 1
                    ? "#a4b7c7"
                    : `url(#${id}-${s.species[0].element})`
                }
                opacity={Math.max(
                  0.3,
                  s.species.reduce((n, sp) => n + sp.occupancy, 0),
                )}
                stroke={selected === s.i ? "#2563eb" : "#fff"}
                strokeDasharray={s.species.length > 1 ? "2 1" : undefined}
                strokeWidth={selected === s.i ? 2.5 : 0.6}
              />
              {labels && (
                <text x={s.x + 11} y={s.y - 8} fill="#35495e" fontSize="11">
                  {s.species.map((sp) => sp.element).join("/")}
                </text>
              )}
            </g>
          ))}
          {showCell &&
            [1, 2, 4].map((v, i) => (
              <g key={v}>
                <line
                  x1={vertices[0].x}
                  y1={vertices[0].y}
                  x2={vertices[v].x}
                  y2={vertices[v].y}
                  stroke={["#c07165", "#6d9686", "#6289bb"][i]}
                  strokeWidth="2"
                />
                <text
                  x={vertices[v].x + 9}
                  y={vertices[v].y - 8}
                  fill={["#a85549", "#508572", "#4d78b0"][i]}
                  fontSize="13"
                  fontStyle="italic"
                >
                  {["a", "b", "c"][i]}
                </text>
              </g>
            ))}
        </svg>
      )}
      <div className="crystal-view-footer">
        <div className="crystal-legend">
          {elements.map((el) => (
            <span key={el}>
              <i style={{ background: elementColor(el) }} />
              {el}
              <small>{cell.composition[el]}</small>
            </span>
          ))}
        </div>
        <div className="crystal-presets">
          <span>View</span>
          {(
            [
              ["3D", -0.65, 0.4],
              ["Front", 0, 0],
              ["Top", 0, Math.PI / 2],
              ["Side", Math.PI / 2, 0],
            ] as const
          ).map(([name, y, p]) => (
            <button
              key={name}
              onClick={() => {
                setYaw(y);
                setPitch(p);
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <p className="viewer-caption">
        {selected == null
          ? "Full unit-cell sites · colors identify elements · atom sizes are illustrative; bonds are not inferred."
          : `Site ${selected + 1} · ${cell.sites[selected].species.map((s) => `${s.element} (${s.occupancy})`).join(", ")} · fractional [${cell.sites[selected].frac_coords.map((v) => v.toFixed(5)).join(", ")}]`}
      </p>
    </div>
  );
}
