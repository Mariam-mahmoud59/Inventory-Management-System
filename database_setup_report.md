# IMS Database Setup Report

**Project:** Inventory Management System (IMS)
**Platform:** Supabase (PostgreSQL 17)
**Region:** `eu-central-1`
**Date:** 2026-03-03
**Author:** Lead Database Engineer

---

## 1. Executive Summary

The IMS database has been successfully deployed to the Supabase platform. All schema objects — tables, enums, indexes, constraints, functions, triggers, and row-level security policies — are live and operational on the production instance. Supabase Realtime has been configured for the relevant tables. The database is ready for API integration.

---

## 2. Schema Overview

### 2.1 Extensions

| Extension | Purpose |
|-----------|---------|
| `uuid-ossp` | UUID generation (`uuid_generate_v4()`) for all primary keys |
| `pgcrypto` | Cryptographic functions for hashing and token generation |

### 2.2 Custom Enum Types

| Enum | Values |
|------|--------|
| `user_role` | `admin`, `manager`, `staff` |
| `order_type` | `purchase`, `sale` |
| `order_status` | `draft`, `confirmed`, `shipped`, `delivered`, `cancelled` |
| `txn_type` | `purchase_in`, `sale_out`, `adjustment_in`, `adjustment_out`, `transfer_in`, `transfer_out` |

### 2.3 Tables (10 total)

Tables are listed in dependency order. All primary keys are `UUID` with auto-generation.

| # | Table | Description | Key Relationships |
|---|-------|-------------|-------------------|
| 1 | `categories` | Product classification | Referenced by `products` |
| 2 | `suppliers` | Vendor/supplier registry | Referenced by `products`, `orders` |
| 3 | `branches` | Warehouse/location entities | Referenced by `stock_levels`, `orders`, `profiles` |
| 4 | `products` | Product catalog | FK → `categories`, `suppliers` |
| 5 | `stock_levels` | Live inventory per product per branch | FK → `products`, `branches`. `UNIQUE(product_id, branch_id)`. `CHECK (quantity >= 0)` |
| 6 | `stock_transactions` | Immutable audit log of all stock movements | FK → `stock_levels` |
| 7 | `orders` | Purchase orders & sales orders | FK → `branches`, `suppliers` |
| 8 | `order_items` | Line items within an order | FK → `orders`, `products`. Auto-computed `subtotal` column |
| 9 | `profiles` | User profiles extending `auth.users` | FK → `auth.users`, `branches` |
| 10 | `notifications` | In-app notification records | FK → `auth.users` |

### 2.4 Indexes

A total of 23 indexes have been created across the schema, covering:

- Primary lookup fields (`sku`, `barcode`, `name`)
- Foreign key columns (`category_id`, `supplier_id`, `branch_id`, `product_id`)
- Query-critical columns (`order_type`, `status`, `txn_type`, `created_at`)
- Partial index on `notifications(user_id, is_read) WHERE is_read = false` for unread notification queries

---

## 3. Security & Row-Level Security (RLS)

RLS is **enabled on all 10 tables**. A total of **32 policies** enforce the RBAC permissions matrix. The design philosophy is **deny-by-default** — any table/operation combination without an explicit `USING` or `WITH CHECK` clause will be rejected.

### 3.1 Policy Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `categories` | All authenticated | Admin, Manager | Admin, Manager | Admin, Manager |
| `suppliers` | All authenticated | Admin, Manager | Admin, Manager | Admin, Manager |
| `branches` | All authenticated | Admin | Admin | Admin |
| `products` | All authenticated | Admin, Manager | Admin, Manager | Admin, Manager |
| `stock_levels` | Branch-scoped for Staff; All for Admin/Manager | — | — | — |
| `stock_transactions` | Branch-scoped for Staff; All for Admin/Manager | **Blocked** | **Blocked** | **Blocked** |
| `orders` | Admin, Manager | Admin, Manager | Admin, Manager | Admin, Manager |
| `order_items` | Admin, Manager | Admin, Manager | Admin, Manager | Admin, Manager |
| `profiles` | Own profile + Admin can see all | — | — | — |
| `notifications` | Own notifications only | **Blocked** | Own notifications only | **Blocked** |

### 3.2 Design Notes

