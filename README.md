# CALYPSO Materials — Phase 1

An independent frontend for a pressure-oriented materials research platform. The original CALYPSO website was a reference only. This application does not use its routes, API, authentication, data, or scientific modules.

The workspace was initially empty. Following the confirmed scope, this project establishes a new homepage, navigation, discovery entry points, and shared design system. There is no connected dataset and no mock backend.

## Run locally

Requires Node.js 22.13+ (a maintained Node.js LTS version is recommended).

```sh
npm ci
npm run dev
```

Open the local address printed by the server, normally `http://127.0.0.1:5173`.

```sh
npm test
npm run typecheck
npm run build
```

`npm start` serves the production Worker locally. It does not publish the application. This phase has not been deployed.

## Stack and structure

React 19.2, TypeScript 5.9, Vinext 1.0.0-beta.5 / Vite 8, Tailwind 4. Existing starter primitives provide accessible controls, the mobile navigation sheet, select menu, empty states, and skeletons. Lucide provides lightweight scientific icons. No crystal viewer or charting library is used by the Phase 1 product.

| Surface                              | Files                                                                                                                                                                        |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Homepage                             | `app/page.tsx`, `components/materials/homepage.tsx`, `pressure-hero.tsx`, `community-map.tsx`                                                                                |
| Application shell and navigation     | `app/layout.tsx`, `components/materials/app-shell.tsx`                                                                                                                       |
| Tokens, theme, responsive styles     | `app/globals.css`                                                                                                                                                            |
| Shared UI foundations                | `components/materials/foundations.tsx`                                                                                                                                       |
| Search entry and discovery preview   | `app/explore/page.tsx`, `components/materials/search-input.tsx`, `components/materials/search-workspace.tsx`                                                                 |
| Interactive periodic table           | `components/materials/periodic-table.tsx`, `lib/materials/elements.ts`                                                                                                       |
| Element reference information        | `components/materials/element-information.tsx`, `lib/materials/element-reference.ts`                                                                                         |
| Scroll section transitions           | `components/materials/scroll-reveal.ts`, `scroll-reveal-page.tsx`, `lib/materials/scroll-reveal.ts`                                                                          |
| Documentation and updates            | `app/docs/page.tsx`, `lib/materials/site-information.ts`                                                                                                                     |
| Batch contribution workspace         | `app/contribute/page.tsx`, `components/materials/batch-contribution-workspace.tsx`, `contribution-record-editor.tsx`, `lib/materials/batch-contribution.ts`, `zip-import.ts` |
| Personal contribution workspace      | `app/workspace/page.tsx`, `components/materials/my-contributions.tsx`, `lib/materials/local-batches.ts`, `contribution-contract.ts`                                          |
| Statistics and exact record previews | `components/materials/data-sections.tsx`                                                                                                                                     |
| API schemas and adapter              | `lib/materials/api.ts`, `.env.example`                                                                                                                                       |
| URL query normalization              | `lib/materials/search.ts`                                                                                                                                                    |
| About and citation availability      | `app/about/page.tsx`                                                                                                                                                         |
| Contract, draft and motion checks    | `tests/materials.test.ts`, `tests/contribution.test.ts`, `tests/scroll-reveal.test.ts`                                                                                       |

## Available now

- Light theme, sticky top navigation, accessible mobile drawer and active route states.
- Seven query modes, plus composition, pressure and symmetry filters; committed search state survives URLs, reloads, browser back and forward.
- All 118 elements, scientifically ordered, with selected states, removal, reset, and arrow-key navigation. A short hover dwell previews a reference without requiring a search selection; keyboard focus and clicks inspect immediately. Pin info keeps inspection independent of search selections. Compact reference cards have a uniform height, in the table's central space on desktop and above the scrolling table on mobile. Selected chips appear at the top, and an expandable color guide explains ten chemical categories. PubChem reference values never imply database coverage.
- Four distinct statistics with documented counting meanings, loading states, unavailable values, and error recovery.
- API-backed record previews when configured; unsupported or missing data never generates fabricated records.
- Honest Upcoming states for scientific tools; search filters are available as frontend controls with a reserved API contract. There are no fake charts, crystal structures, detail links, or stability labels.
- A scroll-driven diamond-anvil introduction and staggered section fades across the application, with a full viewport reading area, five editable placeholder names, email contact entries and a map prepared for verified community statistics.
- Independent documentation and updates page; unconfirmed methods, materials sources and citations are marked To be published. Interface history is separate from scientific data releases.
- Batch contribution drafts for structures, Raman/XRD curves, physical properties and original attachments; multiple files/ZIP and explicit CSV mappings. Private by default, with separate processing consent. Save/reopen local batches, export/import original bytes, and inspect their preparation status in `/workspace`. No actual submission, review or VASP execution.

