# Import a mapped Salesforce asset report

Read CLAUDE.md and docs/cli.md. Confirm the selected database before reading real records.

```bash
node scripts/telecom.mjs import salesforce --file=<assets.csv> --map=<mapping.json> --actor="<operator>" --dry-run --json
```

Read docs/replace-salesforce-communications-cloud.md first. Map exact column headings and statuses from the real report. Do a dry run, reconcile counts and per-currency totals, then remove --dry-run for the requested import. Changed source rows stop for reconciliation. Never describe a made-up report as a native export.
