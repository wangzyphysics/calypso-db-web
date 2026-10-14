# Search controls and account editor — 2026-10-14 (v12)

- Before edits, backed up both source projects and a private consistent database snapshot in `versions/20261014-083934-before-controls-layout-v12`. All five SHA-256 entries passed. Compared all 15 scientific tables plus users, password credentials, batches, records and files: all 20 tables are logically unchanged. Only ordinary test-session activity occurred.
- `npm test`: 52/52 passed, including bounded sizing at narrow/wide extremes, independent drag limits, unchanged neighboring widths, supported result preferences and existing scientific/identity contracts. Final TypeScript, production build and `git diff --check` passed. No new dependency or backend/schema change.
- Browser: Columns retains the menu for multiple selections, closes on outside clicks and supports Escape. Sort by and Columns triggers share 42 px heights and vertically aligned chevrons. Sort menus stay inside the viewport; native mouse opening at 704 px in an 844 px viewport flips the menu above the trigger. At 320 px, both result menus remained inside the page and document width was 305 px.
- Browser: Refine your search collapses at desktop, tablet and mobile widths; draft H and 1 GPa values survived collapse. The collapsed desktop table uses the full row. The common-filter sidebar is 618.6 px high beside a 628.5 px periodic table; expanded source filters are capped at 628.5 px with internal scrolling. Common controls and the source-filter disclosure are fully visible.
- Browser: actual mouse dragging beyond the composition maximum stopped at 400 px; Home selected the 180 px minimum. The wider table scrolls internally without growing the shell. After going to result page two, the 400 px width was retained and the range correctly showed 11–20 of 20. Reset widths restored a fitted layout. Last-column handles are also available.
- Browser: Manage opens a separate accessible dialog. Close button, Escape and backdrop clicks each dismissed it; keyboard focus returned to the original Manage button. At 390 px, the dialog stayed within the viewport, profile fields stacked, the form scrolled internally, and the close button remained at 31 px after scrolling to the final field. No account/profile/role/password action was submitted.
- Browser widths 1440, 1024, 768, 390 and 320 px were checked. Middle-width expanded filters use three columns at 1024 and two at 768, with collapse available. Tables scroll internally; menus and account dialogs remain bounded.
- An initial anonymous sign-in returned a CSRF mismatch. Inspection found that changing auth mode during bootstrap could start a second anonymous session. The provider now starts in configured service mode, avoiding that repeated initialization. A separate localhost browser session signed in successfully on its first attempt and signed out afterward, with no browser errors/warnings. Existing credentials and CSRF authorization checks were preserved.
- Screenshots: `outputs/controls-v12-qa/search-controls-desktop.png`, `result-tools-desktop.png`, `sort-mobile.png`, `sort-mobile-flipped.png`, `manage-desktop.png`, `manage-mobile.png`. Temporary viewport overrides were reset and test tabs closed after verification; development/API services were retained.
- Website administrator roles are stored in `calypso_platform.users`; the existing Accounts → Grant admin/Remove admin flow handles later authorization with reasons, audit and last-admin protection. The private JSON contains initial local-test credentials, not runtime role configuration. PostgreSQL connection roles are separate. Documentation now states this distinction explicitly.

---

# Results workspace and graphical administration — 2026-10-13 (v11)

