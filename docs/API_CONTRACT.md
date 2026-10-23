# Independent materials API contract

> 2026-10-12: The local PostgreSQL API is now implemented in the adjacent materials-backend-lab/src/platform. See [active local configuration](LOCAL_DATABASE.md). Public previews use GET /previews; materials search requires a server session. The remaining contracts below include future interfaces; they are not all implemented.

This document defines the frontend integration contract. A loopback PostgreSQL service now implements materials/statistics and bounded previews, with explicit unavailable scientific features. The application has no dependency on the original CALYPSO site.

### Contribution teaching examples (2026-10-14, v14)

Static `/upload-examples/examples-v1.json` and `teaching-data.zip` contain only synthetic teaching data; they are not material API records. Contribution v3 accepts an additive `exampleOnly: boolean` (default false). The shared parser also sets it when a record source begins with the known `TUTORIAL ONLY:` marker. `PUT /contributions/batches/:id` rejects these drafts with HTTP 400 before file verification or a database transaction. Browser-only persistence rejects them too, and submission readiness includes a blocking teaching-data error. Regular v1/v2/v3 research drafts remain compatible. These protections prevent accidental submission of supplied examples, not arbitrary scientific fraud.

Configure `NEXT_PUBLIC_MATERIALS_API_BASE` to an HTTP(S) base URL or same-origin path. Responses are plain JSON; transport-specific envelopes should be normalized in `lib/materials/api.ts` when the actual backend contract is agreed.

## GET /statistics

Return:

```ts
interface CountMetric {
  count: number | null; // Non-negative integer. Null means unavailable, never zero.
  definition: string; // Required explanation of what the backend counted.
}
interface DatabaseStatistics {
  materials: CountMetric;
  phases: CountMetric;
  structureRecords: CountMetric;
  pressureCoverage: {
    minGPa: number | null;
    maxGPa: number | null;
    definition: string;
  };
}
```

Expected meanings, to be confirmed with the dataset owner:

- Materials: distinct material identities, not simply the number of formulas.
- Phases: distinct structural phase identities, not phases assumed to be stable.
- Structure records: exact stored structures at their recorded calculation conditions.
- Pressure coverage: validated minimum and maximum recorded pressure across the intended complete dataset. Both endpoints must be supplied together, ordered, and in GPa. Never calculate coverage from the preview sample.

The frontend preserves unavailable counts as em dashes, accepts actual zero counts and zero pressure, and displays supplied counting definitions. It performs no inference or extrapolation.

## GET /materials

Query parameters:

| Parameter | Meaning                                                                                      |
| --------- | -------------------------------------------------------------------------------------------- |
| `limit`   | Number of preview records requested; the current UI requests 6                               |
| `query`   | Optional normalized search text                                                              |
| `type`    | `any`, `formula`, `elements`, `system`, `id`, `record`, or `phase`; sent when a query exists |

`elements` is a comma-separated, deduplicated list of valid case-sensitive element symbols. The inclusion and exact-system semantics are specified in Discovery filters below and must be implemented by the connected backend. Chemical Unicode subscripts are converted to digits. All query values are URL-encoded.

Return:

```ts
interface MaterialRecord {
  recordId: string; // Exact database structure record identity.
  materialId: string;
  formula: string; // Plain text, never executable HTML.
  phaseId: string | null;
  spaceGroup: string | null;
  crystalSystem: string | null;
  pressureGPa: number | null; // Actual recorded pressure, not slider pressure.
  createdAt?: string | null; // ISO 8601 timestamp with UTC offset.
}
interface MaterialsResponse {
  items: MaterialRecord[];
  total: number; // Total matching exact structure records.
  order: "unspecified" | "created_desc";
}
```

“Recently Added Materials” is used only if the backend declares `created_desc` and every returned record has a valid, non-increasing creation timestamp. Otherwise the section remains “Explore Materials”. No stable-phase selection, formula-based merging, structural interpolation, or deduplication of scientifically distinct records is performed.

As of v17 (2026-10-18), preview cards and tables open `/materials/:recordId`. Authenticated `GET /records/:id` and `/records/:id/download` are implemented by the independent PostgreSQL API. See [structure detail contract and export conventions](STRUCTURE_DETAILS.md).

## Loading and failures

- Missing base URL: no request; explicit connection-pending state.
- Request in progress: statistics and material skeletons.
- Empty response: explicit no-record state, with search guidance when applicable.
- HTTP 401/403: authorization-required error; no automatic redirect or credential prompt.
- Network errors, non-success HTTP responses, or a 15-second timeout: recoverable error and Retry action.
- Malformed response: schema error; counts and records are not displayed.
- Query changes and unmounts: outstanding requests are aborted; stale responses cannot replace the current resource.

Never expose server credentials through public environment variables. The current adapter has no authentication or token-storage implementation. Integrate the independent backend's approved authentication separately when available.

## Discovery filters (homepage/search revision)

The home route is now an introduction only. `/explore` owns the draft query, its periodic-table selection and optional filters. Searching commits them to the URL; browser back/forward restores the committed search. Editing the draft does not trigger backend requests. A filter-only search is allowed.

The reserved backend must implement the following semantics before connection:

