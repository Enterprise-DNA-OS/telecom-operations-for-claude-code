# Bring Salesforce service records across

Checked 17 October 2026. This importer covers a configured service asset report, not a full Communications Cloud migration.

## Export and map once

1. In Salesforce, create or run an asset report with the service, account and site fields required in docs/cli.md. Use stable asset identifiers as code and stable account and site codes. Include carrier reference, service status, currency, monthly charge, monthly carrier cost, start and contract end dates. Account owner and site address must be present in the report or added from a verified join.
2. Use Export, Details Only, CSV. Salesforce documents this in [Manage Reported Data](https://trailhead.salesforce.com/content/learn/projects/create-reports-and-dashboards-for-sales-and-marketing-managers/manage-reported-data) and [Export a Report](https://help.salesforce.com/s/articleView?id=sf.reports_export.htm&language=en_US). Export permissions and report types depend on the installation.
3. Save UTF-8 CSV. Convert dates to YYYY-MM-DD and amounts to unsigned plain decimals without currency symbols or separators. Preserve identifiers as text. Convert any other encoding explicitly.
4. Copy examples/salesforce/mapping.json and replace each column heading with the exact heading in your report. Map source statuses and service types explicitly. Set a retention review date under your policy. For ceased records, map ceased_on too. The supplied assets.csv is fictional and demonstrates one configured report, not Salesforce's universal column names.

## One-command import after mapping

```bash
node scripts/telecom.mjs import salesforce --file=your-assets.csv --map=your-mapping.json --actor="Operator" --dry-run --json
node scripts/telecom.mjs import salesforce --file=your-assets.csv --map=your-mapping.json --actor="Operator" --json
```

Use a fresh migrated database. The dry run rolls back all writes. Compare counts, account/site links, dates and totals separately for each currency before importing for real. Each file is atomic. Duplicate asset codes, conflicting customer details, invalid dates and invalid money stop the entire file. Unchanged repeats skip records; changed source rows or mappings stop for explicit reconciliation. A repeated export never overwrites service changes made locally after import. Original source rows are included in the portable export.

## What carries over

Accounts and owners, sites and addresses, service identity, type, carrier reference, status, currency, monthly charge and cost, start and contract end dates. Imported services require an accuracy review before orders can be authorised or completed.

## What needs a separate migration

Product bundles, usage, pricing rules, billing, tax, invoices, payments, attachments, approval history, orders, tasks, notes, subscriptions, network identifiers not included in the mapping, and carrier connections. Do not reconstruct missing approvals or completion evidence. Map additional records through a reviewed migration with Enterprise DNA or your own coding agent.

## Cutover

A mapped service inventory can be imported in one working session. Full replacement depends on your operating scope. Reconcile a small pilot, run both service registers in parallel, and verify the records that staff use. Keep existing billing, emergency-service and network systems running. Do not cancel Salesforce until every required workflow has an accepted replacement and its records are reconciled.
