# Record an accuracy check already performed

Read CLAUDE.md and docs/cli.md. Confirm the selected database before reading real records.

```bash
node scripts/telecom.mjs verify-service <service-code> --checked=YYYY-MM-DD --reference="<source checked>" --actor="<operator>" --json
```

Read the full service history first. Record only an action already evidenced by the operator. Never infer approval or carrier completion. Completing an order changes local service records only. Explain blocked records and the evidence missing. Do not invent evidence to pass a gate.
