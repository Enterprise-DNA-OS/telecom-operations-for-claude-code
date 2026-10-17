CREATE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TABLE accounts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE CHECK (length(trim(code))>0), name text NOT NULL CHECK(length(trim(name))>0), owner text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES accounts(id), code text NOT NULL UNIQUE, name text NOT NULL, address text NOT NULL,
 UNIQUE(id,account_id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE services (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES accounts(id), site_id uuid NOT NULL,
 code text NOT NULL UNIQUE, name text NOT NULL, kind text NOT NULL CHECK(kind IN ('fibre','voice','mobile','data')),
 carrier text NOT NULL, carrier_reference text NOT NULL DEFAULT '', status text NOT NULL CHECK(status IN ('planned','active','ceased')),
 currency text NOT NULL CHECK(currency IN ('NZD','AUD','USD')), charge_cents bigint NOT NULL CHECK(charge_cents>=0), cost_cents bigint NOT NULL CHECK(cost_cents>=0),
 started_on date NOT NULL, contract_end date NOT NULL, ceased_on date, review_due date NOT NULL,
 verified_on date, verification_reference text NOT NULL DEFAULT '', source_row jsonb, source_hash text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(site_id,account_id) REFERENCES sites(id,account_id), CHECK(contract_end>=started_on),
 CHECK(ceased_on IS NULL OR ceased_on>=started_on), CHECK((status='ceased')=(ceased_on IS NOT NULL)),
 CHECK(verified_on IS NULL OR length(trim(verification_reference))>0)
);
CREATE TABLE change_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), service_id uuid NOT NULL REFERENCES services(id), code text NOT NULL UNIQUE,
 kind text NOT NULL CHECK(kind IN ('add','move','change','disconnect')), owner text NOT NULL, requested_on date NOT NULL, due_on date NOT NULL,
 status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','authorised','completed','cancelled')),
 target_site_id uuid REFERENCES sites(id), target_charge_cents bigint CHECK(target_charge_cents>=0), target_cost_cents bigint CHECK(target_cost_cents>=0), target_contract_end date,
 authorisation_reference text NOT NULL DEFAULT '', authorised_on date, completion_reference text NOT NULL DEFAULT '', completed_on date,
 cancellation_reason text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(due_on>=requested_on), CHECK(authorised_on IS NULL OR authorised_on>=requested_on), CHECK(completed_on IS NULL OR completed_on>=authorised_on),
 CHECK(status NOT IN ('authorised','completed') OR (authorised_on IS NOT NULL AND length(trim(authorisation_reference))>0)),
 CHECK((status='completed')=(completed_on IS NOT NULL)), CHECK(status<>'completed' OR length(trim(completion_reference))>0),
 CHECK(status<>'cancelled' OR length(trim(cancellation_reason))>0),
 CHECK((kind='move')=(target_site_id IS NOT NULL)),
 CHECK((kind='change')=(target_charge_cents IS NOT NULL AND target_cost_cents IS NOT NULL AND target_contract_end IS NOT NULL)),
 CHECK(kind='change' OR (target_charge_cents IS NULL AND target_cost_cents IS NULL AND target_contract_end IS NULL))
);
CREATE UNIQUE INDEX one_open_order_per_service ON change_orders(service_id) WHERE status IN ('requested','authorised');
CREATE TABLE carrier_tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES change_orders(id), title text NOT NULL, owner text NOT NULL, due_on date NOT NULL,
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')), closed_on date, evidence text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((status='closed')=(closed_on IS NOT NULL)), CHECK(status<>'closed' OR length(trim(evidence))>0)
);
CREATE TABLE notes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), service_id uuid NOT NULL REFERENCES services(id), actor text NOT NULL, body text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor text NOT NULL, event text NOT NULL, record_id uuid NOT NULL, detail jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION check_order_scope() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s services; target_account uuid;
BEGIN
 SELECT * INTO s FROM services WHERE id=NEW.service_id;
 IF NEW.target_site_id IS NOT NULL THEN
  SELECT account_id INTO target_account FROM sites WHERE id=NEW.target_site_id;
  IF target_account IS DISTINCT FROM s.account_id THEN RAISE EXCEPTION 'Move site must belong to service account'; END IF;
 END IF;
 IF NEW.target_contract_end IS NOT NULL AND NEW.target_contract_end<s.started_on THEN RAISE EXCEPTION 'Contract end precedes service start'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER order_scope BEFORE INSERT OR UPDATE ON change_orders FOR EACH ROW EXECUTE FUNCTION check_order_scope();
DO $$ DECLARE n text; BEGIN
 FOREACH n IN ARRAY ARRAY['accounts','sites','services','change_orders','carrier_tasks','notes','audit_events'] LOOP
  EXECUTE format('CREATE TRIGGER touch_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()',n);
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',n);
  EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',n);
 END LOOP;
END $$;
CREATE VIEW service_register AS
 SELECT s.id,s.code,a.name account,si.name site,s.name,s.kind,s.carrier,s.carrier_reference,s.status,s.currency,
 s.charge_cents,s.cost_cents,(s.charge_cents-s.cost_cents) margin_cents,s.started_on,s.contract_end,s.ceased_on,s.review_due
 FROM services s JOIN accounts a ON a.id=s.account_id JOIN sites si ON si.id=s.site_id;
CREATE VIEW order_book AS
 SELECT o.id,o.code,s.code service,s.account,s.carrier,o.kind,o.owner,o.status,o.requested_on,o.due_on,
 greatest(current_date-o.due_on,0) days_overdue,
 (SELECT count(*)::integer FROM carrier_tasks t WHERE t.order_id=o.id AND t.status='open') open_tasks
 FROM change_orders o JOIN service_register s ON s.id=o.service_id WHERE o.status IN ('requested','authorised');
CREATE VIEW renewal_queue AS
 SELECT r.*,contract_end-current_date days_to_expiry FROM service_register r WHERE status='active' AND contract_end<=current_date+60;
CREATE VIEW carrier_queue AS
 SELECT t.id,o.code change_order,s.code service,s.carrier,t.title,t.owner,t.due_on,greatest(current_date-t.due_on,0) days_overdue
 FROM carrier_tasks t JOIN change_orders o ON o.id=t.order_id JOIN services s ON s.id=o.service_id
 WHERE t.status='open' AND o.status IN ('requested','authorised');
CREATE VIEW record_checks AS
 SELECT s.id,s.code,s.status,s.verified_on,s.review_due,
 (s.verified_on IS NULL) accuracy_check_missing,(s.review_due<current_date) retention_review_due,
 (s.status='active' AND length(trim(s.carrier_reference))=0) carrier_reference_missing
 FROM services s;
CREATE VIEW monthly_margin AS
 SELECT account,carrier,currency,count(*)::integer active_services,sum(charge_cents) charge_cents,sum(cost_cents) cost_cents,sum(margin_cents) margin_cents
 FROM service_register WHERE status='active' GROUP BY account,carrier,currency;
REVOKE ALL ON service_register,order_book,renewal_queue,carrier_queue,record_checks,monthly_margin FROM PUBLIC;