- Before changes, archived both source projects and a private consistent PostgreSQL snapshot in `versions/20261013-194029-before-discovery-admin-v11`; all five checksum entries verified. All 15 original scientific tables remain logically identical to this snapshot.
- Frontend tests: 49/49 passed. PostgreSQL integration tests: 21/21 passed. TypeScript and production build passed. Coverage includes ranges/page sizes/URL preferences, exact phase expansion, full-dataset phase grouping, numeric space-group ordering, demo isolation, rejected demo login, suspension/session revocation, recoverable deletion/restoration, optimistic conflicts, review and credential safety.
- Browser: total 20 records; 10-per-page selection shows 1–10 then 11–20, with back/forward restoring the range and URL. Table/card/phase presentations and column visibility work. Changing sort preserves an unsubmitted Fe-O draft. The duplicate result-filter form was removed; a single search workspace supplies all filters.
- Browser: By phase returns 18 groups for the 20 genuine records. Expanding the source-assigned hydrogen phase shows the exact 1, 15 and 60 GPa records. Eight records without phase assignment remain separate. No stability, continuous pressure coverage or structure interpolation is inferred.
- Browser: administrator Overview contains six chart panels, while Accounts, Contribution review and Audit log are separate sections. Switching Live/Demo keeps the cohort explicit. A marked demo identity was suspended/reactivated and recoverably deleted/restored through the UI; four reason-bearing audit entries persist. Existing real/preset profiles, passwords and permissions were not changed.
- The explicitly synthetic local cohort contains 180 identities (174 non-deleted) and 48 private metadata-only batches. It has no password credentials or uploaded scientific files. Demo owners are excluded from ordinary search, live statistics and real review queues. Homepage demo geography now has nine disclosed regions, with final-value country counts and differently timed digit reels. Real material metrics remain 20/10/20 and 1–300 GPa.
- Desktop/tablet/mobile checks at 1440, 1024, 768, 390 and 320 px found no shell overflow. Tables scroll internally, tablet cards use two columns, and mobile account charts stack. Final chart mounting produced no new browser errors or warnings after a positive initial responsive size was supplied; the earlier mount warning is resolved.
- Screenshots: `outputs/discovery-v11-qa/results-table-desktop.png`, `phase-records-desktop.png`, `admin-charts-desktop.png`, `admin-mobile.png`, `account-access-controls.png`, `map-demo-desktop.png`. Viewport override reset and temporary QA tab closed after verification; existing development/API services retained.
- CLI demo statistics export parsed as valid aggregate JSON. No new dependency or scientific module rewrite. Permanent account purge, VASP execution, email delivery and OAuth remain outside this revision. Account listings currently paginate in the browser; larger deployments should page/filter users server-side.

---

# Discovery results and database statistics — 2026-10-13

- Backed up both source projects and a private consistent PostgreSQL snapshot before edits: `versions/20261013-101002-before-results-statistics-v10`. All five SHA-256 entries passed verification. All 15 original scientific tables are unchanged against that snapshot.
- `npm test`: 44/44 passed. Tests cover result-filter URL serialization, invalid facet/order values, declared-country aliases, unknown country handling, public small-group suppression and existing identity/scientific behaviors. Final TypeScript and production build passed.
- `npm run platform:test`: 18/18 real PostgreSQL tests passed, including full-dataset pressure/source/type filtering, pressure ordering with unknown values last, pagination, administrator-only aggregate access, exclusion of QA accounts, retained privacy/review checks and credential safety. Existing fixtures were cleaned up; no original material/profile/password was changed by this revision.
- Browser: homepage reels enter on scroll and settle on 20 materials / 10 source phase labels / 20 display records / 1–300 GPa. Registered-account count is 1; its declared country is not recognized, so no public geographic hotspot is fabricated. Populated-map animation is implemented but cannot be visually validated against live cohorts until sufficient genuine country data exists; aggregation is covered by tests.
- Browser: Cards/List toggles use the same ten records; result-level pressure-availability filter returns all 11 reported-pressure records. Ascending order shows 1, 15, 25, 60, 100 and 200 GPa on page one; page two shows the remaining 300 GPa structure. Removing the filter returns 20 records and page one. Filter/order criteria appear in URL; no client-only current-page filtering is used.
- Browser: administrator footer entry redirects anonymous visitors to sign-in; existing local administrator opens the real aggregate overview. JSON export downloaded and parsed successfully. New regional/type empty states are explicit. Desktop 1440px and mobile 390px lists, controls and administrator panels stay within viewport width (1425/375px document widths respectively).
- Screenshots: `outputs/statistics-qa/admin-desktop.png`, `admin-mobile.png`, `results-list-desktop.png`, `results-list-mobile.png`. Temporary viewport override reset after verification; existing development/API services retained.
- No new dependency, schema migration, scientific record, chart, pressure explorer, OAuth, email delivery or VASP worker was introduced. Unexpired-session counts explicitly do not claim daily active users.

---

# Registration and password validation — 2026-10-12 (v8.1)

## Registration consistency and administrator tools — 2026-10-12

