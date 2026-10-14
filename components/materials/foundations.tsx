import Link from "next/link";
import { Database, type LucideIcon } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`container ${className}`}>{children}</div>;
}
export function SectionHeader({
  number,
  title,
  description,
  action,
}: {
  number?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        <div className="section-title-row">
          {number && <span className="section-number">{number}</span>}
          <h2>{title}</h2>
        </div>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function StatCard({
  label,
  value,
  note,
  pending = false,
}: {
  label: string;
  value: React.ReactNode | null;
  note: string;
  pending?: boolean;
}) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      {pending ? (
        <Skeleton className="stat-skeleton" />
      ) : (
        <p className={`stat-value${value === null ? " unavailable" : ""}`}>
          {value ?? "—"}
        </p>
      )}
      <p className="stat-note">{note}</p>
    </div>
  );
}
export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  action = "Explore records",
  revealStep,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  action?: string;
  revealStep?: number;
}) {
  return (
    <article
      className="feature-card"
      data-reveal={revealStep !== undefined || undefined}
      data-reveal-step={revealStep}
    >
      <div className="feature-top">
        <span className="feature-icon">
          <Icon size={26} strokeWidth={1.4} />
        </span>
        <span className="status-label">Upcoming</span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {href ? (
        <Link className="feature-action" href={href}>
          {action}
        </Link>
      ) : (
        <span className="feature-action muted">
          Available in a future release
        </span>
      )}
    </article>
  );
}
export function EmptyState({
  title,
  description,
  icon: Icon = Database,
  children,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <Empty className="empty-state">
      <EmptyMedia variant="icon">
        <Icon aria-hidden="true" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children}
    </Empty>
  );
}
export function LoadingSkeleton({
  label = "Loading materials",
}: {
  label?: string;
}) {
  return (
    <div className="material-grid" role="status" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <div className="material-card skeleton-card" key={i}>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="mt-4 h-4 w-36" />
          <Skeleton className="mt-6 h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
export function ChemicalFormula({ formula }: { formula: string }) {
  // Text nodes, never server-provided HTML.
  return (
    <span aria-label={formula}>
      {formula
        .split(/(\d+(?:\.\d+)?)/g)
        .map((part, i) =>
          /^\d/.test(part) ? (
            <sub key={i}>{part}</sub>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
    </span>
  );
}
