-- Fictional businesses and carrier names. Relative dates keep the demo useful.
INSERT INTO accounts(id,code,name,owner) VALUES
 ('10000000-0000-0000-0000-000000000001','HARBOUR','Harbour Design Demo','Mia'),
 ('10000000-0000-0000-0000-000000000002','RIDGE','Ridge Foods Demo','Ari') ON CONFLICT DO NOTHING;
INSERT INTO sites(id,account_id,code,name,address) VALUES
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','H-NORTH','Harbour North','10 Example Road, Auckland'),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','H-SOUTH','Harbour South','20 Example Road, Auckland'),
 ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','R-DEPOT','Ridge Depot','30 Example Road, Brisbane') ON CONFLICT DO NOTHING;
INSERT INTO services(id,account_id,site_id,code,name,kind,carrier,carrier_reference,status,currency,charge_cents,cost_cents,started_on,contract_end,review_due,verified_on,verification_reference) VALUES
 ('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','SVC-101','North fibre','fibre','Demo Carrier North','C-101','active','NZD',22000,14000,current_date-300,current_date+20,current_date+90,current_date-5,'Demo service schedule'),
 ('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','SVC-102','North voice','voice','Demo Carrier North','C-102','active','NZD',9000,11000,current_date-400,current_date-10,current_date-1,NULL,''),
 ('30000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003','SVC-103','Depot fibre','fibre','Demo Carrier South','','active','AUD',35000,24000,current_date-100,current_date+200,current_date+90,current_date-3,'Demo carrier schedule'),
 ('30000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','SVC-104','South backup','data','Demo Carrier South','C-104','planned','NZD',11000,7000,current_date,current_date+365,current_date+90,NULL,'') ON CONFLICT DO NOTHING;
INSERT INTO change_orders(id,service_id,code,kind,owner,requested_on,due_on,target_site_id,status,authorised_on,authorisation_reference) VALUES
 ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','MACD-101','move','Mia',current_date-10,current_date-2,'20000000-0000-0000-0000-000000000002','authorised',current_date-9,'Demo customer instruction'),
 ('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000004','MACD-102','add','Ari',current_date,current_date+5,NULL,'requested',NULL,'') ON CONFLICT DO NOTHING;
INSERT INTO carrier_tasks(id,order_id,title,owner,due_on) VALUES
 ('50000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','Confirm cutover appointment','Mia',current_date-3),
 ('50000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002','Get activation confirmation','Ari',current_date+3) ON CONFLICT DO NOTHING;
