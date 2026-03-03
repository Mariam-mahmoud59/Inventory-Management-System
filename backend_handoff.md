# Backend Developer Handoff — IMS

**To:** Backend Developer (FastAPI)
**From:** Lead Database Engineer
**Date:** 2026-03-03
**Subject:** Database Ready for API Integration

---

## 1. Status

The Supabase PostgreSQL database for the Inventory Management System is **fully deployed and secured**. All tables, indexes, constraints, RLS policies, triggers, and RPC functions are live. You can begin API development immediately.

Refer to the accompanying `database_setup_report.md` for the complete schema reference.

---

## 2. Connection Credentials

Add the following environment variables to your `.env` file. Retrieve the actual values from the [Supabase Dashboard → Project Settings → API](https://supabase.com/dashboard/project/momvhjbermzewknbjktt/settings/api).

```env
# Supabase Project
SUPABASE_URL=https://momvhjbermzewknbjktt.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vbXZoamJlcm16ZXdrbmJqa3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzYwNDEsImV4cCI6MjA4ODExMjA0MX0.cQ37zT_LkjkRu5lwbrVWTad_mvSWQQ4CSW_jCeScQWM

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vbXZoamJlcm16ZXdrbmJqa3R0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUzNjA0MSwiZXhwIjoyMDg4MTEyMDQxfQ.Cwf4nN9JDrKU5qEK2EecbccHSH1mhSSXx1am0aTzLLc

# Direct database connection (use connection pooler for production)
DATABASE_URL="postgresql://postgres:-zP+72EtvuQF@bA@db.momvhjbermzewknbjktt.supabase.co:5432/postgres"
```

> **⚠️ Security:** Never commit the Service Role Key to version control. The `.env.example` file in the repository should contain only placeholder values.

---

## 3. Authentication & RLS Integration

### 3.1 Client-Facing Requests (User JWT)

For all API endpoints that act on behalf of authenticated users, initialize the Supabase client with the **user's JWT** from the `Authorization` header. This ensures RLS policies are enforced based on the user's identity and role.

```python
from supabase import create_client

def get_supabase_client(user_jwt: str):
    """Client scoped to the authenticated user — RLS is enforced."""
    client = create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_ANON_KEY,
    )
    client.auth.set_session(access_token=user_jwt, refresh_token="")
    return client
```

### 3.2 Background / Admin Tasks (Service Role Key)

For server-side operations that should **bypass RLS** (e.g., scheduled jobs, seed scripts, system-generated notifications), use the Service Role Key:

```python
from supabase import create_client

def get_admin_client():
    """Elevated client — bypasses all RLS policies."""
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY,
    )
```

### 3.3 Key RLS Behaviors to Be Aware Of

| Scenario | Behavior |
|----------|----------|
| Staff user queries `stock_levels` | Only sees their assigned branch |
| Staff user queries `orders` | **Denied** — only Admin/Manager can access orders |
| Any client tries `INSERT` into `stock_transactions` | **Denied** — must use the `adjust_stock_level()` RPC |
| Any client tries `INSERT` into `notifications` | **Denied** — notifications are server-generated |

---

## 4. Using the `adjust_stock_level()` RPC

All stock mutations **must** go through this RPC function. Do not perform direct `UPDATE` on `stock_levels` — the RPC handles row locking, audit logging, and low-stock alert generation atomically.

```python
async def adjust_stock(
    supabase_client,
    product_id: str,
    branch_id: str,
    quantity_change: int,
    txn_type: str,
    performed_by: str,
    notes: str | None = None,
):
    result = supabase_client.rpc("adjust_stock_level", {
        "p_product_id": product_id,
        "p_branch_id": branch_id,
        "p_quantity_change": quantity_change,
        "p_txn_type": txn_type,
        "p_performed_by": performed_by,
        "p_notes": notes,
    }).execute()

    if not result.data or result.data.get("success") is False:
        raise HTTPException(
            status_code=409,
            detail=result.data.get("error", "Stock update failed"),
        )

    return result.data
    # Returns: { "success": true, "quantity_before": 50, "quantity_after": 45, "low_stock_alert": false }
```

**Valid `txn_type` values:** `purchase_in`, `sale_out`, `adjustment_in`, `adjustment_out`, `transfer_in`, `transfer_out`

> **Note:** The RPC must be called with the **Service Role Key** or from a context where the user has write access to `stock_levels`. Since RLS blocks direct client inserts into `stock_transactions`, the backend should typically use the admin client when calling this function.

---

## 5. Seed Data — Required First Step

Direct SQL `INSERT` into `auth.users` is not possible on Supabase. You must use the **Supabase Auth Admin API** to create the initial users.

**Action Required:** Create a `seed_db.py` script that performs the following:

### 5.1 Create the First Admin User

```python
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Example of creating the first admin user
# 1. Create the user via Auth API
auth_response = supabase.auth.admin.create_user({
    "email": "admin@ims-project.com",
    "password": "ChangeMe!2026",
    "email_confirm": True,
    "user_metadata": {"full_name": "System Administrator"},
})

admin_uid = auth_response.user.id

# 2. Insert the corresponding profile record
supabase.table("profiles").insert({
    "id": str(admin_uid),
    "full_name": "System Administrator",
    "role": "admin",
    "is_active": True,
}).execute()
```

### 5.2 Populate Lookup Data

After the admin user exists, seed the reference tables:

```python
# Categories
categories = [
    {"name": "Electronics", "description": "Electronic devices and components"},
    {"name": "Office Supplies", "description": "Stationery, paper, and office equipment"},
    {"name": "Raw Materials", "description": "Manufacturing inputs and raw materials"},
]
supabase.table("categories").insert(categories).execute()

# Branches
branches = [
    {"name": "Main Warehouse", "address": "123 Industrial Ave", "phone": "+1-555-0100"},
    {"name": "Downtown Store", "address": "456 Main St", "phone": "+1-555-0200"},
]
supabase.table("branches").insert(branches).execute()

# After branches are created, update the admin profile with a branch assignment
main_warehouse = supabase.table("branches").select("id").eq("name", "Main Warehouse").single().execute()
supabase.table("profiles").update({"branch_id": main_warehouse.data["id"]}).eq("id", str(admin_uid)).execute()
```

### 5.3 Execution Order

1. Run `seed_db.py` **once** against the production database
2. Verify login with the admin credentials via the Supabase Auth UI or your login endpoint
3. All subsequent users can be created through the application's user management interface

---

## 6. Realtime Subscriptions

Two tables are configured for Supabase Realtime:

| Table | Events | Frontend Use Case |
|-------|--------|-------------------|
| `notifications` | `INSERT` | Push toast alerts to connected users when low-stock events are triggered |
| `stock_levels` | `UPDATE` | Live-update dashboard quantities without polling |

Realtime events will respect RLS — a Staff user subscribed to `stock_levels` will only receive change events for their assigned branch.

---

## 7. Quick Reference — Table Relationships

```
categories ←── products ──→ suppliers
                  │
                  ▼
branches ←── stock_levels ──→ stock_transactions
    │             │
    ▼             │
 profiles     (audit log)
    │
    ▼
auth.users ←── notifications

orders ──→ order_items ──→ products
  │
  ▼
branches, suppliers
```

---

*Questions? Reach out to the database team or refer to `database_setup_report.md` for the full schema documentation.*
