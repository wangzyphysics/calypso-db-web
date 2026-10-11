# Current validation — viewport reading area and shared transitions (v6)

Verified locally on 2026-10-10. Before editing, the exact v5 source was archived to `../versions/20261010-150412-scroll-inspection-v5/`: 175 files, 4,042,346 archive bytes. Archive file content, modes and per-file hashes were compared with the source. The SHA-256 (`1d2aea20c05c15bfe6d89004a7fa513cb4c3cadbb2176aa41be556ad101249f6`) was verified again after editing. The archive excludes reproducible dependencies, builds and local caches; it includes source, assets, lockfile, documentation, tests and existing screenshots.

- `npm test`: 23 tests passed. Two new viewport-geometry regressions cover fully visible short headings/bottom actions, entry, exit, offscreen and viewport-spanning content. The wider entrance interval is checked without reducing the fully visible reading area.
- `npm run typecheck`: passed. `npm run build`: passed after the final CSS changes; the same five routes were generated. Existing non-failing experimental and route-classification notices remain.
- Production homepage inspected at 1280 × 720: the scientific-tools heading spans 175–237 px, four feature cards 261–504 px, and invitation 528–627 px. All six groups have opacity 1, zero blur and zero offset simultaneously. Content spanning a viewport also remains readable.
- Actual downward scrolling showed staggered partially entering cards at opacity approximately 0.96, 0.92, 0.88 and 0.84, with corresponding blur/translation. Offscreen content uses the full 52 px entrance amplitude. The entrance interval is approximately 22% of the viewport below the sticky header, capped at 200 px and bounded by each item's height; fully visible items always stay clear.
- Shared motion verified on discovery (5 groups), documentation (12), contribution (6) and about (6), while homepage retains 16 independently measured groups. Focused form sections remain clear. Dynamic route/form content is observed for measurement updates. Reduced-motion hook/CSS fallback and homepage Pause behavior are retained; the operating-system preference was not changed.
- All five pages checked at 1440, 1024, 768, 390 and 320 px: document width matches viewport width. Only the periodic table has intentional horizontal scrolling.
- Actual pointer input verified with no selected elements: immediately crossing Fe did not replace the preview; after the 350 ms dwell, Fe reference values appeared with zero selected elements and an empty query. Pinning the information prevented keyboard inspection of other elements from changing it. Hover/focus inspection does not alter search state. Clear selected elements resets the reference and pin when a selection is cleared.
- Final fixed-height references checked for He, Hf, N, Og and Rf at 1440, 768 and 320 px. Every desktop/tablet card is 114 px high; every mobile card is 184 px high. There was no internal horizontal or vertical overflow, including long oxidation-state lists, names and predicted configurations. Property columns extend toward the right edge; orbital letters remain italic and occupancies superscript. No reference values were modified.
- Final production navigation checked: Fe/O selection → Search commits `type=elements&query=Fe%2CO#results`, while input stays `Fe-O` and two elements remain selected → Documentation → Contribute → About → browser Back/Forward. Route-specific content and shared transitions appeared correctly. No new console warnings or errors were observed during that journey.
- The new interface entry is recorded in platform history, separately from pending scientific database releases. No API contract, scientific data, chart, contribution-validation logic or dependency changes were made.

## Current artifacts

- `outputs/reading-area-v6-desktop.png`
- `outputs/scroll-transition-v6-desktop.png`
- `outputs/hover-inspection-v6-desktop.png`
- `outputs/hover-inspection-v6-mobile.png`
- `outputs/layout-check-v6.json`

Development preview remains `http://127.0.0.1:5173/`. The temporary production server and agent-created QA tab are closed after verification; the original development server remains running. No deployment was performed. Statistics, materials records, user-map intensity, scientific documentation and actual contribution submission still await verified data/backend support.

---

# Previous validation — scroll storytelling and element inspection (v5)

Verified locally on 2026-10-10. The exact pre-edit v4 archive is in `../versions/20261010-131653-discovery-layout-v4/`: 169 files, 3,773,232 archive bytes, with a per-file manifest and restoration guide. Archive contents, file modes and hashes were checked before editing, and the archive SHA-256 was checked again after implementation.

