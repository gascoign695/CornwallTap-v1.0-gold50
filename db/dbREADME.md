# CornwallTap D1 Database

This folder documents the application-owned Cloudflare D1 schema.

## Files

- `schema.sql` — current application schema
- `migrations/` — individual schema changes added over time

## Important

Do not include Cloudflare-managed tables such as `_cf_KV`.

Before making a database change:

1. Confirm the current production schema in the Cloudflare D1 console.
2. Add a new numbered migration file in `db/migrations/`.
3. Update `db/schema.sql` so it reflects the final current schema.
4. Apply the migration manually in the Cloudflare D1 console.
5. Verify the live schema after the change.

Do not re-run old migration files against production unless you have confirmed they have not already been applied.