- `npm test`: 42/42 passed, including matching required research fields, invalid email rejection, registration-to-profile email copying and empty search navigation. `npm run platform:test`: 16/16 real PostgreSQL tests passed, including ten-per-page complete search, administrator profile changes, concurrent-version rejection, temporary password reset, old credential/session revocation, forced password replacement, access restrictions and credential-free audits.
- Browser: malformed registration email shows an inline alert on blur; a disposable registration retained its exact email, institution, research group and China default in PostgreSQL and Research Profile. Shared Required/Optional markers were checked on both forms. Email code controls remain disabled and explicitly deferred, with emailVerified=false.
- Browser: empty Search produced `/explore#results`, ten articles, Page 1 of 2; Next produced Page 2, and repeating Search reset to Page 1.
- Browser: administrator sign-in, account filtering, required profile editor, save with a reason and account audit feedback succeeded using a disposable fixture. Password reset and replacement were tested through the isolated PostgreSQL API tests; no existing user password was changed.
- Profile desktop checked at 1440px; administrator editor at 390px, with page width within viewport. Temporary viewport override reset after QA. Screenshot: `outputs/accounts-qa/research-profile-required.png`.
- Backup before changes: `versions/20261012-214544-before-registration-verification-v9`, with source archives and a private repeatable-read snapshot of both scientific and platform tables. The new v2 account migration leaves the scientific tables untouched and only fills previously empty contact addresses from registered email.


## Local PostgreSQL integration — 2026-10-12

- `npm test`: 41/41 passed; `npm run typecheck`: passed; final `npm run build`: passed, including all three API catch-all route families.
- `materials-backend-lab/npm run platform:test`: 15/15 real PostgreSQL tests passed. Covers server registration/profile persistence, password hashing and incorrect passwords, CSRF/Origin, ownership, private publication, submission/review, optimistic conflicts, file hashes/downloads, reversible archive, mixed structure/spectroscopy calculation eligibility, seven search modes/combined filters/pagination, role audit/session revocation and API restart persistence. Test fixtures are removed transactionally.
- Compared all 15 original calypso_lab tables to the consistent pre-change snapshot: identical logical rows. Still 20 materials, 10 source phase labels and 40 structure representations (20 display records). Portable backup restored into a separate SQLite memory database with the same domain hash; all seven backup SHA256 entries verified.
- Browser development flow: full password registration with affiliations → protected search; source ID caly-259513 → its actual Cm record at 200 GPa; original curve upload/context/profile attribution → PostgreSQL draft → refresh/reopen → submit → administrator feedback saved as needs-information. Synthetic browser fixtures removed afterward; preset test accounts and user-created data are preserved.
- Browser production build: real 20/10/20 statistics and 1–300 GPa reported coverage; server session retained; selecting H updates the query/table; exact 15 GPa filter returns the real B2/n-mB24, C2/c record. Sign-out revokes session and anonymous exploration returns to sign-in. No production-journey console errors were recorded; transient dev reload errors during environment-file changes resolved after restart.
- Responsive review checked at 390 px and material results at 1440 px, with no shell horizontal overflow. Screenshots: `outputs/database-qa/production-material-search.png` and `production-material-search-desktop.png`.
- One-command startup verified with running services and with the web port free. No scientific chart, material detail, pressure explorer, OAuth or VASP worker was implemented. Progress is null until actual execution exists.

Earlier validation entries below describe previous unconnected versions.