- `npm test`: 21 tests passed, including a regression that round-trips hyphenated element/exact-system input through the existing comma-separated URL/API representation. Formula and identifier input conventions and invalid drafts are retained.
- `npm run typecheck`: passed after the final application changes.
- `npm run build`: passed after the final application changes; all five existing routes were generated.
- Built production `/`, `/explore?type=elements&query=Fe%2CO`, `/docs`, `/contribute` and `/about` returned HTTP 200.
- Rendered homepage and discovery reviewed at 1440, 1024, 941, 768, 390 and 320 px. Document width equals viewport width; only the periodic table scrolls horizontally. Cells retain a 44 px height, and detached-series ranges remain on one line. The map retains its 900:350 aspect ratio. Homepage contains no search form.
- Element and exact-system submissions display `Fe-O` in the input and result title. Exclusion input displays `H-He`. Submit, reload and browser Back retain these conventions, while the committed URL/API values remain `Fe,O` and `H,He`. Included and excluded table highlights agree with the inputs.
- With no included/excluded elements, reference values and Pin info are absent. Moving keyboard focus from H to He does not expose values before a selection. Clicking He reveals its information, with missing electronegativity still Not reported. Clearing all elements hides the reference and resets the pin.
- Pointer dwell checked through actual input: the reference remained O immediately after moving onto another cell, then changed to Ni after settling, without adding Ni to the search. Pinning Ni kept its reference while ArrowRight moved focus from Fe to Co and clicking Pd updated the search. Unpinning restored normal inspection. Pending previews cancel on leave, pin and unmount.
- Desktop Pd identity places symbol and Z 46 together, with name and category below. Its electron configuration shows italic d and upright superscript 10. Oganesson's longer predicted configuration and oxidation list fit both the central and mobile panels; no source fields were edited. Selected chips and pin controls fit at 320 px, including multiple exclusions.
- Homepage reveal areas are split into 16 independent content groups. At a 1440 px viewport, four entering feature cards had opacity approximately 0.61, 0.50, 0.39 and 0.29, then all reached 1 in the reading area. On a 941 px viewport, an exiting card row faded to about 0.33 while the next row remained fully visible. Reverse scrolling updates the entry state. On mobile, upper cards were fully visible while later cards faded in farther down the viewport.
- Pause removed the active reveal classes and made all 16 content groups fully opaque at every reviewed width. The operating-system reduced-motion preference was not changed; the hook and CSS fallback were inspected in source. Keyboard-focused content remains visible.
- Production browser journey: homepage Start exploring → select Fe/O → submit → result/input `Fe-O` → Documentation → Back restores query and highlights → Pin info remains fixed during keyboard inspection → Forward returns to Documentation. No new production console warnings or errors were observed.
- Actual interface changes were added to the platform history, separately from pending scientific database releases. The temporary production preview and agent-created QA tabs were closed; the original development server remains available.

## Current artifacts

- `outputs/element-inspection-v5-desktop.png`
- `outputs/element-inspection-v5-mobile.png`
- `outputs/scroll-story-v5-desktop.png`
- `outputs/scroll-story-v5-tablet.png`
- `outputs/scroll-story-v5-mobile.png`
- `outputs/layout-check-v5.json`

Preview: `http://127.0.0.1:5173/`. No backend, material records, scientific charts or deployment was introduced. Previous scientific-content and local-contribution limitations below continue to apply. The framework's existing experimental-feature and route-classification notices remain non-failing.

---

# Previous discovery layout validation (v4)

Verified locally on 2026-10-10. The exact pre-refinement source archive remains in `../versions/20261010-115904-scroll-docs-contribute-v3/`. This revision changes layout and element-reference presentation; no backend, scientific records or deployment was introduced.

- `npm test`: 20 tests passed. Search, reference-data, API-contract and contribution logic remain unchanged.
- `npm run typecheck`: passed.
- `npm run build`: passed, generating the same five routes.
- Rendered discovery layouts reviewed at 1440, 1190, 1024, 941, 768, 390 and 320 px; the built production page was also inspected at 1280 px. Root width equals viewport width. Only the periodic table scrolls horizontally at narrow widths.
- At 941 px, composition and symmetry are equal-width columns with aligned controls; pressure occupies a separate full-width row. Mobile filters expand into one column. Desktop keeps the existing compact filter sidebar.
- A `Fe2O3` query highlights Fe and O and shows both removal chips above the table. Inclusion/exclusion still update the query and exclusion input; chip removal works. A search with 0–100 GPa retains both values in the committed URL.
- Element information occupies the reserved central grid area on desktop and tablet. Hover/focus/click update the inspected element without an overlay. Keyboard ArrowDown from Helium focuses Neon and updates its reference without changing selected elements.
- Helium retains Not reported for missing electronegativity. Oganesson retains predicted electron-configuration wording and all supplied oxidation states; its longer content fits the central panel and the mobile panel. Chemical data and classification were not changed.
- The Color guide contains all ten categories, is closed by default, and closes with Escape while returning focus to its summary. The 320 px menu stays within the viewport; Include, Exclude and Clear remain visible without shrinking or clipping. Detached series labels align with La/Ac rows; 57–71 and 89–103 ranges do not wrap.
- Homepage reviewed at 1440, 941, 390 and 320 px. The discovery invitation has a complete border and 24 px clearance from the feature grid. The map keeps its 900:350 aspect ratio and explicit `xMidYMid meet` behavior; tablet layouts stack the map below the text/statistics row, and mobile layouts stack all content. Counts and user-distribution data remain pending.
- Built production journey: query-to-table synchronization, element exclusion, reference information, color-guide open/dismiss, search URL commit, navigation to Documentation and Back restoring query/exclusion/chips. The temporary production preview was stopped; the original development server remains running.
- Actual frontend changes are recorded separately in the Documentation page's platform history.

