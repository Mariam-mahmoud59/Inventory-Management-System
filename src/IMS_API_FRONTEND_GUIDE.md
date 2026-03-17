## IMS Backend Integration Guide (Frontend Handoff)

This guide gives you everything you need to consume the IMS FastAPI + Supabase backend without needing further backend details.

---

### Authentication

**How to get a JWT from Supabase**

Use the Supabase JS client and sign the user in via email/password or another supported method. Example (email/password):

```ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // Access token (JWT) is here:
  const accessToken = data.session?.access_token;
  // Store in memory or secure storage.
  return accessToken;
}
```

**How to call the backend with the JWT**

All protected endpoints require:

- `Authorization: Bearer <JWT>`
- `Content-Type: application/json` for JSON requests

```ts
async function apiGet(path: string, accessToken: string) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw { status: res.status, body };
  }

  return res.json();
}
```

Supabase JS handles refresh tokens; use `supabase.auth.getSession()` on app load to restore a session and get a valid `access_token`.

---

### Roles and User Context

Every protected endpoint runs with a `UserContext` derived from Supabase Auth and the `profiles` table:

- `id: UUID`
- `email: string`
- `role: "admin" | "manager" | "staff"`
- `branch_id: UUID | null`
- `jwt: string` (the same token you passed)

Use `role` and `branch_id` on the frontend to:

- Show/hide features (e.g., admin-only screens).
- Scope branch-specific views for Staff users.

---

### Key Endpoints & Required Roles

Base URL: `http(s)://<backend-host>/api/v1`

#### Auth / Health

- **GET `/api/v1/health`**
  - **Roles**: Public
  - **Use**: Simple health check.

#### Products

- **GET `/api/v1/products`**
  - **Roles**: admin, manager, staff
  - Filters: `category_id`, `supplier_id`, `search`, `skip`, `limit`.
- **GET `/api/v1/products/{id}`**
  - **Roles**: admin, manager, staff
- **POST `/api/v1/products`**
  - **Roles**: admin, manager
  - **Use**: Create product.
- **PUT `/api/v1/products/{id}`**
  - **Roles**: admin, manager
  - **Use**: Update product.
- **DELETE `/api/v1/products/{id}`**
  - **Roles**: admin
  - **Use**: Deactivate/delete product.

#### Stock

- **GET `/api/v1/stock`**
  - **Roles**: admin, manager, staff
  - Filters: `branch_id`, `product_id`.
  - **Staff privacy**: If role is `staff`, the backend forces `branch_id` to the user’s own branch, ignoring any branch_id passed in.
- **POST `/api/v1/stock/adjust`**
  - **Roles**: admin, manager, staff
  - **Use**: Adjust stock up/down for a product at a branch.
  - **Staff restriction**: Staff can only adjust stock for their own `branch_id`.
- **POST `/api/v1/stock/transfer`**
  - **Roles**: admin, manager
  - **Use**: Transfer stock between branches.

#### Orders

- **GET `/api/v1/orders`**
  - **Roles**: admin, manager
  - Filters:
    - `order_type` = `purchase` | `sale`
    - `status` = `draft` | `confirmed` | `shipped` | `delivered` | `cancelled`
    - `branch_id` (UUID)
- **GET `/api/v1/orders/{id}`**
  - **Roles**: admin, manager
  - **Use**: Order details including line items.
- **POST `/api/v1/orders`**
  - **Roles**: admin, manager
  - **Use**: Create purchase or sales order with nested items.
- **PUT `/api/v1/orders/{id}/status`**
  - **Roles**: admin, manager
  - **Use**: Update order status.
  - **Stock integration when status = `delivered`**:
    - Purchase order: stock **increases** for each item.
    - Sales order: stock **decreases** for each item.

#### Dashboard / Reporting

- **GET `/api/v1/dashboard/summary`**
  - **Roles**: admin, manager
  - **Use**: High-level KPIs:
    - `total_inventory_value`
    - `low_stock_alerts` (list)
    - `order_summary` (`pending`, `delivered` for current month)
    - `recent_transactions` (last 10 stock transactions)

- **GET `/api/v1/reports/stock-movement`** (backend support in services)
  - **Roles**: admin, manager
  - **Query**: `start_date`, `end_date` (ISO dates)
  - **Use**: Build charts for stock IN vs OUT per day.

---

### Error Handling Expectations

Errors follow FastAPI’s default shape:

- **Payload**: `{ "detail": "Human-readable error message" }`

You should handle at least:

- **401 Unauthorized**
  - Missing/invalid/expired JWT.
  - Action: clear session, redirect to login, show “Session expired” message.

- **403 Forbidden**
  - Authenticated but:
    - Role not allowed for the endpoint.
    - User inactive or profile not found.
    - Staff attempting to operate on a different branch.
  - Action: show an “Access denied” page/toast and/or hide controls for those operations.

- **404 Not Found**
  - Resource does not exist (e.g., product/order not found).
  - Action: show “Not found” UI.

- **409 Conflict**
  - Business conflicts around stock adjustments (e.g., insufficient stock).
  - Action: show a clear validation error near the form (e.g., “Insufficient stock to fulfill this order.”).

Also expect:

- **400 Bad Request** for invalid payloads.
- **500 Internal Server Error** for unexpected server problems (generic error to user, log details).

---

### Real-time Notifications (Low Stock Alerts)

The `notifications` table in Supabase is configured for Realtime. You can subscribe directly from the frontend with the Supabase JS client.

**Behavior**

- Backend/DB logic inserts into `notifications` on low-stock events.
- RLS ensures each user only sees their own notifications.

**Subscription example**

```ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: any) => void
) {
  const channel = supabase
    .channel('low-stock-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new); // notification row
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

Use this to drive:

- Toasts (e.g., “Low stock for SKU XYZ”).
- A bell icon / notifications dropdown.

---

### Swagger / OpenAPI as Source of Truth

- **URL**: `/docs` on the backend.
- Contains:
  - All endpoints and HTTP methods.
  - All request/response models:
    - `UserContext`
    - `ProductCreate`, `ProductResponse`
    - `StockAdjustmentRequest`, `StockLevelResponse`, etc.
    - `OrderCreate`, `OrderResponse`, `OrderItemResponse`
    - `DashboardSummary`, and more.
  - Descriptions including which roles can access each endpoint.

**Recommended workflow**

- Use `/docs` to confirm:
  - Exact field names and types.
  - Which fields are optional/required.
  - Nested structures for orders, stock, and dashboard responses.
- Optionally generate TypeScript types from the OpenAPI spec or mirror the shapes into your `types/` directory.

