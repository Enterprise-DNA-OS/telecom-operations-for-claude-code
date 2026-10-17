# Telecom Operations for Claude Code

Customer services, carrier follow-ups and move, add, change and disconnect records in a database you own. Free MIT code from Enterprise DNA. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free code. Install, run the demo and map your export. Hosting and coding-agent costs are yours. | Your service fields, commercial terms, review rules, carrier connections and Salesforce mapping. [Get your version built](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=salesforce-communications-cloud&utm_medium=readme). | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=salesforce-communications-cloud&utm_medium=readme). |

## The work behind a service change

A customer wants a circuit moved. The desk needs the correct site, the customer's instruction, the carrier appointment and proof that the change finished. The same service record should then show the new location. This build keeps that sequence together and shows the work that is late.

Salesforce Communications Cloud Advanced lists US$475 per user per month, billed annually. Ten seats would be US$57,000 a year at that list price. This is an illustrative scenario, not a verified customer's invoice or a saving claim. [Vendor pricing](https://www.salesforce.com/communications/pricing/), checked 17 October 2026.

The free desk covers internal service records and change review. It does not operate a telecom network, bill subscribers, collect payments, monitor circuits or send carrier orders. Keep those systems in place until any replacement is scoped and checked.

## Quick start

Node 20 or newer. No server is needed for the embedded demo.

```bash
git clone https://github.com/Enterprise-DNA-OS/telecom-operations-for-claude-code.git
cd telecom-operations-for-claude-code
npm install
npm test
npm run demo
```

The demo ignores DATABASE_URL and writes fictional records under .data/demo. To read it on Linux or macOS:

```bash
DATA_DIR=.data/demo node scripts/telecom.mjs order-book
DATA_DIR=.data/demo node scripts/telecom.mjs service SVC-101 --json
DATA_DIR=.data/demo npm run view
DATA_DIR=.data/demo npm run docs
```

On PowerShell set `$env:DATA_DIR='.data/demo'`, then run without the DATA_DIR prefix. For real records, choose a fresh DATA_DIR, run npm run migrate and import without seeding. DATABASE_URL selects your controlled PostgreSQL database. Keep connection settings out of git.

## Recurring work

| Work | Command |
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

## Ten questions across your records

The insights command executes all ten today. These are questions the free desk answers across its records, not a claim that configured Salesforce reporting cannot answer them.

1. Which active services cost more than their monthly charge?
2. Which renewals have an unfinished service change?
3. Which carriers have overdue follow-ups?
4. Which customer accounts have the lowest monthly margin in each currency?
5. Which active services have no carrier reference?
6. Which requested changes still need customer authorisation?
7. Which authorised changes are blocked by carrier tasks?
8. Which service records need an accuracy or retention review?
9. Which expired service contracts are still active?
10. Which completed changes have both customer and carrier evidence?

## Your first hour: ten things to ask for

1. Show the changes already overdue.
2. Show the carrier appointments we still need.
3. List active services with expired contracts.
4. Show negative margin services, separated by currency.
5. Read the full SVC-101 file.
6. Show changes waiting for customer authorisation.
7. Draft the Monday review from changes, carriers and renewals.
8. Render each customer's service schedule with our brand.
9. Test our Salesforce export without importing it.
10. Add our escalation owner and a read-only carrier report.

## Import and export

```bash
node scripts/telecom.mjs import salesforce --file=examples/salesforce/assets.csv --map=examples/salesforce/mapping.json --actor="Operator" --dry-run --json
node scripts/telecom.mjs import salesforce --file=examples/salesforce/assets.csv --map=examples/salesforce/mapping.json --actor="Operator" --json
node scripts/telecom.mjs export --out=telecom-backup.json --json
```

Map the exact columns in your Salesforce Details Only service asset report once, then import with one command. The example is a configured report shape, not a universal Salesforce export. Dates must be ISO and amounts plain decimals. Original source rows are retained. Unchanged repeats are skipped; changed rows stop for reconciliation. The import creates accounts, sites and services. It does not reconstruct orders, tasks, attachments or approval history. Read the [switch guide](docs/replace-salesforce-communications-cloud.md).

## Views, paperwork and controls

Set business name, logo and colours in brand.json. npm run view renders the weekly desk, monthly margins and record review. npm run docs renders customer service schedules, change working papers and renewal briefs. Output is read-only HTML and drafts remain local.

An order must have recorded customer authorisation, current record reviews, closed carrier tasks and completion evidence before it changes the service register. Move orders stay within the customer's sites. One open change per service avoids conflicting instructions. Charges and carrier costs are stored in integer cents, with no currency conversion. Margin excludes taxes, usage and overhead.

[Record checks](docs/compliance.md) cite privacy rules and identify missing reviews. They do not certify compliance. A database owner can change records and history. Shared use needs reviewed access and backup arrangements; actor text is not authentication. The free desk has no customer login, carrier integration, mobile workflow or live provisioning. [Why no front end](docs/why-no-front-end.md) describes the boundary.

## Verification

npm test uses a temporary database and exercises all reads, all four change types, blocked transitions, cross-account moves, import conflicts, dry runs, rollback, repeated imports, exports, drafts and escaped HTML. CI covers Windows and Linux on Node 20 and 22, plus PostgreSQL 17. TEST_DATABASE_URL must refer to a disposable test database; the suite creates and removes its own schema.

## Licence

MIT. Copyright (c) 2026 Enterprise DNA. Salesforce is a trademark of Salesforce, Inc. This independent project is not affiliated with or endorsed by Salesforce.