- Backed up the complete v8 source before editing to `../versions/20261012-102553-accounts-v8/`: 221 files, 4,653,389 archive bytes. Archive entries were checked against the per-file SHA-256 manifest. Browser storage and reproducible dependencies/builds are separate.
- 41 tests passed. TypeScript and the final production build passed. Tests cover mandatory registration metadata, strict registration payloads, duplicate usernames/emails, independently salted password hashes, incorrect passwords, member/private defaults, production test-mode guards and same-origin/CSRF registration contracts. Existing scientific and contribution tests still pass.
- Browser: account, email, password/confirmation, full name, institution, research group and career stage are required during registration. Mismatched passwords show an error; successful local test registration returns to `/explore?type=elements&query=Fe-O#results`. Saved affiliation fields appear in My Profile. The new account has no administrator entry.
- Browser: after sign-out, an incorrect password is rejected; the registered account/password signs back into the same account and returns to the original search URL. Only the two preset development identities retain passwordless test shortcuts. Synthetic test identities were used; no real identity, email, upload or calculation was submitted.
- Final layouts at 1440, 1024, 768, 390 and 320 px have equal Sign in/Sign up card widths at every breakpoint: approximately 654, 517, 654, 339 and 269 px respectively. Heights follow each page's own content; there is no shared fixed/minimum card height. Password-to-sign-in-button spacing is 20 px. No document horizontal overflow was observed.
- The final development and production browser checks had no console errors or warnings. The production build exposes no test registration/account shortcuts; unconfigured real registration stays disabled and provider messages explicitly await connection. Sign in/Sign up links preserve search query/hash return paths. The temporary production preview was stopped; the existing development preview was retained.
- Actual screenshots and measurements: `outputs/signup-v8-1-preview.png`, `outputs/signup-layout-check-v8-1.json`.
- Real registration, verification, account/password sign-in and provider callbacks still require the authentication backend. The proposed contracts and implementation guide are in `docs/AUTHENTICATION.md`. Local test registration stores a salted password hash on this device and does not verify identity.

---

# Account and access validation — 2026-10-12 (v8)

- Backed up v7 before edits: `versions/20261012-091527-batch-contributions-v7/`, 202 files, 4,545,947 archive bytes; every archive entry verified against SHA-256 manifest, final archive checksum passed. Dependencies/builds/secrets excluded; browser draft storage is separate.
- 38 tests passed, including return-path protection, optional profile validation, nullable provider email, attribution snapshots and legacy schema defaults, CSRF/same-origin contracts, role restrictions, test-mode guards and stale profile/role versions. TypeScript and the production build passed. Existing Vinext route-classification warning remains non-fatal.
- Browser: anonymous `/explore?type=elements&query=Fe%2CO#results` redirects to login, local test researcher returns to the original URL with `Fe-O` input and Fe/O selections intact.
- Browser: profile save survives refresh; Apply my profile explicitly copies saved name/institution/group/career stage into a contribution. Later profile edits leave the saved batch attribution unchanged.
- Browser: a new synthetic Raman batch saves under the researcher; the administrator has zero saved batches and cannot retrieve the researcher's batch by its URL. No server upload or calculation occurs. The temporary QA batch was deleted through the UI; synthetic profile fields were reset.
- Browser: administrator grants and revokes the researcher's admin role with reasons, audit records appear; member direct access to `/admin` shows access-required state. Test identities end with researcher=member and test-admin=admin.
- Browser: login/profile/admin/contribute at 1440, 1024, 768, 390 and 320 px have no body/root horizontal overflow; mobile menu closes on account navigation. Screenshots inspected; viewport overrides reset.
- Production preview: home/about/docs accessible anonymously; explore/account/admin/workspace/contribute redirect to sign-in, preserving destination. No local test buttons appear in production; unconfigured providers clearly report pending connection. Final browser error/warning logs are empty.
- Observed development HMR context mismatch resolved by isolating the shared AuthContext/hook from the provider component; subsequent provider hot update and navigation had no new context errors. A temporary production preview needed restart after rebuilding to refresh Wrangler's asset inventory; after restart CSS/JS loaded and browser flows passed.
- Screenshots: `outputs/login-v8-preview.png`; responsive measurements: `outputs/account-layout-check-v8.json`. The preview uses the existing localhost:5173 server; the temporary localhost:4176 production process was stopped.
- Limitations: identity providers, email/SMS delivery, server authorization/roles, protected uploads, audit retention and VASP are not implemented. The local tests are explicitly not production authentication or secure data isolation. Legacy unassigned draft schema migration is tested; the current browser contained no pre-account drafts to exercise a real legacy-copy UI flow.

---

# Current validation — batch contributions and workspace (v7), 2026-10-11

The exact v6 source was backed up before modification to `../versions/20261011-150021-viewport-reading-v6/`. The archive contains 183 files (4,296,810 bytes); per-file entries were verified at creation and the final archive SHA-256 check passes: `c65d310110bdf0a8bffdbaaae1fe9df70f6b8f74b78205ca1920864f85e44f09`.

## Automated checks