## Current artifacts

- `outputs/periodic-layout-v4-desktop.png`
- `outputs/periodic-layout-v4-mobile.png`
- `outputs/filters-layout-v4-tablet.png`
- `outputs/homepage-layout-v4-desktop.png`
- `outputs/homepage-layout-v4-mobile.png`
- `outputs/community-layout-v4-tablet.png`
- `outputs/layout-check-v4.json`

Preview: `http://127.0.0.1:5173/`. Materials API integration, populated search results and map heat intensity still await a verified independent backend. Existing scientific-content and contribution-draft limitations below continue to apply.

---

## Previous scroll, reference data and contribution validation (v3)

Verified locally on 2026-10-10. The earlier homepage/search version is retained at `../versions/20261010-105256-homepage-explore-v2/`. No deployment or backend was introduced.

- `npm test`: 20 tests passed, including nine new reference-data/contribution checks.
- `npm run typecheck`: passed.
- `npm run build`: passed, with `/`, `/about`, `/explore`, `/docs` and `/contribute` generated.
- Development and built production preview: all five routes, including a query-bearing search URL, returned HTTP 200 on direct requests.
- Rendered homepage, discovery, documentation and contribution pages reviewed at 1440, 1024, 768, 390 and 320 px. Root document width matched viewport width; the periodic table alone scrolls at narrow widths. Navigation at 1024 px has no overlap. Desktop and mobile screenshots inspected.
- Homepage has no search form. About Us shows only five placeholder names and a roster note. Contact links use the approved email and separate join/collaboration/feedback subjects.
- Scroll opacity checked on entry, exit and reverse scrolling: the community section reached opacity 0 after leaving the viewport and returned to 1 on scrolling back. Contact content was partially visible during entry. Pause makes all reveal sections opacity 1 with no transform; reduced-motion handling was inspected in source, without changing OS preferences.
- Periodic table: all ten category labels visible; keyboard-focused reference cards show all required fields, correct superscripts and source notes. Helium's missing electronegativity reads Not reported. A formula still selects Fe and O; tapping Helium updates the mobile reference panel. Tooltips dismiss when the page scrolls, as intended by the accessible primitive.
- Documentation anchor links scroll to their sections. Methods, sources, citations and scientific database releases remain pending. Platform history is separately labelled.
- Local contribution browser journey: invalid CIF displays a specific cell-field error; a valid synthetic fixture passes basic checks; an invalid formula blocks export and focuses the alert; valid metadata exports an actual JSON download. The exported text and SHA-256 match the fixture, Unicode formula becomes H2, pressure 0 is retained and status is local-draft. No upload takes place. Refresh clears the file and form.
- Production browser journeys: homepage → docs → contribute → explore; production file preflight; search with formula and 0–100 GPa; Back/Forward restore route and committed query. Mobile menu navigates to docs and closes. The retained Vinext entry-signature compatibility plugin remains effective.
- No new browser console warnings or errors in the final development or production journeys. The temporary production preview was stopped; the existing development preview remains for review.

## Current limitations

Materials search execution, statistics, previews, map heat intensity and scientific database releases still require a real backend. No fabricated materials or usage counts are included. Scientific detail pages and charts remain future work.

Contribution export is a local draft, not a submission. Preflight is intentionally limited to common CIF/POSCAR text forms; it does not parse complete CIF syntax, validate structure/metadata consistency, calculate symmetry, establish stability or perform scientific review. Actual upload, authentication, review and ingestion await confirmed policies and a backend. Contact links open a mail composer; the application sends nothing automatically.

The framework's existing experimental-feature and route-classification notices are non-failing. Build success and actual route behavior were checked separately. OS reduced-motion preferences were not changed; the source fallback and explicit Pause behavior were checked.

## Current artifacts

- `outputs/home-contact-v3.png`
- `outputs/home-contact-mobile-v3.png`
- `outputs/element-reference-v3.png`
- `outputs/element-mobile-v3.png`
- `outputs/docs-v3.png`
- `outputs/docs-mobile-v3.png`
- `outputs/contribute-v3.png`
- `outputs/contribute-mobile-v3.png`

Preview: `http://127.0.0.1:5173/`. No site was published.

---

## Previous homepage and discovery validation (v2) — 2026-10-10

Scope follows the clarified request: an independent frontend, original sites used only as references, no materials dataset yet, local review only.

## Completed

