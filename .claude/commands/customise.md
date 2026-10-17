# Make the fields and process fit the business

Read CLAUDE.md and docs/cli.md. Confirm the selected database before reading real records.

Describe the requested field, stage, calculation or rule. Read the current migration and affected commands. Write a new migration, never rewrite an applied one. Back up real records. Apply the migration to a temporary database and add meaningful tests for the changed behaviour. Update the CLI, import mapping, documents and affected commands. Run npm test and demo. Present the migration and its effect before applying it to the real database. Never add live carrier actions.
