# Record a reasoned retention review

Read CLAUDE.md and docs/cli.md. Confirm the selected database before reading real records.

```bash
node scripts/telecom.mjs review-retention <service-code> --due=YYYY-MM-DD --reason="<reason for keeping the record>" --actor="<operator>" --json
```

Read related records before drafting or changing them. Present the result in plain language, retaining codes, dates and currency units. If matching is ambiguous, show candidates and ask which record. Never send a document or issue a carrier instruction.
