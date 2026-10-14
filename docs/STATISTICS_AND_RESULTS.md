# Discovery results and administration — v12, 2026-10-14

The interface follows the supplied result-table reference and the [Materials Project search flow](https://docs.materialsproject.org/apps/explorer-apps/materials-explorer/tutorial): one search/filter workspace, then result presentation and column controls. Account operations cover the familiar profile, role, password, block/unblock, session and account-lifecycle capabilities described in [Auth0 user management](https://auth0.com/docs/manage-users/user-accounts/manage-users-using-the-management-api). CALYPSO implements these against its existing local backend, without adding Auth0 or new dependencies.

## Search and results

All filters now live in **Refine your search**: composition, excluded elements, element count, symmetry, exact reported pressure, data source, data origin, data type and pressure availability. Record context is expandable to keep the search workspace compact. The duplicate result-filter form has been removed.

Results begin with a total and an explicit displayed range, for example **20 matching records · Showing 11–20 of 20 records**. The default is a compact table, with card and phase-group presentations available. Column controls select available fields; absent scientific properties are not invented. Each page can contain 10, 20, 50 or 100 entries, defaulting to 20. Pagination, page size, presentation and grouping are URL-synchronized (`page`, `pageSize`, `view`, `grouping`), with back/forward restoration. Changing page size, sort or grouping returns to page one. Switching presentation does not discard an unsubmitted chemistry draft.

Sorting supports database-addition time, formula, pressure in either direction and space-group number. Unknown pressure stays last in both pressure orders. Non-chronological ordering is not labeled recently added. API queries use a consistent read-only snapshot so totals and returned records refer to the same database view.

## Phase aggregation

**By phase** groups the entire matching dataset before pagination, using existing source Phase IDs already scoped by composition. Common formulas, space-group symbols or contributor-proposed phase labels do not merge records. Records without a Phase ID remain separate.

A group displays composition, source phase label, available symmetry, record count, reported-pressure count and exact minimum/maximum recorded pressure. It expands into actual structure records ordered by pressure, with child pagination for large groups. A range does not imply continuous pressure coverage, interpolated structures, a stability interval or a stable phase. This is search organization, not a Pressure Explorer.

The current genuine dataset contains 20 display records grouped into 18 phase/unassigned groups. The source-assigned hydrogen phase has three records at 1, 15 and 60 GPa. Eight unassigned records remain eight separate groups.

Backend additions: `groupBy=phase` returns groups, `groupsTotal`, total matching records and pressure/count summaries. `groupKey=phase:<source-id>` or `record:<record-id>` expands an exact group while preserving the current search. Group summaries and child records remain bounded and paginated. Unsupported grouping and keys are rejected; sort expressions are selected from a whitelist.

## Administrator organization and access

Open `/admin` through the footer or administrator account menu. Existing local administrator: `local.admin`; its password remains in the private `materials-backend-lab/.local/platform-test-accounts.json` file.

The page separates **Overview**, **Accounts**, **Contribution review** and **Audit log**. Overview provides registration trends, account-status distributions, review-status distributions, contributed data-type counts, country rankings and career-stage distributions. Scientific collection metrics remain separately labeled as live. JSON export identifies the selected cohort.

Accounts support search, status filtering and 15-per-page management. Real/preset identities and explicitly synthetic identities are separated. The selected-account editor has research-profile, password/security and access/status tabs. Available operations include profile corrections, temporary password reset, administrator grants/revocations, session revocation, suspension/reactivation and recoverable account deletion/restoration.

Every access action needs a reason and an expected version. Suspension, deletion and explicit session revocation remove current sessions. Suspended/deleted accounts cannot sign in or use protected APIs. Restoration does not recreate sessions or change the prior password. Password reset still requires replacement before exploration. Demo identities cannot sign in, receive password resets or gain administrator roles.

Deletion is **recoverable**, implemented as a deleted status. It retains identity IDs, contribution ownership/attribution and audits. Approved contributions of a deleted owner leave shared search until restoration; suspension affects account access and preserves scientific contributions. Self-restriction and removal of the last active administrator are prohibited. Permanent purge is not implemented and should not be confused with the visible recoverable delete operation.

Migration `003-account-lifecycle.sql` adds status/reason/timestamp/demo markers and access-audit actions. Previously applied migrations remain immutable. Scientific tables are unchanged.

## Explicit synthetic preview data

The user requested populated demonstration charts and geography. A dedicated local seed creates **180 marked synthetic identities** and **48 synthetic contribution metadata batches**. These have fictional `Demo Institute` affiliations and reserved `example.test` email addresses. No password credentials, raw structure/spectroscopy files, standardized calculations or genuine scientific measurements are created.

150 demo identities start active, 24 suspended and 6 deleted. Thus the community total initially shows **174 non-deleted demo accounts**, while the account-status chart counts all 180. Smaller country groups are suppressed; displayed map counts can sum to less than 174. Institutions, groups, career stages and creation timestamps are illustrative.

Homepage community and administrator charts default to **Demo preview** when the explicit cohort is present, with a persistent **SYNTHETIC DEMO** notice. **Live data** always switches back to genuine aggregates. Imported scientific counts remain genuine in either mode. Demo accounts are excluded from all live totals, scientific search and real review queues. All demo batches are private; their metadata never becomes a public scientific contribution.

To initialize or refresh the local showcase from the workspace root:

```sh
npm --prefix materials-backend-lab run platform:showcase
```

The seed keeps deterministic identities/batches, does not overwrite real accounts or administrator credentials, preserves demo access changes, and refreshes only illustrative creation dates/private demonstration visibility when rerun. It does not run automatically during normal startup. Browser QA access operations affected only a marked demo identity and restored it afterward; their audit entries remain visible.

## Statistics API and CLI

`GET /api/identity/admin/statistics?view=live|demo` requires an administrator session. `GET /api/materials/statistics` retains genuine homepage metrics and additionally exposes a separately marked `communityDemo` aggregate when the local cohort exists. It never substitutes fake materials or real user counts.

```sh
npm --prefix materials-backend-lab run platform:stats
npm --prefix materials-backend-lab run --silent platform:stats -- --demo > /tmp/calypso-demo-statistics.json
```

CLI exports use the private existing connection and a repeatable-read READ ONLY transaction. JSON contains aggregates, not profile names, emails, passwords or private draft contents.

Live totals exclude preset/QA/demo identities and deleted accounts. Institutions are distinct normalized self-reports; groups are institution/group pairs. Contribution metrics exclude archived batches and deleted owners. Registered accounts are not verified people or visitors. Unexpired authenticated sessions are not DAU. Registrations use Asia/Shanghai calendar days. VASP execution, email verification and visit/download event tracking remain unconnected.

Public geography uses explicit profile countries and a minimum cohort of three; no IP location inference occurs. Demo geography is explicitly illustrative. Rolling digits use staggered metric entry, different digit travel/duration and accessible final values, without rounding scientific pressure precision. Reduced-motion users receive final values and static charts.


## Result controls and column sizing — v12

Columns and Sort by share the existing Radix menu foundation. Their triggers have equal heights and matching chevrons; menus are portaled outside scrolling/animated sections, avoid viewport collisions, scroll within the available height, and close on an outside click or Escape. Column checkbox selections keep the menu open for consecutive changes. No result filtering or API contract was changed.

Refine your search can be collapsed at every breakpoint without clearing draft criteria. When the panel is beside the periodic table, its maximum height follows the table and extra controls scroll internally. When collapsed, the table uses the full row. Small screens initially collapse the filter panel.

All table columns have draggable header edges, accessible focusable separators and independent width bounds. Arrow keys adjust by 8 px, Shift+Arrow by 24 px; Home/End select the column's minimum/maximum. A canceled pointer gesture restores its starting widths. Wider tables scroll inside their container; they do not expand the application shell. Reset widths restores a viewport-fitted layout. Current result column widths are retained across sorting, paging and table/card switches; a new submitted search starts a new result workspace. Viewport resizing refits bounded columns.

The limits are centralized in `lib/materials/table-columns.ts` (minimum/maximum px): composition 180/400, pressure 150/260, phase 145/340, space group 145/300, crystal system 145/320, source 130/260, record identifier 190/480. Scientific values and counting definitions remain unchanged.
