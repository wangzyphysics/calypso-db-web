# Phase 2 architecture notes — design only

The application shell owns navigation and theme. Search owns its URL query. There is no global pressure store, crystal viewer, chart, or structure interpolation in Phase 1.

Future material exploration should use:

```text
Material identity → Phase identity → Available pressure → Exact structure record
```

A context scoped to a material detail route should distinguish:

```ts
interface FutureMaterialExploration {
  materialId: string;
  selectedPhaseId: string | null;
  requestedPressureGPa: number | null;
  actualPressureGPa: number | null;
  selectedRecordId: string | null;
  mode: "follow-selected-phase" | "follow-stable-phase";
}
```

This shape is explanatory documentation, not implemented application state.

- Follow Selected Phase stays within the selected phase's available records.
- Follow Stable Phase requires validated comparative stability data at the requested conditions. Record existence is insufficient.
- A slider request must resolve to a real record, display its actual pressure, and make any mismatch explicit.
- Charts may emit pressure or phase selections; a material-scoped coordinator should synchronize the selected exact record and URL.
- Crystal geometry, coordinates, symmetry, lattice parameters, metadata, and scientific plots must all refer to that record.
- Never invent interpolated crystal structures. XRD must use an actual structure and clearly defined calculation settings.
- Changing materials resets the exploration context and cancels outstanding data requests.

Suggested next work, subject to review:

1. Confirm real data ownership, API contracts, material/phase identifiers, counting definitions, creation timestamps, pressure units, and provenance.
2. Implement real material search and filtering with URL state and pagination.
3. Establish independent material detail routes and record-level downloads before enabling detail links.
4. Add the scoped pressure context, then integrate scientific viewers and linked charts against verified data.

No Phase 2 implementation has been started.
