export const contactEmail = "database@calypso.cn";
export const placeholderTeam = ["张三", "李四", "王五", "赵六", "孙七"];
export function contactHref(
  topic:
    | "Join the team"
    | "Research collaboration"
    | "Website feedback"
    | "Data contribution",
) {
  return `mailto:${contactEmail}?subject=${encodeURIComponent(`CALYPSO Materials · ${topic}`)}`;
}
export const platformUpdates = [
  {
    date: "2026-10-16",
    title: "Reliable contribution drafts and original-file handling",
    changes: [
      "Saved submissions reopen after refresh with their selected condition and record; metadata-only drafts can be saved.",
      "Shared originals can be reused across conditions; same-name files with different bytes are kept separately.",
      "All-record visibility, explicit submission-title guidance and reversible draft removal with confirmation for populated groups.",
    ],
  },
  {
    date: "2026-10-14",
    title: "Contribution examples and upload tutorial",
    changes: [
      "On-demand teaching examples for structures, spectra, numerical properties and mixed batches.",
      "Example preview restores the original draft; marked teaching data cannot be saved or submitted.",
      "Documentation links each category to its form example and explains scalar CSV, repeated acquisitions and batch manifests.",
    ],
  },
  {
    date: "2026-10-14",
    title: "Phase-based scientific contributions",
    changes: [
      "Phase → P–T condition → data cards, with experimental/theoretical labels on each record.",
      "Persistent Phase IDs, generated unidentified names and separate identification evidence.",
      "Explicit unknown/target conditions, shared-file acquisitions and grouped CSV/ZIP import.",
      "Database-backed hierarchy in personal batches and administrator review; legacy drafts remain readable.",
    ],
  },
  {
    date: "2026-10-14",
    title: "Discovery controls and account management refinements",
    changes: [
      "Viewport-aware result menus with consistent triggers, outside-click dismissal and keyboard support.",
      "Collapsible search filters at every breakpoint and an internally scrolling sidebar bounded by the periodic table.",
      "Independently resizable table columns with minimum/maximum widths and a layout reset.",
      "Dedicated account-management dialogs with fixed close controls, internal scrolling and focus restoration.",
    ],
  },
  {
    date: "2026-10-13",
    title: "Pressure-aware result organization and administrative workflows",
    changes: [
      "Unified search filters, explicit result totals/ranges, configurable page sizes, sortable tables and column controls.",
      "Source-phase grouping with exact pressure coverage and expandable structure records; unassigned records remain separate.",
      "Administrative chart overview, account status tools, recoverable deletion/restoration and session revocation with audits.",
      "Explicitly labeled synthetic demo cohorts for community maps and dashboards; live scientific records remain separate.",
      "Staggered digit reels with varied duration/travel and reduced-motion support.",
    ],
  },
  {
    date: "2026-10-13",
    title: "Discovery results and database statistics",
    changes: [
      "Viewport-triggered rolling numbers for verified database and community counts, with reduced-motion support.",
      "Card/list results, record-source and data-type filters, pressure availability, pressure sorting and full-dataset filtering.",
      "Country aggregates use declared research-profile countries and a minimum of three accounts per displayed country.",
      "Administrator statistics, registration trends, review counts and JSON export; read-only local statistics CLI.",
    ],
  },
  {
    date: "2026-10-12",
    title: "Registration, profile consistency and account administration",
    changes: [
      "Shared required research fields, explicit optional fields, inline email checks and China as the registration country default.",
      "Registration email is copied into the research profile. Email verification remains visibly reserved for a future service.",
      "Empty searches show all available records, ten per page.",
      "Administrator account search, profile corrections, audited temporary-password resets and required password replacement.",
    ],
  },
  {
    date: "2026-10-12",
    title: "Local PostgreSQL integration",
    changes: [
      "Real password registration, required research profiles and database-backed sessions.",
      "Material statistics, source identifiers, seven query modes, filters and pagination from the local materials database.",
      "Persistent contribution files and batches, submission, administrator review and recoverable archive.",
      "Approved public contributions are labeled as original user data; private records stay out of shared search. VASP execution is awaiting connection.",
    ],
  },
  {
    date: "2026-10-12",
    title: "Accounts and research profiles",
    changes: [
      "Local test sign-in, research profiles, account settings and role administration.",
      "Dedicated sign-up with account/password, required research affiliation and return to the original discovery query.",
      "Protected discovery entry points and explicit profile-to-contribution attribution.",
      "Account-scoped browser drafts with preserved unassigned legacy copies; real sign-in services await connection.",
    ],
  },
  {
    date: "2026-10-11",
    title: "Experimental and theoretical contribution batches",
    changes: [
      "Multi-file and ZIP drafts, CSV associations and original-value curve previews.",
      "Private-by-default visibility, separate processing consent and persistent local batches.",
      "Personal contribution workspace and reserved review, publication and VASP workflow contracts.",
    ],
  },
  {
    date: "2026-10-10",
    title: "Viewport reading area and shared transitions",
    changes: [
      "Fully visible content stays clear; blur transitions are limited to viewport edges.",
      "Scroll transitions extend to discovery, documentation, contribution and about pages.",
      "Hover inspection works before selection, with compact, uniform-height reference cards.",
    ],
  },
  {
    date: "2026-10-10",
    title: "Scroll storytelling and element inspection",
    changes: [
      "Longer, staggered homepage scroll transitions with a reduced-motion alternative.",
      "Consistent hyphenated element search input after applying a search.",
      "Compact reference cards, italic orbital labels, delayed previews and pinned inspection.",
    ],
  },
  {
    date: "2026-10-10",
    title: "Discovery layout refinements",
    changes: [
      "Element reference information in the table's central space, with selections above the table.",
      "Expandable category guide, readable series markers and compact mobile controls.",
      "Responsive filter grouping and balanced homepage map and discovery sections.",
    ],
  },
  {
    date: "2026-10-10",
    title: "Documentation and contribution workspace",
    changes: [
      "Element reference information and detailed periodic-table categories.",
      "Local contribution drafts, documentation and contact entries.",
      "Scroll transitions and a simplified team section.",
    ],
  },
  {
    date: "2026-10-10",
    title: "Homepage and independent discovery workspace",
    changes: [
      "Diamond-anvil introduction, scientific overview and community map.",
      "Seven search modes with synchronized element and filter controls.",
    ],
  },
  {
    date: "2026-10-09",
    title: "Initial application foundation",
    changes: [
      "Responsive application shell, light theme and independent API boundary.",
    ],
  },
];
