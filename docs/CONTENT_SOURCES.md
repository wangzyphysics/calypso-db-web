# Content and visual sources

Current revision: 2026-10-10. This is an independent local prototype without a connected materials dataset.

## Public contact and team

- `database@calypso.cn` was supplied and approved for display by the user.
- Join, collaboration, website feedback and contribution mail links use separate subjects. No messages are sent by the application.
- The user requested five placeholder names: 张三, 李四, 王五, 赵六, 孙七. They are not a verified roster. No real researcher biographies, student identities, institutional endorsement or current vacancies are asserted.
- Calculation protocols, materials provenance, data citations, licensing and scientific database releases have not been supplied. `/docs` marks these as To be published or pending. Platform update entries describe actual interface work only.

## Periodic-table reference dataset

- Official NCBI PubChem endpoint: https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON
- Human-readable source: https://pubchem.ncbi.nlm.nih.gov/periodic-table/
- Retrieved: 2026-10-10; 118 elements stored in `lib/materials/element-reference.ts`.
- Source fields: AtomicNumber, Name, AtomicMass, ElectronConfiguration, Electronegativity, OxidationStates and GroupBlock. Reference values are retained as source strings; blank fields remain null. Prediction qualifiers are preserved.
- Atomic mass is labelled in u; it is not presented as an exact measured material property or an assertion of standard atomic-weight status for every element. Oxidation-state entries retain the source's reported states and qualifications.
- Ten source category groups provide the table colors. These do not represent dataset coverage, phase stability or pressure-dependent behavior.
- The stored snapshot is static and does not require a runtime request to PubChem. Review upstream changes explicitly before refreshing it.

## Structure-file checks

- VASP POSCAR specification: https://vasp.at/wiki/index.php/POSCAR — cell scaling, optional species names, atom counts, selective dynamics and coordinates. Negative single scaling factors represent a requested volume; three scale factors must be positive.
- IUCr CIF syntax: https://www.iucr.org/what-we-do/digital-standards/cif/cif1/file-syntax
- Local preflight supports common text CIF/POSCAR forms only. It is not a complete CIF parser, structure validator or scientific review. The original decoded text is preserved; no structures are interpolated or labelled stable.
- Files and metadata used in tests are explicitly synthetic QA fixtures, never scientific application records.

## Design references

- Materials Project search tutorial: https://docs.materialsproject.org/apps/explorer-apps/materials-explorer/tutorial — composition/identifier queries, periodic table and refining filters.
- Atomly: https://atomly.matchat.cn/ and HPMat: https://hpmat.org/ — product direction only. No records, statistics, branding assets or services are copied.
- Apple: https://www.apple.com.cn/iphone-duo/ and https://www.apple.com.cn/iphone-18-pro/ — scroll-based visual progression and restrained transitions. No Apple assets or implementation are reused.

## Images and geography

- `public/images/diamond-anvil-cell.jpg` is an AI-generated conceptual illustration, not a photograph, apparatus specification or measured dataset. Generated using the imagegen skill; optimized to JPEG. The homepage labels it as conceptual.
- `lib/materials/world-map.ts` contains static geometry derived from Natural Earth 1:110m Admin 0 countries: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson
- Natural Earth geography is public domain: https://www.naturalearthdata.com/about/terms-of-use/
- The map contains no invented user counts, hotspots or geolocation tracking. Counts and intensity require an optional verified aggregate statistics response.
