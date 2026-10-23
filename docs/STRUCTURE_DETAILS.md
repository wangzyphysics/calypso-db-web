# Structure record workspaces — v17, 2026-10-18

## Entry and layout

`/materials/:recordId` is a signed-in workspace. Search formula links, record-ID links and preview-card actions use the exact search record ID. The existing BFF forwards `/api/materials/records/*` to the independent PostgreSQL API. No source-database schema migration or visualization dependency is required.

The page contains a record overview, crystal viewer and lattice panel, phase pressure records, paginated atomic coordinates, source calculations, provenance and downloads. Section links remain visible while scrolling; forms/tables are never blurred. A requested cell is local to the record and persisted as `?cell=<structureId>`; invalid or foreign cell IDs produce an explicit fallback notice. Login/signup preserve these record URLs, including cell and section.

The SVG orthographic viewer uses the actual 3×3 lattice and fractional sites. An orthonormal camera basis improves the initial framing without changing lengths or geometry. Drag or arrow keys rotate; +/− zoom and 0 resets. Visible controls support zoom, labels, unit-cell boundaries and camera presets. Atom size is illustrative; no chemical bonds, atomic radii or stability are inferred. Mixed-occupancy sites use a neutral marker and retain species/occupancy in coordinates and exports. Cells above 2,000 sites use coordinate/export inspection rather than a truncated rendering.

## Active API

All detail/download requests require the platform session; temporary-password accounts must first change their password. Responses are `no-store`. Backend implementation: `materials-backend-lab/src/platform/material-detail.mjs`. Frontend runtime contract: `lib/materials/detail.ts`.

### `GET /api/materials/records/:id`

Imported display record IDs (`str_*`) and material IDs (`mat_*`) resolve to a canonical detail DTO. A unique source external ID also resolves; an ambiguous alias returns 409. Unknown IDs and inaccessible contributions return the same 404 response. The payload contains:

- Canonical record/material/phase IDs, formula, reported conditions and source symmetry.
- `cells[]`: exact full-cell lattice, sites/species/occupancies, volume, role, composition and site count; `defaultCellId` identifies the display cell.
- `calculations[]`: source task state/version/settings, exact output-cell association, raw source energy with its own site count and volume, and result summaries/quality flags. Large forces/stress/OUTCAR arrays and unmapped representative/Wyckoff arrays are excluded from the page DTO.
- `sources[]`: source namespace, external ID, provided license, a sanitized source reference and selected source metadata. No local absolute paths or user contact email is returned.
- `relatedRecords[]`: up to 200 exact records sharing an explicit source Phase ID, or a contributor Phase ID within the same batch. `relatedHasMore` links to the phase search for larger groups. No formula-only merge, stable-phase claim or interpolation occurs.

Contributed IDs (`contribution_<record UUID>`) use the existing v3 contribution graph and original files. An owner can read a private draft; administrators can read submitted data for review; ordinary signed-in users can read approved public data. Archived batches, deleted owners and demo data are unavailable. The same checks protect original-file downloads and related records. Contributor email/profile details are omitted.

Raman/XRD/property records reuse the existing numerical parser and explicit x/y column mapping. Original order and units are preserved, including descending/nonmonotonic x and single-value property tables. No smoothing, peak assignment or structural inference is performed. Original attachments remain downloadable. Contributed CIF/POSCAR files currently retain their original bytes and metadata; parsing a verified full-cell geometry into the scientific structure store is a separate ingestion step, so these records do not display an invented crystal.

### `GET /api/materials/records/:id/download?format=…&cell=…`

Formats: `json`, `cif`, `poscar`, `csv`, `original` (contributed files only). Foreign cell IDs fail with 404. Duplicate/unsupported parameters fail with 400.

- JSON: `schemaVersion: 1`, `exportKind: calypso-record-detail`, selected cell ID and the detail projection, including all stored cell representations and task summaries. This is not a contribution upload package and does not claim to contain original full VASP outputs.
- CIF: generated full-cell P1 representation with explicit comments. The original space group is not reassigned to P1. Left-handed bases are transformed by reversing c and the corresponding fractional z together before metric export; occupancy is retained.
- POSCAR: exact selected lattice and grouped species with Direct coordinates. Partial or mixed occupancies return 422 rather than being rounded into integer atoms.
- CSV: all selected full-cell sites, species, occupancies and fractional coordinates.
- Original: byte-for-byte contributor file, served as a download after the same visibility check.

Export conventions follow the [VASP POSCAR specification](https://vasp.at/wiki/index.php/POSCAR) and IUCr definitions for [fractional coordinates](https://www.iucr.org/__data/iucr/cifdic_html/1/cif_core.dic/Iatom_site_fract_.html) and [site occupancy](https://www.iucr.org/__data/iucr/cifdic_html/1/cif_core.dic/Iatom_site_occupancy.html).

## Scientific boundaries

The initial imported dataset has 20 material identities and 40 cell representations. For example, `caly-259513` has a 30-site display cell and a 15-site relaxation cell. Its raw source energy belongs to the latter. Imported temperature is unreported. Source phase labels and successful task execution do not establish thermodynamic stability or method compatibility. The page displays no fabricated DOS, band gap, EOS fit, enthalpy curve, XRD simulation or interpolated structure. Wyckoff labels need a verified site mapping before display.

The existing account, search, contribution validation, shared CLI/web ingestion and review endpoints remain compatible. Deployment requires updating **both** the frontend Worker and the independent API package; rebuilding the frontend alone cannot add the new server endpoint. No remote deployment was performed for this revision.