- `npm test`: 11 tests passed.
- `npm run typecheck`: passed.
- Scoped ESLint check for the modified application components, API/search modules and Vite configuration: passed. The optimized hero image intentionally uses a static image element; its local lint exception explains the choice.
- `npm run build`: passed; homepage, About, and discovery routes produced.
- Development HTTP checks: `/`, `/about`, and query-bearing `/explore` returned 200; an unavailable route returned 404.
- Built production Worker run locally: the same routes returned 200 and unavailable route returned 404. Its temporary process was stopped after checking.
- Actual rendered homepage reviewed at 1440, 1280, 1024, 768, 390, and 320 px. No horizontal overflow of the application shell. The periodic table scrolls within its own region at narrow widths.
- Desktop and mobile screenshots reviewed. Full-page composition, card proportions, table alignment, and footer were inspected.
- Mobile navigation opens, navigates to About, closes after selection, and closes with Escape. Upcoming navigation items remain explicitly labelled on mobile.
- Homepage contains no search form or periodic table. Its Start exploring actions navigate to the independent `/explore` workspace.
- The scroll scene enlarges the diamond-anvil image and sample light, fades the initial copy, and reveals the pressure narrative. Pause returns to a compact static scene; resume restores animation.
- Search supports seven query modes and composition, excluded-element, element-count, recorded-pressure, crystal-system and space-group filters. Formula subscripts normalize to ASCII: `Fe₂O₃` becomes `Fe2O3`.
- Explicit formula search rejects unknown element symbols and shows an accessible validation error.
- Typed formulas highlight their constituent elements. Periodic-table inclusion updates the query; exclusion updates the exclusion field. Excluded elements have distinct visual and accessible states.
- Include/exclude conflicts and reversed pressure ranges reject submission, focus the validation alert, and leave the applied URL unchanged. Duplicate labels no longer cause duplicate React keys.
- Exact-system searches and combined filters serialize to the URL. Zero pressure survives normalization. Filter-only searches are supported; `P2₁/c` normalizes to `P21/c`.
- Browser Back and Forward navigate between completed app routes. Current route navigation states are visible.
- Periodic-table ArrowRight navigation moves keyboard focus from Hydrogen to Helium.
- Production browser journeys checked Start exploring, query submission with 0–100 GPa, Back, Forward, and About. A client-build compatibility plugin preserves entry signatures to prevent Vinext beta.5/Vite 8 from dropping dynamic routing-module exports. No dependency files were patched; remove the plugin when an upstream upgrade passes these journeys.
- Browser console: no new warnings or errors observed during the final development and production journeys. Initial SVG-title hydration and duplicate-element key errors were fixed and rechecked.
- World map reviewed with accurate reference geometry, neutral colors and unavailable statistics. Its caption icon remains 13 px, independent of the map SVG sizing. Team and Join Us sections appear before the footer and use verified external profile/directory/opportunity links.
- Default unconfigured data state displays no fabricated counts, material records, stability assignments, or scientific charts.

## Test coverage

The tests validate all 118 element identities, valid table positions, formula and composition parsing, query-to-table derivation, combined filter URL round-trips, independent API query parameters, no requests from an unconfigured client, count definitions, genuine zero counts and pressures, optional community schema validation, malformed response rejection, authorization and network error classification, and the conditions required to claim chronological ordering.

Injected fetch responses are isolated contract-test fixtures. They are not a backend and are never included in the application.

## Limitations

No actual materials backend or scientific dataset was supplied. Live API integration, populated previews, authenticated data access, and their scientific correctness cannot yet be validated. Loading, Retry, empty-record, authorization, and invalid-response UI paths are implemented; the API failure classifications were tested, while the browser review exercised unconfigured data and query-validation states.

Frontend filters reserve a backend contract; their execution against a scientific dataset is unverified. No independent material-detail route exists without supplied records. Scientific charts, Pressure Explorer, phase diagrams, XRD, exports, dataset publications, licensing, and ownership statements remain inactive. Phase 2 has not been implemented. Student profiles await an approved roster. Registered-user totals and regional heat intensity await verified aggregate statistics.

The operating-system reduced-motion setting was not changed during browser review. Its CSS/media-query fallback was inspected in source; the explicit Pause/Resume control was exercised in the browser. The hero image is a conceptual illustration, not an experimental instrument photograph or a scientific diagram.

The framework prints non-failing Node experimental-feature and Vinext route-classification notices during the build. The build exits successfully, and the production routes were independently checked.

## Artifacts

- `outputs/homepage-v2-desktop.jpg`
- `outputs/homepage-v2-mobile.jpg`
- `outputs/homepage-v2-community.jpg`
- `outputs/homepage-v2-team.jpg`
- `outputs/search-v2-desktop.jpg`

The development preview remains available at `http://127.0.0.1:5173/` for review. No site was published.
