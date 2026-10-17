# One command-line desk

Run node scripts/telecom.mjs <command>. Every command supports --json. Flags use --key=value. Unknown flags and ambiguous names exit 1 with candidates. Mutations require --actor and run atomically. The actor is a note about who performed the work, not a signed identity.

## accounts

Read the customer accounts and their owners.

`node scripts/telecom.mjs accounts --json`

## sites

Read the service locations.

`node scripts/telecom.mjs sites --json`

## services

Read the service inventory.

`node scripts/telecom.mjs services --json`

## order-book

Review move, add, change and disconnect orders.

`node scripts/telecom.mjs order-book --json`

## renewals

Review contracts expiring within 60 days and expired active services.

`node scripts/telecom.mjs renewals --json`

## margins

Review monthly charges less carrier costs by currency.

`node scripts/telecom.mjs margins --json`

## carrier-chase

Prepare the carrier follow-up list.

`node scripts/telecom.mjs carrier-chase --json`

## attention

Find overdue changes, carrier tasks and retention reviews.

`node scripts/telecom.mjs attention --json`

## compliance

Check service accuracy, retention review dates and missing carrier references.

`node scripts/telecom.mjs compliance --json`

## workload

Review open changes by owner.

`node scripts/telecom.mjs workload --json`

## history

Read the recorded change history.

`node scripts/telecom.mjs history --json`

## service

Read one service and its orders, tasks and notes.

`node scripts/telecom.mjs service <service-code> --json`

## insights

Answer ten cross-record questions.

`node scripts/telecom.mjs insights --json`

## add

Add an account, site, service, order or carrier task.

`node scripts/telecom.mjs add <account|site|service|order|task> --file=<record.json> --actor="<operator>" --json`

## log

Record a service note.

`node scripts/telecom.mjs log <service-code> --note="<factual note>" --actor="<operator>" --json`

## verify-service

Record an accuracy check already performed.

`node scripts/telecom.mjs verify-service <service-code> --checked=YYYY-MM-DD --reference="<source checked>" --actor="<operator>" --json`

## review-retention

Record a reasoned retention review.

`node scripts/telecom.mjs review-retention <service-code> --due=YYYY-MM-DD --reason="<reason for keeping the record>" --actor="<operator>" --json`

## authorise-order

Record customer authorisation already received.

`node scripts/telecom.mjs authorise-order <order-code> --on=YYYY-MM-DD --reference="<customer instruction>" --actor="<operator>" --json`

## complete-task

Record carrier task completion with evidence.

`node scripts/telecom.mjs complete-task <task-id> --on=YYYY-MM-DD --evidence="<carrier confirmation>" --actor="<operator>" --json`

## complete-order

Record a confirmed service change.

`node scripts/telecom.mjs complete-order <order-code> --on=YYYY-MM-DD --evidence="<completed carrier change>" --actor="<operator>" --json`

## cancel-order

Cancel a local change request.

`node scripts/telecom.mjs cancel-order <order-code> --reason="<reason>" --actor="<operator>" --json`

## import

Import a mapped Salesforce asset report.

`node scripts/telecom.mjs import salesforce --file=<assets.csv> --map=<mapping.json> --actor="<operator>" --dry-run --json`

## export

Export every record and source row.

`node scripts/telecom.mjs export --out=<new-backup.json> --json`

## weekly-review

Draft the Monday operations review.

`node scripts/telecom.mjs weekly-review --json`

## draft-change

Draft an internal change working paper.

`node scripts/telecom.mjs draft-change <order-code> --json`

## view

Render the read-only dashboards.

`npm run view`

## documents

Render service schedules, change papers and renewal briefs.

`npm run docs`

## Add record files

All fields below are required unless marked optional. Unknown fields fail.

- account: code, name, owner.
- site: account (code, name or id), code, name, address.
- service: account, site, code, name, kind (fibre, voice, mobile or data), carrier, carrier_reference (optional), status (planned, active or ceased), currency (NZD, AUD or USD), charge_cents, cost_cents, started_on, contract_end, review_due. A ceased service also requires ceased_on.
- order: service, code, kind (add, move, change or disconnect), owner, requested_on, due_on. Move requires target_site in the same account. Change requires target_charge_cents, target_cost_cents and target_contract_end. Only one order can remain open per service.
- task: order, title, owner, due_on.

Example new order file:

```json
{"service":"SVC-103","code":"MACD-NEW","kind":"change","owner":"Ari","requested_on":"2026-10-17","due_on":"2026-10-20","target_charge_cents":36000,"target_cost_cents":24000,"target_contract_end":"2027-10-17"}
```

Read the selected service before using this shape. Example dates are not an instruction to record an event.

## Change lifecycle

Add a requested order. Record the supplied customer instruction with authorise-order. Close each carrier task using actual evidence. Complete the order only after the carrier confirms it. The command updates local records: add activates, move changes the site, change updates commercial terms, disconnect records cessation. It does not operate the network. cancel-order closes an uncompleted request without altering its service and leaves task history intact.

## Amounts and dates

Input cents must be nonnegative safe integers. Read output keys ending in _cents are cents. HTML reports render those as decimal currency amounts. Dates use YYYY-MM-DD. Completion and authorisation cannot be future-dated. Database time is UTC. Open tasks and orders are overdue after their due date. Renewals include active contracts ending within 60 days and contracts already expired. Retention review dates are explicitly chosen business policy.

## Backups

export emits a versioned JSON object containing all seven record types, original import rows and audit events. --out refuses to overwrite a file. It is a portable export, not a restore command. Test your database backup and recovery process before real use.