- `npm test`: all 31 tests passed, including eight batch/import/privacy/progress checks and the existing 23 checks.
- `npm run typecheck`: passed.
- `npm run build`: final client, SSR and RSC builds passed; `/workspace` joins the existing five routes.
- `git diff --check`: passed. No dependency or lockfile changes.
- Build notices about Node experimental features and Vinext static route classification are non-failing. Actual production routes were checked separately.

The batch tests exercise explicit multi-curve associations, quoted/multiline CSV, required data origin, missing and ambiguous file paths, zero pressure, raw binary checksums, conservative v1 migration, legacy checksum mismatch, native ZIP expansion/CRC/path failures, one-point properties versus multi-point spectra, structure file limits, explicit publication intent and honest step-count progress.

## Browser verification

Synthetic fixtures were created only in the local QA directory and test fixtures. They are not real material records, are not bundled into product previews, and were never uploaded to a service. The UI labels saved QA batches as synthetic. Their temporary browser drafts were removed after checking; actual user drafts were not touched.

- Development ZIP import with a manifest: three original files became four records; two distinct curves reference one original table at 0 and 10 GPa. Preview uses the chosen numeric columns, preserves zeros and source order, and applies no fitting.
- Manifest errors are visible and leave the prior four-record batch intact.
- Private is the initial selection. Switching requested visibility resets permission confirmation. Private VASP processing consent remains independent; it does not enable public intent.
- Save confirms an IndexedDB transaction. Refresh, reopen through the exact draft link, edit and save were verified.
- Exported v2 JSON was read locally: all original bytes and SHA-256 checksums exactly match the source ZIP, including the binary attachment. Private intent, processing consent and actual zero pressure are preserved.
- Export reimport creates a second local identity; the two batches keep separate selection, visibility and record lists.
- A property table with one numerical row displays 2.3 at its original 0 GPa coordinate as a single value, not a continuous curve.
- An unavailable batch identifier displays Draft not found rather than silently showing another batch.
- Local deletion uses an inline confirmation; removal and return to the empty state were verified for agent-created QA batches only.
- Desktop/mobile viewport checks at 1440, 1024, 768, 390 and 320 px show no root/body horizontal overflow in the contribution editor or workspace. Mobile navigation includes the workspace link and closes after route navigation.
- Form hit targets keep their position during fades, avoiding movement between pointer down and click. Section headings and surrounding introductions retain shared scroll motion; input sections retain opacity/blur transitions. All existing reduced-motion behavior remains.
- Production Worker: `/`, `/contribute`, `/workspace`, `/docs`, `/explore?type=elements&query=Fe%2CO`, `/about` returned 200; an unavailable route returned 404.
- Production browser: empty workspace; client navigation to contribution; simultaneous XY/POSCAR file selection; real four-point XRD preview; incomplete local draft save/reload; cleanup; Documentation and Explore navigation.
- Existing production search: Contains elements accepts Fe-O, highlights Fe and O, commits the compatible comma-delimited query in the URL, and restores history through Back/Forward. Search API/data execution remains unconfigured.
- No browser warnings or errors were observed in the final development and production journeys.

## Artifacts

- `outputs/layout-check-v7.json`
- `outputs/workspace-v7-private.png` — actual private QA batch and independent processing intent; synthetic QA data only.
- `outputs/workspace-v7-desktop.png`, `outputs/workspace-v7-mobile.png`, `outputs/workspace-v7-empty.png`
- `outputs/contribute-v7-curve-desktop.png`, `outputs/contribute-v7-default.png`

## Integration limits

No authentication, upload/review service, ACL enforcement, public contribution indexing or VASP execution exists yet. Local privacy is a recorded submission preference, not server account protection. Original vendor formats and 2D images are retained as attachments; full crystallographic and scientific validation awaits review. Numerical protocols and the real VASP step graph must come from the existing scripts. No live percentage, submitted batch, public scientific record or standardized output was fabricated.

The proposed server contracts and privacy rules are in `docs/CONTRIBUTIONS.md` and `lib/materials/contribution-contract.ts`. Existing material search, periodic-table reference values, homepage motion geometry and future material-scoped pressure architecture remain intact. No material-detail redesign or Pressure Explorer was implemented.

---

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
