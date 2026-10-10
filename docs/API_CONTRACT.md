# Independent materials API contract

This is an interface reservation for a future verified backend. No API server, sample response, or fallback database is implemented in this project. The application has no dependency on the original CALYPSO site.

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

Material detail navigation is reserved for a later phase and is intentionally not active on preview cards. Add it only when real independent detail routes exist.

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

## Local contribution drafts (no submission API yet)

`/contribute` is a separate page-scoped workspace. It does not call `fetch`, write local storage, send email, publish records or use the reserved materials query endpoints. File content and contact metadata exist only in page memory until a local JSON export; refresh/navigation clears the workspace.

Export shape:

```ts
interface LocalContributionDraft {
  schemaVersion: 1;
  status: "local-draft";
  metadata: {
    contributorName: string;
    email: string;
    formula: string; // Normalized text.
    pressureGPa: number; // Finite actual recorded pressure, including zero.
    calculationMethod: string; // Contributor-supplied, not platform-approved.
    source: string;
    notes: string;
    permissionConfirmed: true;
  };
  structure: {
    fileName: string;
    format: "cif" | "poscar";
    sha256: string; // SHA-256 of the decoded structure text encoded as UTF-8.
    content: string;
  };
  preflight: { format: "cif" | "poscar"; checks: string[]; warnings: string[] };
}
```

A draft holds one structure record. File limits are 5 MiB. Supported names are `.cif`, `POSCAR`, `.poscar` and `.vasp`. CIF checks look for a single named data block, six cell parameters and coordinate field names. POSCAR checks basic lattice scaling, nonzero cell volume, atom counts, coordinate mode and the expected numeric position rows. These checks do not validate full file syntax, symmetry, scientific correctness, metadata/structure agreement, stability or ownership.

Future actual submissions require a separately agreed API, authentication, server-side file validation, permission/licensing policy and explicit review states. The confirmed process is prepare → human review → ingestion. A locally exported draft is not an accepted submission and must not enter a published record collection automatically. No endpoint names or successful submission responses are invented in this phase.
