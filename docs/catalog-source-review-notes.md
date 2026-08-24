# O*NET and ESCO Source Review

**Project:** AI-VR Career Guidance System
**Review date:** 24 August 2026
**Review mode:** Read-only; official first-party sources only

## Scope and conclusion

This review assessed O*NET and ESCO as possible sources for a future career-catalog refresh. No accounts were created, no authentication was performed, no purchases were made, no forms were submitted, and no external service was changed. The result is a source and licensing decision, not an authorization to ingest or publish third-party data.

Both sources are viable for a zero-cost, version-pinned catalog pipeline. **ESCO is the simpler first candidate for a freely redistributable multilingual and relationship-rich snapshot**, because the European Commission describes ESCO as free to download, use, reproduce, and reuse for any purpose subject to acknowledgement and clear modification notices.[1] O*NET’s downloadable database is also broadly reusable under CC BY 4.0 with attribution and change-notice requirements, but its Web Services path requires registration, a registered application URL, prominent attribution, and compliance with service limits.[2] [3]

The project should therefore keep the current project-authored catalog as the production source of truth, use separate O*NET and ESCO adapters, pin an exact source release, store provenance and license metadata, generate a diff report, require manual approval, and publish only an approved snapshot. No learner profile, assessment answer, conversation, or other personal data is needed for ingestion.

## Source comparison

| Area | O*NET | ESCO | Implication for this project |
|---|---|---|---|
| Official owner/source | U.S. Department of Labor, Employment and Training Administration; National Center for O*NET Development | European Commission, Directorate-General for Employment, Social Affairs and Inclusion | Store source owner and attribution text with every snapshot. |
| Primary data access | Downloadable database files, including SQL for PostgreSQL-compatible systems and machine-readable RDF; Web Services API is also available | Downloadable SKOS-RDF and CSV classification; web-service API and a downloadable/local API are documented | Prefer bulk/local snapshots for scheduled refresh and reproducibility; keep API adapters optional. |
| Current release information observed | O*NET Database 30.3; update summary reported 891 occupations updated year-to-date through May 2026 and the next database update scheduled for August 2026 | Official site footer reported ESCO v1.2.1, last updated 10 December 2025; web-service page also documents older selectable versions including v1.0.9 and v1.2.0 | Never infer “latest” from an API default. Record exact version, release date, retrieval time, and artifact hash. Recheck these time-sensitive values before implementation. |
| Update model | O*NET states that data collection updates occur quarterly, with a primary update in the third quarter; past releases are archived | ESCO states it is continuously updated; major versions can change concepts/data model, while minor versions can change relations, labels, typos, and translations; delta CSV files are provided | Use a release-aware refresh trigger rather than blindly overwriting the catalog. Treat major updates as schema/mapping review events. |
| Identifiers | O*NET-SOC occupation taxonomy and stable database identifiers; the database page also describes permanent machine-readable resource IRIs | ESCO concepts use stable URIs; occupations map to ISCO-08; alternative labels and relationship modules are available | Preserve external IDs/URIs separately from project IDs and map aliases/relationships through reviewed crosswalks. |
| Relevant content | Occupations, skills, essential and transferable skills, education/training, tasks, work activities, work context, interests, and related occupations/domains | Occupations, skills/competences, qualifications/education relationships, ISCO hierarchy, alternative labels, and linking modules | The project’s ontology fields for domains, aliases, prerequisites, transferable/related skills, education pathways, and provenance are directionally compatible. |
| Learner data required | None for a catalog snapshot | None for a catalog snapshot | Keep ingestion completely separate from user-owned data and consented personalization. |

## O*NET licensing and access

The official O*NET database page identifies release 30.3 and provides downloadable SQL files for MySQL, PostgreSQL, MariaDB, and other ANSI-compatible relational databases, as well as RDF and other machine-readable formats.[2] It recommends loading numbered files in order to maintain foreign-key integrity. The same page describes a broad content model covering occupations, skills, transferable skills, education and training, tasks, work activities, work context, interests, and related domains.[2]

> “Except as noted below, the content of the O*NET 30.3 Database is licensed under a Creative Commons Attribution 4.0 International License.” — O*NET database license page[2]

The database license requires credit to the O*NET 30.3 Database and the U.S. Department of Labor Employment and Training Administration, a link to the CC BY 4.0 license, and an indication of changes. Modified material should be identified clearly, with a recommended listing or equivalent contact/download path for changes. O*NET is also a USDOL/ETA trademark, and third-party content is outside the database license.[2]

The separate Web Services data license applies to O*NET data returned through the API and says registered account holders may publish it subject to the terms. The terms require a Web Services account in good standing, acknowledgement and a link, registration of the application URL, and unmodified presentation except for changes to format or organization that do not materially change accuracy, attribution, or intent.[3] The terms describe best-effort availability and possible throttling or suspension above **5 requests per second** or **50,000 requests per day**, and they reserve the right to change interfaces with notice.[4] Web Services responses may include external-source content with separate restrictions.[3]

