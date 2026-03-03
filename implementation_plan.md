# Scalable Web-Based Inventory Management System (IMS) — Technical Blueprint

A comprehensive architecture and implementation plan for a multi-tenant, role-based Inventory Management System.

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend — React + Tailwind CSS"
        A[React SPA] --> B[TanStack Query]
        A --> C[React Router]
        A --> D[Tailwind UI Components]
    end

    subgraph "Backend — FastAPI"
        E[FastAPI Server] --> F[Auth Middleware]
        E --> G[Business Logic Layer]
        E --> H[Background Workers]
    end

    subgraph "Supabase Platform"
        I[(PostgreSQL + RLS)]
        J[Supabase Auth]
        K[Supabase Realtime]
        L[Supabase Storage]
    end

    B -->|REST API| E
    A -->|Realtime WS| K
    F -->|Verify JWT| J
    G -->|SQL / Supabase Client| I
    H -->|Notifications| K
    G -->|File Exports| L
```

> [!IMPORTANT]
> The **FastAPI backend** acts as the sole gateway for all business-critical operations (stock updates, order processing). The frontend connects to **Supabase Realtime** directly for live UI updates, but all mutations go through the API.

---

## 2. Folder Structure

### 2.1 Frontend — React (Vite + TypeScript)

```
frontend/
├── public/
├── src/
│   ├── api/                    # API client & TanStack Query hooks
│   │   ├── client.ts           # Axios/fetch instance with auth headers
│   │   ├── queries/            # useQuery hooks per domain
│   │   │   ├── useDashboard.ts
│   │   │   ├── useProducts.ts
│   │   │   ├── useStock.ts
│   │   │   ├── useOrders.ts
│   │   │   ├── useBranches.ts
│   │   │   ├── useUsers.ts
│   │   │   └── useReports.ts
│   │   └── mutations/          # useMutation hooks
│   │       ├── useProductMutations.ts
│   │       ├── useStockMutations.ts
│   │       └── useOrderMutations.ts
│   ├── components/
│   │   ├── ui/                 # Reusable primitives (Button, Modal, Table, Badge…)
│   │   ├── layout/             # Shell, Sidebar, Header, Footer
│   │   ├── dashboard/          # Dashboard-specific widgets
│   │   ├── products/           # Product CRUD components
│   │   ├── stock/              # Stock tracking & adjustment
│   │   ├── orders/             # PO / SO components
│   │   ├── branches/           # Branch management
│   │   ├── users/              # User / role management
│   │   └── reports/            # Report builder & export
│   ├── contexts/               # Auth, Theme, Notification providers
│   ├── hooks/                  # Shared custom hooks
│   ├── lib/                    # Supabase client, helpers, constants
│   ├── pages/                  # Route-level page components
│   │   ├── DashboardPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── StockPage.tsx
│   │   ├── OrdersPage.tsx
│   │   ├── BranchesPage.tsx
│   │   ├── UsersPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── types/                  # TypeScript interfaces & enums
│   ├── utils/                  # Formatters, validators, PDF/CSV export
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css               # Tailwind directives
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### 2.2 Backend — FastAPI (Python)

```
backend/
├── app/
│   ├── main.py                 # FastAPI app factory, CORS, lifespan
│   ├── config.py               # Pydantic Settings (env vars)
│   ├── deps.py                 # Dependency injection (DB session, current user)
│   ├── auth/
│   │   ├── middleware.py        # JWT verification via Supabase
│   │   ├── permissions.py       # RBAC decorators / dependencies
│   │   └── schemas.py
│   ├── routers/
│   │   ├── dashboard.py
│   │   ├── products.py
│   │   ├── stock.py
│   │   ├── orders.py
│   │   ├── branches.py
│   │   ├── users.py
│   │   └── reports.py
│   ├── services/               # Business logic layer
│   │   ├── product_service.py
│   │   ├── stock_service.py
│   │   ├── order_service.py
│   │   ├── branch_service.py
│   │   ├── report_service.py
│   │   └── notification_service.py
│   ├── models/                 # Pydantic request/response schemas
│   │   ├── product.py
│   │   ├── stock.py
│   │   ├── order.py
│   │   ├── branch.py
│   │   └── common.py
│   ├── db/
│   │   ├── supabase.py         # Supabase client singleton
│   │   └── queries.py          # Raw SQL helpers (transactions)
│   └── utils/
│       ├── export.py           # PDF / CSV generation
│       └── realtime.py         # Supabase Realtime broadcast helper
├── tests/
│   ├── conftest.py
│   ├── test_products.py
│   ├── test_stock.py
│   └── test_orders.py
├── requirements.txt
├── Dockerfile
└── .env.example
```