## Data connection

Leave `NEXT_PUBLIC_MATERIALS_API_BASE` unset until the independent backend is available. The application then makes no materials API requests and displays connection-pending states. Query entry remains functional and its pending state is explicit.

Copy `.env.example` to `.env.local`, configure the API base, and restart the development server. Public environment variables must never contain secrets. Browser requests use same-origin credentials only. An external service must explicitly support the application's origin through CORS. Authentication is not implemented in Phase 1.

See [API contract](docs/API_CONTRACT.md). The documented endpoints are a proposed integration boundary, not claims about an existing backend.

## Scientific boundary and future work

Phase 1 does not implement material details, linked scientific analysis charts, diffraction calculations, phase diagrams, database-record exports, or a Pressure Explorer. Contribution-file previews use only uploaded numerical values for preparation checks. None of these exist behind a misleading active link. Local contribution-draft export is available separately.

See [Phase 2 architecture notes](docs/PHASE_2.md). Future pressure state belongs to a single material's exploration context, not the application shell. Exact records and available pressures must remain explicit.

## Design decisions

The homepage uses a dark diamond-anvil introduction followed by light scientific sections, restrained typography, section indices, subtle surfaces and sparing blue accents. Its only discovery action is navigation to the dedicated search page. The periodic table and synchronized query/filter controls live on that search page. System and Chinese font fallbacks avoid a network font dependency. On mobile only the periodic table scrolls horizontally; the application shell remains within the viewport. Reduced-motion preferences, visible focus states, semantic landmarks, and formula subscripts are included.

Project ownership, publication, and copyright statements are intentionally absent until verified. Data-specific citations will be added after a real dataset is supplied.

## Homepage and discovery revision — 2026-10-10

The homepage is now a presentation page without a query form or periodic table. Its “Start exploring” actions lead to `/explore`. It introduces pressure research, database summaries, planned scientific tools, a verified-statistics-ready community map, an initial research-team section and “Join Us”. The diamond-anvil scene uses one optimized conceptual image and page-local scroll transforms; no 3D package, pressure explorer or scientific chart has been introduced. Users may pause the animation, and reduced-motion preferences disable it.

The search page offers seven modes: all fields, formula, contains elements, exact chemical system, material ID, structure-record ID and phase ID. It adds excluded elements, distinct-element count, actual recorded pressure range, crystal system and space group. A single query draft derives periodic-table highlights; clicking the table updates the query. The exclusion input shares the same state with exclusion selection. Complete formulas highlight their constituent elements; clicking an element switches to a composition search instead of silently inventing new stoichiometry.

Search commits query and filters to the URL and restores them on history navigation. It remains a frontend/API contract reservation until a verified independent backend is supplied. There are no invented search results, database counts, registered-user counts or heat-map hotspots. See `docs/API_CONTRACT.md` for the new filter and optional community contracts, and `docs/CONTENT_SOURCES.md` for reference data, image provenance and map attribution.

Main files changed in this revision: `components/materials/homepage.tsx`, `pressure-hero.tsx`, `community-map.tsx`, `search-workspace.tsx`, `search-input.tsx`, `periodic-table.tsx`, `app-shell.tsx`, `data-sections.tsx`, `lib/materials/search.ts`, `api.ts`, `world-map.ts`, `app/globals.css`, `app/about/page.tsx`, the hero image, tests and documentation. The original source snapshot remains at `../versions/20261009-211248-phase1/`.

`build/vinext-navigation-plugin.ts` and `vite.config.ts` also add a production-client compatibility setting for the current Vinext/Vite versions. It preserves routing-module exports, retaining client navigation and prefetch behavior without patching dependencies. See `docs/VALIDATION.md` for the checked development and production journeys.

