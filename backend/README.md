Backend (Flask) — Notes

- Uses `supabase` Python client. Ensure you set `SUPABASE_URL` and `SUPABASE_KEY` in a `.env` file or environment.
- Example endpoints:
  - GET /api/health
  - GET /api/complaints
  - POST /api/complaints

Supabase table schema (example SQL):

```sql
create table complaints (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  status text default 'pending',
  user_id uuid,
  created_at timestamptz default now()
);
```

Security: For production, use service_role key only server-side, validate JWT on the backend, and enforce RBAC in Supabase Policies.