---

## 3. Database Schema (Supabase / PostgreSQL)

### 3.1 ER Diagram

```mermaid
erDiagram
    users ||--o{ user_roles : has
    roles ||--o{ user_roles : assigned
    branches ||--o{ stock_levels : holds
    products ||--o{ stock_levels : tracked_at
    products }o--|| categories : belongs_to
    suppliers ||--o{ products : supplies
    orders ||--o{ order_items : contains
    orders }o--|| branches : placed_at
    orders }o--o| suppliers : from
    products ||--o{ order_items : ordered
    stock_levels ||--o{ stock_transactions : logs
    users ||--o{ stock_transactions : performed_by
    users ||--o{ orders : created_by
```

### 3.2 SQL Schema

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff');
CREATE TYPE order_type AS ENUM ('purchase', 'sale');
CREATE TYPE order_status AS ENUM ('draft', 'confirmed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE txn_type AS ENUM (
    'purchase_in', 'sale_out', 'adjustment_in', 'adjustment_out', 'transfer_in', 'transfer_out'
);

-- ============================================================
-- TABLES
-- ============================================================

-- 1. Categories
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Suppliers
CREATE TABLE suppliers (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(200) NOT NULL,
    contact_name VARCHAR(150),
    email        VARCHAR(254),
    phone        VARCHAR(30),
    address      TEXT,
    created_at   TIMESTAMPTZ DEFAULT now(),
    updated_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_suppliers_name ON suppliers(name);

-- 3. Branches (Locations / Warehouses)
CREATE TABLE branches (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(150) NOT NULL UNIQUE,
    address    TEXT,
    phone      VARCHAR(30),
    is_active  BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Products
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku             VARCHAR(50)  NOT NULL UNIQUE,
    barcode         VARCHAR(100) UNIQUE,
    name            VARCHAR(250) NOT NULL,
    description     TEXT,
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    supplier_id     UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    unit_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
    cost_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
    min_stock_level INT NOT NULL DEFAULT 0,
    image_url       TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_products_sku     ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);

-- 5. Stock Levels (per product per branch — the "live" quantity)
CREATE TABLE stock_levels (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    quantity    INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, branch_id)
);
CREATE INDEX idx_stock_product ON stock_levels(product_id);
CREATE INDEX idx_stock_branch  ON stock_levels(branch_id);

-- 6. Stock Transactions (immutable audit log)
CREATE TABLE stock_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_level_id  UUID NOT NULL REFERENCES stock_levels(id),
    txn_type        txn_type NOT NULL,
    quantity_change  INT NOT NULL,  -- positive = in, negative = out
    quantity_before  INT NOT NULL,
    quantity_after   INT NOT NULL,
    reference_id     UUID,          -- order_id or transfer_id
    notes           TEXT,
    performed_by    UUID NOT NULL,  -- auth.uid()
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_txn_stock     ON stock_transactions(stock_level_id);
CREATE INDEX idx_txn_type      ON stock_transactions(txn_type);
CREATE INDEX idx_txn_date      ON stock_transactions(created_at);
CREATE INDEX idx_txn_performer ON stock_transactions(performed_by);

-- 7. Orders (Purchase Orders & Sales Orders)
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number    VARCHAR(30) NOT NULL UNIQUE,
    order_type      order_type NOT NULL,
    status          order_status NOT NULL DEFAULT 'draft',
    branch_id       UUID NOT NULL REFERENCES branches(id),
    supplier_id     UUID REFERENCES suppliers(id),  -- only for purchase orders
    total_amount    NUMERIC(14,2) DEFAULT 0,
    notes           TEXT,
    created_by      UUID NOT NULL,  -- auth.uid()
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_orders_type   ON orders(order_type);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_branch ON orders(branch_id);
CREATE INDEX idx_orders_date   ON orders(created_at);