## Scroll, reference data and contribution revision — 2026-10-10

The homepage now fades scientific sections in and out as they enter and leave the viewport. The hero Pause control disables both the scene and section motion; reduced-motion preferences also disable them. Focused sections remain visible, and the content is readable without JavaScript.

About Us contains five placeholder names only. `lib/materials/site-information.ts` centralizes the roster, public contact `database@calypso.cn`, mail subjects and actual platform update entries. Join, collaboration and feedback links use the same public email with separate subjects.

`/docs` collects calculation methods, materials provenance, citation/reuse and database releases. All unconfirmed scientific content remains pending. The same page displays actual frontend development history, explicitly distinguished from scientific dataset updates.

`/contribute` implements the confirmed prepare → review → ingestion workflow as a local draft workspace. Choose one CIF/POSCAR file up to 5 MiB; provide the exact recorded pressure, calculation information, provenance and contact details; confirm permission to share; export a JSON draft. The file content and metadata remain in page memory until navigation or refresh. No upload occurs. The JSON includes the original decoded text and SHA-256 of its UTF-8 representation. The preflight checks basic formatting only, not crystallographic/scientific correctness. Authentication, actual submission, reviewer operations and ingestion await a backend and confirmed policies.

All 118 periodic-table reference records use a dated PubChem snapshot. Missing values stay unavailable and prediction qualifiers remain visible. Reference values are separate from computed material properties and pressure-dependent records. Ten categories refine table colors without changing inclusion/exclusion semantics.

Modified surfaces: homepage/hero/scroll sections; app shell and footer; periodic table and reference cards; documentation and contribution routes; shared styles and public content configuration; draft validation tests and project documentation. No dependency, search API or scientific chart changes were required. The prior version remains in `../versions/20261010-105256-homepage-explore-v2/`.

## Discovery layout refinement — 2026-10-10 (v4)

The scientific-tools invitation is now a separate bordered surface with 24 px of clearance from the feature grid. The community map has a larger share of the desktop row, preserves its SVG aspect ratio, and occupies a full row at tablet sizes. Mobile text and statistics stack above the map.

Element inspection uses the periodic table's unused central area rather than a floating tooltip. Hover, keyboard focus and touch selection update the same reference; on mobile it stays above the scrolling table with larger text. Included and excluded element chips sit above the table. Ten category colors remain intact behind the expandable Color guide, with keyboard dismissal; lanthanide/actinide ranges stay on one line, and the two detached rows have aligned series labels.

At widths up to 1190 px, composition and symmetry occupy equal columns and pressure uses a separate full-width row. Mobile filters remain a single expandable column. Query derivation, exclusion, validation, URL state, API contracts and scientific data are unchanged.

Modified files: `components/materials/periodic-table.tsx`, `element-information.tsx`, `search-workspace.tsx`, `homepage.tsx`, `community-map.tsx`, `app/globals.css`, `lib/materials/site-information.ts` and project documentation. Browser screenshots are in `outputs/*-v4-*.png`; checks are documented in `docs/VALIDATION.md`. The pre-refinement version is preserved in `../versions/20261010-115904-scroll-docs-contribute-v3/`.

## Scroll storytelling and element inspection — 2026-10-10 (v5)

The exact v4 version was backed up before editing to `../versions/20261010-131653-discovery-layout-v4/`. Its source archive, per-file manifest, SHA-256 checksum and restoration guide were verified; generated dependencies and builds remain reproducible rather than archived.

Homepage introductions, feature cards, the map and contact content now animate separately over a longer viewport interval. A 52 px entrance translation, restrained blur and staggered card entry make the scroll transitions clearer; content is fully opaque in the reading area and fades again on exit. The geometry calculation compensates for its own animated translation to avoid scroll feedback. Pause, reduced-motion preferences and focused content preserve readability.

Element and exact-system queries display the chemical-system convention `Fe-O`, including after submit, reload and history navigation. Excluded-element input and search-result titles use the same convention. URL/API normalization still uses the existing comma-separated contract; only display conversion changed. Formula and identifier modes retain their own input conventions, and invalid saved drafts remain intact for error reporting.

