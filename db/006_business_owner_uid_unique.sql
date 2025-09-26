-- Ensure a single business per owner and make upserts deterministic
create unique index if not exists businesses_owner_uid_key on businesses(owner_uid);

