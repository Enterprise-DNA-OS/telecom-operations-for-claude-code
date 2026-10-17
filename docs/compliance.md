# Record controls and their sources

Reviewed 17 October 2026. The compliance command checks records, not legal compliance. This is a service administration tool, not a regulated network, emergency service, payment system or lawful-interception system.

| Check | Basis | What the build does |
|---|---|---|
| Missing accuracy review | [NZ privacy principle 8](https://www.privacy.org.nz/privacy-principles/8/) requires reasonable checks before use or disclosure | Lists unverified service records. Authorisation, completion and change drafts require a recorded check with a source reference. |
| Retention review overdue | [NZ privacy principle 9](https://www.privacy.org.nz/privacy-principles/9/) limits keeping personal information beyond its lawful purpose | Lists review dates that have passed. The operator records the reason and next review. No fixed statutory retention period is assumed and nothing is deleted automatically. |
| Access and storage review | [NZ privacy principle 5](https://www.privacy.org.nz/privacy-principles/5/) requires reasonable security safeguards | Base records have row security enabled with no public grants. This does not configure an application login or prove security. The owner must review database roles, device security, backups and generated files. |
| Telecom-specific obligations | The [Telecommunications Information Privacy Code 2020](https://www.privacy.org.nz/privacy-principles/codes-of-practice/tipc2020/) modifies privacy rules for telecommunications agencies | The operator must determine applicability and required controls before using real subscriber data. This build does not implement all code duties. Do not put traffic data, communications content, emergency location or directory publication workflows here. |
| Carrier reference and evidence | Local operating policy, not a legal rule | Flags active services with missing carrier references. Add completion needs a reference. Every completed change requires customer authorisation evidence and carrier completion evidence, with no open carrier tasks. |

Dates in the seed and example mapping are demonstration policy choices, not legal deadlines. An operator can record an accuracy check without this software validating the underlying document. An actor name is not authentication. Database owners can change the records and audit log. Shared use requires a designed access model and a tested recovery process. Files generated as reports, drafts and exports can contain private information. Store and share them under your own approved controls.

Australian operations need their own privacy and telecommunications assessment. The NZ checks are not represented as Australian compliance. No automated customer notices, cancellation messages, carrier orders or regulatory reports are sent.