-- 8. Order Items
CREATE TABLE order_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id),
    quantity    INT NOT NULL CHECK (quantity > 0),
    unit_price  NUMERIC(12,2) NOT NULL,
    subtotal    NUMERIC(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);
CREATE INDEX idx_oitems_order   ON order_items(order_id);
CREATE INDEX idx_oitems_product ON order_items(product_id);

-- 9. User profiles & roles (extends Supabase auth.users)
CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   VARCHAR(200),
    avatar_url  TEXT,
    branch_id   UUID REFERENCES branches(id),
    role        user_role NOT NULL DEFAULT 'staff',
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_profiles_role   ON profiles(role);
CREATE INDEX idx_profiles_branch ON profiles(branch_id);

-- 10. Notifications
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title       VARCHAR(250) NOT NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT false,
    metadata    JSONB,            -- e.g. { "product_id": "...", "branch_id": "..." }
    created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notif_user   ON notifications(user_id);
CREATE INDEX idx_notif_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Auto-update `updated_at` trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated   BEFORE UPDATE ON products     FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_suppliers_updated  BEFORE UPDATE ON suppliers    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_orders_updated     BEFORE UPDATE ON orders       FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_stock_updated      BEFORE UPDATE ON stock_levels FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

---

## 4. Security — RBAC & Row Level Security

### 4.1 Role Permissions Matrix

| Capability               | Admin | Manager | Staff |
|--------------------------|:-----:|:-------:|:-----:|
| View Dashboard           | ✅    | ✅      | ✅    |
| Manage Products          | ✅    | ✅      | ❌    |
| Quick Stock Adjustment   | ✅    | ✅      | ✅    |
| Create / Approve Orders  | ✅    | ✅      | ❌    |
| Manage Branches          | ✅    | ❌      | ❌    |
| Manage Users & Roles     | ✅    | ❌      | ❌    |
| Export Reports            | ✅    | ✅      | ❌    |
| View Own Branch Stock    | ✅    | ✅      | ✅    |

### 4.2 Supabase RLS Policies (Key Examples)

```sql
-- Enable RLS on all tables
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels      ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;

-- Products: everyone can read, only admin/manager can mutate
CREATE POLICY "products_select" ON products FOR SELECT USING (true);
CREATE POLICY "products_mutate" ON products FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
);

-- Stock: staff can only see their own branch
CREATE POLICY "stock_branch_read" ON stock_levels FOR SELECT USING (
    branch_id IN (
        SELECT branch_id FROM profiles WHERE id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
);

-- Profiles: users can read their own, admins can read/write all
CREATE POLICY "profiles_self_read" ON profiles FOR SELECT USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### 4.3 FastAPI RBAC Dependency

```python
# app/auth/permissions.py
from fastapi import Depends, HTTPException, status
from app.deps import get_current_user

