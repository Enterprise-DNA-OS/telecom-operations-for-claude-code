# Telecom Operations for Claude Code

This is an internal telecom service desk for a business connectivity reseller or a team managing customer circuits. Read the records before acting. All sample businesses and carriers are fictional.

## How to work

Use scripts/telecom.mjs for records. Confirm DATA_DIR or DATABASE_URL before work. The demo uses .data/demo; a fresh business database starts with migrations only, without the seed. Read docs/cli.md for flags and record files. Read docs/compliance.md before interpreting record checks.

| When the operator asks | Use |
|---|---|
| Read the customer accounts and their owners | /accounts |
| Read the service locations | /sites |
| Read the service inventory | /services |
| Review move, add, change and disconnect orders | /order-book |
| Review contracts expiring within 60 days and expired active services | /renewals |
| Review monthly charges less carrier costs by currency | /margins |
| Prepare the carrier follow-up list | /carrier-chase |
| Find overdue changes, carrier tasks and retention reviews | /attention |
| Check service accuracy, retention review dates and missing carrier references | /compliance |
| Review open changes by owner | /workload |
| Read the recorded change history | /history |
| Read one service and its orders, tasks and notes | /service |
| Answer ten cross-record questions | /insights |
| Add an account, site, service, order or carrier task | /add |
| Record a service note | /log |
| Record an accuracy check already performed | /verify-service |
| Record a reasoned retention review | /review-retention |
| Record customer authorisation already received | /authorise-order |
| Record carrier task completion with evidence | /complete-task |
| Record a confirmed service change | /complete-order |
| Cancel a local change request | /cancel-order |
| Import a mapped Salesforce asset report | /import |
| Export every record and source row | /export |
| Draft the Monday operations review | /weekly-review |
| Draft an internal change working paper | /draft-change |
| Render the read-only dashboards | /view |
| Render service schedules, change papers and renewal briefs | /documents |
| Make the fields and process fit the business | /customise |
| Add a read-only report for a new question | /new-view |

## Rules

- Never send email, messages, carrier instructions or network commands. Drafts stay in drafts/.
- Record authorisation and completion only from evidence the operator supplies. A typed actor is not authenticated identity.
- Completing an order updates the local service register. It never proves that a network changed.
- Preserve source rows, identifiers, currencies and existing history. Never guess which ambiguous record was meant.
- Use one transaction for mutations. Do not remove gates to make a test pass.
- Do not delete real records or apply migrations to the real database without the operator's explicit instruction.
- Do not collect call records, message content, emergency location, card data or credentials here.
- Export and back up before customisation. Verify access, backups and jurisdiction rules before shared use.
- Do not claim the free desk replaces billing, provisioning, routing, field dispatch or subscriber portals.

## Working on the code

Keep main. Run npm test and npm run demo after domain changes. CI tests Node 20 and 22 on Windows and Linux and PostgreSQL 17. Source data, .env files, reports and drafts stay out of git. All amounts are integer cents and margins remain separated by currency.

Omni by Enterprise DNA: https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=salesforce-communications-cloud&utm_medium=instructions