Reference information stays hidden without any included or excluded elements. When a selection exists, pointer previews require about 350 ms of uninterrupted dwell; leaving a cell cancels the pending update and retains the last preview. Keyboard focus and clicks inspect immediately. Pin info freezes the visible reference while search selection continues independently; unpin resumes previewing, and clearing all elements hides the reference and clears the pin.

Cells are 44 px high rather than 46 px, with slightly smaller element labels. The reference identity puts the symbol and atomic number together, followed by the full name and category, without a distant floating number. Orbital letters are italic, electron occupancies remain superscripts, and source qualifiers and missing values are preserved. Mobile references retain readable type and stay outside the scrolling grid.

Modified source: `app/globals.css`; homepage, community-map, foundations and scroll-reveal components; periodic-table and element-information components; search-workspace and data-sections; `lib/materials/search.ts` and `site-information.ts`; one search-display regression in `tests/materials.test.ts`. No dependencies, API schemas or scientific reference values changed. The final build, 21 tests, typecheck and browser journeys are recorded in `docs/VALIDATION.md`.

## Viewport reading area and shared transitions — 2026-10-10 (v6)

The exact pre-edit v5 source is preserved in `../versions/20261010-150412-scroll-inspection-v5/`, with a verified archive, per-file manifest, checksum and restoration guide. Dependencies and generated builds are excluded from the source backup.

Fully visible headings, cards and bottom actions stay clear across one viewport beneath the sticky header. Partially entering/leaving content fades with a restrained blur at the viewport edges; the entrance interval is about 22% of the available viewport, capped at 200 px and bounded by each item's height. Entrance translation remains 52 px. This prevents a short title or action from becoming blurry while the rest of the same screen is still readable. A small shared page wrapper extends this behavior to discovery, documentation, contribution and about pages. Focused content, reduced-motion preferences and the homepage Pause control preserve readability. Resize and content changes refresh the measured items.

Hover inspection now works with zero selected elements, without changing the query. The existing 350 ms dwell and Pin info retain the intended reference while the pointer crosses other elements. The compact reference background has a fixed 114 px desktop height and 184 px mobile height; property columns extend farther right to balance the identity column. Long names, oxidation lists and predicted configurations keep their original values and qualifiers.

Modified surfaces: shared reveal hook, page wrapper and geometry helper; homepage-compatible styles; discovery and reference cards; documentation, contribution and about routes; platform history; viewport geometry tests and project documentation. No dependencies, API contracts, contribution logic or scientific data changed. Current verification and screenshots are in `docs/VALIDATION.md`.

## Batch contributions and personal workspace — 2026-10-11 (v7)

Before editing, the exact v6 source was backed up and hash-verified at `../versions/20261011-150021-viewport-reading-v6/`. This revision adds experimental/theoretical batches, native multiple-file/ZIP import, CSV record mappings, column-specific curve previews, original binary attachments and v2 JSON export/import. Original files are stored once even when several curves reference them. No dependency was added.

Saved drafts persist in this browser through IndexedDB. `/workspace` groups actual saved batches and provides record context, independent review/publication/computation/quality/ingestion placeholders, reopening, export and local removal. Account and server integration remain pending; no authentication, fake approval, calculation job or progress percentage is presented.

Default visibility is private; users can request public display after approval and separately authorize eligible structures for VASP processing. Private outputs remain private. Future approved public theoretical contributions retain a red-star source/status label until platform standardization, while original and standardized records stay separate. The user's existing VASP scripts will connect through a server adapter whose real step plan and events drive the workspace.

Main changes: `components/materials/batch-contribution-workspace.tsx`, `contribution-record-editor.tsx`, `my-contributions.tsx`; `app/workspace/page.tsx`; `lib/materials/batch-contribution.ts`, `zip-import.ts`, `local-batches.ts`, `contribution-contract.ts`; shell navigation, documentation and scoped styles. Existing contribution entry points remain compatible, and the v1 exporter/preflight module remains for migration and format checks. Search, periodic-table behavior, scientific detail pages and pressure state were not changed.

See [batch and interface design](docs/CONTRIBUTIONS.md), [API contract](docs/API_CONTRACT.md), and [validation](docs/VALIDATION.md).