**O*NET decision:** use the downloadable database for a reproducible local import if O*NET is selected, and retain the required attribution/change log. Do not build the first refresh around Web Services because registration and a registered application URL would add an approval and availability dependency that is unnecessary for a college-project batch pipeline.

## ESCO licensing and access

The official European Commission ESCO API page documents both a web-service API and a downloadable/local API.[1] It lists the ESCO API software under the European Union Public Licence (EUPL) 1.2 and identifies Apache 2.0 components used by the software.[1] The official FAQ states that ESCO is published in SKOS-RDF and CSV and can be downloaded, used, reproduced, and reused for any purpose free of charge, subject to acknowledgement and clearly indicating modified or adapted versions.[5]

The official ESCO web-service documentation describes URI-based concept access and version selection. At the time of review, it stated that v1.0.9 was the default while v1.2.0 was also available; the current-site indicator reported v1.2.1, demonstrating why the pipeline must pin a selected version instead of relying on a service default.[6]

The official ESCO versions page distinguishes major updates, which can introduce concepts and data-model changes, from minor updates, which can adjust relations, labels, translations, and corrections. It lists v1.2.1 as a December 2025 minor release and states that delta files are available as CSV for understanding changes between versions.[7]

ESCO’s official FAQ also documents core modules, linking modules, supporting modules, stable URIs, alternative labels, occupation-to-ISCO relationships, and education/training connections.[5] These characteristics are useful for multilingual terminology normalization and future career-to-skill and career-to-education mappings. The project must nevertheless preserve the original preferred labels and descriptions where attribution or interoperability requires it, and it must mark any local adaptation as project-authored.

**ESCO decision:** use an official downloadable CSV/SKOS-RDF release as the first external-source candidate after a separate mapping and attribution review. The local API is an option if a fully local deployment becomes valuable, but its software license and operational footprint must be reviewed independently from the data-reuse terms.

## Recommended refresh design

The current repository already has a provider-neutral ontology snapshot, source version, license metadata, deterministic diff reporting, and explicit pending-review/approved/rolled-back states. The research supports the following next design without changing the current career, recommendation, skill-gap, or roadmap contracts:

| Pipeline stage | Required behavior |
|---|---|
| Acquire | Retrieve only an approved official bulk release or a documented API response set. Do not send learner data. Use a bounded, retrying downloader with checksums and an immutable raw artifact. |
| Identify | Record source key, source release/version, release date if provided, retrieval timestamp, URL, license, attribution text, and content hash. For ESCO, record the selected version rather than the API default. |
| Normalize | Map O*NET-SOC or ESCO URIs to internal stable IDs through an explicit crosswalk. Keep external IDs, preferred labels, alternative labels, source descriptions, and local adaptations in separate fields. |
| Validate | Check duplicate IDs, orphan relationships, missing descriptions, invalid levels, broken education links, unsupported license exceptions, and unexpected record-count changes. Reject invalid snapshots. |
| Diff | Produce added/updated/removed records and changed fields. Treat major source releases or large diffs as manual review events. ESCO delta CSVs may supplement the local diff; they do not replace validation. |
| Approve | Require an authorized project-owner review of the diff, license/attribution text, mapping decisions, and user-facing implications. Approval must be recorded separately from acquisition. |
| Publish | Publish only the approved normalized snapshot. Keep the previous approved snapshot available for rollback; never mutate the current catalog in place from an unreviewed download. |
| Observe | Record refresh success/failure, duration, record counts, diff size, and publication status without learner data. Alert on missing releases, checksum changes, unusually large diffs, or license metadata changes. |

For a zero-cost implementation, a low-frequency scheduled check can look for announced releases and prepare a pending report, while actual publication remains manual. O*NET’s quarterly update statement suggests a quarterly review cadence with an additional check around its primary third-quarter update. ESCO has no simple fixed cadence in the reviewed pages; a monthly metadata check plus event-driven review of official version announcements is safer than assuming a quarterly release. No schedule has been configured in this repository because the source account/hosting and non-production rehearsal gates are still open.

## Decision and pending approvals

The project may proceed with a **local, version-pinned, read-only ESCO or O*NET snapshot prototype** after selecting one source and writing its adapter-specific attribution/mapping tests. It should not yet enable external-career-data production behavior. The following remain pending: selection of the first source, exact release artifact, field-level mapping, license-exception review, scheduled runtime, persistent import-report storage, authorized publication UI, and non-production restore/rehearsal evidence.

## References

[1]: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api "European Commission — Use ESCO Services (API)"
[2]: https://www.onetcenter.org/database.html "O*NET Resource Center — O*NET 30.3 Database and database license"
[3]: https://services.onetcenter.org/help/license_data "O*NET Web Services Data License"
[4]: https://services.onetcenter.org/terms "O*NET Web Services Terms of Service"
[5]: https://esco.ec.europa.eu/en/about-esco/faq "European Commission — ESCO FAQ"
[6]: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api/esco-web-service-api "European Commission — ESCO Web Service API"
[7]: https://esco.ec.europa.eu/en/about-esco/escopedia/escopedia/esco-versions "European Commission — ESCO versions"
