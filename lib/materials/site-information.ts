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