def require_role(*allowed_roles: str):
    async def role_checker(user=Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return user
    return role_checker

# Usage in router:
# @router.post("/products", dependencies=[Depends(require_role("admin", "manager"))])
```

---

## 5. API Design — FastAPI RESTful Endpoints

| Method   | Endpoint                              | Roles            | Description                         |
|----------|---------------------------------------|------------------|-------------------------------------|
| `GET`    | `/api/v1/dashboard/summary`           | All              | KPIs, low-stock alerts, totals      |
| `GET`    | `/api/v1/products`                    | All              | List products (filter, search, page)|
| `POST`   | `/api/v1/products`                    | Admin, Manager   | Create product                      |
| `PUT`    | `/api/v1/products/{id}`               | Admin, Manager   | Update product                      |
| `DELETE` | `/api/v1/products/{id}`               | Admin            | Soft-delete product                 |
| `GET`    | `/api/v1/stock`                       | All              | Stock levels (branch filter)        |
| `POST`   | `/api/v1/stock/adjust`                | All              | Quick stock adjustment              |
| `POST`   | `/api/v1/stock/transfer`              | Admin, Manager   | Inter-branch transfer               |
| `GET`    | `/api/v1/orders`                      | Admin, Manager   | List orders                         |
| `POST`   | `/api/v1/orders`                      | Admin, Manager   | Create purchase/sale order          |
| `PUT`    | `/api/v1/orders/{id}/status`          | Admin, Manager   | Update order status & process stock |
| `GET`    | `/api/v1/branches`                    | All              | List branches                       |
| `POST`   | `/api/v1/branches`                    | Admin            | Create branch                       |
| `PUT`    | `/api/v1/branches/{id}`              | Admin            | Update branch                       |
| `GET`    | `/api/v1/users`                       | Admin            | List users                          |
| `PUT`    | `/api/v1/users/{id}/role`             | Admin            | Change user role                    |
| `GET`    | `/api/v1/reports/stock-movement`      | Admin, Manager   | Stock movement report               |
| `GET`    | `/api/v1/reports/valuation`           | Admin, Manager   | Inventory valuation                 |
| `GET`    | `/api/v1/reports/export`              | Admin, Manager   | Download PDF or CSV                 |
| `GET`    | `/api/v1/notifications`              | All              | User's notifications                |
| `PUT`    | `/api/v1/notifications/{id}/read`     | All              | Mark notification read              |

---

## 6. Concurrency & Race Condition Handling

> [!CAUTION]
> Two users adjusting the same stock row simultaneously can corrupt inventory counts. All stock mutations **must** use serializable transactions.

### Strategy: `SELECT ... FOR UPDATE` + Atomic Transaction

```sql
-- Executed inside a PostgreSQL transaction (SERIALIZABLE or with row locking)
BEGIN;

    -- Lock the specific stock row
    SELECT quantity
      FROM stock_levels
     WHERE product_id = $1 AND branch_id = $2
       FOR UPDATE;

    -- Apply the change (e.g., -5 units)
    UPDATE stock_levels
       SET quantity = quantity + $3,   -- $3 can be negative
           updated_at = now()
     WHERE product_id = $1 AND branch_id = $2;

    -- Record immutable audit entry
    INSERT INTO stock_transactions (
        stock_level_id, txn_type, quantity_change,
        quantity_before, quantity_after, performed_by, notes
    ) VALUES (...);

COMMIT;
```

> [!TIP]
> The `CHECK (quantity >= 0)` constraint on `stock_levels.quantity` acts as a final safety net — PostgreSQL will reject any update that would drive stock negative.

---

## 7. Sample FastAPI — Stock Update Transaction

```python
# app/services/stock_service.py
from fastapi import HTTPException
from app.db.supabase import get_supabase_client

async def adjust_stock(
    product_id: str,
    branch_id: str,
    quantity_change: int,
    txn_type: str,
    performed_by: str,
    notes: str | None = None,
):
    """
    Atomically adjust stock using a PostgreSQL RPC function
    to guarantee no race conditions.
    """
    supabase = get_supabase_client()

    # Calls a Supabase database function (see SQL below)
    result = supabase.rpc("adjust_stock_level", {
        "p_product_id": product_id,
        "p_branch_id": branch_id,
        "p_quantity_change": quantity_change,
        "p_txn_type": txn_type,
        "p_performed_by": performed_by,
        "p_notes": notes,
    }).execute()

    if result.data is None or result.data.get("success") is False:
        raise HTTPException(status_code=409, detail=result.data.get("error", "Stock update failed"))

    return result.data
```

### Corresponding PostgreSQL RPC Function

```sql
CREATE OR REPLACE FUNCTION adjust_stock_level(
    p_product_id  UUID,
    p_branch_id   UUID,
    p_quantity_change INT,
    p_txn_type    txn_type,
    p_performed_by UUID,
    p_notes       TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock_id      UUID;
    v_current_qty   INT;
    v_new_qty       INT;
    v_min_stock     INT;
BEGIN
    -- 1. Lock the row
    SELECT sl.id, sl.quantity, p.min_stock_level
      INTO v_stock_id, v_current_qty, v_min_stock
      FROM stock_levels sl
      JOIN products p ON p.id = sl.product_id
     WHERE sl.product_id = p_product_id
       AND sl.branch_id  = p_branch_id
       FOR UPDATE;

    IF v_stock_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Stock record not found');
    END IF;

    v_new_qty := v_current_qty + p_quantity_change;

    IF v_new_qty < 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock');
    END IF;

    -- 2. Update quantity
    UPDATE stock_levels SET quantity = v_new_qty, updated_at = now()
     WHERE id = v_stock_id;

    -- 3. Audit log
    INSERT INTO stock_transactions (
        stock_level_id, txn_type, quantity_change,
        quantity_before, quantity_after, performed_by, notes
    ) VALUES (
        v_stock_id, p_txn_type, p_quantity_change,
        v_current_qty, v_new_qty, p_performed_by, p_notes
    );

    -- 4. Low-stock notification
    IF v_new_qty <= v_min_stock THEN
        INSERT INTO notifications (user_id, title, message, metadata)
        SELECT p.id, 'Low Stock Alert',
               format('Product %s is at %s units (min: %s)', pr.name, v_new_qty, v_min_stock),
               jsonb_build_object('product_id', p_product_id, 'branch_id', p_branch_id, 'quantity', v_new_qty)
          FROM profiles p
          JOIN products pr ON pr.id = p_product_id
         WHERE p.role IN ('admin', 'manager');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'quantity_before', v_current_qty,
        'quantity_after', v_new_qty,
        'low_stock_alert', v_new_qty <= v_min_stock
    );
END;
$$;
```

---

## 8. Real-Time Notifications — Low Stock Alerts

### Architecture

```mermaid
sequenceDiagram
    participant Staff as Staff (Browser)
    participant API as FastAPI
    participant DB as PostgreSQL
    participant RT as Supabase Realtime

    Staff->>API: POST /stock/adjust (qty: -10)
    API->>DB: RPC adjust_stock_level()
    DB-->>DB: Inserts into notifications table
    DB-->>RT: Row insert triggers Realtime broadcast
    RT-->>Staff: WebSocket push → toast notification
    API-->>Staff: 200 OK { success, low_stock_alert }
```

### Frontend Subscription (React)

```tsx
// hooks/useNotifications.ts
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";  // or any toast lib

export function useRealtimeNotifications(userId: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel("notifications")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    toast.warning(payload.new.title, {
                        description: payload.new.message,
                    });
                    queryClient.invalidateQueries({ queryKey: ["notifications"] });
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [userId, queryClient]);
}
```

---

## 9. Key Web Pages — Feature Breakdown

| Page                 | Key Features                                                                                          |
|----------------------|-------------------------------------------------------------------------------------------------------|
| **Dashboard**        | Total products, total stock value, low-stock alerts list, recent transactions chart, orders summary    |
| **Product Mgmt**     | DataTable with search/filter by category/supplier, CRUD modals, SKU & barcode fields, image upload    |
| **Stock Tracking**   | Branch selector, live quantities, "Quick Adjust" inline modal, transfer between branches              |
| **Order Mgmt**       | Tabs for Purchase / Sale, create order with line items, status workflow (draft→confirmed→delivered)    |
| **Branch Mgmt**      | CRUD branches, toggle active/inactive, view stock summary per branch                                  |
| **User Roles**       | List users, assign roles (Admin/Manager/Staff), assign branch, activate/deactivate                    |
| **Reports**          | Date range filters, stock movement table, inventory valuation, export to PDF & CSV                    |

---

## 10. Verification Plan

Since this is a **planning-only deliverable** (technical blueprint), verification is as follows:

### Review Checklist
- [ ] Folder structures cover all required features
- [ ] SQL schema has proper foreign keys, indexes, and constraints
- [ ] RLS policies enforce the permissions matrix
- [ ] Stock adjustment RPC handles race conditions with `FOR UPDATE`
- [ ] API endpoints cover all CRUD and business operations
- [ ] Real-time notification flow is end-to-end

### Manual Verification (when implemented)
1. **Schema deployment**: Run the SQL in Supabase SQL Editor — verify all tables, indexes, and functions are created without errors
2. **RPC test**: Call `adjust_stock_level()` from the SQL Editor with test data — verify quantity updates and audit log entries
3. **Concurrent test**: Open two SQL sessions, both `SELECT ... FOR UPDATE` on the same row — verify the second session blocks until the first commits
4. **API smoke test**: `uvicorn app.main:app --reload` → hit `/docs` → test each endpoint via Swagger UI
5. **Realtime test**: Subscribe to `notifications` table in Supabase dashboard → trigger a low-stock adjustment → verify the row appears