- **`stock_transactions`**: Direct client-side mutations are blocked. All stock writes flow through the `adjust_stock_level()` RPC function, which inserts transaction records server-side.
- **`notifications`**: Inserts are blocked at the client level. Notifications are generated server-side by the RPC function (low-stock alerts) or the backend service layer. Users may only read and mark-as-read their own notifications.
- **`stock_levels`**: Staff users are restricted to viewing inventory for their assigned branch. Admin and Manager roles have cross-branch visibility.
- **Function security**: Both `update_timestamp()` and `adjust_stock_level()` have `search_path` explicitly set to `public` to prevent search-path injection attacks.

---

## 4. Database Logic

### 4.1 Auto-Timestamp Triggers

The `update_timestamp()` function automatically sets the `updated_at` column to `now()` on every `UPDATE` operation. It is attached to the following tables:

| Trigger Name | Table |
|-------------|-------|
| `trg_products_updated` | `products` |
| `trg_suppliers_updated` | `suppliers` |
| `trg_orders_updated` | `orders` |
| `trg_stock_updated` | `stock_levels` |

### 4.2 Stock Adjustment RPC — `adjust_stock_level()`

This is the core business-critical function. It performs an **atomic, race-condition-safe** stock adjustment using `SELECT ... FOR UPDATE` row locking.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `p_product_id` | `UUID` | Target product |
| `p_branch_id` | `UUID` | Target branch/warehouse |
| `p_quantity_change` | `INT` | Delta (positive = stock in, negative = stock out) |
| `p_txn_type` | `txn_type` | Transaction classification |
| `p_performed_by` | `UUID` | User performing the action (`auth.uid()`) |
| `p_notes` | `TEXT` | Optional free-text note |

**Execution flow:**

1. **Lock** the target `stock_levels` row with `FOR UPDATE` (prevents concurrent modifications)
2. **Validate** the resulting quantity is non-negative
3. **Update** the `stock_levels.quantity`
4. **Insert** an immutable audit record into `stock_transactions`
5. **Generate low-stock alerts** — if the new quantity falls at or below `products.min_stock_level`, insert a notification for all Admin and Manager users

**Return value:** `JSONB` object containing `success`, `quantity_before`, `quantity_after`, and `low_stock_alert` fields.

**Safety guarantees:**
- `SELECT ... FOR UPDATE` prevents lost-update race conditions
- `CHECK (quantity >= 0)` on `stock_levels` acts as a database-level safety net
- The entire operation runs within a single transaction — partial failures are impossible

---

## 5. Realtime Configuration

Supabase Realtime has been enabled for two tables via the `supabase_realtime` publication:

| Table | Use Case |
|-------|----------|
| `notifications` | Push low-stock alerts and system notifications to connected clients in real time |
| `stock_levels` | Broadcast live inventory changes to dashboards and stock tracking views |

The frontend subscribes to `postgres_changes` events on these tables using the Supabase JS client. Realtime events respect RLS — users will only receive changes for rows they are authorized to see.

---

## 6. Migration Log

All migrations were applied via the Supabase Management API. A total of **22 migrations** executed successfully with zero errors.

| Migration | Description |
|-----------|-------------|
| `create_extensions` | `uuid-ossp`, `pgcrypto` |
| `create_enum_types` | 4 custom enum types |
| `create_categories_table` | Categories table |
| `create_suppliers_table` | Suppliers table + index |
| `create_branches_table` | Branches table |
| `create_products_table` | Products table + 4 indexes |
| `create_stock_levels_table` | Stock levels + CHECK constraint + unique composite |
| `create_stock_transactions_table` | Audit log + 4 indexes |
| `create_orders_table` | Orders + 4 indexes |
| `create_order_items_table` | Order items + generated subtotal column |
| `create_profiles_table` | User profiles (FK → auth.users) |
| `create_notifications_table` | Notifications + partial index |
| `create_update_timestamp_function_and_triggers` | Trigger function + 4 triggers |
| `create_adjust_stock_level_rpc` | Stock adjustment RPC |
| `enable_rls_on_all_tables` | RLS enabled on 5 core tables |
| `create_rls_policies` | Initial 4 RLS policies |
| `fix_function_search_paths` | Security hardening |
| `rls_policies_categories_suppliers` | 8 policies |
| `rls_policies_branches` | 4 policies |
| `rls_policies_orders_order_items` | 8 policies |
| `rls_policies_stock_transactions` | 4 policies |
| `rls_policies_notifications` | 4 policies |
| `enable_realtime_notifications_stock_levels` | Realtime publication |

---

*End of report.*
