# Add a read-only report for a new question

Read CLAUDE.md and docs/cli.md. Confirm the selected database before reading real records.

Ask for the business question, read the schema and run a SELECT against the existing records. Add a read-only SQL view in a new migration if needed and a section in views.json. Preserve currency units and record identities. Render with npm run view, inspect the output and run npm test. Do not add action buttons or a server.