| Parameter                    | Meaning                                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `type=any`                   | Formula, element combination, or identifier, with backend-disclosed interpretation                                     |
| `type=formula`               | Match a chemically equivalent formula/composition, with normalization specified by the dataset owner                   |
| `type=elements`              | Must contain **every** supplied element; additional elements are allowed                                               |
| `type=system`                | Exactly the supplied set of elements, independent of stoichiometry                                                     |
| `type=id`                    | Exact material identifier                                                                                              |
| `type=record`                | Exact structure-record identifier                                                                                      |
| `type=phase`                 | Exact phase identifier                                                                                                 |
| `excludeElements`            | Comma-separated valid symbols; exclude records containing any listed element                                           |
| `pressureMin`, `pressureMax` | Inclusive finite GPa limits on the actual recorded pressure, including zero; missing endpoints are unbounded           |
| `elementsMin`, `elementsMax` | Inclusive integer range (1–118) on distinct element count                                                              |
| `crystalSystem`              | One of the seven crystallographic systems, lowercase                                                                   |
| `spaceGroup`                 | International Tables number 1–230 or Hermann–Mauguin symbol; backend must validate the actual symbol and normalization |

Combine these criteria with AND. Inclusion and exclusion cannot overlap. Unknown metadata does not satisfy a specific filter. No electronic-property or stability filters are offered without supporting data. Numeric negative pressure is preserved if intentionally requested; no values are invented or interpolated. Actual backend search execution remains pending.

## Optional verified community statistics

`GET /statistics` may additionally provide:

```ts
community?: {
  registeredUsers: {count: number | null; definition: string};
  definition: string; // Population, date/window, consent and aggregation basis.
  regions: Array<{countryCode: string; users: number}>;
}
```

`countryCode` uses unique uppercase three-letter codes matching the reference geography. Counts are non-negative integers. The regional sum cannot exceed an available registered-user total. Unmapped/unspecified regions may be omitted and are not inferred. Missing regions remain neutral, distinct from a supplied zero. Intensity uses log(1 + count), relative to the largest supplied regional count, and the UI labels this scale.

This is an interface reservation only: the frontend does not collect IP addresses, infer location, store analytics or fabricate user counts. The base map remains neutral when aggregates are absent. Counts for CALYPSO software adoption or other websites must never be used as this database's registered-user total.

## Phase-based contributions (v13 / draft schema v3)

The active local PostgreSQL service supports contribution drafts, original files, submission, whole-batch review, privacy and recoverable archive. `/contribute` organizes Phase → P–T condition → data cards; `/workspace` and administrator review display the same graph. The browser-only fallback remains account scoped.

A v3 draft contains `phases[]`, `conditions[]`, `records[]` and `files[]`. Phase has a permanent contribution ID, optional name, formula, contributor identification status/evidence and optional feed/measured composition. Condition has its own ID and phaseId, explicit pressure/temperature definitions, values, path and notes. Record references phaseId / conditionId, stores its own origin/type, acquisition metadata, optional exact structure link and explicit condition overrides. Original files remain separately hashed byte streams. Legacy flat formula/name/P–T fields are authoritative projections from the graph, except explicitly enabled record-specific conditions.

The same-origin routes remain `GET /batches`, `GET/PUT /batches/:id`, `POST /batches/:id/submit`, `GET /batches/:id/events`, `GET /batches/:id/files/:fileId`, `DELETE /batches/:id` (recoverable archive), `POST /batches/:id/restore`, `GET /admin/review`, `PATCH /admin/review/:id`. Owner comes from the authenticated session; writes retain Origin/CSRF checks and expectedUpdatedAt conflict detection. Review envelopes add phases/conditions, with absent arrays accepted for legacy responses.

Server validation checks graph references, original hashes, conditions and scientific context before submission. New Phase/condition identities are protected by PostgreSQL keys and batch-scoped foreign keys. Draft saving remains allowed before context is complete. Legacy v2 reads conservatively create separate containers per record; importing an exported draft as a copy remaps all graph identities and preserves files/record associations.

Explicit public intent and batch approval are required for shared indexing. Target calculation pressure is not reported pressure. Contributor Phase IDs may organize results without confirming phase identity or stability; scientific homepage counts remain defined by the imported source dataset. Phase assignment, review, publication, calculation and ingestion remain independent. VASP execution, canonical cross-batch phase linkage and per-record partial review are not implemented.

[Contribution design](CONTRIBUTIONS.md) specifies fields, CSV/ZIP grouping, migration and boundaries. The broader future workflow request/response reservations in `lib/materials/contribution-contract.ts` do not imply an active worker.

## Authentication and ownership (v8)

See [AUTHENTICATION.md](AUTHENTICATION.md) and `lib/accounts/client.ts` for the same-origin identity BFF contract. The UI sign-in gate is not server authorization: the materials API must enforce sessions on every search and protected record/download request. Contribution ownerId must come from the server session; explicit contributor profile snapshots do not confer ownership. Local browser drafts now use mode/user-scoped IndexedDB keys, preserving pre-account drafts for explicit copying.

## Contribution draft recovery (2026-10-16, v15)

PUT/read draft persistence supports zero scientific records and original files; submission still rejects an empty/incomplete batch. Draft titles may be empty while editing; the client normalizes a blank saved title to Untitled contribution. No table or endpoint migration is required. Saved frontend URLs carry draft/condition/record identifiers; all server ownership, CSRF and optimistic-version checks remain in force. File path uniqueness is preserved: ordinary uploads resolve byte-identical same-path repeats by sharing the existing file ID, while distinct bytes get an explicit unique path. Manifest imports never silently redirect ambiguous references. Deletions remove graph references and retain shared files until their final record is removed; they persist only on save.
